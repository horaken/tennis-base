import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getEventsData, fetchEventsData } from '../services/dataService';
import { formatDate, parsePracticeContents, getVideoPlayerParams } from '../utils/format';
import { EventItem } from '../types';

export const EventDetailPage: React.FC = () => {
  const { id: pathId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const rawId = (pathId || queryId || '').trim();
  const [eventsList, setEventsList] = useState<EventItem[]>(() => getEventsData());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load latest events from Google Spreadsheet / JSON dynamically
  useEffect(() => {
    let isMounted = true;
    fetchEventsData()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setEventsList(data);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const event = useMemo(() => {
    if (!rawId) return null;

    // 1. Exact match
    const exact = eventsList.find((item) => item.id === rawId);
    if (exact) return exact;

    // 2. Case-insensitive / normalized match (e.g., removing hyphens: 20261018-02 vs 2026101802)
    const normId = rawId.replace(/[-_]/g, '').toLowerCase();
    const normalized = eventsList.find(
      (item) => (item.id || '').replace(/[-_]/g, '').toLowerCase() === normId
    );
    if (normalized) return normalized;

    // 3. Date-based fallback if passed date string as id (e.g., 2026-10-18)
    const byDate = eventsList.find((item) => item.date === rawId);
    if (byDate) return byDate;

    return null;
  }, [rawId, eventsList]);

  if (isLoading && !event) {
    return (
      <main className="section page-main">
        <div className="container" aria-live="polite">
          <div className="empty-message" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--muted)', fontWeight: 600 }}>
              ⏳ 開催記録を読み込んでいます…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="section page-main">
        <div className="container" aria-live="polite">
          <div className="empty-message">
            <h2>開催記録が見つかりませんでした</h2>
            <p>指定されたID（{rawId ? `ID: ${rawId}` : 'ID未指定'}）のイベントが存在しないか、削除された可能性があります。</p>
            <p style={{ marginTop: '12px' }}>
              <Link className="text-link" to="/events">
                ← 開催記録一覧へ戻る
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  const practices = parsePracticeContents(event.practiceContents);
  const videos = (event.videos ?? []).filter((v) => v && v.url);
  const consultations = (event.aiConsultations ?? []).filter((c) => c && c.url);
  const photos = (event.photos ?? []).filter((p) => p && p.url);

  return (
    <main className="section page-main">
      <div className="container" aria-live="polite">
        <p className="eyebrow">EVENT DETAIL</p>
        <p className="event-meta">{formatDate(event.date)}</p>
        <h1>{event.title}</h1>

        {/* 開催情報（場所・参加者） */}
        {(event.location || event.participants) && (
          <dl className="detail-list">
            {event.location && (
              <div>
                <dt>開催場所</dt>
                <dd>{event.location}</dd>
              </div>
            )}
            {event.participants && (
              <div>
                <dt>参加者</dt>
                <dd>{event.participants}</dd>
              </div>
            )}
          </dl>
        )}

        {/* 練習内容 */}
        {practices.length > 0 && (
          <section className="detail-section">
            <h2>練習内容</h2>
            <ul className="practice-list">
              {practices.map((content, index) => (
                <li key={index}>{content}</li>
              ))}
            </ul>
          </section>
        )}

        {/* コメント・総括 */}
        {event.comment && (
          <section className="detail-section">
            <h2>開催メモ・総括</h2>
            <p className="detail-comment">{event.comment}</p>
          </section>
        )}

        {/* 練習動画 */}
        {videos.length > 0 && (
          <section className="detail-section">
            <h2>練習動画</h2>
            <ul className="link-list">
              {videos.map((vid, index) => {
                const playerParams = getVideoPlayerParams(vid.url);
                return (
                  <li key={index}>
                    {playerParams ? (
                      <Link
                        className="text-link"
                        to={`/video-player?id=${encodeURIComponent(playerParams.id)}&file=${encodeURIComponent(playerParams.file)}`}
                        style={{ fontWeight: 700 }}
                      >
                        🎥 {vid.title}（コマ送りプレーヤーで再生）
                      </Link>
                    ) : (
                      <a
                        className="text-link"
                        href={vid.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        🎥 {vid.title}
                      </a>
                    )}
                    {vid.participant && <span className="tag-chip">{vid.participant}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* AI診断・分析 */}
        {consultations.length > 0 && (
          <section className="detail-section">
            <h2>AI診断・分析</h2>
            <ul className="link-list">
              {consultations.map((item, index) => (
                <li key={index}>
                  <a
                    className="text-link"
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ✨ {item.title}
                  </a>
                  {item.participant && <span className="tag-chip">{item.participant}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 写真一覧 */}
        {photos.length > 0 && (
          <section className="detail-section">
            <h2>写真</h2>
            <div className="photo-grid">
              {photos.map((item, index) => (
                <img
                  key={index}
                  src={item.url}
                  alt={item.alt || `${event.title}の写真`}
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}

        <p style={{ marginTop: '36px' }}>
          <Link className="text-link" to="/events">
            ← 開催記録一覧へ戻る
          </Link>
        </p>
      </div>
    </main>
  );
};
