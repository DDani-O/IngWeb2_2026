// src/modules/analytics/types/consumption.types.ts

export interface ExpenseRecord {
  id: string;
  amount: number;
  merchant: string;
  date: string;
  categoryId: string;
  categoryName: string;
}

export interface CategoryExpenses {
  categoryId: string;
  categoryName: string;
  expenses: number[];
  records: ExpenseRecord[];
}

export interface MonthlyExpenseData {
  month: string;
  total: number;
  count: number;
  transactions: number[];
}

export interface DayExpenseData {
  dayOfWeek: number;
  total: number;
  count: number;
}
