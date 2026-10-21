import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchParticipantVideos } from '../services/searchService';
import { VideoSearchResult } from '../types';
import { getVideoPlayerParams } from '../utils/format';

export const VideoSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialName = searchParams.get('name') || '';

  const [handleName, setHandleName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [results, setResults] = useState<VideoSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Perform search
  const executeSearch = async (nameToSearch: string) => {
    const trimmed = nameToSearch.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setStatusMessage('検索しています…');
    setResults([]);
    setHasSearched(true);

    try {
      const response = await searchParticipantVideos(trimmed);
      if (!response.ok) {
        setStatusMessage(response.message || '検索に失敗しました。時間をおいて再度お試しください。');
        setResults([]);
        return;
      }

      const items = response.results || [];
      setResults(items);
      if (items.length > 0) {
        setStatusMessage(`${items.length}件の動画が見つかりました。`);
        // Store in localStorage for convenience
        try {
          localStorage.setItem('tennis_base_last_handle', trimmed);
        } catch {
          // ignore localStorage error
        }
      } else {
        setStatusMessage('該当する動画はありません。');
      }
    } catch {
      setStatusMessage('検索APIに接続できませんでした。時間をおいて再度お試しください。');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleName.trim()) {
      setSearchParams({ name: handleName.trim() });
      executeSearch(handleName.trim());
    }
  };

  // Auto-search if name query parameter is present on load
  useEffect(() => {
    if (initialName.trim()) {
      setHandleName(initialName.trim());
      executeSearch(initialName.trim());
    } else {
      // Suggest saved name from localStorage if available
      try {
        const saved = localStorage.getItem('tennis_base_last_handle');
        if (saved && !handleName) {
          setHandleName(saved);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <main className="section page-main">
      <div className="container">
        <p className="eyebrow">VIDEO SEARCH</p>
        <h1>テニス動画検索</h1>
        <p className="lead">登録したハンドルネームを入力して動画を検索できます。</p>

        <form id="search-form" className="search-form" onSubmit={handleSubmit}>
          <input
            id="handle-name"
            type="text"
            value={handleName}
            onChange={(e) => setHandleName(e.target.value)}
            placeholder="ハンドルネームを入力"
            required
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !handleName.trim()}>
            {isLoading ? '検索中…' : '検索'}
          </button>
        </form>

        {statusMessage && (
          <p id="search-status" aria-live="polite" style={{ margin: '16px 0', color: '#637381', fontWeight: 600 }}>
            {statusMessage}
          </p>
        )}

        <div id="search-results">
          {results.map((item, index) => {
            const videoUrl = String(item.videoUrl || '');
            const aiUrl = String(item.aiUrl || '');
            const safeVideoUrl = /^https?:\/\/[^\s"'<>]+$/i.test(videoUrl) ? videoUrl : '';
            const safeAiUrl = /^https?:\/\/[^\s"'<>]+$/i.test(aiUrl) ? aiUrl : '';
            const seconds = Number(item.startSeconds);
            const hasSeconds = Number.isFinite(seconds) && seconds >= 0;

            // Check if this video can be opened in the internal video-player
            const videoParams = safeVideoUrl ? getVideoPlayerParams(safeVideoUrl) : null;

            return (
              <article key={index} className="video-result">
                <h2>{item.eventName || 'イベント'}</h2>
                <p>開催日：{item.date}</p>

                {safeVideoUrl ? (
                  <p>
                    {videoParams ? (
                      <Link
                        to={`/video-player?id=${encodeURIComponent(videoParams.id)}&file=${encodeURIComponent(videoParams.file)}${hasSeconds ? `&t=${seconds}` : ''}`}
                        style={{ color: 'var(--blue)', fontWeight: 700 }}
                      >
                        🎥 コマ送りプレーヤーで開く
                      </Link>
                    ) : (
                      <a
                        href={safeVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--blue)', fontWeight: 700 }}
                      >
                        🎥 動画を開く
                      </a>
                    )}
                    {hasSeconds ? `（開始位置：${seconds}秒）` : ''}
                    {videoParams && (
                      <span style={{ marginLeft: '12px' }}>
                        <a
                          href={safeVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--muted)', fontSize: '0.88rem' }}
                        >
                          [別タブで開く]
                        </a>
                      </span>
                    )}
                  </p>
                ) : (
                  <p style={{ color: 'var(--muted)' }}>動画URLはまだ登録されていません。</p>
                )}

                {safeAiUrl && (
                  <p>
                    <a
                      href={safeAiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#15803d', fontWeight: 700 }}
                    >
                      ✨ AI診断を見る
                    </a>
                  </p>
                )}

                {item.memo && <p style={{ color: '#4b5d6e' }}>メモ：{item.memo}</p>}
              </article>
            );
          })}
        </div>

        {hasSearched && results.length === 0 && !isLoading && (
          <div style={{ marginTop: '24px', padding: '16px', background: '#fdfefe', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--muted)' }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--navy)' }}>💡 動画が見つからない場合：</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>大文字・小文字、全角・半角（例: 「Taka」と「taka」など）が登録時のハンドルネームと一致しているかご確認ください。</li>
              <li>まだスプレッドシートに登録されていない練習会動画の可能性があります。</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
};
