import rawEvents from '../../data/events.json';
import rawSchedule from '../../data/schedule.json';
import { EventItem, ScheduleItem } from '../types';
import {
  fetchScheduleFromSheet,
  fetchEventsFromSheet,
  fetchParticipantNamesFromSheet,
} from './sheetScheduleService';
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
    const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/tennis-base') ? '/tennis-base' : '';
    const res = await fetch(`${basePath}/data/schedule.json?v=${Date.now()}`);
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
 * Enriches events with participantNames from the "イベント参加者" sheet
 */
export const fetchEventsData = async (): Promise<EventItem[]> => {
  // 1. Fetch participant map from "イベント参加者" sheet
  let participantMap = new Map<string, string[]>();
  try {
    participantMap = await fetchParticipantNamesFromSheet();
  } catch (err) {
    console.warn('Failed to fetch participant names from sheet:', err);
  }

  // 2. Fetch sheet events
  let sheetEvents: EventItem[] = [];
  try {
    sheetEvents = await fetchEventsFromSheet();
  } catch (err) {
    console.warn('Google Sheet events fetch failed:', err);
  }

  // 3. Fetch github events
  let baseEvents: EventItem[] = [];
  try {
    const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/tennis-base') ? '/tennis-base' : '';
    const res = await fetch(`${basePath}/data/events.json?v=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        baseEvents = data as EventItem[];
      }
    }
  } catch (err) {
    console.warn('Failed to fetch /data/events.json dynamically, using fallback', err);
  }

  if (baseEvents.length === 0) {
    baseEvents = (rawEvents as unknown as EventItem[]) || [];
  }

  // Merge sheet-only events
  const baseIds = new Set(baseEvents.map((event) => event.id));
  const sheetOnlyEvents = sheetEvents.filter((event) => !baseIds.has(event.id));
  const combined = [...baseEvents, ...sheetOnlyEvents];

  const sheetEventMap = new Map(sheetEvents.map((e) => [e.id, e]));

  // 4. Enrich every event with participantNames from participantMap and sheetEvents
  return combined.map((event) => {
    const fromPartSheet =
      participantMap.get(event.id) ||
      participantMap.get(event.id.replace(/-/g, ''));
    const fromSheetEvent = sheetEventMap.get(event.id);

    const mergedNames = new Set<string>(event.participantNames || []);
    if (fromPartSheet) {
      fromPartSheet.forEach((n) => mergedNames.add(n));
    }
    if (fromSheetEvent && fromSheetEvent.participantNames) {
      fromSheetEvent.participantNames.forEach((n) => mergedNames.add(n));
    }

    // Also extract best server from comment if present
    const bestServerMatch = event.comment?.match(/「([^」]+)」/);
    if (bestServerMatch && bestServerMatch[1]) {
      mergedNames.add(bestServerMatch[1].trim());
    }

    return {
      ...event,
      participantNames: Array.from(mergedNames),
    };
  });
};

export const getEventsData = (): EventItem[] => {
  return rawEvents as unknown as EventItem[];
};

export const getScheduleData = (): ScheduleItem[] => {
  const today = getTodayDateString();
  const raw = (rawSchedule as unknown as ScheduleItem[]) || [];
  return raw.filter((s) => s.date && s.date >= today);
};
