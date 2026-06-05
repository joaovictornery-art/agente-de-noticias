import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function loadSentItems(storagePath) {
  try {
    const content = await readFile(storagePath, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.sentItems) ? parsed.sentItems : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function saveSentItems(storagePath, sentItems) {
  await mkdir(path.dirname(storagePath), { recursive: true });
  await writeFile(
    storagePath,
    JSON.stringify({ sentItems }, null, 2),
    "utf8"
  );
}

export async function markItemsAsSent(storagePath, currentSentItems, items) {
  const sentAt = new Date().toISOString();
  const newRecords = items.map((item) => ({
    id: item.id,
    title: item.title,
    source: item.source,
    url: item.url,
    sentAt
  }));

  const merged = dedupeRecords([...currentSentItems, ...newRecords]);
  await saveSentItems(storagePath, merged);

  return merged;
}

function dedupeRecords(records) {
  const seen = new Set();

  return records.filter((record) => {
    if (!record.id || seen.has(record.id)) {
      return false;
    }

    seen.add(record.id);
    return true;
  });
}
