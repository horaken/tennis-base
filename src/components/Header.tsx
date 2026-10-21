import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const isEventsActive =
    pathname === '/events' || pathname === '/events.html' || pathname.startsWith('/events/');
  const isScheduleActive = pathname === '/schedule' || pathname === '/schedule.html';
  const isVideoSearchActive =
    pathname === '/video-search' || pathname === '/video-search.html' || pathname === '/search';
  const isVideoPlayerActive =
    pathname === '/video-player' ||
    pathname === '/video-player/' ||
    pathname === '/video-player/index.html';

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="site-logo" to="/">
          <span>🎾</span> tennis-base.net
        </Link>
        <nav aria-label="メインメニュー">
          <ul className="nav-list">
            <li>
              <Link
                to="/events"
                className={isEventsActive ? 'active' : ''}
                aria-current={isEventsActive ? 'page' : undefined}
              >
                開催記録
              </Link>
            </li>
            <li>
              <Link
                to="/schedule"
                className={isScheduleActive ? 'active' : ''}
                aria-current={isScheduleActive ? 'page' : undefined}
              >
                今後の予定
              </Link>
            </li>
            <li>
              <Link
                to="/video-search"
                className={isVideoSearchActive ? 'active' : ''}
                aria-current={isVideoSearchActive ? 'page' : undefined}
              >
                動画検索
              </Link>
            </li>
            <li>
              <Link
                to="/video-player"
                className={isVideoPlayerActive ? 'active' : ''}
                aria-current={isVideoPlayerActive ? 'page' : undefined}
              >
                コマ送りプレーヤー
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
