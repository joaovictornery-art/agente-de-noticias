import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  trimValues: true
});

export async function fetchItemsFromSources(sources, options = {}) {
  const items = [];
  const fetchImpl = options.fetchImpl || fetch;

  for (const source of sources) {
    const sourceItems = await fetchSourceItems(source, fetchImpl);
    items.push(...sourceItems);
  }

  return items;
}

async function fetchSourceItems(source, fetchImpl) {
  try {
    const response = await fetchImpl(source.url, {
      headers: {
        "User-Agent": "projeto-agente-de-noticias/0.1 (+local personal digest)"
      }
    });

    if (!response.ok) {
      console.warn(`Fonte ignorada (${response.status}): ${source.name}`);
      return [];
    }

    const body = await response.text();
    const items = source.type === "rss"
      ? parseFeed(body, source)
      : parseHtmlListing(body, source);

    return filterBySourceKeywords(items, source);
  } catch (error) {
    console.warn(`Fonte ignorada (${source.name}): ${error.message}`);
    return [];
  }
}

function parseFeed(xml, source) {
  const parsed = xmlParser.parse(xml);
  const channelItems = parsed?.rss?.channel?.item ?? parsed?.rdf?.RDF?.item;
  const atomItems = parsed?.feed?.entry;
  const rawItems = normalizeArray(channelItems ?? atomItems);

  return rawItems.map((item) => normalizeFeedItem(item, source)).filter(Boolean);
}

function normalizeFeedItem(item, source) {
  const title = cleanText(readText(item.title));
  const summary = cleanText(readText(item.description ?? item.summary ?? item.content));
  const url = readFeedUrl(item.link, item.guid);

  if (!title || !url) {
    return null;
  }

  return {
    id: stableId(url),
    source: source.name,
    sourceWeight: source.sourceWeight ?? 1,
    title,
    summary,
    url,
    publishedAt: normalizeDate(item.pubDate ?? item.published ?? item.updated ?? item["dc:date"])
  };
}

function parseHtmlListing(html, source) {
  const $ = cheerio.load(html);
  const itemsByUrl = new Map();

  $(source.linkSelector ?? "a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const url = normalizeUrl(href, source.baseUrl ?? source.url);
    const title = cleanListingTitle($(element).text());

    if (!url || !title || !matchesIncludePatterns(url, source.includePatterns)) {
      return;
    }

    const item = {
      id: stableId(url),
      source: source.name,
      sourceWeight: source.sourceWeight ?? 1,
      title,
      summary: "",
      url,
      publishedAt: extractDateFromText($(element).text())
    };

    const existingItem = itemsByUrl.get(url);
    if (!existingItem || isBetterHtmlTitle(item.title, existingItem.title)) {
      itemsByUrl.set(url, item);
    }
  });

  return [...itemsByUrl.values()];
}

function filterBySourceKeywords(items, source) {
  if (!source.requiredKeywords?.length) {
    return items;
  }

  return items.filter((item) => {
    const searchableText = `${item.title} ${item.summary}`.toLowerCase();
    return source.requiredKeywords.some((keyword) => searchableText.includes(keyword.toLowerCase()));
  });
}

function readFeedUrl(link, guid) {
  if (typeof link === "string") {
    return link;
  }

  if (Array.isArray(link)) {
    const alternate = link.find((entry) => entry?.rel === "alternate" || entry?.href);
    return alternate?.href ?? null;
  }

  if (link?.href) {
    return link.href;
  }

  if (typeof guid === "string" && guid.startsWith("http")) {
    return guid;
  }

  if (guid?.text?.startsWith("http")) {
    return guid.text;
  }

  return null;
}

function readText(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value?.text) {
    return value.text;
  }

  if (value?.["#text"]) {
    return value["#text"];
  }

  return "";
}

function normalizeArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeUrl(href, baseUrl) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:")) {
    return null;
  }

  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function matchesIncludePatterns(url, patterns = []) {
  return !patterns.length || patterns.some((pattern) => url.includes(pattern));
}

function normalizeDate(value) {
  const rawValue = readText(value);
  if (!rawValue) {
    return null;
  }

  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractDateFromText(value) {
  const match = String(value ?? "").match(/[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/);
  return match ? normalizeDate(match[0]) : null;
}

function cleanListingTitle(value) {
  let title = cleanText(value);

  title = title.replace(
    /^(Announcements|Product|Policy|Research|Company|Engineering|Global Affairs)([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})(.+)$/i,
    "$3"
  );
  title = title.replace(
    /^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}(Announcements|Product|Policy|Research|Company|Engineering|Global Affairs)(.+)$/i,
    "$2"
  );
  title = title.replace(
    /^(.+?)(Announcements|Product|Policy|Research|Company|Engineering|Global Affairs)[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}.+$/i,
    "$1"
  );
  title = title.replace(
    /^(.+?)(Announcements|Product|Policy|Research|Company|Engineering|Global Affairs)(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}$/i,
    "$1"
  );

  return title.replace(/\s+/g, " ").trim();
}

function isBetterHtmlTitle(candidate, current) {
  if (candidate.length < current.length && candidate.length >= 20) {
    return true;
  }

  const candidateLooksClean = !/[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/.test(candidate);
  const currentLooksDirty = /[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/.test(current);

  return candidateLooksClean && currentLooksDirty;
}

function cleanText(value) {
  const strippedText = String(value ?? "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gis, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return decodeHtmlEntities(decodeHtmlEntities(strippedText));
}

function decodeHtmlEntities(value) {
  return cheerio.load(`<span>${value}</span>`).text();
}

function stableId(value) {
  return String(value).trim().toLowerCase();
}
