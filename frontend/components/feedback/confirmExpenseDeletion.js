/** Confirmación para borrar un gasto, la misma desde el historial y desde la edición. */
import { confirmDialog } from "../organisms/Modal.js";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Pregunta antes de borrar, con el comercio y el monto del gasto.
 * @param {{merchant: string, amount: number}} expense
 * @returns {Promise<boolean>} `true` si el cliente confirmó
 */
export function confirmExpenseDeletion(expense) {
  return confirmDialog({
    title: "Eliminar gasto",
    message: `Se eliminara el gasto de ${expense.merchant} por ${formatCurrency(expense.amount)}.`,
    confirmLabel: "Eliminar",
  });
}
