import { describe, expect, it } from "vitest";
import { mensagemErroAuth } from "./auth-erros";

describe("mensagens de erro de conta", () => {
  it("senha fraca é explicada no cadastro", () => {
    expect(mensagemErroAuth({ message: "Password is known to be weak and easy to guess, please choose a different one.", code: "weak_password" }, "cadastrar")).toMatch(/muito fácil/);
  });
  it("e-mail não confirmado pede confirmação no login", () => {
    expect(mensagemErroAuth({ message: "Email not confirmed", code: "email_not_confirmed" }, "entrar")).toMatch(/Confirme seu e-mail/);
  });
  it("senha errada no login", () => {
    expect(mensagemErroAuth({ message: "Invalid login credentials", code: "invalid_credentials" }, "entrar")).toMatch(/E-mail ou senha incorretos/);
  });
  it("muitas tentativas pede para esperar", () => {
    expect(mensagemErroAuth({ message: "email rate limit exceeded", code: "over_email_send_rate_limit" }, "cadastrar")).toMatch(/Espere alguns minutos/);
  });
});
