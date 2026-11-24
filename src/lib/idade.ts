export const IDADE_MINIMA = 13;

/** Calcula a idade completa a partir de "AAAA-MM-DD". */
export function calcularIdade(nascimento: string, hoje: Date = new Date()): number {
  const [a, m, d] = nascimento.split("-").map(Number);
  if (!a || !m || !d) return NaN;
  let idade = hoje.getFullYear() - a;
  const mes = hoje.getMonth() + 1;
  if (mes < m || (mes === m && hoje.getDate() < d)) idade--;
  return idade;
}

export function idadePermitida(nascimento: string, hoje: Date = new Date()): boolean {
  const idade = calcularIdade(nascimento, hoje);
  return Number.isFinite(idade) && idade >= IDADE_MINIMA && idade < 120;
}

/** Data de hoje no horário de Brasília, em "AAAA-MM-DD". */
export function hojeBrasilia(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** Capas valem só no dia em que foram registradas. */
export function capasDeHoje(capas: number, capasDia: string | null | undefined, agora: Date = new Date()): number {
  return capasDia === hojeBrasilia(agora) ? capas : 0;
}
