import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { QueryExpensesDto } from "./dto/query-expenses.dto";
import { SummaryQueryDto } from "./dto/summary-query.dto";

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findAll(userId: string, query: QueryExpensesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const search = query.search?.trim();

    let request = this.supabase
      .from("gastos")
      .select(
        `
          id,
          cliente_id,
          categoria_id,
          comercio,
          fecha_gasto,
          monto,
          descripcion,
          origen,
          moneda,
          ticket_principal_id,
          ocr_estado,
          ocr_confianza,
          creado_en,
          actualizado_en,
          categorias_de_gasto (
            id,
            nombre
          )
        `,
        { count: "exact" },
      )
      .eq("cliente_id", userId)
      .order("fecha_gasto", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (query.categoryId) {
      request = request.eq("categoria_id", query.categoryId);
    }

    if (query.from) {
      request = request.gte("fecha_gasto", query.from);
    }

    if (query.to) {
      request = request.lte("fecha_gasto", query.to);
    }

    if (search) {
      request = request.or(
        `comercio.ilike.%${search}%,descripcion.ilike.%${search}%`,
      );
    }

    const { data: expenses, count, error } = await request;

    if (error) {
      throw new BadRequestException("Error al consultar los gastos");
    }

    const formatted = (expenses || []).map((expense) => this.formatExpense(expense));

    return {
      data: formatted,
      pagination: {
        total: count ?? formatted.length,
        page,
        limit,
        totalPages: Math.ceil((count ?? formatted.length) / limit),
      },
    };
  }

  async getSummary(userId: string, query: SummaryQueryDto) {
    const [year, month] = query.month.split("-").map(Number);
    if (!year || !month || month < 1 || month > 12) {
      throw new BadRequestException("El mes debe tener formato YYYY-MM");
    }

    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);

    const { data: expenses, error } = await this.supabase
      .from("gastos")
      .select(
        `
          id,
          cliente_id,
          categoria_id,
          comercio,
          fecha_gasto,
          monto,
          descripcion,
          origen,
          moneda,
          ticket_principal_id,
          ocr_estado,
          ocr_confianza,
          creado_en,
          actualizado_en,
          categorias_de_gasto (
            id,
            nombre
          )
        `,
      )
      .eq("cliente_id", userId)
      .gte("fecha_gasto", firstDay)
      .lte("fecha_gasto", lastDay)
      .order("fecha_gasto", { ascending: true, nullsFirst: false });

    if (error) {
      throw new BadRequestException("Error al obtener el resumen de gastos");
    }

    const rows = expenses || [];
    const totalMonth = rows.reduce((acc, expense) => acc + Number(expense.monto), 0);
    const expenseCount = rows.length;
    const averageExpense = expenseCount ? totalMonth / expenseCount : 0;

    const grouped = rows.reduce((acc, expense) => {
      const categoryId = expense.categoria_id;
     
      const categoryData = expense.categorias_de_gasto as any;
      const categoryName = Array.isArray(categoryData) 
        ? categoryData[0]?.nombre 
        : categoryData?.nombre;
     
     
      const current = acc.find((item) => item.categoryId === categoryId);

      if (current) {
        current.totalAmount += Number(expense.monto);
      } else {
        acc.push({
          categoryId,
          categoryName,
          totalAmount: Number(expense.monto),
        });
      }

      return acc;
    }, [] as Array<{ categoryId: string; categoryName: string | null; totalAmount: number }>);

    const highestExpenseRow = rows.reduce((best, expense) => {
      if (!best || Number(expense.monto) > Number(best.monto)) {
        return expense;
      }
      return best;
    }, null as any);

    return {
      totalMonth,
      totalByCategory: grouped.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: Number(item.totalAmount.toFixed(2)),
      })),
      expenseCount,
      averageExpense: Number(averageExpense.toFixed(2)),
      highestExpense: highestExpenseRow
        ? this.formatExpense(highestExpenseRow)
        : null,
    };
  }

  async findOne(userId: string, id: string) {
    const { data: expense, error } = await this.supabase
      .from("gastos")
      .select(`
        id,
        cliente_id,
        categoria_id,
        comercio,
        fecha_gasto,
        monto,
        descripcion,
        origen,
        moneda,
        ticket_principal_id,
        ocr_estado,
        ocr_confianza,
        creado_en,
        actualizado_en,
        categorias_de_gasto (
          id,
          nombre
        )
      `)
      .eq("id", id)
      .eq("cliente_id", userId)
      .single();

    if (error || !expense) {
      throw new NotFoundException("Gasto no encontrado");
    }

    return {
      id: expense.id,
      amount: expense.monto,
      merchant: expense.comercio,
      categoryId: expense.categoria_id,
      categoryName: expense.categorias_de_gasto?.[0]?.nombre,
      date: expense.fecha_gasto,
      notes: expense.descripcion,
      ticketImageUrl: expense.ticket_principal_id || null,
      userId: expense.cliente_id,
      createdAt: expense.creado_en,
    };
  }

  async create(userId: string, dto: CreateExpenseDto) {
    // Validar que la categoría existe en el sistema global
    // NOTA: No hay categorías personales. Todas las categorías son globales y públicas.
    const { data: category, error: categoryError } = await this.supabase
      .from("categorias_de_gasto")
      .select("id, nombre")
      .eq("id", dto.categoryId)
      .single();

    if (categoryError || !category) {
      throw new BadRequestException(
        "La categoría especificada no existe. Solo se pueden asignar categorías globales.",
      );
    }

    // Insertar el gasto
    const { data: expense, error: expenseError } = await this.supabase
      .from("gastos")
      .insert({
        cliente_id: userId,
        categoria_id: dto.categoryId,
        comercio: dto.merchant,
        fecha_gasto: dto.date,
        monto: dto.amount,
        descripcion: dto.notes || null,
        origen: "manual",
        moneda: "ARS",
      })
      .select(`
        id,
        cliente_id,
        categoria_id,
        comercio,
        fecha_gasto,
        monto,
        descripcion,
        origen,
        moneda,
        ticket_principal_id,
        ocr_estado,
        ocr_confianza,
        creado_en,
        actualizado_en,
        categorias_de_gasto (
          id,
          nombre
        )
      `)
      .single();

    if (expenseError) {
      throw new BadRequestException("Error al crear el gasto");
    }

    // Formatear la respuesta según el contrato del API
    return {
      id: expense.id,
      amount: expense.monto,
      merchant: expense.comercio,
      categoryId: expense.categoria_id,
      categoryName: expense.categorias_de_gasto?.[0]?.nombre,
      date: expense.fecha_gasto,
      notes: expense.descripcion,
      ticketImageUrl: expense.ticket_principal_id || null,
      userId: expense.cliente_id,
      createdAt: expense.creado_en,
    };
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    // Verificar que el gasto existe y pertenece al usuario
    const { data: existingExpense, error: checkError } = await this.supabase
      .from("gastos")
      .select("id, cliente_id")
      .eq("id", id)
      .eq("cliente_id", userId)
      .single();

    if (checkError || !existingExpense) {
      throw new NotFoundException("Gasto no encontrado");
    }

    // Si viene categoryId, validar que existe en el sistema global
    // NOTA: No hay categorías personales. Todas las categorías son globales y públicas.
    if (dto.categoryId) {
      const { data: category, error: categoryError } = await this.supabase
        .from("categorias_de_gasto")
        .select("id")
        .eq("id", dto.categoryId)
        .single();

      if (categoryError || !category) {
        throw new BadRequestException(
          "La categoría especificada no existe. Solo se pueden asignar categorías globales.",
        );
      }
    }

    // Construir objeto de actualización solo con campos proporcionados
    const updateData: any = {};
    if (dto.amount !== undefined) updateData.monto = dto.amount;
    if (dto.merchant !== undefined) updateData.comercio = dto.merchant;
    if (dto.categoryId !== undefined) updateData.categoria_id = dto.categoryId;
    if (dto.date !== undefined) updateData.fecha_gasto = dto.date;
    if (dto.notes !== undefined) updateData.descripcion = dto.notes;

    // Actualizar el gasto
    const { data: expense, error: updateError } = await this.supabase
      .from("gastos")
      .update(updateData)
      .eq("id", id)
      .eq("cliente_id", userId)
      .select(`
        id,
        cliente_id,
        categoria_id,
        comercio,
        fecha_gasto,
        monto,
        descripcion,
        origen,
        moneda,
        ticket_principal_id,
        ocr_estado,
        ocr_confianza,
        creado_en,
        actualizado_en,
        categorias_de_gasto (
          id,
          nombre
        )
      `)
      .single();

    if (updateError || !expense) {
      throw new BadRequestException("Error al actualizar el gasto");
    }

    return {
      id: expense.id,
      amount: expense.monto,
      merchant: expense.comercio,
      categoryId: expense.categoria_id,
      categoryName: expense.categorias_de_gasto?.[0]?.nombre,
      date: expense.fecha_gasto,
      notes: expense.descripcion,
      ticketImageUrl: expense.ticket_principal_id || null,
      userId: expense.cliente_id,
      createdAt: expense.creado_en,
    };
  }

  async remove(userId: string, id: string) {
    // Verificar que el gasto existe y pertenece al usuario
    const { data: existingExpense, error: checkError } = await this.supabase
      .from("gastos")
      .select("id")
      .eq("id", id)
      .eq("cliente_id", userId)
      .single();

    if (checkError || !existingExpense) {
      throw new NotFoundException("Gasto no encontrado");
    }

    // Eliminar el gasto
    const { error: deleteError } = await this.supabase
      .from("gastos")
      .delete()
      .eq("id", id)
      .eq("cliente_id", userId);

    if (deleteError) {
      throw new BadRequestException("Error al eliminar el gasto");
    }
  }

  private formatExpense(expense: any) {
    return {
      id: expense.id,
      amount: Number(expense.monto),
      merchant: expense.comercio,
      categoryId: expense.categoria_id,
      categoryName: expense.categorias_de_gasto?.nombre,
      date: expense.fecha_gasto,
      notes: expense.descripcion,
      ticketImageUrl: expense.ticket_principal_id || null,
      userId: expense.cliente_id,
      createdAt: expense.creado_en,
    };
  }
}
