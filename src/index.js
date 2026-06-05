import { config } from "./config.js";
import { sources } from "./sources.js";
import { fetchItemsFromSources } from "./fetchFeeds.js";
import { prepareDigestItems } from "./filterItems.js";
import { summarizeItems } from "./summarize.js";
import { buildDigestMessage } from "./digest.js";
import { sendTelegramMessage } from "./sendTelegram.js";
import { loadSentItems, markItemsAsSent } from "./storage.js";

async function main() {
  const mode = readMode(process.argv);
  const sentItems = await loadSentItems(config.runtime.storagePath);
  const sentItemIds = new Set(sentItems.map((item) => item.id));

  console.log("Coletando noticias das fontes do V1...");
  const fetchedItems = await fetchItemsFromSources(sources);
  console.log(`Itens coletados: ${fetchedItems.length}`);

  const selectedItems = prepareDigestItems(fetchedItems, sentItemIds, config);
  console.log(`Itens selecionados para o briefing: ${selectedItems.length}`);

  const summarizedItems = await summarizeItems(selectedItems, config);
  const message = buildDigestMessage(summarizedItems);

  if (mode === "dry-run") {
    console.log("\n--- PREVIEW DO BRIEFING ---\n");
    console.log(message);
    console.log("\n--- FIM DO PREVIEW ---");
    console.log("\nNada foi enviado e nenhum item foi marcado como usado.");
    return;
  }

  await sendTelegramMessage(config, message);
  await markItemsAsSent(config.runtime.storagePath, sentItems, summarizedItems);
  console.log("Briefing enviado pelo Telegram e historico atualizado.");
}

function readMode(argv) {
  if (argv.includes("--send")) {
    return "send";
  }

  return "dry-run";
}

main().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exitCode = 1;
});
