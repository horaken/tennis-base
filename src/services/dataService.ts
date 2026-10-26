import rawEvents from '../../data/events.json';
import rawSchedule from '../../data/schedule.json';
import { EventItem, ScheduleItem } from '../types';
import { fetchScheduleFromSheet, fetchEventsFromSheet } from './sheetScheduleService';
import { getTodayDateString } from '../utils/format';

/**
 * Fetch schedule data dynamically at runtime (with cache busting)
 * Checks Google Spreadsheet first, then /data/schedule.json, then bundled JSON
 * Strictly excludes any past dates (date < today).
 */
export const fetchScheduleData = async (): Promise<ScheduleItem[]> => {
  const today = getTodayDateString();

  // 1. Try Google Spreadsheet direct GViz sync
  try {
    const sheetItems = await fetchScheduleFromSheet();
    if (sheetItems && sheetItems.length > 0) {
      // Filter out past dates strictly
      return sheetItems.filter((s) => s.date && s.date >= today);
    }
  } catch (err) {
    console.warn('Google Sheet schedule fetch failed:', err);
  }

  // 2. Try static /data/schedule.json
  try {
    const res = await fetch(`/data/schedule.json?v=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return (data as ScheduleItem[]).filter((s) => s.date && s.date >= today);
      }
    }
  } catch (err) {
    console.warn('Failed to fetch /data/schedule.json dynamically, using fallback', err);
  }

  const raw = (rawSchedule as unknown as ScheduleItem[]) || [];
  return raw.filter((s) => s.date && s.date >= today);
};

/**
 * Fetch events data dynamically at runtime (with cache busting)
 * Prefers GitHub JSON for matching IDs and appends sheet-only events
 */
export const fetchEventsData = async (): Promise<EventItem[]> => {
  let sheetEvents: EventItem[] = [];

  // 1. Try Google Spreadsheet direct GViz sync
  try {
    sheetEvents = await fetchEventsFromSheet();
  } catch (err) {
    console.warn('Google Sheet events fetch failed:', err);
  }

  // GitHub JSON is the source of truth for matching IDs. Sheet-only events
  // remain available so new events can continue to be entered in the sheet.
  try {
    const jsonUrl = new URL('./data/events.json', window.location.href);
    jsonUrl.searchParams.set('v', String(Date.now()));
    const res = await fetch(jsonUrl.toString());
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const githubEvents = data as EventItem[];
        const githubIds = new Set(githubEvents.map((event) => event.id));
        const sheetOnlyEvents = sheetEvents.filter((event) => !githubIds.has(event.id));
        return [...githubEvents, ...sheetOnlyEvents];
      }
    }
  } catch (err) {
    console.warn('Failed to fetch /data/events.json dynamically, using fallback', err);
  }

  // If the live JSON cannot be reached, use the bundled GitHub snapshot first
  // and append only events that exist solely in the spreadsheet.
  const bundledEvents = (rawEvents as unknown as EventItem[]) || [];
  const bundledIds = new Set(bundledEvents.map((event) => event.id));
  const sheetOnlyEvents = sheetEvents.filter((event) => !bundledIds.has(event.id));
  return [...bundledEvents, ...sheetOnlyEvents];
};

export const getEventsData = (): EventItem[] => {
  return rawEvents as unknown as EventItem[];
};

export const getScheduleData = (): ScheduleItem[] => {
  const today = getTodayDateString();
  const raw = (rawSchedule as unknown as ScheduleItem[]) || [];
  return raw.filter((s) => s.date && s.date >= today);
};
