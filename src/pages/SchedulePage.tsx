import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getScheduleData, fetchScheduleData } from '../services/dataService';
import { formatDate, getTodayDateString, normalizeTime } from '../utils/format';
import { ScheduleItem } from '../types';

export const SchedulePage: React.FC = () => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(() => getScheduleData());
  const today = useMemo(() => getTodayDateString(), []);
  const location = useLocation();
  const navigate = useNavigate();

  // Load latest data dynamically on mount
  useEffect(() => {
    let isMounted = true;
    fetchScheduleData().then((data) => {
      if (isMounted && data && data.length > 0) {
        setScheduleItems(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Standardize date format (e.g. 2026/10/25 -> 2026-10-25)
  const normalizedSchedule = useMemo(() => {
    return scheduleItems.map((item) => {
      const cleanDate = (item.date || '').replace(/\//g, '-').trim();
      return {
        ...item,
        date: cleanDate,
      };
    });
  }, [scheduleItems]);

  // Strictly filter out past dates: only date >= today is displayed
  const baseEvents: ScheduleItem[] = useMemo(() => {
    return normalizedSchedule
      .filter((item) => item.date && item.date >= today)
      .sort((a, b) => {
        const dateDiff = (a.date || '').localeCompare(b.date || '');
        if (dateDiff !== 0) return dateDiff;
        return normalizeTime(a.time).localeCompare(normalizeTime(b.time));
      });
  }, [normalizedSchedule, today]);

  // Year and Month grouping (ascending)
  const { years, yearMonthData, allMonths } = useMemo(() => {
    const ymData = new Map<string, Map<number, ScheduleItem[]>>();
    const monthsSet = new Set<number>();

    baseEvents.forEach((item) => {
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

    const sortedYears = Array.from(ymData.keys()).sort((a, b) => a.localeCompare(b));
    const sortedMonths = Array.from(monthsSet).sort((a, b) => a - b);

    return {
      years: sortedYears,
      yearMonthData: ymData,
      allMonths: sortedMonths,
    };
  }, [baseEvents]);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Hash handling
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
          .sort((a, b) => a - b)
          .forEach((m) => {
            list.push({ month: m, count: mData.get(m)!.length });
          });
      }
    }
    return list;
  }, [selectedYear, allMonths, yearMonthData]);

  const totalInScope = useMemo(() => {
    if (selectedYear === 'all') return baseEvents.length;
    const mData = yearMonthData.get(selectedYear);
    if (!mData) return 0;
    let count = 0;
    mData.forEach((arr) => {
      count += arr.length;
    });
    return count;
  }, [selectedYear, baseEvents.length, yearMonthData]);

  const filteredEvents = useMemo(() => {
    return baseEvents.filter((item) => {
      if (!item.date) return false;
      const y = item.date.substring(0, 4);
      const m = parseInt(item.date.substring(5, 7), 10);
      if (selectedYear !== 'all' && y !== selectedYear) return false;
      if (selectedMonth !== 'all' && String(m) !== String(selectedMonth)) return false;
      return true;
    });
  }, [baseEvents, selectedYear, selectedMonth]);

  const summaryContent = useMemo(() => {
    if (selectedYear === 'all' && selectedMonth === 'all') {
      return (
        <>
          <span className="summary-label">すべての開催予定</span>
          <span className="summary-count">全 {filteredEvents.length} 件</span>
        </>
      );
    }
    if (selectedYear !== 'all' && selectedMonth === 'all') {
      return (
        <>
          <span className="summary-label">
            <strong>{selectedYear}年</strong> のすべての開催予定
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
            の開催予定
          </span>
          <span className="summary-count">{filteredEvents.length} 件</span>
        </>
      );
    }
    return (
      <>
        <span className="summary-label">
          <strong>{selectedMonth}月</strong> の開催予定
        </span>
        <span className="summary-count">{filteredEvents.length} 件</span>
      </>
    );
  }, [selectedYear, selectedMonth, filteredEvents.length]);

  return (
    <main className="section page-main">
      <div className="container">
        <div className="page-heading-group">
          <p className="eyebrow">SCHEDULE</p>
          <h1>今後の開催予定</h1>
          <p className="lead">
            今後の開催予定を掲載しています。年月タブで切り替えて、日程・時間・開催場所をご確認いただけます。
          </p>
        </div>

        {/* スケジュール情報バー */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '12px',
            fontSize: '0.88rem',
            color: 'var(--muted)',
          }}
        >
          <div>
            <span>
              📅 基準日: <strong>{today}</strong>（本日以降の開催予定のみ表示）
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
              🟢 Googleスプレッドシート（schedule）連動中
            </span>
            <button
              type="button"
              onClick={() => {
                fetchScheduleData().then((data) => {
                  if (data) {
                    setScheduleItems(data);
                  }
                });
              }}
              className="tab-chip"
              style={{
                cursor: 'pointer',
                padding: '4px 10px',
                fontSize: '0.82rem',
                border: '1px solid #d4e0e8',
                borderRadius: '6px',
                background: '#ffffff',
                color: 'var(--navy)',
                fontWeight: 600,
              }}
              title="スプレッドシートの最新データを即時再取得します"
            >
              🔄 最新情報に更新
            </button>
          </div>
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
                <span className="tab-count">{baseEvents.length}</span>
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

        {/* サマリーバー */}
        <div className="events-summary-bar" aria-live="polite">
          {summaryContent}
        </div>

        {/* スケジュール一覧 */}
        <div className="card-list" aria-live="polite">
          {filteredEvents.length === 0 ? (
            <div className="empty-message">
              <p>現在予定されている開催情報はありません。</p>
            </div>
          ) : (
            filteredEvents.map((item, index) => {
              const formattedDate = formatDate(item.date);
              return (
                <article key={index} className="event-card schedule-card">
                  <div className="event-card-top">
                    <div className="event-card-badges">
                      <span className="badge badge-date">📅 {formattedDate}</span>
                      {item.time && <span className="badge badge-time">⏰ {item.time}</span>}
                      {item.location && <span className="badge badge-location">📍 {item.location}</span>}
                    </div>
                  </div>
                  <h3 className="event-card-title">{item.title}</h3>
                  {item.description && <p className="event-description">{item.description}</p>}
                </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
};
