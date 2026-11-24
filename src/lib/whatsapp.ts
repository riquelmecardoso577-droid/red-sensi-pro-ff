export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function numeroWhatsApp(valor: string): string {
  const d = somenteDigitos(valor);
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

export function linkWhatsApp(numero: string, texto: string): string {
  return `https://wa.me/${numeroWhatsApp(numero)}?text=${encodeURIComponent(texto)}`;
}

export function whatsappValido(valor: string): boolean {
  const d = somenteDigitos(valor);
  return d.length >= 10 && d.length <= 13;
}
