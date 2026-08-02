// data フォルダの JSON を読み込み、各ページに表示します。
const formatDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
};

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
})[character]);

const externalLink = (url, label) => url
  ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
  : "";

const createCard = (item, isSchedule = false) => {
  const meta = isSchedule
    ? `${formatDate(item.date)} ${item.time} ｜ ${item.location}`
    : `${formatDate(item.date)} ｜ ${item.location}`;
  if (isSchedule) {
    return `<article class="event-card"><p class="event-meta">${escapeHtml(meta)}</p><h3>${escapeHtml(item.title)}</h3><p class="event-description">${escapeHtml(item.description)}</p></article>`;
  }

  const participants = item.participants && item.participants !== "-"
    ? `<p class="event-participants">参加者：${escapeHtml(item.participants)}</p>`
    : "";
  const detailUrl = `event-detail.html?id=${encodeURIComponent(item.id)}`;

  return `<article class="event-card"><p class="event-meta"><a href="${detailUrl}">${escapeHtml(meta)}</a></p><h3><a class="card-title-link" href="${detailUrl}">${escapeHtml(item.title)}</a></h3>${participants}<p class="event-description">${escapeHtml(item.comment)}</p></article>`;
};

const renderItems = async (url, targetId, isSchedule = false, limit) => {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load data");
    const items = await response.json();
    const displayedItems = limit ? items.slice(0, limit) : items;
    target.innerHTML = displayedItems.length
      ? displayedItems.map((item) => createCard(item, isSchedule)).join("")
      : '<p class="empty-message">現在掲載中の情報はありません。</p>';
  } catch (error) {
    target.innerHTML = '<p class="empty-message">情報を読み込めませんでした。時間をおいて再度お試しください。</p>';
  }
};

const renderLatestEvents = async () => {
  const target = document.getElementById("latest-event");
  if (!target) return;
  try {
    const response = await fetch("data/events.json");
    if (!response.ok) throw new Error("Failed to load data");
    const items = await response.json();
    const latestEvents = [...items]
      .sort((first, second) => second.date.localeCompare(first.date))
      .slice(0, 5);

    target.innerHTML = latestEvents.length
      ? latestEvents.map((item) => createCard(item)).join("")
      : '<p class="empty-message">現在掲載中の情報はありません。</p>';
  } catch (error) {
    target.innerHTML = '<p class="empty-message">情報を読み込めませんでした。時間をおいて再度お試しください。</p>';
  }
};

const listLinks = (items, label) => items.length
  ? `<ul class="detail-link-list">${items.map((item) => `<li>${externalLink(item.url, item.participant ? `${item.participant}：${item.title}` : item.title)}</li>`).join("")}</ul>`
  : `<p class="empty-message">${label}はまだありません。</p>`;

const renderEventDetail = async () => {
  const target = document.getElementById("event-detail");
  if (!target) return;
  const eventId = new URLSearchParams(window.location.search).get("id");
  try {
    const response = await fetch("data/events.json");
    if (!response.ok) throw new Error("Failed to load data");
    const items = await response.json();
    const item = items.find((event) => event.id === eventId);
    if (!item) throw new Error("Event not found");

    const videos = item.videos ?? [];
    const consultations = item.aiConsultations ?? [];
    const practices = item.practiceContents ?? [];

    document.title = `${item.title} | tennis-base.net`;
    target.innerHTML = `<p class="eyebrow">EVENT DETAIL</p><p class="event-meta">${escapeHtml(formatDate(item.date))}</p><h1>${escapeHtml(item.title)}</h1><dl class="detail-list"><div><dt>開催場所</dt><dd>${escapeHtml(item.location)}</dd></div><div><dt>参加者</dt><dd>${escapeHtml(item.participants)}</dd></div></dl><section class="detail-section"><h2>練習内容</h2>${practices.length ? `<ul>${practices.map((practice) => `<li>${escapeHtml(practice)}</li>`).join("")}</ul>` : '<p>記録はありません。</p>'}</section><section class="detail-section"><h2>コメント</h2><p>${escapeHtml(item.comment)}</p></section><section class="detail-section"><h2>動画リンク</h2>${listLinks(videos, "動画")}</section><section class="detail-section"><h2>AI相談結果</h2>${listLinks(consultations, "AI相談結果")}</section><p><a class="text-link" href="events.html">← 開催記録一覧へ戻る</a></p>`;
  } catch (error) {
    target.innerHTML = '<p class="empty-message">開催情報が見つかりませんでした。</p><p><a class="text-link" href="events.html">開催記録一覧へ戻る</a></p>';
  }
};

document.getElementById("current-year").textContent = new Date().getFullYear();
renderLatestEvents();
renderItems("data/events.json", "events-list");
renderItems("data/schedule.json", "schedule-list", true);
renderEventDetail();
