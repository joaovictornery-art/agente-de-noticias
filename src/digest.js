export function buildDigestMessage(items) {
  if (!items.length) {
    return "Nenhuma novidade nova encontrada para o briefing de hoje.";
  }

  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date());

  const lines = [
    "<b>Briefing de IA, automacoes e negocios</b>",
    `<i>${escapeHtml(date)} - ${items.length} noticias selecionadas</i>`,
    ""
  ];

  items.forEach((item, index) => {
    lines.push(`<b>${index + 1}. ${escapeHtml(item.title)}</b>`);
    lines.push(`Fonte: ${escapeHtml(item.source)}`);
    lines.push(`Resumo: ${escapeHtml(item.shortSummary)}`);
    lines.push(`Por que importa: ${escapeHtml(item.whyItMatters)}`);
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
