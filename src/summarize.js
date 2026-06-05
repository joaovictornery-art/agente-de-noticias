import { GoogleGenerativeAI } from "@google/generative-ai";

export async function summarizeItems(items, config) {
  if (!items.length) {
    return [];
  }

  if (!config.gemini.apiKey) {
    return items.map((item) => ({
      ...item,
      shortSummary: fallbackSummary(item),
      whyItMatters: fallbackWhyItMatters(item)
    }));
  }

  return summarizeWithGemini(items, config);
}

async function summarizeWithGemini(items, config) {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const model = genAI.getGenerativeModel({ model: config.gemini.model });

  const prompt = buildPrompt(items, config.runtime.language);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const summaries = parseJsonArray(text);

  return items.map((item, index) => ({
    ...item,
    shortSummary: summaries[index]?.shortSummary || fallbackSummary(item),
    whyItMatters: summaries[index]?.whyItMatters || fallbackWhyItMatters(item)
  }));
}

function buildPrompt(items, language) {
  const payload = items.map((item, index) => ({
    index,
    source: item.source,
    title: item.title,
    summary: item.summary,
    url: item.url,
    rankingReason: item.reason
  }));

  return `
Voce e um curador de noticias de IA, automacoes e negocios.
Responda somente com JSON valido, sem markdown.
Idioma: ${language}.

Para cada item, gere:
- shortSummary: resumo em ate 220 caracteres.
- whyItMatters: por que isso importa em ate 180 caracteres, com foco em impacto pratico.

Itens:
${JSON.stringify(payload, null, 2)}
`;
}

function parseJsonArray(text) {
  try {
    const cleanText = text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleanText);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fallbackSummary(item) {
  const sourceText = item.summary || item.title;
  return truncate(sourceText, 220);
}

function fallbackWhyItMatters(item) {
  if (item.reason) {
    return `Selecionada por ${item.reason}.`;
  }

  return "Selecionada por relevancia para IA, automacoes ou negocios.";
}

function truncate(value, maxLength) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}...`;
}
