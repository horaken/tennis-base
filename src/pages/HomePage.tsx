import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getEventsData, fetchEventsData } from '../services/dataService';
import { formatDate } from '../utils/format';
import { EventItem } from '../types';

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
      <section className="hero">
        <div className="container">
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
              <Link className="button button-accent" to="/video-search">
                ご自分のサーブ動画を見る（動画検索）
              </Link>
            </p>
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
                    {item.participants && item.participants !== '-' && (
                      <p className="event-participants">参加者：{item.participants}</p>
                    )}
                    {item.comment && (
                      <p className="event-description">{item.comment}</p>
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
