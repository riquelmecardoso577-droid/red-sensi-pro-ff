# Red Sensi Pro Ff

Crie o RED SENSI PRO FF - Rede Social Gamer de Free Fire, estilo Free Fire + Instagram + TikTok.



TECNOLOGIA: Next.js 14, Tailwind CSS, Supabase.



CORES: Fundo #0a0a0a, Vermelho #ff0033, Mobile first.

NOME DO APP: RED SENSI PRO FF - Logo: RED em vermelho neon, SENSI em branco, PRO FF pequeno embaixo. Nome curto no PWA: RED SENSI



1. BANCO SUPABASE - Tabelas:

- sensis: id, marca, modelo, geral, vermelho, mira2x, mira4x, awm, olhadinha, botao, dpi, preco, destaque

- usuarios: id, nome, foto, data_nascimento (date), idade (int), nick_ff, whatsapp, patente, capas_hoje, bio, verificado (boolean)

- posts: id, usuario_id, foto_video, legenda, curtidas

- videos: id, usuario_id, video_url, legenda, curtidas

- pedidos: id, sensi_id, whatsapp_cliente, valor, status

- verificados: id, usuario_id, id_ff, print_url, rede_social (TikTok/Kwai/Instagram/YouTube), arroba, status (pendente/aprovado/reprovado)



INSIRA AS 18 SENSIS DE ANTES (Samsung Padrão 184, Samsung A17 194, Universal 190, Universal V2 177, Só Capa 200, Verificado 189, Meta 198, DPI 721, Balanceada 180, Felpsz 175, Chataco 198, Mikasa 184, Universal V3 177, sadx 177, Ponto Vermelho 200, Equilibrada 157, Caveira 165, Laranja 128)



2. CADASTRO OBRIGATÓRIO:

- Campos: Nome, Foto, Data de Nascimento (calcular idade), Nick FF, WhatsApp, Senha

- Bloquear se menor de 13 anos

- Mostrar só idade no perfil, não data completa



3. 5 ABAS:

- INÍCIO: Feed Instagram - Stories em cima, posts, curtir, comentar, seguir, selo verificado azul

- VÍDEOS: Estilo TikTok - Tela cheia, desliza pra cima, curtir, "USAR ESSA SENSI"

- COMUNIDADE: Ranking capa, clãs, desafios

- LOJA: Grid 18 sensis, filtro Samsung, Motorola, Xiaomi, iPhone, Universal, Xit. Página /sensi/[id] com tabela + COPIAR

- PERFIL: Foto, nome + selo verificado, idade, patente, bio, capas hoje, botão "Pedir Verificado ✅"



4. SISTEMA VERIFICADO:

- Formulário: ID FF, Print do perfil FF com selo Garena, Rede Social (TikTok/Kwai/Instagram/YouTube), @

- Cria registro pendente, Admin aprova/reprova



5. CHECKOUT PIX:

Modal Chave PIX, QR Code, valor R$ 7,90, campo WhatsApp, botão "JÁ FIZ O PIX" cria pedido PENDENTE, redireciona WhatsApp



6. ADMIN /admin:

Login Supabase Auth, Dashboard pedidos, APROVAR/REPROVAR pedidos, CRUD sensis, Config PIX/WhatsApp, ABA VERIFICADOS: Nome, ID FF, Rede Social, @, Print, Idade, APROVAR/REPROVAR, Lista usuários com Nome, Idade, Data Nascimento, Nick FF



7. PWA:

manifest.json name "RED SENSI PRO FF", short_name "RED SENSI", theme_color #ff0033, display standalone, icons 192 e 512, sw.js, botão INSTALAR APP



Gere tudo funcionando, paginação 10 em 10 no feed.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://red-sensi-pro-ff.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b45e852-9f36-4a02-8862-724011ea8df1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
