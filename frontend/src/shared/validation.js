export const digits = (value) => String(value ?? '').replace(/\D/g, '');
export function validCPF(value) {
  const cpf = digits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let length = 9; length <= 10; length++) {
    let total = 0;
    for (let i = 0; i < length; i++) total += Number(cpf[i]) * (length + 1 - i);
    const check = ((total * 10) % 11) % 10;
    if (check !== Number(cpf[length])) return false;
  }
  return true;
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validCNS(value) {
  const cns = digits(value);
  return (
    /^\d{15}$/.test(cns) &&
    !/^(\d)\1{14}$/.test(cns) &&
    [...cns].reduce((sum, v, i) => sum + Number(v) * (15 - i), 0) % 11 === 0
  );
}
export const normalizeSearch = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const csvCell = (value) =>
  `"${String(value ?? '')
    .replace(/^[\s]*[=+@-]/, "'$&")
    .replace(/"/g, '""')}"`;
