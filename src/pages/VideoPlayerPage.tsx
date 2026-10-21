import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getEventsData } from '../services/dataService';
import { getVideoPlayerParams } from '../utils/format';

export const VideoPlayerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL parameters or defaults
  const archiveId = searchParams.get('id') || '0725_20261013';
  const fileName = searchParams.get('file') || 'サーブ動画_0801.mp4';
  const initialSecondsParam = searchParams.get('t') || searchParams.get('startSeconds') || '';
  const initialSeconds = Number(initialSecondsParam);

  const [inputArchiveId, setInputArchiveId] = useState(archiveId);
  const [inputFileName, setInputFileName] = useState(fileName);
  const [speed, setSpeed] = useState<number>(1);
  const [fps, setFps] = useState<number>(30);
  const [statusText, setStatusText] = useState<string>('動画を読み込んでいます。');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSeekedInitialRef = useRef<boolean>(false);

  // Sync state if search params change
  useEffect(() => {
    setInputArchiveId(archiveId);
    setInputFileName(fileName);
    hasSeekedInitialRef.current = false;
  }, [archiveId, fileName]);

  // Construct Archive.org URL
  const videoUrl = useMemo(() => {
    return `https://archive.org/download/${encodeURIComponent(archiveId)}/${encodeURIComponent(fileName)}`;
  }, [archiveId, fileName]);

  // Extract preset videos from events.json for convenience
  const eventVideoPresets = useMemo(() => {
    const events = getEventsData();
    const presets: { label: string; date: string; id: string; file: string }[] = [];

    events.forEach((ev) => {
      (ev.videos || []).forEach((vid) => {
        const p = getVideoPlayerParams(vid.url);
        if (p) {
          presets.push({
            label: `${ev.date} ${vid.title}`,
            date: ev.date,
            id: p.id,
            file: p.file,
          });
        }
      });
    });

    return presets;
  }, []);

  const updateStatus = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.currentTime)) return;

    const frame = Math.round(video.currentTime * fps);
    setStatusText(
      `時間: ${video.currentTime.toFixed(3)} 秒 / 推定フレーム番号: ${frame}`
    );
  }, [fps]);

  const stepFrame = useCallback((direction: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;

    video.pause();
    setIsPlaying(false);

    const step = 1 / fps;
    const target = Math.max(0, Math.min(video.duration, video.currentTime + direction * step));
    video.currentTime = target;
    updateStatus();
  }, [fps, updateStatus]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        handlePlay();
      } else {
        handlePause();
      }
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpeed = Number(e.target.value);
    setSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const handleFpsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFps = Number(e.target.value);
    setFps(newFps);
  };

  const handleApplyCustomVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputArchiveId.trim() && inputFileName.trim()) {
      setSearchParams({
        id: inputArchiveId.trim(),
        file: inputFileName.trim(),
      });
    }
  };

  const handleSelectPreset = (preset: { id: string; file: string }) => {
    setSearchParams({
      id: preset.id,
      file: preset.file,
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(-1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepFrame(1);
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [stepFrame]);

  // Video element setup and listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    setStatusText('動画を読み込んでいます…');

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setHasError(true);
      setStatusText('動画を読み込めません。アイテムIDとファイル名を確認してください。');
    };

    const onLoadedMetadata = () => {
      if (!hasSeekedInitialRef.current && Number.isFinite(initialSeconds) && initialSeconds > 0) {
        if (initialSeconds <= video.duration) {
          video.currentTime = initialSeconds;
          hasSeekedInitialRef.current = true;
        }
      }
      updateStatus();
    };

    video.addEventListener('timeupdate', updateStatus);
    video.addEventListener('seeked', updateStatus);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onError);

    video.src = videoUrl;
    video.playbackRate = speed;

    return () => {
      video.removeEventListener('timeupdate', updateStatus);
      video.removeEventListener('seeked', updateStatus);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
    };
  }, [videoUrl, initialSeconds]);

  return (
    <main className="section page-main">
      <div className="container video-player-container">
        <div style={{ marginBottom: '16px' }}>
          <p className="eyebrow">VIDEO ANALYSIS</p>
          <h2>テニス動画コマ送りプレーヤー</h2>
          <p className="lead" style={{ margin: '8px 0 16px' }}>
            フレーム単位での巻き戻し・早送りが可能なテニスフォーム分析用プレーヤーです。キーボードの左右矢印キーで1コマ移動、スペースキーで再生/停止が可能です。
          </p>
        </div>

        {/* 動画プレイヤー */}
        <div className="video-element-wrapper">
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
          >
            お使いのブラウザは動画再生に対応していません。
          </video>
        </div>

        {/* ダウンロード & 直リンク */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginTop: '12px', fontSize: '0.92rem' }}>
          <a
            className="text-link"
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            📥 動画を開く・ダウンロード
          </a>
          {Number.isFinite(initialSeconds) && initialSeconds > 0 && (
            <span style={{ color: 'var(--muted)' }}>
              （開始シーク指定：{initialSeconds}秒）
            </span>
          )}
        </div>

        {/* 操作ボタン */}
        <div className="player-controls">
          <button
            type="button"
            className="player-btn"
            onClick={() => stepFrame(-1)}
            title="左矢印キーでも操作可能"
          >
            ◀ 1コマ戻る
          </button>
          <button
            type="button"
            className="player-btn"
            style={{ minWidth: '80px', justifyContent: 'center' }}
            onClick={isPlaying ? handlePause : handlePlay}
            title="スペースキーでも操作可能"
          >
            {isPlaying ? '⏸ 停止' : '▶ 再生'}
          </button>
          <button
            type="button"
            className="player-btn"
            onClick={() => stepFrame(1)}
            title="右矢印キーでも操作可能"
          >
            1コマ進む ▶
          </button>
        </div>

        {/* 速度・FPS設定 */}
        <div className="player-controls">
          <label className="player-select-label">
            再生速度:
            <select
              className="player-select"
              value={speed}
              onChange={handleSpeedChange}
            >
              <option value="0.25">0.25倍</option>
              <option value="0.5">0.5倍</option>
              <option value="0.75">0.75倍</option>
              <option value="1">通常速度</option>
            </select>
          </label>

          <label className="player-select-label">
            フレームレート:
            <select
              className="player-select"
              value={fps}
              onChange={handleFpsChange}
            >
              <option value="24">24 fps</option>
              <option value="25">25 fps</option>
              <option value="30">30 fps</option>
              <option value="50">50 fps</option>
              <option value="60">60 fps</option>
              <option value="120">120 fps</option>
              <option value="240">240 fps</option>
            </select>
          </label>
        </div>

        {/* 再生ステータス表示 */}
        <div className="player-status" role="status" aria-live="polite">
          {statusText}
        </div>

        {/* 練習会動画プリセット選択 */}
        {eventVideoPresets.length > 0 && (
          <div className="player-archive-source-box" style={{ marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem' }}>
              🎾 開催記録の動画をクイック読み込み
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {eventVideoPresets.map((preset, idx) => {
                const isCurrent = preset.id === archiveId && preset.file === fileName;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="tag-chip"
                    style={{
                      cursor: 'pointer',
                      border: isCurrent ? '1px solid var(--blue)' : '1px solid #d4e0e8',
                      background: isCurrent ? '#edf5fa' : '#ffffff',
                      color: isCurrent ? 'var(--blue)' : 'var(--navy)',
                      fontWeight: isCurrent ? 700 : 500,
                      padding: '6px 12px',
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* カスタム動画ソース指定 */}
        <div className="player-archive-source-box" style={{ marginTop: '16px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem' }}>
            ⚙️ Internet Archive 動画ソース設定
          </h3>
          <form onSubmit={handleApplyCustomVideo} style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <label style={{ flex: '1 1 200px', fontSize: '0.88rem' }}>
                アーカイブID (id):
                <input
                  type="text"
                  value={inputArchiveId}
                  onChange={(e) => setInputArchiveId(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    marginTop: '4px',
                    border: '1px solid #dce3e7',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                  }}
                  placeholder="例: horaken-2026-09-05"
                />
              </label>

              <label style={{ flex: '1 1 200px', fontSize: '0.88rem' }}>
                ファイル名 (file):
                <input
                  type="text"
                  value={inputFileName}
                  onChange={(e) => setInputFileName(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    marginTop: '4px',
                    border: '1px solid #dce3e7',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                  }}
                  placeholder="例: サーブ動画_0905.mp4"
                />
              </label>
            </div>

            <div>
              <button type="submit" className="button" style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
                動画を再読み込み
              </button>
            </div>
          </form>
        </div>

        <p style={{ marginTop: '28px' }}>
          <Link className="text-link" to="/events">
            ← 開催記録一覧へ戻る
          </Link>
        </p>
      </div>
    </main>
  );
};
