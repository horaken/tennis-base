import { EventItem, ScheduleItem } from '../types';
import { getTodayDateString } from '../utils/format';

// The Google Spreadsheet ID provided by the user
export const DEFAULT_SPREADSHEET_ID = '1s-Py0EYGTouk8BqavwxQLYF9tQfQwR018z8ZkXUFg9I';

/**
 * Get current configured Spreadsheet ID from localStorage or fallback
 */
export const getSpreadsheetId = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tennis_base_spreadsheet_id');
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_SPREADSHEET_ID;
};

/**
 * Save new Spreadsheet ID
 */
export const setSpreadsheetId = (idOrUrl: string): string => {
  let cleanId = idOrUrl.trim();
  const match = cleanId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    cleanId = match[1];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('tennis_base_spreadsheet_id', cleanId);
  }
  return cleanId;
};

/**
 * Robust CSV parser that handles quotes, escaped quotes, and newlines
 */
export const parseCsvText = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentVal += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
};

/**
 * Fetch a specific sheet's CSV data
 */
async function fetchSheetCsv(spreadsheetId: string, sheetName: string): Promise<string[][] | null> {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
    spreadsheetId
  )}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_v=${Date.now()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }
    const csvText = await res.text();
    return parseCsvText(csvText);
  } catch (err) {
    console.warn(`Failed to fetch sheet ${sheetName}:`, err);
    return null;
  }
}

/**
 * Fetches the latest schedule directly from the "schedule" sheet in Google Spreadsheet
 */
export const fetchScheduleFromSheet = async (
  spreadsheetId = getSpreadsheetId()
): Promise<ScheduleItem[]> => {
  if (!spreadsheetId) return [];

  const rows = await fetchSheetCsv(spreadsheetId, 'schedule');
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const dateIdx = headers.indexOf('date');
  const timeIdx = headers.indexOf('time');
  const titleIdx = headers.indexOf('title');
  const locIdx = headers.indexOf('location');
  const descIdx = headers.indexOf('description');

  const items: ScheduleItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rawDate = (r[dateIdx >= 0 ? dateIdx : 0] || '').replace(/\//g, '-').trim();

    // Check if column 0 has a valid YYYY-MM-DD date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      continue;
    }

    // A列のdateがすでに過去の日程の場合は除外
    const today = getTodayDateString();
    if (rawDate < today) {
      continue;
    }

    const title = (r[titleIdx >= 0 ? titleIdx : 2] || '').trim();
    if (!title) continue;

    const time = (r[timeIdx >= 0 ? timeIdx : 1] || '').trim();
    const location = (r[locIdx >= 0 ? locIdx : 3] || '').trim();
    const description = (r[descIdx >= 0 ? descIdx : 4] || '').trim();

    items.push({
      date: rawDate,
      time,
      title,
      location,
      description,
    });
  }

  return items;
};

/**
 * Fetches the latest events from the "events" or "シート1" sheet in Google Spreadsheet
 */
export const fetchEventsFromSheet = async (
  spreadsheetId = getSpreadsheetId()
): Promise<EventItem[]> => {
  if (!spreadsheetId) return [];

  // Try "events", then "シート1"
  let rows = await fetchSheetCsv(spreadsheetId, 'events');
  if (!rows || rows.length <= 1) {
    rows = await fetchSheetCsv(spreadsheetId, 'シート1');
  }
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const idIdx = headers.indexOf('id');
  const dateIdx = headers.indexOf('date');
  const titleIdx = headers.indexOf('title');
  const locIdx = headers.indexOf('location');
  const partIdx = headers.indexOf('participants');
  const pracIdx = headers.indexOf('practicecontents');
  const commentIdx = headers.indexOf('comment');
  const vTitleIdx = headers.indexOf('videos_title');
  const vUrlIdx = headers.indexOf('videos_url');
  const aiTitleIdx = headers.indexOf('aiconsultations_title');
  const aiUrlIdx = headers.indexOf('aiconsultations_url');
  const statusIdx = headers.indexOf('status');

  const items: EventItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = (r[idIdx >= 0 ? idIdx : 0] || '').trim();

    // Ignore rows without ID (such as template/copy-paste sample rows)
    if (!id) continue;

    const status = (r[statusIdx >= 0 ? statusIdx : 11] || '').trim();
    if (status === '下書き' || status === '非公開') continue;

    const date = (r[dateIdx >= 0 ? dateIdx : 1] || '').replace(/\//g, '-').trim();
    const title = (r[titleIdx >= 0 ? titleIdx : 2] || '').trim();
    const location = (r[locIdx >= 0 ? locIdx : 3] || '').trim();
    const participants = (r[partIdx >= 0 ? partIdx : 4] || '').trim();
    const practiceContents = (r[pracIdx >= 0 ? pracIdx : 5] || '').trim();
    const comment = (r[commentIdx >= 0 ? commentIdx : 6] || '').trim();

    const vTitle = (r[vTitleIdx >= 0 ? vTitleIdx : 7] || '').trim();
    const vUrl = (r[vUrlIdx >= 0 ? vUrlIdx : 8] || '').trim();
    const aiTitle = (r[aiTitleIdx >= 0 ? aiTitleIdx : 9] || '').trim();
    const aiUrl = (r[aiUrlIdx >= 0 ? aiUrlIdx : 10] || '').trim();

    const videos = vUrl ? [{ title: vTitle || '動画', url: vUrl }] : [];
    const aiConsultations = aiUrl ? [{ title: aiTitle || 'AI診断', url: aiUrl }] : [];

    items.push({
      id,
      date,
      title,
      location,
      participants,
      practiceContents,
      comment,
      videos,
      aiConsultations,
    });
  }

  return items;
};
