const scoringTerms = [
  { term: "launch", points: 4 },
  { term: "released", points: 4 },
  { term: "announce", points: 4 },
  { term: "model", points: 4 },
  { term: "agent", points: 4 },
  { term: "automation", points: 4 },
  { term: "enterprise", points: 3 },
  { term: "business", points: 3 },
  { term: "developer", points: 3 },
  { term: "api", points: 3 },
  { term: "product", points: 3 },
  { term: "research", points: 2 },
  { term: "safety", points: 2 },
  { term: "benchmark", points: 2 },
  { term: "openai", points: 4 },
  { term: "anthropic", points: 4 },
  { term: "google", points: 3 },
  { term: "gemini", points: 3 },
  { term: "ia", points: 3 },
  { term: "automacao", points: 4 },
  { term: "automação", points: 4 },
  { term: "negocios", points: 3 },
  { term: "negócios", points: 3 }
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
  const searchableText = `${item.title} ${item.summary}`.toLowerCase();
  const keywordScore = scoringTerms.reduce((score, scoringTerm) => {
    return searchableText.includes(scoringTerm.term) ? score + scoringTerm.points : score;
  }, 0);

  const recencyScore = scoreRecency(item.publishedAt);
  const score = keywordScore + recencyScore + (item.sourceWeight ?? 1);

  return {
    ...item,
    score,
    reason: buildReason(item, score, keywordScore, recencyScore)
  };
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

function buildReason(item, score, keywordScore, recencyScore) {
  const reasons = [];

  if ((item.sourceWeight ?? 1) >= 5) {
    reasons.push("fonte oficial de alto peso");
  }

  if (keywordScore >= 8) {
    reasons.push("forte sinal de impacto/relevancia");
  } else if (keywordScore >= 4) {
    reasons.push("bom sinal de relevancia pratica");
  }

  if (recencyScore >= 3) {
    reasons.push("item recente");
  }

  return reasons.length ? reasons.join("; ") : `pontuacao ${score}`;
}

function compareRankedItems(a, b) {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  return dateValue(b.publishedAt) - dateValue(a.publishedAt);
}

function dateValue(value) {
  const date = new Date(value ?? 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase();
}
