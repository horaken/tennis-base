import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getEventsData, fetchEventsData } from '../services/dataService';
import { formatDate } from '../utils/format';
import { EventItem } from '../types';
import { TennisRacketDecoration, TennisBallDecoration } from '../components/TennisDecorations';

export const HomePage: React.FC = () => {
  const [eventsList, setEventsList] = useState<EventItem[]>(() => getEventsData());

  useEffect(() => {
    let isMounted = true;
    fetchEventsData().then((data) => {
      if (isMounted && data && data.length > 0) {
        setEventsList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const events = useMemo(() => {
    const list = [...eventsList];
    return list
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 5);
  }, [eventsList]);

  return (
    <main>
      <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '20px', top: '20px', opacity: 0.85, transform: 'rotate(15deg)' }}>
          <TennisRacketDecoration />
        </div>
        <div style={{ position: 'absolute', right: '80px', bottom: '20px', opacity: 0.85 }}>
          <TennisBallDecoration />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p className="eyebrow">TENNIS COMMUNITY</p>
          <h1>
            テニスを、もっと気軽に。<br />もっと楽しく。
          </h1>
          <p className="lead">
            tennis-base.net は、テニスコミュニティの開催記録と今後の予定をお知らせするサイトです。
          </p>

          <div className="hero-buttons">
            <p>
              <Link className="button" to="/schedule">
                今後の開催予定を見る（開催予定表）
              </Link>
            </p>
            <p>
              <Link className="button" to="/events">
                すべての開催イベントを見る（開催記録一覧）
              </Link>
            </p>
            <p>
              <Link className="button button-accent" to="/participant-search">
                🔍 テニスベアＩＤから動画検索
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* テニスベアＩＤから動画検索 専用セクション（目立つカード） */}
      <section className="section" style={{ paddingTop: '24px', paddingBottom: '16px' }}>
        <div className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              border: '2px solid #a7f3d0',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#92400e',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  NEW 機能
                </span>
                <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>
                  TENNIS BEAR ID SEARCH
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', color: '#064e3b', margin: '0 0 6px 0', fontWeight: 800 }}>
                テニスベアＩＤから練習動画を探す
              </h2>
              <p style={{ color: '#065f46', margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
                テニスベアの登録ＩＤ（ニックネーム）を入力するだけで、ご自身が参加された練習会の動画コマ送り再生ページへ直接アクセスできます。
              </p>
            </div>

            <div>
              <Link
                to="/participant-search"
                className="button button-accent"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  textDecoration: 'none',
                }}
              >
                🔍 テニスベアＩＤから動画検索
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LATEST EVENT</p>
              <h2>最新開催情報（動画とＡＩ診断付き）</h2>
            </div>
            <Link className="text-link" to="/events">
              開催記録一覧を見る
            </Link>
          </div>

          <div className="card-list" aria-live="polite">
            {events.length === 0 ? (
              <p className="empty-message">現在掲載中の情報はありません。</p>
            ) : (
              events.map((item) => {
                const detailUrl = `/events/${encodeURIComponent(item.id)}`;
                const meta = `${formatDate(item.date)} ｜ ${item.location || ''}`;

                // Extract best server phrase from comment if present
                const bestServerMatch = item.comment?.match(/本日のベストサーバーは、[「『]?([^」』\s]+)[」』]?さんをＡＩが選出/);
                const bestServerName = bestServerMatch ? bestServerMatch[1] : null;

                // Clean comment removing standard best server text if extracted to avoid duplication, or display with highlight
                return (
                  <article key={item.id} className="event-card">
                    <p className="event-meta">
                      <Link to={detailUrl}>{meta}</Link>
                    </p>
                    <h3>
                      <Link className="card-title-link" to={detailUrl}>
                        {item.title}
                      </Link>
                    </h3>

                    {/* 参加者名一覧 */}
                    <div style={{ margin: '8px 0 12px 0' }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', margin: '0 0 4px 0' }}>
                        👥 参加者名一覧 ({item.participants || `${item.participantNames?.length || 0}名`}):
                      </p>
                      {item.participantNames && item.participantNames.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {item.participantNames.map((name, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.78rem',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #10b981',
                                fontWeight: 600,
                              }}
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="event-participants" style={{ margin: 0, fontSize: '0.85rem' }}>
                          {item.participants}
                        </p>
                      )}
                    </div>

                    {/* ベストサーバー選出バナー（目立つ装飾） */}
                    {bestServerName && (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #fffbe3 0%, #fef3c7 100%)',
                          border: '2px solid #f59e0b',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          margin: '10px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>👑</span>
                        <div style={{ fontSize: '0.92rem', color: '#78350f', fontWeight: 800 }}>
                          本日のベストサーバーは、<span style={{ color: '#d97706', fontSize: '1.05rem', textDecoration: 'underline' }}>「{bestServerName}」</span> さんをＡＩが選出！✨
                        </div>
                      </div>
                    )}

                    {item.comment && (
                      <p className="event-description" style={{ marginTop: '8px' }}>
                        {item.comment}
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
};
