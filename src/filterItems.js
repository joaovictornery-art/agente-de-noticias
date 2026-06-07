const scoringProfiles = [
  {
    id: "crescimento_profissional",
    label: "Crescimento profissional",
    weight: 5,
    terms: [
      "agent",
      "agents",
      "ai agent",
      "automation",
      "workflow",
      "integration",
      "api",
      "developer",
      "developers",
      "platform",
      "ai tools",
      "developer tools",
      "function calling",
      "mcp",
      "rag",
      "knowledge base",
      "solutions",
      "builder",
      "claude",
      "codex",
      "n8n"
    ]
  },
  {
    id: "portfolio_projetos",
    label: "Portfolio e projetos pessoais",
    weight: 4,
    terms: [
      "dashboard",
      "analytics",
      "bi",
      "customer support",
      "support ai",
      "help desk",
      "sales",
      "business",
      "small business",
      "assistant",
      "chatbot",
      "telegram",
      "document",
      "pdf",
      "semantic search",
      "database",
      "prototype",
      "app",
      "product"
    ]
  },
  {
    id: "aplicacao_trabalho",
    label: "Aplicacao no trabalho",
    weight: 3,
    terms: [
      "support ai",
      "ticket",
      "tickets",
      "customer intelligence",
      "customer health",
      "health score",
      "knowledge hub",
      "single source of truth",
      "salesforce",
      "crm",
      "botmaker",
      "embedding",
      "embeddings",
      "cluster",
      "classification",
      "eval",
      "evals",
      "pii",
      "redaction",
      "privacy",
      "lgpd",
      "firebase",
      "firestore",
      "serverless",
      "observability",
      "logs",
      "monitoring"
    ]
  },
  {
    id: "mercado_estrategia",
    label: "Mercado e estrategia",
    weight: 2,
    terms: [
      "enterprise",
      "openai",
      "anthropic",
      "google",
      "gemini",
      "case study",
      "customer story",
      "partnership",
      "adoption",
      "launch",
      "released",
      "announce",
      "model",
      "startup",
      "funding",
      "ipo",
      "revenue",
      "market"
    ]
  },
  {
    id: "pesquisa_hype",
    label: "Pesquisa ou hype",
    weight: 1,
    terms: [
      "research",
      "paper",
      "benchmark",
      "safety",
      "policy",
      "valuation"
    ]
  }
];

const lowSignalTerms = [
  "funding",
  "valuation",
  "ipo",
  "office",
  "shopping",
  "thrift",
  "ransomware",
  "hack",
  "policy",
  "lawsuit",
  "regulation"
];

export function prepareDigestItems(items, sentItemIds, config) {
  const lookbackDays = config.runtime.lookbackDays;
  const maxItems = config.runtime.maxItemsPerDigest;
  const freshItems = filterFreshItems(items, lookbackDays);
  const uniqueItems = dedupeItems(freshItems);
  const unseenItems = uniqueItems.filter((item) => !sentItemIds.has(item.id));
  const scoredItems = unseenItems.map(scoreItem);

  return scoredItems
    .sort(compareRankedItems)
    .slice(0, maxItems);
}

export function dedupeItems(items) {
  const seen = new Set();
  const uniqueItems = [];

  for (const item of items) {
    const key = normalizeKey(item.id || item.url || item.title);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueItems.push({ ...item, id: key });
  }

  return uniqueItems;
}

function filterFreshItems(items, lookbackDays) {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - lookbackDays);

  return items.filter((item) => {
    if (!item.publishedAt) {
      return true;
    }

    const publishedAt = new Date(item.publishedAt);
    return !Number.isNaN(publishedAt.getTime()) && publishedAt >= minDate;
  });
}

function scoreItem(item) {
  const searchableText = normalizeSearchText(`${item.title} ${item.summary}`);
  const profileScores = scoreProfiles(searchableText);
  const topProfile = getTopProfile(profileScores);
  const sourceScore = item.sourceWeight ?? 1;
  const recencyScore = scoreRecency(item.publishedAt);
  const lowSignalPenalty = scoreLowSignalPenalty(searchableText, profileScores);
  const profileScore = profileScores.reduce((sum, profile) => sum + profile.score, 0);
  const score = profileScore + sourceScore + recencyScore - lowSignalPenalty;

  return {
    ...item,
    score,
    priorityCategory: topProfile.label,
    priorityCategoryId: topProfile.id,
    applicationArea: buildApplicationArea(topProfile.id),
    reason: buildReason(item, profileScores, topProfile, recencyScore, lowSignalPenalty)
  };
}

function scoreProfiles(searchableText) {
  return scoringProfiles.map((profile) => {
    const matchedTerms = profile.terms.filter((term) => termMatches(searchableText, term));
    return {
      id: profile.id,
      label: profile.label,
      matchedTerms,
      score: matchedTerms.length * profile.weight
    };
  });
}

function getTopProfile(profileScores) {
  const sortedProfiles = [...profileScores].sort((a, b) => b.score - a.score);
  return sortedProfiles[0]?.score > 0 ? sortedProfiles[0] : scoringProfiles[3];
}

function scoreRecency(publishedAt) {
  if (!publishedAt) {
    return 1;
  }

  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= 2) {
    return 5;
  }

  if (ageDays <= 7) {
    return 3;
  }

  return 1;
}

function scoreLowSignalPenalty(searchableText, profileScores) {
  const hasLowSignal = lowSignalTerms.some((term) => termMatches(searchableText, term));
  const hasCareerOrPortfolioSignal = profileScores.some((profile) => {
    return ["crescimento_profissional", "portfolio_projetos", "aplicacao_trabalho"].includes(profile.id)
      && profile.score > 0;
  });

  if (!hasLowSignal) {
    return 0;
  }

  return hasCareerOrPortfolioSignal ? 3 : 6;
}

function buildApplicationArea(profileId) {
  const applicationAreas = {
    crescimento_profissional: "carreira pessoal",
    portfolio_projetos: "portfolio/projeto proprio",
    aplicacao_trabalho: "trabalho na Stays",
    mercado_estrategia: "visao de mercado",
    pesquisa_hype: "estudo futuro"
  };

  return applicationAreas[profileId] ?? "visao de mercado";
}

function buildReason(item, profileScores, topProfile, recencyScore, lowSignalPenalty) {
  const reasons = [];
  const strongProfiles = profileScores
    .filter((profile) => profile.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  for (const profile of strongProfiles) {
    const terms = profile.matchedTerms.slice(0, 3).join(", ");
    reasons.push(`${profile.label}: ${terms}`);
  }

  if ((item.sourceWeight ?? 1) >= 5) {
    reasons.push("fonte oficial de alto peso");
  }

  if (recencyScore >= 3) {
    reasons.push("item recente");
  }

  if (lowSignalPenalty > 0) {
    reasons.push("sinal de hype/mercado reduzido por baixa aplicabilidade");
  }

  return reasons.length ? reasons.join("; ") : `categoria principal: ${topProfile.label}`;
}

function compareRankedItems(a, b) {
  const priorityOrder = [
    "crescimento_profissional",
    "portfolio_projetos",
    "aplicacao_trabalho",
    "mercado_estrategia",
    "pesquisa_hype"
  ];
  const priorityDelta = priorityOrder.indexOf(a.priorityCategoryId) - priorityOrder.indexOf(b.priorityCategoryId);

  if (b.score !== a.score) {
    return b.score - a.score;
  }

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return dateValue(b.publishedAt) - dateValue(a.publishedAt);
}

function dateValue(value) {
  const date = new Date(value ?? 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeKey(value) {
  const text = String(value ?? "").trim().toLowerCase();

  try {
    const url = new URL(text);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return text;
  }
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function termMatches(searchableText, term) {
  const normalizedTerm = normalizeSearchText(term);
  const escapedTerm = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`, "i");
  return pattern.test(searchableText);
}
