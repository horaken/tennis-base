import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchEventsData, getEventsData } from '../services/dataService';
import { formatDate, getVideoPlayerParams } from '../utils/format';
import { EventItem } from '../types';
import { TennisRacketDecoration } from '../components/TennisDecorations';

export const ParticipantSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [events, setEvents] = useState<EventItem[]>(() => getEventsData());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch dynamic events from Google Spreadsheet and GitHub JSON
  useEffect(() => {
    let isMounted = true;
    fetchEventsData()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setEvents(data);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync input with URL search param
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // Filter events matching the search query
  const searchResults = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (!raw) return [];

    // Split input into keywords (supports space, comma, newline separated search words)
    const terms = raw.split(/[,、\s\u3000\n]+/).filter(Boolean);
    if (terms.length === 0) return [];

    return events.filter((e) => {
      // Search strictly inside registered participant IDs
      const candidateNames: string[] = [];

      if (Array.isArray(e.participantNames)) {
        e.participantNames.forEach((n) => {
          if (n) candidateNames.push(n.toLowerCase());
        });
      }
      e.videos?.forEach((v) => {
        if (v.participant) candidateNames.push(v.participant.toLowerCase());
      });

      // Match if ANY of the search terms matches ANY candidate participant ID
      return terms.some((term) =>
        candidateNames.some((cand) => cand.includes(term))
      );
    });
  }, [query, events]);

  const searchTerms = useMemo(() => {
    return query.trim().toLowerCase().split(/[,、\s\u3000\n]+/).filter(Boolean);
  }, [query]);

  const hasSearched = query.trim().length > 0;

  return (
    <main className="section page-main">
      <div className="container" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, opacity: 0.85 }}>
          <TennisRacketDecoration />
        </div>
        {/* Header & Badge */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#065f46',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.05em',
              }}
            >
              🎾 TENNIS BEAR ID SEARCH
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
              テニスベア登録ＩＤで検索
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', margin: '0 0 10px 0' }}>テニスベアＩＤから動画検索</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
            練習会参加時のテニスベアＩＤ（ニックネーム）を入力して、動画再生ページ（コマ送りプレーヤー）を検索できます。※本名の入力は不要です。
          </p>
        </div>

        {/* Search Input Box */}
        <div
          style={{
            backgroundColor: 'var(--card-bg, #ffffff)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="テニスベアＩＤを入力（例: Sugi、佐山、kazu0031、てる など）"
                style={{
                  width: '100%',
                  padding: '12px 38px 12px 14px',
                  fontSize: '1rem',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: '#9ca3af',
                  }}
                  title="クリア"
                >
                  ✕
                </button>
              )}
            </div>
            {query && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleQueryChange(query)}
                style={{ whiteSpace: 'nowrap', padding: '12px 20px', fontWeight: 700 }}
              >
                🔍 検索
              </button>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
            <p>⏳ イベントデータを読み込み中…</p>
          </div>
        )}

        {/* Search Results (Pattern 1: 一覧表示 ➔ 選択して再生) */}
        {hasSearched ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                「{query}」の検索結果（{searchResults.length}件）
              </h2>
            </div>

            {searchResults.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#f9fafb',
                  padding: '40px 20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px dashed #d1d5db',
                }}
              >
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>
                  該当するイベントが見つかりませんでした
                </p>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0 0 16px 0' }}>
                  テニスベアでの登録ＩＤ（英字・数字・ひらがな・カタカナ）をご確認いただき、再度お試しください。
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleQueryChange('')}
                  style={{ fontSize: '0.85rem' }}
                >
                  検索をリセット
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {searchResults.map((event) => {
                  const videos = (event.videos || []).filter((v) => v && v.url);
                  const consultations = (event.aiConsultations || []).filter((c) => c && c.url);

                  return (
                    <article
                      key={event.id}
                      style={{
                        backgroundColor: 'var(--card-bg, #ffffff)',
                        border: '1px solid var(--border, #e5e7eb)',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      {/* Event Header info */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary, #059669)' }}>
                            📅 {formatDate(event.date)}
                          </span>
                          {event.location && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                              📍 {event.location}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '1.15rem', margin: '0 0 6px 0' }}>
                          <Link
                            to={`/events/${encodeURIComponent(event.id)}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {event.title}
                          </Link>
                        </h3>
                        {event.comment && (
                          <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: 0 }}>
                            {event.comment}
                          </p>
                        )}

                        {/* 参加テニスベアＩＤタグ一覧（検索語と一致したＩＤをハイライト） */}
                        {event.participantNames && event.participantNames.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', margin: '0 0 4px 0' }}>
                              👥 参加テニスベアＩＤ:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {event.participantNames.map((name, i) => {
                                const isMatched = searchTerms.some((t) => name.toLowerCase().includes(t));
                                return (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: '0.8rem',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      backgroundColor: isMatched ? '#ecfdf5' : '#f1f5f9',
                                      color: isMatched ? '#047857' : '#475569',
                                      border: '1px solid',
                                      borderColor: isMatched ? '#10b981' : '#e2e8f0',
                                      fontWeight: isMatched ? 800 : 500,
                                      boxShadow: isMatched ? '0 1px 3px rgba(16, 185, 129, 0.2)' : 'none',
                                    }}
                                  >
                                    {isMatched ? '✓ ' : ''}{name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Video Playback Buttons */}
                      {videos.length > 0 ? (
                        <div
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginTop: '4px',
                          }}
                        >
                          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', margin: '0 0 8px 0' }}>
                            🎥 練習動画（コマ送りプレーヤー）:
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {videos.map((vid, idx) => {
                              const params = getVideoPlayerParams(vid.url);
                              const targetUrl = params
                                ? `/video-player?id=${encodeURIComponent(params.id)}&file=${encodeURIComponent(params.file)}&eventId=${encodeURIComponent(event.id)}`
                                : vid.url;
                              const isInternal = Boolean(params);

                              return isInternal ? (
                                <Link
                                  key={idx}
                                  to={targetUrl}
                                  className="btn btn-primary"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 14px',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    backgroundColor: '#059669',
                                    color: '#ffffff',
                                    borderRadius: '6px',
                                  }}
                                >
                                  ▶ {vid.title || '動画を再生する'}
                                </Link>
                              ) : (
                                <a
                                  key={idx}
                                  href={targetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 14px',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    backgroundColor: '#059669',
                                    color: '#ffffff',
                                    borderRadius: '6px',
                                  }}
                                >
                                  ▶ {vid.title || '動画を再生する (外部)'} ↗
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                          このイベントには動画リンクが登録されていません。
                        </p>
                      )}

                      {/* AI Consultation Link & Event Detail link */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px dashed #f1f5f9' }}>
                        <div>
                          {consultations.map((c, idx) => (
                            <a
                              key={idx}
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '0.85rem',
                                color: '#4f46e5',
                                fontWeight: 600,
                                textDecoration: 'none',
                                marginRight: '12px',
                              }}
                            >
                              ✨ {c.title || 'AI診断・分析を見る'} ↗
                            </a>
                          ))}
                        </div>
                        <Link
                          to={`/events/${encodeURIComponent(event.id)}`}
                          style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          開催記録詳細へ →
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Initial Empty state: Instructions and sample events */
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0', color: '#1e293b' }}>
              💡 検索の使い方
            </h3>
            <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <li>上部の検索ボックスにテニスベアＩＤ（ニックネーム）を入力してください（本名の入力は不要です）。</li>
              <li>スペース区切りで複数のＩＤを一度に入力して検索することも可能です。</li>
              <li>検索結果カード内の「▶ 動画を再生する」ボタンを押すと、コマ送り・スロー再生プレーヤーが直接開きます。</li>
            </ul>

            <h4 style={{ fontSize: '0.95rem', margin: '16px 0 8px 0', color: '#334155' }}>
              🎥 最近の動画付き開催記録（抜粋）:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {events
                .filter((e) => e.videos && e.videos.length > 0)
                .slice(0, 3)
                .map((e) => (
                  <div
                    key={e.id}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.88rem',
                    }}
                  >
                    <span>
                      <strong style={{ color: '#059669' }}>{formatDate(e.date)}</strong>: {e.title}
                    </span>
                    <Link
                      to={`/events/${encodeURIComponent(e.id)}`}
                      style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                    >
                      詳細 →
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '32px' }}>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: '0.9rem', textDecoration: 'none' }}>
            ← トップページへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
};
