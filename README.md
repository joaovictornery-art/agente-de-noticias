# projeto-agente-de-noticias

Agente local para montar um briefing curto de IA, automacoes e negocios e enviar pelo Telegram.

## V1

O V1 faz quatro coisas:

- Coleta noticias das fontes combinadas: OpenAI, Anthropic, Google AI Blog e TechCrunch AI.
- Remove itens repetidos e ignora noticias ja enviadas.
- Seleciona ate 5 itens por briefing usando criterios ligados a carreira, portfolio, trabalho, mercado e aplicabilidade real.
- Gera uma mensagem em portugues com resumo, motivo de importancia, aplicacao possivel e link.

## Criterios de curadoria

O radar prioriza noticias que ajudam o Joao a crescer como AI Solutions Builder / AI Product Builder.

Ordem de prioridade:

1. Crescimento profissional pessoal: agentes, automacoes, integracoes, APIs, RAG, MCP, OpenAI, Anthropic, Gemini, Claude, Codex, n8n e ferramentas para construir solucoes com IA.
2. Portfolio e projetos pessoais: ideias que possam virar projeto publico, demonstracao, README, dashboard, assistente, base de conhecimento ou automacao real.
3. Aplicacao no trabalho: suporte com IA, ticket intelligence, Knowledge Hub, KBChat, Salesforce, Botmaker, customer intelligence, embeddings, privacidade, Firebase, logs e observabilidade.
4. Mercado e estrategia: movimentos relevantes de Big Techs, startups, plataformas e casos reais de adocao.
5. Pesquisa ou hype: benchmarks, funding, valuation e pesquisa pura so entram bem quando tiverem aplicacao clara para carreira, portfolio ou trabalho.

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

## Como colocar no ar pelo GitHub Actions

O jeito mais simples e sem servidor pago e usar o proprio GitHub Actions.

O workflow ja esta configurado em:

```text
.github/workflows/send-digest.yml
```

Ele roda:

- Toda segunda e quinta.
- As 08:00 no horario de Sao Paulo.
- Tambem manualmente pelo botao `Run workflow` dentro da aba `Actions`.

### Secrets obrigatorios

No GitHub, abra:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

Crie estes secrets:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

O `GEMINI_API_KEY` e opcional. Sem ele, o projeto envia um resumo simples usando titulo/descricao da noticia.

### Como testar depois das chaves

Depois de cadastrar os secrets:

1. Entre na aba `Actions` do repositorio.
2. Clique em `Send news digest`.
3. Clique em `Run workflow`.
4. Confirme se a mensagem chegou no Telegram.

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

O projeto esta pronto para uso local e para rodar no GitHub Actions. A parte que ainda depende de voce e cadastrar as chaves do Telegram como secrets no GitHub.

Observacao sobre fontes: a OpenAI bloqueou a coleta direta da pagina oficial durante os testes locais, entao o V1 usa a pagina publica da OpenRSS como espelho de listagem. Os links finais continuam apontando para `openai.com`.
