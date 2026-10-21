import React, { useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getEventsData } from '../services/dataService';
import { formatDate, parsePracticeContents, getVideoPlayerParams } from '../utils/format';

export const EventDetailPage: React.FC = () => {
  const { id: pathId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const eventId = pathId || queryId;

  const event = useMemo(() => {
    if (!eventId) return null;
    const events = getEventsData();
    return events.find((item) => item.id === eventId) || null;
  }, [eventId]);

  if (!event) {
    return (
      <main className="section page-main">
        <div className="container" aria-live="polite">
          <div className="empty-message">
            <h2>開催記録が見つかりませんでした</h2>
            <p>指定されたIDのイベントが存在しないか、削除された可能性があります。</p>
            <p>
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
            <ul>
              {practices.map((practice, index) => (
                <li key={index}>{practice}</li>
              ))}
            </ul>
          </section>
        )}

        {/* コメント */}
        {event.comment && (
          <section className="detail-section">
            <h2>コメント</h2>
            <p>{event.comment}</p>
          </section>
        )}

        {/* 写真 */}
        {photos.length > 0 && (
          <section className="detail-section">
            <h2>写真</h2>
            <div className="photo-grid">
              {photos.map((photo, index) => (
                <img key={index} src={photo.url} alt={photo.alt || `${event.title}の様子`} />
              ))}
            </div>
          </section>
        )}

        {/* 動画リンク */}
        {videos.length > 0 && (
          <section className="detail-section">
            <h2>動画リンク</h2>
            <ul className="detail-link-list">
              {videos.map((video, index) => {
                const label = video.participant
                  ? `${video.participant}：${video.title}`
                  : video.title || '動画を見る';
                const videoParams = getVideoPlayerParams(video.url);

                if (videoParams) {
                  return (
                    <li key={index}>
                      <Link
                        to={`/video-player?id=${encodeURIComponent(videoParams.id)}&file=${encodeURIComponent(videoParams.file)}`}
                      >
                        🎥 {label}（コマ送りプレーヤーで開く）
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={index}>
                    <a href={video.url} target="_blank" rel="noopener noreferrer">
                      🎥 {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* AI相談結果 */}
        {consultations.length > 0 && (
          <section className="detail-section">
            <h2>AI相談結果</h2>
            <ul className="detail-link-list">
              {consultations.map((consultation, index) => {
                const label = consultation.participant
                  ? `${consultation.participant}：${consultation.title}`
                  : consultation.title || 'AI診断結果を見る';
                return (
                  <li key={index}>
                    <a href={consultation.url} target="_blank" rel="noopener noreferrer">
                      ✨ {label}
                    </a>
                  </li>
                );
              })}
            </ul>
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
