// src/modules/analytics/services/consumption-analytics.service.ts

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../common/supabase/supabase.provider';
import { plainToInstance } from 'class-transformer';
import {
  ConsumptionAnalysisDto,
  ConsumptionHighlightsDto,
  CategoryDistributionDto,
  MonthlyEvolutionEntryDto,
  UnusualExpenseDto,
} from '../dto';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { ExpenseRecord } from '../types/consumption.types';
import { ANALYTICS_CONSTANTS } from '../constants/analytics.constants';

@Injectable()
export class ConsumptionAnalyticsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly anomalyDetection: AnomalyDetectionService,
  ) {}

  /**
   * Obtener análisis de consumo completo del cliente
   */
  async getConsumptionAnalysis(
    clientId: string,
    monthsBack: number = ANALYTICS_CONSTANTS.DEFAULT_MONTHS_BACK,
  ): Promise<ConsumptionAnalysisDto> {
    if (!clientId) {
      throw new BadRequestException('Cliente ID es requerido');
    }

    if (monthsBack < 1 || monthsBack > 60) {
      throw new BadRequestException('Meses debe estar entre 1 y 60');
    }

    // 1. Validar que cliente existe
    const { data: clientExists, error: clientError } = await this.supabase
      .from('usuarios')
      .select('id')
      .eq('id', clientId)
      .eq('rol', 'cliente')
      .single();

    if (clientError || !clientExists) {
      throw new NotFoundException('Cliente no encontrado');
    }

    try {
      // 2. Obtener highlights
      const highlights = await this._getHighlights(clientId, monthsBack);

      // 3. Obtener distribución por categoría
      const categoryDistribution = await this._getCategoryDistribution(
        clientId,
        monthsBack,
      );

      // 4. Obtener evolución mensual
      const monthlyEvolution = await this._getMonthlyEvolution(
        clientId,
        monthsBack,
      );

      // 5. Detectar gastos inusuales
      const unusualExpenses = await this._getUnusualExpenses(
        clientId,
        monthsBack,
      );

      // 6. Calcular período
      const now = new Date();
      const periodEnd = now;
      const periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - monthsBack);

      // 6b. Evolución por categoría×mes
      const categoryMonthlyEvolution = await this._getCategoryMonthlyEvolution(
        clientId,
        monthsBack,
      );

      return {
        highlights,
        categoryDistribution,
        monthlyEvolution,
        unusualExpenses,
        categoryMonthlyEvolution,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        generatedAt: Date.now(),
      } as ConsumptionAnalysisDto;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      
      throw new BadRequestException(
        `Error al analizar consumo: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Obtener highlights de consumo
   */
  private async _getHighlights(
    clientId: string,
    monthsBack: number,
  ): Promise<ConsumptionHighlightsDto> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsBack);
    const dateFrom = monthsAgo.toISOString().slice(0, 10);

    const { data, error } = await this.supabase
      .from('gastos')
      .select(
        `
        id,
        monto,
        comercio,
        categoria_id,
        fecha_gasto
      `,
      )
      .eq('cliente_id', clientId)
      .gte('fecha_gasto', dateFrom)
      .order('fecha_gasto', { ascending: false });

    if (error) {
      throw new BadRequestException('Error al consultar gastos');
    }

    if (!data || data.length === 0) {
      return {
        totalExpense: 0,
        averageExpense: 0,
        transactionCount: 0,
        uniqueCategories: 0,
        maxExpense: 0,
        minExpense: 0,
        uniqueMerchants: 0,
        dayOfHighestExpense: 0,
        topMerchants: [],
      };
    }

    const totalExpense = data.reduce((sum, e) => sum + Number(e.monto), 0);
    const averageExpense = totalExpense / data.length;
    const maxExpense = Math.max(...data.map((e) => Number(e.monto)));
    const minExpense = Math.min(...data.map((e) => Number(e.monto)));

    // Día de la semana con mayor gasto
    const expensesByDay = data.reduce(
      (acc, e) => {
        const date = new Date(e.fecha_gasto);
        const dayOfWeek = date.getDay(); // 0 = Sunday
        const financialDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 1-7 (Mon-Sun)
        acc[financialDay] = (acc[financialDay] || 0) + Number(e.monto);
        return acc;
      },
      {} as Record<number, number>,
    );

    const dayOfHighestExpense = Object.entries(expensesByDay).sort(
      ([, a], [, b]) => b - a,
    )[0]?.[0]
      ? Number(Object.entries(expensesByDay).sort(([, a], [, b]) => b - a)[0][0])
      : 0;

    // Top 5 comercios por frecuencia
    const merchantFrequency = data.reduce(
      (acc, e) => {
        acc[e.comercio] = (acc[e.comercio] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topMerchants = Object.entries(merchantFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([merchant, count]) => ({ merchant, count }));

    // Categorías y comercios únicos
    const uniqueCategories = new Set(data.map((e) => e.categoria_id)).size;
    const uniqueMerchants = Object.keys(merchantFrequency).length;

    return {
      totalExpense: Number(totalExpense.toFixed(2)),
      averageExpense: Number(averageExpense.toFixed(2)),
      transactionCount: data.length,
      uniqueCategories,
      maxExpense: Number(maxExpense.toFixed(2)),
      minExpense: Number(minExpense.toFixed(2)),
      uniqueMerchants,
      dayOfHighestExpense,
      topMerchants,
    };
  }

  /**
   * Obtener distribución por categoría (top 10)
   */
  private async _getCategoryDistribution(
    clientId: string,
    monthsBack: number,
  ): Promise<CategoryDistributionDto[]> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsBack);
    const dateFrom = monthsAgo.toISOString().slice(0, 10);

    const { data, error } = await this.supabase
      .from('gastos')
      .select(
        `
        monto,
        categoria_id,
        categorias_de_gasto (
          id,
          nombre
        )
      `,
      )
      .eq('cliente_id', clientId)
      .gte('fecha_gasto', dateFrom);

    if (error) {
      throw new BadRequestException('Error al obtener categorías');
    }

    if (!data || data.length === 0) return [];

    const categoryMap = new Map<
      string,
      { name: string; amount: number; count: number }
    >();

    let totalAmount = 0;

    // Agrupar por categoría
    data.forEach((expense: any) => {
      const categoryId = expense.categoria_id;
      const categoryName = expense.categorias_de_gasto?.nombre || 'Unknown';
      const amount = Number(expense.monto);

      totalAmount += amount;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          name: categoryName,
          amount: 0,
          count: 0,
        });
      }

      const cat = categoryMap.get(categoryId)!;
      cat.amount += amount;
      cat.count += 1;
    });

    // Convertir a array y calcular porcentajes
    let ranking = 1;
    const distribution = Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, ANALYTICS_CONSTANTS.TOP_CATEGORIES_LIMIT)
      .map(([categoryId, cat]) => ({
        categoryId,
        categoryName: cat.name,
        amount: Number(cat.amount.toFixed(2)),
        percentage: Number(
          ((cat.amount / totalAmount) * 100).toFixed(2),
        ),
        transactionCount: cat.count,
        averagePerTransaction: Number(
          (cat.amount / cat.count).toFixed(2),
        ),
        ranking: ranking++,
      }));

    return distribution.map((d) =>
      plainToInstance(CategoryDistributionDto, d),
    );
  }

  /**
   * Obtener evolución mensual
   */
  private async _getMonthlyEvolution(
    clientId: string,
    monthsBack: number,
  ): Promise<MonthlyEvolutionEntryDto[]> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsBack);
    const dateFrom = monthsAgo.toISOString().slice(0, 10);

    const { data, error } = await this.supabase
      .from('gastos')
      .select('monto, fecha_gasto')
      .eq('cliente_id', clientId)
      .gte('fecha_gasto', dateFrom)
      .order('fecha_gasto', { ascending: true });

    if (error) {
      throw new BadRequestException('Error al obtener evolución');
    }

    if (!data || data.length === 0) return [];

    // Agrupar por mes
    const monthlyData = new Map<
      string,
      { total: number; count: number; transactions: number[] }
    >();

    data.forEach((expense: any) => {
      const date = new Date(expense.fecha_gasto);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { total: 0, count: 0, transactions: [] });
      }

      const month = monthlyData.get(monthKey)!;
      const amount = Number(expense.monto);
      month.total += amount;
      month.count += 1;
      month.transactions.push(amount);
    });

    // Convertir a array y calcular variaciones
    const evolution: MonthlyEvolutionEntryDto[] = [];
    let previousTotal: number | null = null;

    Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([monthKey, dataPeriod]) => {
        let variationPercentage: number | null = null;
        if (previousTotal !== null && previousTotal !== 0) {
          variationPercentage = Number(
            (((dataPeriod.total - previousTotal) / previousTotal) * 100).toFixed(2),
          );
        }

        const trend =
          variationPercentage === null
            ? 0
            : variationPercentage > ANALYTICS_CONSTANTS.TREND_UP_THRESHOLD
              ? 1
              : variationPercentage < ANALYTICS_CONSTANTS.TREND_DOWN_THRESHOLD
                ? -1
                : 0;

        evolution.push({
          month: monthKey,
          totalExpense: Number(dataPeriod.total.toFixed(2)),
          transactionCount: dataPeriod.count,
          averagePerTransaction: Number(
            (dataPeriod.total / dataPeriod.count).toFixed(2),
          ),
          variationPercentage,
          trend,
        });

        previousTotal = dataPeriod.total;
      });

    return evolution.map((e) =>
      plainToInstance(MonthlyEvolutionEntryDto, e),
    );
  }

  /**
   * Evolución mensual desglosada por categoría (top 5)
   */
  private async _getCategoryMonthlyEvolution(
    clientId: string,
    monthsBack: number,
  ): Promise<{ months: string[]; series: { name: string; amounts: number[] }[] }> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsBack);
    const dateFrom = monthsAgo.toISOString().slice(0, 10);

    const { data, error } = await this.supabase
      .from('gastos')
      .select(
        `
        monto,
        fecha_gasto,
        categoria_id,
        categorias_de_gasto (nombre)
      `,
      )
      .eq('cliente_id', clientId)
      .gte('fecha_gasto', dateFrom)
      .order('fecha_gasto', { ascending: true });

    if (error || !data || data.length === 0) return { months: [], series: [] };

    const monthSet = new Set<string>();
    const categoryMap = new Map<
      string,
      { name: string; monthlyTotals: Map<string, number>; total: number }
    >();

    data.forEach((expense: any) => {
      const date = new Date(expense.fecha_gasto);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const categoryId = expense.categoria_id;
      const categoryName = expense.categorias_de_gasto?.nombre || 'Otros';
      const amount = Number(expense.monto);

      monthSet.add(monthKey);

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, { name: categoryName, monthlyTotals: new Map(), total: 0 });
      }

      const cat = categoryMap.get(categoryId)!;
      cat.monthlyTotals.set(monthKey, (cat.monthlyTotals.get(monthKey) || 0) + amount);
      cat.total += amount;
    });

    const months = Array.from(monthSet).sort();

    const series = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((cat) => ({
        name: cat.name,
        amounts: months.map((m) =>
          Number((cat.monthlyTotals.get(m) || 0).toFixed(2)),
        ),
      }));

    return { months, series };
  }

  /**
   * Detectar gastos inusuales
   */
  private async _getUnusualExpenses(
    clientId: string,
    monthsBack: number,
  ): Promise<UnusualExpenseDto[]> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsBack);
    const dateFrom = monthsAgo.toISOString().slice(0, 10);

    const { data, error } = await this.supabase
      .from('gastos')
      .select(
        `
        id,
        monto,
        comercio,
        fecha_gasto,
        categoria_id,
        categorias_de_gasto (nombre)
      `,
      )
      .eq('cliente_id', clientId)
      .gte('fecha_gasto', dateFrom)
      .order('fecha_gasto', { ascending: false });

    if (error) {
      throw new BadRequestException('Error al detectar anomalías');
    }

    if (!data || data.length === 0) return [];

    // Usar servicio de anomalía detection
    const expenses: ExpenseRecord[] = data.map((e: any) => ({
      id: e.id,
      amount: Number(e.monto),
      merchant: e.comercio,
      date: e.fecha_gasto,
      categoryId: e.categoria_id,
      categoryName: e.categorias_de_gasto?.nombre || 'Unknown',
    }));

    const unusual = await this.anomalyDetection.detectAnomalies(expenses);

    return unusual.map((u) => ({
      expenseId: u.id,
      merchant: u.merchant,
      amount: u.amount,
      category: u.categoryName,
      date: u.date,
      zScore: Number(u.zScore.toFixed(2)),
      reason: u.reason,
      anomalyScore: Number(u.anomalyScore.toFixed(2)),
      categoryMean: u.categoryMean,
    }));
  }
}
