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
 * Checks Google Spreadsheet first, then /data/events.json, then bundled JSON
 */
export const fetchEventsData = async (): Promise<EventItem[]> => {
  // 1. Try Google Spreadsheet direct GViz sync
  try {
    const sheetEvents = await fetchEventsFromSheet();
    if (sheetEvents && sheetEvents.length > 0) {
      // Merge by event id: sheet records override or prepend to existing
      const existing = (rawEvents as unknown as EventItem[]) || [];
      const sheetIds = new Set(sheetEvents.map((e) => e.id));
      const nonOverlapping = existing.filter((e) => !sheetIds.has(e.id));
      return [...sheetEvents, ...nonOverlapping];
    }
  } catch (err) {
    console.warn('Google Sheet events fetch failed:', err);
  }

  // 2. Try static /data/events.json
  try {
    const res = await fetch(`/data/events.json?v=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data as EventItem[];
      }
    }
  } catch (err) {
    console.warn('Failed to fetch /data/events.json dynamically, using fallback', err);
  }

  return rawEvents as unknown as EventItem[];
};

export const getEventsData = (): EventItem[] => {
  return rawEvents as unknown as EventItem[];
};

export const getScheduleData = (): ScheduleItem[] => {
  const today = getTodayDateString();
  const raw = (rawSchedule as unknown as ScheduleItem[]) || [];
  return raw.filter((s) => s.date && s.date >= today);
};
