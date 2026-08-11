// data フォルダの JSON を読み込み、各ページに表示します。
const formatDate = (dateString) => {
  const date = new Date(dateString);

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
  console.log("createCard:", item);

  const meta = isSchedule
    ? `${formatDate(item.date)} ${item.time} ｜ ${item.location}`
    : `${formatDate(item.date)} ｜ ${item.location}`;
  if (isSchedule) {
    return `<article class="event-card"><p class="event-meta">${escapeHtml(meta)}</p><h3>${escapeHtml(item.title)}</h3>${item.description ? `<p class="event-description">${escapeHtml(item.description)}</p>` : ""}</article>`;
  }

  const participants = item.participants && item.participants !== "-"
    ? `<p class="event-participants">参加者：${escapeHtml(item.participants)}</p>`
    : "";
  const detailUrl = `event-detail.html?id=${encodeURIComponent(item.id)}`;
  const comment = item.comment ? `<p class="event-description">${escapeHtml(item.comment)}</p>` : "";

  return `<article class="event-card"><p class="event-meta"><a href="${detailUrl}">${escapeHtml(meta)}</a></p><h3><a class="card-title-link" href="${detailUrl}">${escapeHtml(item.title)}</a></h3>${participants}${comment}</article>`;
};

const renderItems = async (url, targetId, isSchedule = false, limit) => {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    const response = await fetch(`${url}?v=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to load data");
    const items = await response.json();
    console.log("取得件数:", items.length);
    console.log("先頭データ:", items[0]);
    const displayedItems = limit ? items.slice(0, limit) : items;
    target.innerHTML = displayedItems.length
      ? displayedItems.map((item) => createCard(item, isSchedule)).join("")
      : '<p class="empty-message">現在掲載中の情報はありません。</p>';
  } catch (error) {
    console.error("renderLatestEvents error:", error);
    target.innerHTML =
      '<p class="empty-message">情報を読み込めませんでした。</p>';
  }
};

const renderLatestEvents = async () => {
  const target = document.getElementById("latest-event");
  if (!target) return;
  try {
    const jsonUrl = "data/events.json?v=" + Date.now();
    console.log("取得URL:", jsonUrl);
    const response = await fetch(jsonUrl);

    console.log("HTTP status:", response.status);

    const text = await response.text();

    console.log("JSON文字数:", text.length);
    console.log("JSON先頭:", text.substring(0, 100));

    const items = JSON.parse(text);
    const latestEvents = [...items]
      .sort((first, second) => second.date.localeCompare(first.date))
      .slice(0, 5);

    console.log("最新5件:", latestEvents);

    target.innerHTML = latestEvents.length
      ? latestEvents.map((item) => createCard(item)).join("")
      : '<p class="empty-message">現在掲載中の情報はありません。</p>';
  } catch (error) {
    target.innerHTML = '<p class="empty-message">情報を読み込めませんでした。時間をおいて再度お試しください。</p>';
  }
};

const listLinks = (items, label) => {
  const validItems = (items ?? []).filter((item) => item && item.url);
  return validItems.length
    ? `<ul class="detail-link-list">${validItems.map((item) => `<li>${externalLink(item.url, item.participant ? `${item.participant}：${item.title}` : item.title)}</li>`).join("")}</ul>`
    : "";
};

const renderEventDetail = async () => {
  const target = document.getElementById("event-detail");
  if (!target) return;
  const eventId = new URLSearchParams(window.location.search).get("id");
  try {
    const response = await fetch("data/events.json?v=" + Date.now());
    if (!response.ok) throw new Error("Failed to load data");
    const items = await response.json();
    const item = items.find((event) => event.id === eventId);
    if (!item) throw new Error("Event not found");

    const videos = (item.videos ?? []).filter((video) => video?.url);
    const consultations = (item.aiConsultations ?? []).filter((consultation) => consultation?.url);
    const practices = (item.practiceContents ?? []).filter(Boolean);
    const location = item.location?.trim();
    const participants = item.participants?.trim();
    const comment = item.comment?.trim();

    const details = [
      location ? `<div><dt>開催場所</dt><dd>${escapeHtml(location)}</dd></div>` : "",
      participants ? `<div><dt>参加者</dt><dd>${escapeHtml(participants)}</dd></div>` : ""
    ].filter(Boolean).join("");
    const practiceSection = practices.length
      ? `<section class="detail-section"><h2>練習内容</h2><ul>${practices.map((practice) => `<li>${escapeHtml(practice)}</li>`).join("")}</ul></section>`
      : "";
    const commentSection = comment
      ? `<section class="detail-section"><h2>コメント</h2><p>${escapeHtml(comment)}</p></section>`
      : "";
    const videoSection = videos.length
      ? `<section class="detail-section"><h2>動画リンク</h2>${listLinks(videos, "動画")}</section>`
      : "";
    const consultationSection = consultations.length
      ? `<section class="detail-section"><h2>AI相談結果</h2>${listLinks(consultations, "AI相談結果")}</section>`
      : "";

    document.title = `${item.title} | tennis-base.net`;
    target.innerHTML = `<p class="eyebrow">EVENT DETAIL</p><p class="event-meta">${escapeHtml(formatDate(item.date))}</p><h1>${escapeHtml(item.title)}</h1>${details ? `<dl class="detail-list">${details}</dl>` : ""}${practiceSection}${commentSection}${videoSection}${consultationSection}<p><a class="text-link" href="events.html">← 開催記録一覧へ戻る</a></p>`;
  } 
  catch (error) {
    console.error("詳細表示エラー:", error);
    target.innerHTML = '<p class="empty-message">開催情報が見つかりませんでした。</p>';
  }
};

const yearElement = document.getElementById("current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}
renderLatestEvents();
renderItems("data/events.json", "events-list");
renderItems("data/schedule.json", "schedule-list", true);
renderEventDetail();
