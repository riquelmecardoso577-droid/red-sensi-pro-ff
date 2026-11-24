import { describe, expect, it } from "vitest";
import { calcularIdade, capasDeHoje, idadePermitida } from "./idade";
import { crc16, gerarPixCopiaECola, PRECO_SENSI } from "./pix";

describe("cadastro: idade mínima 13 anos", () => {
  const hoje = new Date(2026, 10, 24); // 24/11/2026
  it("bloqueia quem tem 12 anos", () => {
    expect(calcularIdade("2014-01-10", hoje)).toBe(12);
    expect(idadePermitida("2014-01-10", hoje)).toBe(false);
  });
  it("bloqueia quem faz 13 só amanhã", () => {
    expect(idadePermitida("2013-11-25", hoje)).toBe(false);
  });
  it("libera quem fez 13 hoje", () => {
    expect(idadePermitida("2013-11-24", hoje)).toBe(true);
  });
});

describe("checkout PIX", () => {
  it("valor da sensi é R$ 7,90", () => {
    expect(PRECO_SENSI).toBe(7.9);
  });
  it("CRC16 padrão do BR Code", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
  it("payload leva o valor 7.90 e termina com CRC válido", () => {
    const p = gerarPixCopiaECola({ chave: "teste@redsensi.com", nome: "Red Sensi", cidade: "São Paulo", valor: 7.9 });
    expect(p).toContain("54047.90");
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
  });
});

describe("capas hoje", () => {
  it("zera capas de outro dia", () => {
    const agora = new Date("2026-11-24T15:00:00Z");
    expect(capasDeHoje(30, "2026-11-23", agora)).toBe(0);
    expect(capasDeHoje(30, "2026-11-24", agora)).toBe(30);
  });
});
