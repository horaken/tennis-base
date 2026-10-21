import { VideoSearchApiResponse } from '../types';

export const GAS_API_URL =
  'https://script.google.com/macros/s/AKfycbwARW9dNjpqvTmRFXLJbFvb8rq0lVTVZCn_cyu-bLravLp6HdfNlKEqwldvJA14fcTu5g/exec';

/**
 * Searches for participant's serve videos using the Google Apps Script endpoint via JSONP.
 * JSONP is used to ensure compatibility with GAS 302 redirects without CORS restrictions.
 */
export const searchParticipantVideos = (name: string): Promise<VideoSearchApiResponse> => {
  return new Promise((resolve) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      resolve({ ok: false, message: 'ハンドルネームを指定してください' });
      return;
    }

    const callbackName = `videoSearchCb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const scriptId = `script_${callbackName}`;

    // Set timeout to avoid hanging indefinitely
    const timeoutTimer = setTimeout(() => {
      cleanup();
      resolve({
        ok: false,
        message: '通信がタイムアウトしました。時間をおいて再度お試しください。',
      });
    }, 15000);

    const cleanup = () => {
      clearTimeout(timeoutTimer);
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any)[callbackName];
        const scriptElement = document.getElementById(scriptId);
        if (scriptElement) {
          scriptElement.remove();
        }
      }
    };

    // Define JSONP callback on window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[callbackName] = (data: VideoSearchApiResponse) => {
      cleanup();
      resolve(data);
    };

    // Create and append script tag
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `${GAS_API_URL}?name=${encodeURIComponent(trimmedName)}&callback=${callbackName}`;
    script.onerror = () => {
      cleanup();
      resolve({
        ok: false,
        message: '検索APIに接続できませんでした。ネットワーク接続またはGASの公開設定を確認してください。',
      });
    };

    document.body.appendChild(script);
  });
};
