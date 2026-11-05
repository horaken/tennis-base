// Append these namespaced functions to the existing Apps Script project.
// Keep the existing doGet(e); add the admin routing snippet from README.md.
const EVENTS_ADMIN_SHEET_NAME = 'events';
const EVENTS_ADMIN_REQUIRED_HEADERS = [
  'id', 'date', 'title', 'location', 'participants', 'practiceContents', 'comment',
  'videos_title', 'videos_url', 'aiConsultations_title', 'aiConsultations_url', 'participantNames'
];

function eventsAdminPage_() {
  return HtmlService.createHtmlOutputFromFile('index_2').setTitle('イベント管理');
}

function eventsAdminLogin(credentials) {
  const props = PropertiesService.getScriptProperties();
  const expectedId = props.getProperty('ADMIN_ID');
  const expectedPassword = props.getProperty('ADMIN_PASSWORD');
  if (!expectedId || !expectedPassword || !credentials ||
      credentials.id !== expectedId || credentials.password !== expectedPassword) {
    throw new Error('IDまたはPasswordが違います。');
  }
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('events-admin:' + token, 'ok', 21600);
  return { token: token };
}

function eventsAdminFindEvent(token, id) {
  eventsAdminRequireAdmin_(token);
  const table = eventsAdminGetTable_(eventsAdminGetSheet_());
  const key = String(id || '').trim();
  if (!key) throw new Error('検索するIDを入力してください。');
  const idCol = table.index.id;
  const matches = [];
  for (let r = 1; r < table.rows.length; r++) {
    if (String(table.rows[r][idCol] || '').trim() === key) matches.push({ row: r + 1, values: table.rows[r] });
  }
  if (matches.length > 1) throw new Error('同じIDの行が複数あります。シートを確認してください。');
  if (!matches.length) return { found: false, event: { id: key } };
  return { found: true, event: eventsAdminRowToEvent_(matches[0].values, table.index) };
}

function eventsAdminSaveEvent(token, event, originalId) {
  eventsAdminRequireAdmin_(token);
  if (!event || !String(event.id || '').trim()) throw new Error('IDは必須です。');
  if (!String(event.date || '').trim() || !String(event.title || '').trim()) {
    throw new Error('開催日とイベント名は必須です。');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = eventsAdminGetSheet_();
    const table = eventsAdminGetTable_(sheet);
    const id = String(event.id).trim();
    const idCol = table.index.id;
    const foundRows = [];
    for (let r = 1; r < table.rows.length; r++) {
      if (String(table.rows[r][idCol] || '').trim() === id) foundRows.push(r + 1);
    }
    if (foundRows.length > 1) throw new Error('同じIDの行が複数あります。シートを確認してください。');
    if (originalId && id !== String(originalId).trim()) throw new Error('既存イベントのIDは変更できません。');
    if (!originalId && foundRows.length) throw new Error('このIDは既に登録されています。検索して既存イベントとして開いてください。');

    const row = foundRows.length ? table.rows[foundRows[0] - 1].slice() : Array(table.headers.length).fill('');
    const values = eventsAdminEventToRow_(event);
    Object.keys(values).forEach(function (header) { row[table.index[header]] = values[header]; });
    if (foundRows.length) {
      row[idCol] = id;
      sheet.getRange(foundRows[0], 1, 1, table.headers.length).setValues([row]);
      return { saved: true, mode: 'updated', row: foundRows[0] };
    }
    sheet.appendRow(row);
    return { saved: true, mode: 'created', row: sheet.getLastRow() };
  } finally {
    lock.releaseLock();
  }
}

function eventsAdminRequireAdmin_(token) {
  if (!token || CacheService.getScriptCache().get('events-admin:' + token) !== 'ok') {
    throw new Error('認証の有効期限が切れました。再度ログインしてください。');
  }
}

function eventsAdminGetSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) throw new Error('スクリプトプロパティにSPREADSHEET_IDを設定してください。');
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(EVENTS_ADMIN_SHEET_NAME);
  if (!sheet) throw new Error('eventsシートが見つかりません。');
  return sheet;
}

function eventsAdminGetTable_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  if (!values.length) throw new Error('eventsシートにヘッダー行がありません。');
  const headers = values[0].map(function (h) { return String(h).trim(); });
  const index = {};
  headers.forEach(function (h, i) { index[h.toLowerCase()] = i; });
  const missing = EVENTS_ADMIN_REQUIRED_HEADERS.filter(function (h) { return index[h.toLowerCase()] === undefined; });
  if (missing.length) throw new Error('eventsシートに必要な列がありません: ' + missing.join(', '));
  return { headers: headers, index: index, rows: values };
}

function eventsAdminRowToEvent_(row, index) {
  const get = function (key) { return row[index[key.toLowerCase()]] || ''; };
  return {
    id: get('id'), date: get('date'), title: get('title'), location: get('location'),
    participants: get('participants'), practiceContents: get('practiceContents'), comment: get('comment'),
    videos_title: get('videos_title'), videos_url: get('videos_url'),
    aiConsultations_title: get('aiConsultations_title'), aiConsultations_url: get('aiConsultations_url'),
    participantNames: get('participantNames')
  };
}

function eventsAdminEventToRow_(event) {
  const output = {};
  EVENTS_ADMIN_REQUIRED_HEADERS.forEach(function (header) {
    output[header] = String(event[header] == null ? '' : event[header]).trim();
  });
  return output;
}
