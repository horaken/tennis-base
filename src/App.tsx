import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { SchedulePage } from './pages/SchedulePage';
import { VideoPlayerPage } from './pages/VideoPlayerPage';
import { VideoSearchPage } from './pages/VideoSearchPage';

export const App: React.FC = () => {
  const location = useLocation();

  // Scroll to top on route change unless hash is present
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className="app-container">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events.html" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/event-detail" element={<EventDetailPage />} />
        <Route path="/event-detail.html" element={<EventDetailPage />} />
        <Route path="/event.html" element={<EventDetailPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/schedule.html" element={<SchedulePage />} />
        <Route path="/video-search" element={<VideoSearchPage />} />
        <Route path="/video-search.html" element={<VideoSearchPage />} />
        <Route path="/search" element={<VideoSearchPage />} />
        <Route path="/video-player" element={<VideoPlayerPage />} />
        <Route path="/video-player/index.html" element={<VideoPlayerPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer />
    </div>
  );
};
