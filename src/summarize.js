import { GoogleGenerativeAI } from "@google/generative-ai";

export async function summarizeItems(items, config) {
  if (!items.length) {
    return [];
  }

  if (!config.gemini.apiKey) {
    return items.map((item) => ({
      ...item,
      shortSummary: fallbackSummary(item),
      whyItMatters: fallbackWhyItMatters(item),
      practicalApplication: fallbackPracticalApplication(item)
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
    whyItMatters: summaries[index]?.whyItMatters || fallbackWhyItMatters(item),
    practicalApplication: summaries[index]?.practicalApplication || fallbackPracticalApplication(item)
  }));
}

function buildPrompt(items, language) {
  const payload = items.map((item, index) => ({
    index,
    source: item.source,
    title: item.title,
    summary: item.summary,
    url: item.url,
    priorityCategory: item.priorityCategory,
    applicationArea: item.applicationArea,
    rankingReason: item.reason
  }));

  return `
Voce e um curador de noticias de IA, automacoes e negocios.
Responda somente com JSON valido, sem markdown.
Idioma: ${language}.

Para cada item, gere:
- shortSummary: resumo em ate 220 caracteres.
- whyItMatters: por que isso importa em ate 180 caracteres, priorizando carreira pessoal e portfolio antes do trabalho.
- practicalApplication: uma aplicacao possivel em ate 160 caracteres.

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

  return "Selecionada por relevancia para sua trilha em IA aplicada, automacoes e solucoes.";
}

function fallbackPracticalApplication(item) {
  if (item.applicationArea === "trabalho na Stays") {
    return "Avaliar se a ideia ajuda suporte, base de conhecimento, ticket intelligence ou automacao interna.";
  }

  if (item.applicationArea === "portfolio/projeto proprio") {
    return "Transformar o conceito em um pequeno projeto demonstravel para GitHub, README ou entrevista.";
  }

  if (item.applicationArea === "carreira pessoal") {
    return "Usar como repertorio para estudar, construir solucoes com IA e fortalecer narrativa profissional.";
  }

  return "Guardar como sinal de mercado e acompanhar se surgir aplicacao pratica.";
}

function truncate(value, maxLength) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}...`;
}
