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

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);

const externalLink = (url, label) =>
  url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    : "";

const parsePracticeContents = (contents) => {
  if (!contents) return [];
  if (Array.isArray(contents)) {
    return contents
      .map((s) => String(s).replace(/^["'\s]+|["'\s]+$/g, "").trim())
      .filter(Boolean);
  }
  return String(contents)
    .split(",")
    .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, "").trim())
    .filter(Boolean);
};

const getFileProtocolErrorMessage = (dataType = "データ") => {
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    return `
      <div class="empty-message error-guide">
        <p style="font-weight: bold; color: var(--navy); margin-top: 0; font-size: 1rem;">⚠️ ローカルファイル（file://）で直接開かれています</p>
        <p>ブラウザのセキュリティ制限（CORS仕様）により、ファイルをダブルクリックして直接開く（<code>file://</code>）形式では、外部のJSONデータ（<code>data/*.json</code>）を読み込むことができません。</p>
        <p style="margin-bottom: 6px;"><strong>正常に表示を確認する方法：</strong></p>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
          <li><strong>VS Codeをご利用の場合</strong>：拡張機能「Live Server」をインストールし、HTMLを右クリックして「Open with Live Server」で起動</li>
          <li><strong>ローカルWebサーバー</strong>：ターミナルで <code>npx serve</code> や <code>python -m http.server 8000</code> を実行して <code>http://localhost:8000/events.html</code> にアクセス</li>
          <li><strong>GitHub Pages</strong>：GitHubにプッシュ後、公開URL（<code>https://...</code>）からアクセス</li>
        </ul>
      </div>
    `;
  }
  return `<p class="empty-message">${dataType}を読み込めませんでした。時間をおいて再度お試しください。</p>`;
};

// 今日の日付文字列（YYYY-MM-DD）を取得
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// スケジュール用カード作成
const createScheduleCard = (item) => {
  const formattedDate = formatDate(item.date);
  const time = item.time ? escapeHtml(item.time) : "";
  const location = item.location ? escapeHtml(item.location) : "";
  const description = item.description
    ? `<p class="event-description">${escapeHtml(item.description)}</p>`
    : "";

  return `
    <article class="event-card schedule-card">
      <div class="event-card-top">
        <div class="event-card-badges">
          <span class="badge badge-date">📅 ${escapeHtml(formattedDate)}</span>
          ${time ? `<span class="badge badge-time">⏰ ${time}</span>` : ""}
          ${location ? `<span class="badge badge-location">📍 ${location}</span>` : ""}
        </div>
      </div>
      <h3 class="event-card-title">${escapeHtml(item.title)}</h3>
      ${description}
    </article>
  `;
};

// トップページ用カード作成
const createCard = (item) => {
  const meta = `${formatDate(item.date)} ｜ ${item.location}`;
  const participants = item.participants && item.participants !== "-"
    ? `<p class="event-participants">参加者：${escapeHtml(item.participants)}</p>`
    : "";
  const detailUrl = `event-detail.html?id=${encodeURIComponent(item.id)}`;
  const comment = item.comment ? `<p class="event-description">${escapeHtml(item.comment)}</p>` : "";

  return `<article class="event-card"><p class="event-meta"><a href="${detailUrl}">${escapeHtml(meta)}</a></p><h3><a class="card-title-link" href="${detailUrl}">${escapeHtml(item.title)}</a></h3>${participants}${comment}</article>`;
};

// 開催記録一覧（events.html）専用の拡張カード作成
const createEventArchiveCard = (item) => {
  const detailUrl = `event-detail.html?id=${encodeURIComponent(item.id)}`;
  const formattedDate = formatDate(item.date);
  const location = item.location ? escapeHtml(item.location) : "";
  const participants = item.participants && item.participants !== "-"
    ? escapeHtml(item.participants)
    : "";

  const practices = parsePracticeContents(item.practiceContents);
  const practiceBadges = practices.length
    ? `<div class="event-tags">${practices.map((p) => `<span class="tag-chip">${escapeHtml(p)}</span>`).join("")}</div>`
    : "";

  const comment = item.comment
    ? `<p class="event-description">${escapeHtml(item.comment)}</p>`
    : "";

  const videos = (item.videos ?? []).filter((v) => v && v.url);
  const consultations = (item.aiConsultations ?? []).filter((c) => c && c.url);

  const actionLinks = [
    `<a class="action-btn btn-primary" href="${detailUrl}">詳細・結果を見る <span aria-hidden="true">&rarr;</span></a>`
  ];

  if (videos.length > 0) {
    actionLinks.push(
      `<a class="action-btn btn-video" href="${escapeHtml(videos[0].url)}" target="_blank" rel="noopener noreferrer"><span class="btn-icon">🎥</span> ${escapeHtml(videos[0].title || "動画")}</a>`
    );
  }
  if (consultations.length > 0) {
    actionLinks.push(
      `<a class="action-btn btn-ai" href="${escapeHtml(consultations[0].url)}" target="_blank" rel="noopener noreferrer"><span class="btn-icon">✨</span> ${escapeHtml(consultations[0].title || "AI診断")}</a>`
    );
  }

  return `
    <article class="event-card event-archive-card">
      <div class="event-card-top">
        <div class="event-card-badges">
          <span class="badge badge-date">📅 ${escapeHtml(formattedDate)}</span>
          ${location ? `<span class="badge badge-location">📍 ${location}</span>` : ""}
          ${participants ? `<span class="badge badge-participants">👥 ${participants}</span>` : ""}
        </div>
      </div>
      <h3 class="event-card-title">
        <a class="card-title-link" href="${detailUrl}">${escapeHtml(item.title)}</a>
      </h3>
      ${practiceBadges}
      ${comment}
      <div class="event-card-actions">
        ${actionLinks.join("")}
      </div>
    </article>
  `;
};

// スケジュール一覧（年・月の横並びタブ表示・昇順・本日以降のみ）
const renderScheduleArchive = async () => {
  const scheduleList = document.getElementById("schedule-list");
  const filterWrapper = document.getElementById("schedule-filter-wrapper");
  const summaryBar = document.getElementById("schedule-summary-bar");

  if (!scheduleList) return;

  try {
    const response = await fetch(`data/schedule.json?v=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to load schedule data");
    const rawItems = await response.json();

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      scheduleList.innerHTML = '<p class="empty-message">現在予定されている開催情報はありません。</p>';
      if (filterWrapper) filterWrapper.innerHTML = "";
      if (summaryBar) summaryBar.innerHTML = "";
      return;
    }

    const today = getTodayDateString();

    // 過去の日程（本日より前）を除外
    const upcomingEvents = rawItems.filter((item) => {
      if (!item.date) return false;
      return item.date >= today;
    });

    if (upcomingEvents.length === 0) {
      scheduleList.innerHTML = '<p class="empty-message">現在予定されている開催情報はありません。</p>';
      if (filterWrapper) filterWrapper.innerHTML = "";
      if (summaryBar) summaryBar.innerHTML = "";
      return;
    }

    // 時間表記の正規化（例: "8:00" -> "08:00" で正しく比較）
    const normalizeTime = (timeStr) => {
      if (!timeStr) return "";
      const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
      return match ? `${match[1].padStart(2, "0")}:${match[2]}` : timeStr;
    };

    // 日付を昇順（直近・早い日程順、同日の場合は開始時間順）にソート
    upcomingEvents.sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return normalizeTime(a.time).localeCompare(normalizeTime(b.time));
    });

    // 年と月でデータをグループ化
    const yearMonthData = new Map(); // year -> Map(month -> events[])
    const allMonthsSet = new Set();

    upcomingEvents.forEach((item) => {
      if (!item.date) return;
      const year = item.date.substring(0, 4);
      const month = parseInt(item.date.substring(5, 7), 10);
      allMonthsSet.add(month);

      if (!yearMonthData.has(year)) {
        yearMonthData.set(year, new Map());
      }
      const mData = yearMonthData.get(year);
      if (!mData.has(month)) {
        mData.set(month, []);
      }
      mData.get(month).push(item);
    });

    // 直近順（昇順）で年・月をソート
    const years = Array.from(yearMonthData.keys()).sort((a, b) => a.localeCompare(b));
    const allMonths = Array.from(allMonthsSet).sort((a, b) => a - b);

    // 選択状態
    let selectedYear = "all";
    let selectedMonth = "all";

    const parseHash = () => {
      const hash = window.location.hash.replace("#", "").trim();
      if (!hash || hash === "all") {
        selectedYear = "all";
        selectedMonth = "all";
        return;
      }
      if (hash.startsWith("month-")) {
        const m = parseInt(hash.replace("month-", ""), 10);
        if (!isNaN(m)) {
          selectedYear = "all";
          selectedMonth = String(m);
        }
        return;
      }
      if (hash.includes("-")) {
        const [y, mStr] = hash.split("-");
        if (yearMonthData.has(y)) {
          selectedYear = y;
          const m = parseInt(mStr, 10);
          if (!isNaN(m) && yearMonthData.get(y).has(m)) {
            selectedMonth = String(m);
          } else {
            selectedMonth = "all";
          }
          return;
        }
      }
      if (yearMonthData.has(hash)) {
        selectedYear = hash;
        selectedMonth = "all";
      }
    };

    parseHash();

    const updateUrlHash = () => {
      let newHash = "all";
      if (selectedYear !== "all" && selectedMonth !== "all") {
        const formattedMonth = String(selectedMonth).padStart(2, "0");
        newHash = `${selectedYear}-${formattedMonth}`;
      } else if (selectedYear !== "all") {
        newHash = `${selectedYear}`;
      } else if (selectedMonth !== "all") {
        newHash = `month-${selectedMonth}`;
      }

      if (history.replaceState) {
        history.replaceState(null, "", `#${newHash}`);
      } else {
        window.location.hash = newHash;
      }
    };

    const renderTabsAndList = () => {
      if (filterWrapper) {
        // 1. 年タブ（横並び）の生成
        let yearTabsHtml = `
          <div class="filter-row">
            <span class="filter-label">開催年</span>
            <div class="tabs-nav year-tabs" role="tablist" aria-label="開催年の選択">
              <button type="button" role="tab" class="tab-btn ${selectedYear === 'all' ? 'active' : ''}" data-year="all" aria-selected="${selectedYear === 'all'}">
                <span>すべての年</span>
                <span class="tab-count">${upcomingEvents.length}</span>
              </button>
        `;

        years.forEach((y) => {
          const yMap = yearMonthData.get(y);
          let count = 0;
          yMap.forEach((evts) => { count += evts.length; });
          const isActive = selectedYear === y;
          yearTabsHtml += `
            <button type="button" role="tab" class="tab-btn ${isActive ? 'active' : ''}" data-year="${y}" aria-selected="${isActive}">
              <span>${y}年</span>
              <span class="tab-count">${count}</span>
            </button>
          `;
        });
        yearTabsHtml += `</div></div>`;

        // 2. 月タブ（横並び）の生成
        let availableMonths = [];
        let totalEventsInScope = 0;

        if (selectedYear === "all") {
          totalEventsInScope = upcomingEvents.length;
          allMonths.forEach((m) => {
            let count = 0;
            yearMonthData.forEach((mData) => {
              if (mData.has(m)) count += mData.get(m).length;
            });
            if (count > 0) {
              availableMonths.push({ month: m, count });
            }
          });
        } else {
          const mData = yearMonthData.get(selectedYear);
          if (mData) {
            mData.forEach((evts) => { totalEventsInScope += evts.length; });
            Array.from(mData.keys()).sort((a, b) => a - b).forEach((m) => {
              availableMonths.push({ month: m, count: mData.get(m).length });
            });
          }
        }

        if (selectedMonth !== "all" && !availableMonths.some((item) => String(item.month) === String(selectedMonth))) {
          selectedMonth = "all";
        }

        let monthTabsHtml = `
          <div class="filter-divider"></div>
          <div class="filter-row">
            <span class="filter-label">開催月</span>
            <div class="tabs-nav month-tabs" role="tablist" aria-label="開催月の選択">
              <button type="button" role="tab" class="tab-btn ${selectedMonth === 'all' ? 'active' : ''}" data-month="all" aria-selected="${selectedMonth === 'all'}">
                <span>すべての月</span>
                <span class="tab-count">${totalEventsInScope}</span>
              </button>
        `;

        availableMonths.forEach(({ month, count }) => {
          const isActive = String(selectedMonth) === String(month);
          monthTabsHtml += `
            <button type="button" role="tab" class="tab-btn ${isActive ? 'active' : ''}" data-month="${month}" aria-selected="${isActive}">
              <span>${month}月</span>
              <span class="tab-count">${count}</span>
            </button>
          `;
        });
        monthTabsHtml += `</div></div>`;

        filterWrapper.innerHTML = yearTabsHtml + monthTabsHtml;

        // 年タブクリックイベント
        filterWrapper.querySelectorAll("[data-year]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const y = btn.getAttribute("data-year");
            if (y === selectedYear) return;
            selectedYear = y;
            updateUrlHash();
            renderTabsAndList();
          });
        });

        // 月タブクリックイベント
        filterWrapper.querySelectorAll("[data-month]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const m = btn.getAttribute("data-month");
            if (m === selectedMonth) return;
            selectedMonth = m;
            updateUrlHash();
            renderTabsAndList();
          });
        });
      }

      // 3. 一覧のフィルタリング
      const filteredEvents = upcomingEvents.filter((item) => {
        if (!item.date) return false;
        const y = item.date.substring(0, 4);
        const m = parseInt(item.date.substring(5, 7), 10);
        if (selectedYear !== "all" && y !== selectedYear) return false;
        if (selectedMonth !== "all" && String(m) !== String(selectedMonth)) return false;
        return true;
      });

      // 4. サマリーバーの更新
      if (summaryBar) {
        let summaryText = "";
        if (selectedYear === "all" && selectedMonth === "all") {
          summaryText = `<span class="summary-label">すべての開催予定</span> <span class="summary-count">全 ${filteredEvents.length} 件</span>`;
        } else if (selectedYear !== "all" && selectedMonth === "all") {
          summaryText = `<span class="summary-label"><strong>${selectedYear}年</strong> のすべての開催予定</span> <span class="summary-count">${filteredEvents.length} 件</span>`;
        } else if (selectedYear !== "all" && selectedMonth !== "all") {
          summaryText = `<span class="summary-label"><strong>${selectedYear}年${selectedMonth}月</strong> の開催予定</span> <span class="summary-count">${filteredEvents.length} 件</span>`;
        } else {
          summaryText = `<span class="summary-label"><strong>${selectedMonth}月</strong> の開催予定</span> <span class="summary-count">${filteredEvents.length} 件</span>`;
        }
        summaryBar.innerHTML = summaryText;
      }

      // 5. カード一覧の描画
      if (filteredEvents.length === 0) {
        scheduleList.innerHTML = '<p class="empty-message">該当する開催予定はありません。</p>';
      } else {
        scheduleList.innerHTML = filteredEvents.map(createScheduleCard).join("");
      }
    };

    renderTabsAndList();

    window.addEventListener("hashchange", () => {
      parseHash();
      renderTabsAndList();
    });

  } catch (error) {
    console.error("renderScheduleArchive error:", error);
    scheduleList.innerHTML = getFileProtocolErrorMessage("開催予定");
  }
};

// トップページの最新開催情報
const renderLatestEvents = async () => {
  const target = document.getElementById("latest-event");
  if (!target) return;
  try {
    const jsonUrl = "data/events.json?v=" + Date.now();
    const response = await fetch(jsonUrl);
    if (!response.ok) throw new Error("Failed to load events data");
    const items = await response.json();
    const latestEvents = [...items]
      .sort((first, second) => second.date.localeCompare(first.date))
      .slice(0, 5);

    target.innerHTML = latestEvents.length
      ? latestEvents.map((item) => createCard(item)).join("")
      : '<p class="empty-message">現在掲載中の情報はありません。</p>';
  } catch (error) {
    console.error("renderLatestEvents error:", error);
    target.innerHTML = getFileProtocolErrorMessage("最新の開催情報");
  }
};

// 開催記録一覧（年・月の横並びタブ表示）
const renderEventsArchive = async () => {
  const eventsList = document.getElementById("events-list");
  const filterWrapper = document.getElementById("events-filter-wrapper");
  const summaryBar = document.getElementById("events-summary-bar");

  if (!eventsList || !filterWrapper) return;

  try {
    const response = await fetch("data/events.json?v=" + Date.now());
    if (!response.ok) throw new Error("Failed to load events data");
    const rawItems = await response.json();

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      eventsList.innerHTML = '<p class="empty-message">現在掲載中の開催記録はありません。</p>';
      filterWrapper.innerHTML = '';
      if (summaryBar) summaryBar.innerHTML = '';
      return;
    }

    // 日付の降順でソート
    const allEvents = [...rawItems].sort((a, b) => b.date.localeCompare(a.date));

    // 年と月でデータをグループ化
    const yearMonthData = new Map(); // year -> Map(month -> events[])
    const allMonthsSet = new Set();

    allEvents.forEach((item) => {
      if (!item.date) return;
      const year = item.date.substring(0, 4);
      const month = parseInt(item.date.substring(5, 7), 10);
      allMonthsSet.add(month);

      if (!yearMonthData.has(year)) {
        yearMonthData.set(year, new Map());
      }
      const mData = yearMonthData.get(year);
      if (!mData.has(month)) {
        mData.set(month, []);
      }
      mData.get(month).push(item);
    });

    const years = Array.from(yearMonthData.keys()).sort((a, b) => b.localeCompare(a));
    const allMonths = Array.from(allMonthsSet).sort((a, b) => b - a);

    // 選択状態
    let selectedYear = "all";
    let selectedMonth = "all";

    const parseHash = () => {
      const hash = window.location.hash.replace("#", "").trim();
      if (!hash || hash === "all") {
        selectedYear = "all";
        selectedMonth = "all";
        return;
      }
      if (hash.startsWith("month-")) {
        const m = parseInt(hash.replace("month-", ""), 10);
        if (!isNaN(m)) {
          selectedYear = "all";
          selectedMonth = String(m);
        }
        return;
      }
      if (hash.includes("-")) {
        const [y, mStr] = hash.split("-");
        if (yearMonthData.has(y)) {
          selectedYear = y;
          const m = parseInt(mStr, 10);
          if (!isNaN(m) && yearMonthData.get(y).has(m)) {
            selectedMonth = String(m);
          } else {
            selectedMonth = "all";
          }
          return;
        }
      }
      if (yearMonthData.has(hash)) {
        selectedYear = hash;
        selectedMonth = "all";
      }
    };

    parseHash();

    const updateUrlHash = () => {
      let newHash = "all";
      if (selectedYear !== "all" && selectedMonth !== "all") {
        const formattedMonth = String(selectedMonth).padStart(2, "0");
        newHash = `${selectedYear}-${formattedMonth}`;
      } else if (selectedYear !== "all") {
        newHash = `${selectedYear}`;
      } else if (selectedMonth !== "all") {
        newHash = `month-${selectedMonth}`;
      }

      if (history.replaceState) {
        history.replaceState(null, "", `#${newHash}`);
      } else {
        window.location.hash = newHash;
      }
    };

    const renderTabsAndList = () => {
      // 1. 年タブ（横並び）の生成
      let yearTabsHtml = `
        <div class="filter-row">
          <span class="filter-label">開催年</span>
          <div class="tabs-nav year-tabs" role="tablist" aria-label="開催年の選択">
            <button type="button" role="tab" class="tab-btn ${selectedYear === 'all' ? 'active' : ''}" data-year="all" aria-selected="${selectedYear === 'all'}">
              <span>すべての年</span>
              <span class="tab-count">${allEvents.length}</span>
            </button>
      `;

      years.forEach((y) => {
        const yMap = yearMonthData.get(y);
        let count = 0;
        yMap.forEach((evts) => { count += evts.length; });
        const isActive = selectedYear === y;
        yearTabsHtml += `
          <button type="button" role="tab" class="tab-btn ${isActive ? 'active' : ''}" data-year="${y}" aria-selected="${isActive}">
            <span>${y}年</span>
            <span class="tab-count">${count}</span>
          </button>
        `;
      });
      yearTabsHtml += `</div></div>`;

      // 2. 月タブ（横並び）の生成（選択された年に応じて動的に件数・選択肢を更新）
      let availableMonths = [];
      let totalEventsInScope = 0;

      if (selectedYear === "all") {
        totalEventsInScope = allEvents.length;
        allMonths.forEach((m) => {
          let count = 0;
          yearMonthData.forEach((mData) => {
            if (mData.has(m)) count += mData.get(m).length;
          });
          if (count > 0) {
            availableMonths.push({ month: m, count });
          }
        });
      } else {
        const mData = yearMonthData.get(selectedYear);
        if (mData) {
          mData.forEach((evts) => { totalEventsInScope += evts.length; });
          Array.from(mData.keys()).sort((a, b) => b - a).forEach((m) => {
            availableMonths.push({ month: m, count: mData.get(m).length });
          });
        }
      }

      // 選択中の月が存在しない場合は「すべて」にリセット
      if (selectedMonth !== "all" && !availableMonths.some((item) => String(item.month) === String(selectedMonth))) {
        selectedMonth = "all";
      }

      let monthTabsHtml = `
        <div class="filter-divider"></div>
        <div class="filter-row">
          <span class="filter-label">開催月</span>
          <div class="tabs-nav month-tabs" role="tablist" aria-label="開催月の選択">
            <button type="button" role="tab" class="tab-btn ${selectedMonth === 'all' ? 'active' : ''}" data-month="all" aria-selected="${selectedMonth === 'all'}">
              <span>すべての月</span>
              <span class="tab-count">${totalEventsInScope}</span>
            </button>
      `;

      availableMonths.forEach(({ month, count }) => {
        const isActive = String(selectedMonth) === String(month);
        monthTabsHtml += `
          <button type="button" role="tab" class="tab-btn ${isActive ? 'active' : ''}" data-month="${month}" aria-selected="${isActive}">
            <span>${month}月</span>
            <span class="tab-count">${count}</span>
          </button>
        `;
      });
      monthTabsHtml += `</div></div>`;

      filterWrapper.innerHTML = yearTabsHtml + monthTabsHtml;

      // 年タブクリックイベント
      filterWrapper.querySelectorAll("[data-year]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const y = btn.getAttribute("data-year");
          if (y === selectedYear) return;
          selectedYear = y;
          updateUrlHash();
          renderTabsAndList();
        });
      });

      // 月タブクリックイベント
      filterWrapper.querySelectorAll("[data-month]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const m = btn.getAttribute("data-month");
          if (m === selectedMonth) return;
          selectedMonth = m;
          updateUrlHash();
          renderTabsAndList();
        });
      });

      // 3. 一覧のフィルタリング
      const filteredEvents = allEvents.filter((item) => {
        if (!item.date) return false;
        const y = item.date.substring(0, 4);
        const m = parseInt(item.date.substring(5, 7), 10);
        if (selectedYear !== "all" && y !== selectedYear) return false;
        if (selectedMonth !== "all" && String(m) !== String(selectedMonth)) return false;
        return true;
      });

      // 4. サマリーバーの更新
      let summaryText = "";
      if (selectedYear === "all" && selectedMonth === "all") {
        summaryText = `<span class="summary-label">すべての開催記録</span> <span class="summary-count">全 ${filteredEvents.length} 件</span>`;
      } else if (selectedYear !== "all" && selectedMonth === "all") {
        summaryText = `<span class="summary-label"><strong>${selectedYear}年</strong> のすべての開催記録</span> <span class="summary-count">${filteredEvents.length} 件</span>`;
      } else if (selectedYear !== "all" && selectedMonth !== "all") {
        summaryText = `<span class="summary-label"><strong>${selectedYear}年${selectedMonth}月</strong> の開催記録</span> <span class="summary-count">${filteredEvents.length} 件</span>`;
      } else {
        summaryText = `<span class="summary-label"><strong>${selectedMonth}月</strong> の開催記録</span> <span class="summary-count">${filteredEvents.length} 件</span>`;
      }

      if (summaryBar) {
        summaryBar.innerHTML = summaryText;
      }

      // 5. カード一覧の描画
      if (filteredEvents.length === 0) {
        eventsList.innerHTML = '<p class="empty-message">該当する開催記録はありません。</p>';
      } else {
        eventsList.innerHTML = filteredEvents.map(createEventArchiveCard).join("");
      }
    };

    renderTabsAndList();

    window.addEventListener("hashchange", () => {
      parseHash();
      renderTabsAndList();
    });

  } catch (error) {
    console.error("renderEventsArchive error:", error);
    eventsList.innerHTML = getFileProtocolErrorMessage("開催記録");
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
    const practices = parsePracticeContents(item.practiceContents);
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
  } catch (error) {
    console.error("詳細表示エラー:", error);
    target.innerHTML = getFileProtocolErrorMessage("開催情報");
  }
};

const yearElement = document.getElementById("current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}
renderLatestEvents();
renderEventsArchive();
renderScheduleArchive();
renderEventDetail();
