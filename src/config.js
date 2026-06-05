import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const config = {
  telegram: {
    botToken: readEnv("TELEGRAM_BOT_TOKEN"),
    chatId: readEnv("TELEGRAM_CHAT_ID")
  },
  gemini: {
    apiKey: readEnv("GEMINI_API_KEY"),
    model: readEnv("GEMINI_MODEL", "gemini-1.5-flash")
  },
  runtime: {
    maxItemsPerDigest: readNumberEnv("MAX_ITEMS_PER_DIGEST", 5),
    lookbackDays: readNumberEnv("LOOKBACK_DAYS", 14),
    language: readEnv("DIGEST_LANGUAGE", "pt-BR"),
    storagePath: readEnv("SENT_ITEMS_PATH", "data/sent-items.json")
  }
};

function readEnv(name, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

function readNumberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
