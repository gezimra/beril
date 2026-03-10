const CODE_SEQUENCE_WIDTH = 5;

function buildCode(prefix: string, year: number, sequence: number): string {
  const safeSequence = Math.max(1, Math.trunc(sequence));
  const paddedSequence = String(safeSequence).padStart(CODE_SEQUENCE_WIDTH, "0");
  return `${prefix}-${year}-${paddedSequence}`;
}

export function generateOrderCode(sequence: number, year = new Date().getFullYear()) {
  return buildCode("BRL-O", year, sequence);
}

export function generateRepairCode(
  sequence: number,
  year = new Date().getFullYear(),
) {
  return buildCode("BRL-R", year, sequence);
}

export function normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, "").trim();
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}
