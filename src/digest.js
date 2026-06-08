export function buildDigestMessage(items) {
  if (!items.length) {
    return "Nenhuma novidade nova encontrada para o briefing de hoje.";
  }

  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date());

  const lines = [
    "<b>Radar da IA</b>",
    `<i>${escapeHtml(date)} - as melhores ${items.length} noticias</i>`,
    ""
  ];

  items.forEach((item, index) => {
    lines.push(`<b>${index + 1}. ${escapeHtml(item.title)}</b>`);
    lines.push(`Fonte: ${escapeHtml(item.source)}`);
    lines.push(`Categoria: ${escapeHtml(item.priorityCategory)}`);
    lines.push(`Resumo: ${escapeHtml(item.shortSummary)}`);
    lines.push(`Link: ${escapeHtml(item.url)}`);
    lines.push("");
  });

  return lines.join("\n").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
