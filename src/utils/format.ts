export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }).format(date);
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const parsePracticeContents = (contents?: string[] | string): string[] => {
  if (!contents) return [];
  if (Array.isArray(contents)) {
    return contents
      .map((s) => String(s).replace(/^["'\s]+|["'\s]+$/g, '').trim())
      .filter(Boolean);
  }
  return String(contents)
    .split(',')
    .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, '').trim())
    .filter(Boolean);
};

export const getTodayDateString = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // fallback to local time
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeTime = (timeStr?: string): string => {
  if (!timeStr) return '';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : timeStr;
};

/**
 * Checks if a URL points to the local or hosted video-player tool
 * e.g. https://horaken.github.io/tennis-base/video-player/?id=...&file=...
 */
export const getVideoPlayerParams = (url: string): { id: string; file: string } | null => {
  if (!url) return null;
  try {
    if (url.includes('video-player')) {
      const parsedUrl = new URL(url, window.location.origin);
      const id = parsedUrl.searchParams.get('id');
      const file = parsedUrl.searchParams.get('file');
      if (id || file) {
        return {
          id: id || '',
          file: file || '',
        };
      }
    }
  } catch {
    // If invalid URL, check with regex
    const match = url.match(/[?&]id=([^&]+)(?:&file=([^&]+))?/);
    if (match) {
      return {
        id: decodeURIComponent(match[1]),
        file: match[2] ? decodeURIComponent(match[2]) : '',
      };
    }
  }
  return null;
};
