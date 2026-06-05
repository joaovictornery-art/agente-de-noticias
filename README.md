# projeto-agente-de-noticias

Agente local para montar um briefing curto de IA, automacoes e negocios e enviar pelo Telegram.

## V1

O V1 faz quatro coisas:

- Coleta noticias das fontes combinadas: OpenAI, Anthropic, Google AI Blog e TechCrunch AI.
- Remove itens repetidos e ignora noticias ja enviadas.
- Seleciona ate 5 itens por briefing usando sinais simples de impacto, relevancia pratica, inovacao, urgencia e peso da fonte.
- Gera uma mensagem em portugues com resumo, motivo de importancia e link.

## Como rodar

Instale as dependencias:

```bash
npm.cmd install
```

Crie seu arquivo local de configuracao:

```bash
copy .env.example .env
```

Preencha o `.env` quando quiser usar Gemini e Telegram:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
GEMINI_API_KEY=
```

Gerar apenas uma previa local, sem enviar nada:

```bash
npm.cmd run preview
```

Enviar pelo Telegram:

```bash
npm.cmd run send
```

Validar a sintaxe dos arquivos principais:

```bash
npm.cmd run check
```

## O que acontece sem chaves

- Sem `GEMINI_API_KEY`: o projeto usa um resumo local simples com base no titulo/descricao.
- Sem `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`: o preview funciona normalmente, mas o envio real falha com uma mensagem explicando o que falta.

## Historico local

Quando o envio real da certo, o projeto grava os itens enviados em:

```text
data/sent-items.json
```

Essa pasta fica fora do Git para nao versionar seu historico pessoal.

## Estrutura

- `src/index.js`: fluxo principal.
- `src/sources.js`: fontes do V1.
- `src/fetchFeeds.js`: coleta RSS/Atom e HTML.
- `src/filterItems.js`: deduplicacao, filtro de historico e ranking.
- `src/summarize.js`: resumo com Gemini ou fallback local.
- `src/digest.js`: montagem da mensagem final.
- `src/sendTelegram.js`: envio pelo Telegram.
- `src/storage.js`: historico local de itens enviados.

## Limite atual

O projeto esta pronto para uso local. A proxima parte que depende de voce e criar o repositorio no GitHub e subir estes arquivos.

Observacao sobre fontes: a OpenAI bloqueou a coleta direta da pagina oficial durante os testes locais, entao o V1 usa a pagina publica da OpenRSS como espelho de listagem. Os links finais continuam apontando para `openai.com`.
