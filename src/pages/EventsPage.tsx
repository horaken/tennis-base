import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getEventsData, fetchEventsData } from '../services/dataService';
import { formatDate, parsePracticeContents, getVideoPlayerParams } from '../utils/format';
import { EventItem } from '../types';
import { TennisCourtDecoration } from '../components/TennisDecorations';

export const EventsPage: React.FC = () => {
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

  const allEvents = useMemo(() => {
    return [...eventsList].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [eventsList]);

  const location = useLocation();
  const navigate = useNavigate();

  // Year and Month grouping
  const { years, yearMonthData, allMonths } = useMemo(() => {
    const ymData = new Map<string, Map<number, typeof allEvents>>();
    const monthsSet = new Set<number>();

    allEvents.forEach((item) => {
      if (!item.date) return;
      const year = item.date.substring(0, 4);
      const month = parseInt(item.date.substring(5, 7), 10);
      monthsSet.add(month);

      if (!ymData.has(year)) {
        ymData.set(year, new Map());
      }
      const mData = ymData.get(year)!;
      if (!mData.has(month)) {
        mData.set(month, []);
      }
      mData.get(month)!.push(item);
    });

    const sortedYears = Array.from(ymData.keys()).sort((a, b) => b.localeCompare(a));
    const sortedMonths = Array.from(monthsSet).sort((a, b) => b - a);

    return {
      years: sortedYears,
      yearMonthData: ymData,
      allMonths: sortedMonths,
    };
  }, [allEvents]);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Sync hash on mount and hash change
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash || hash === 'all') {
      setSelectedYear('all');
      setSelectedMonth('all');
      return;
    }
    if (hash.startsWith('month-')) {
      const m = parseInt(hash.replace('month-', ''), 10);
      if (!isNaN(m)) {
        setSelectedYear('all');
        setSelectedMonth(String(m));
      }
      return;
    }
    if (hash.includes('-')) {
      const [y, mStr] = hash.split('-');
      if (yearMonthData.has(y)) {
        setSelectedYear(y);
        const m = parseInt(mStr, 10);
        if (!isNaN(m) && yearMonthData.get(y)?.has(m)) {
          setSelectedMonth(String(m));
        } else {
          setSelectedMonth('all');
        }
        return;
      }
    }
    if (yearMonthData.has(hash)) {
      setSelectedYear(hash);
      setSelectedMonth('all');
    }
  }, [location.hash, yearMonthData]);

  const updateSelection = (year: string, month: string) => {
    setSelectedYear(year);
    setSelectedMonth(month);

    let newHash = 'all';
    if (year !== 'all' && month !== 'all') {
      const formattedMonth = String(month).padStart(2, '0');
      newHash = `${year}-${formattedMonth}`;
    } else if (year !== 'all') {
      newHash = year;
    } else if (month !== 'all') {
      newHash = `month-${month}`;
    }

    navigate(`#${newHash}`, { replace: true });
  };

  // Available months depending on selected year
  const availableMonths = useMemo(() => {
    const list: { month: number; count: number }[] = [];
    if (selectedYear === 'all') {
      allMonths.forEach((m) => {
        let count = 0;
        yearMonthData.forEach((mData) => {
          if (mData.has(m)) count += mData.get(m)!.length;
        });
        if (count > 0) {
          list.push({ month: m, count });
        }
      });
    } else {
      const mData = yearMonthData.get(selectedYear);
      if (mData) {
        Array.from(mData.keys())
          .sort((a, b) => b - a)
          .forEach((m) => {
            list.push({ month: m, count: mData.get(m)!.length });
          });
      }
    }
    return list;
  }, [selectedYear, allMonths, yearMonthData]);

  // Total count in current year scope
  const totalInScope = useMemo(() => {
    if (selectedYear === 'all') return allEvents.length;
    const mData = yearMonthData.get(selectedYear);
    if (!mData) return 0;
    let count = 0;
    mData.forEach((arr) => {
      count += arr.length;
    });
    return count;
  }, [selectedYear, allEvents.length, yearMonthData]);

  // Filtered list
  const filteredEvents = useMemo(() => {
    return allEvents.filter((item) => {
      if (!item.date) return false;
      const y = item.date.substring(0, 4);
      const m = parseInt(item.date.substring(5, 7), 10);
      if (selectedYear !== 'all' && y !== selectedYear) return false;
      if (selectedMonth !== 'all' && String(m) !== String(selectedMonth)) return false;
      return true;
    });
  }, [allEvents, selectedYear, selectedMonth]);

  // Summary message
  const summaryContent = useMemo(() => {
    if (selectedYear === 'all' && selectedMonth === 'all') {
      return (
        <>
          <span className="summary-label">すべての開催記録</span>
          <span className="summary-count">全 {filteredEvents.length} 件</span>
        </>
      );
    }
    if (selectedYear !== 'all' && selectedMonth === 'all') {
      return (
        <>
          <span className="summary-label">
            <strong>{selectedYear}年</strong> のすべての開催記録
          </span>
          <span className="summary-count">{filteredEvents.length} 件</span>
        </>
      );
    }
    if (selectedYear !== 'all' && selectedMonth !== 'all') {
      return (
        <>
          <span className="summary-label">
            <strong>
              {selectedYear}年{selectedMonth}月
            </strong>{' '}
            の開催記録
          </span>
          <span className="summary-count">{filteredEvents.length} 件</span>
        </>
      );
    }
    return (
      <>
        <span className="summary-label">
          <strong>{selectedMonth}月</strong> の開催記録
        </span>
        <span className="summary-count">{filteredEvents.length} 件</span>
      </>
    );
  }, [selectedYear, selectedMonth, filteredEvents.length]);

  return (
    <main className="section page-main">
      <div className="container">
        <div className="page-heading-group" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, opacity: 0.85 }}>
            <TennisCourtDecoration />
          </div>
          <p className="eyebrow">EVENTS</p>
          <h1>開催記録</h1>
          <p className="lead">
            これまでの開催内容を掲載しています。年月タブで切り替えて、練習内容・動画・ＡＩ診断結果をご確認いただけます。
          </p>
        </div>

        {/* 年月タブフィルター */}
        <div className="events-filter-wrapper" aria-label="開催年月の選択">
          {/* 年タブ */}
          <div className="filter-row">
            <span className="filter-label">開催年</span>
            <div className="tabs-nav year-tabs" role="tablist" aria-label="開催年の選択">
              <button
                type="button"
                role="tab"
                className={`tab-btn ${selectedYear === 'all' ? 'active' : ''}`}
                aria-selected={selectedYear === 'all'}
                onClick={() => updateSelection('all', 'all')}
              >
                <span>すべての年</span>
                <span className="tab-count">{allEvents.length}</span>
              </button>
              {years.map((y) => {
                const yMap = yearMonthData.get(y);
                let count = 0;
                yMap?.forEach((evts) => {
                  count += evts.length;
                });
                const isActive = selectedYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    role="tab"
                    className={`tab-btn ${isActive ? 'active' : ''}`}
                    aria-selected={isActive}
                    onClick={() => updateSelection(y, 'all')}
                  >
                    <span>{y}年</span>
                    <span className="tab-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-divider" />

          {/* 月タブ */}
          <div className="filter-row">
            <span className="filter-label">開催月</span>
            <div className="tabs-nav month-tabs" role="tablist" aria-label="開催月の選択">
              <button
                type="button"
                role="tab"
                className={`tab-btn ${selectedMonth === 'all' ? 'active' : ''}`}
                aria-selected={selectedMonth === 'all'}
                onClick={() => updateSelection(selectedYear, 'all')}
              >
                <span>すべての月</span>
                <span className="tab-count">{totalInScope}</span>
              </button>
              {availableMonths.map(({ month, count }) => {
                const isActive = String(selectedMonth) === String(month);
                return (
                  <button
                    key={month}
                    type="button"
                    role="tab"
                    className={`tab-btn ${isActive ? 'active' : ''}`}
                    aria-selected={isActive}
                    onClick={() => updateSelection(selectedYear, String(month))}
                  >
                    <span>{month}月</span>
                    <span className="tab-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 選択中ステータスバー */}
        <div className="events-summary-bar" aria-live="polite">
          {summaryContent}
        </div>

        {/* 開催記録カード一覧 */}
        <div className="card-list" aria-live="polite">
          {filteredEvents.length === 0 ? (
            <p className="empty-message">該当する開催記録はありません。</p>
          ) : (
            filteredEvents.map((item) => {
              const detailUrl = `/events/${encodeURIComponent(item.id)}`;
              const formattedDate = formatDate(item.date);
              const practices = parsePracticeContents(item.practiceContents);
              const videos = (item.videos ?? []).filter((v) => v && v.url);
              const consultations = (item.aiConsultations ?? []).filter((c) => c && c.url);

              return (
                <article key={item.id} className="event-card event-archive-card">
                  <div className="event-card-top">
                    <div className="event-card-badges">
                      <span className="badge badge-date">📅 {formattedDate}</span>
                      {item.location && <span className="badge badge-location">📍 {item.location}</span>}
                      {item.participants && item.participants !== '-' && (
                        <span className="badge badge-participants">👥 {item.participants}</span>
                      )}
                    </div>
                  </div>

                  {/* 参加者名一覧 */}
                  {item.participantNames && item.participantNames.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0 8px 0' }}>
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
                  )}

                  <h3 className="event-card-title">
                    <Link className="card-title-link" to={detailUrl}>
                      {item.title}
                    </Link>
                  </h3>

                  {practices.length > 0 && (
                    <div className="event-tags">
                      {practices.map((p, idx) => (
                        <span key={idx} className="tag-chip">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.comment && <p className="event-description">{item.comment}</p>}

                  <div className="event-card-actions">
                    <Link className="action-btn btn-primary" to={detailUrl}>
                      詳細・結果を見る <span aria-hidden="true">&rarr;</span>
                    </Link>

                    {videos.length > 0 && (() => {
                      const firstVideo = videos[0];
                      const videoParams = getVideoPlayerParams(firstVideo.url);
                      if (videoParams) {
                        return (
                          <Link
                            className="action-btn btn-video"
                            to={`/video-player?id=${encodeURIComponent(videoParams.id)}&file=${encodeURIComponent(videoParams.file)}`}
                          >
                            <span className="btn-icon">🎥</span> {firstVideo.title || '動画'}
                          </Link>
                        );
                      }
                      return (
                        <a
                          className="action-btn btn-video"
                          href={firstVideo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="btn-icon">🎥</span> {firstVideo.title || '動画'}
                        </a>
                      );
                    })()}

                    {consultations.length > 0 && (
                      <a
                        className="action-btn btn-ai"
                        href={consultations[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="btn-icon">✨</span> {consultations[0].title || 'AI診断'}
                      </a>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
};
