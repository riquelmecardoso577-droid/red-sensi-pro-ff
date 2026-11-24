/** Traduz erros de login/cadastro para mensagens claras em português. */
export function mensagemErroAuth(erro: { message?: string; code?: string | undefined }, acao: "entrar" | "cadastrar"): string {
  const msg = erro.message ?? "";
  const code = erro.code ?? "";
  if (code === "weak_password" || /weak|easy to guess|pwned|leaked/i.test(msg))
    return "Essa senha é muito fácil de adivinhar. Use uma senha mais forte, misturando letras, números e símbolos.";
  if (code === "email_not_confirmed" || /not confirmed|confirm/i.test(msg))
    return "Confirme seu e-mail antes de entrar. Procure o link na sua caixa de entrada (e no spam).";
  if (code === "user_already_exists" || /registered|already/i.test(msg)) return "Esse e-mail já tem conta. Entre com ele.";
  if (/13|idade/i.test(msg)) return "Cadastro bloqueado: idade mínima de 13 anos.";
  if (code === "email_address_invalid" || /invalid.*email|email.*invalid/i.test(msg)) return "Esse e-mail não é válido. Confira e tente de novo.";
  if (code.startsWith("over_") || /rate limit|too many/i.test(msg))
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(msg))
    return "E-mail ou senha incorretos. Se ainda não tem conta, toque em criar conta.";
  return acao === "entrar"
    ? "Não deu pra entrar agora. Tente de novo em instantes."
    : "Não deu pra criar a conta. Confira os dados e tente de novo.";
}
