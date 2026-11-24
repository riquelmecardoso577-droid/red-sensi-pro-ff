// Gera o "PIX Copia e Cola" (BR Code / EMV) com CRC16-CCITT.
function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function normalizarPix(texto: string, max: number): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, max)
    .trim();
}

export interface DadosPix {
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
  txid?: string;
}

export function gerarPixCopiaECola({ chave, nome, cidade, valor, txid = "***" }: DadosPix): string {
  const conta = tlv("00", "br.gov.bcb.pix") + tlv("01", chave.trim());
  const id = txid.replace(/[^A-Za-z0-9*]/g, "").slice(0, 25) || "***";
  let payload =
    tlv("00", "01") +
    tlv("26", conta) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", valor.toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", normalizarPix(nome, 25) || "RED SENSI") +
    tlv("60", normalizarPix(cidade, 15) || "SAO PAULO") +
    tlv("62", tlv("05", id));
  payload += "6304";
  return payload + crc16(payload);
}

export const PRECO_SENSI = 7.9;

export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
