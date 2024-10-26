export const addValidationError = (errors: { field: string; message: string }[], field: string, message: string) => {
  errors.push({ field, message });
};

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function formatDateToYMD(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}