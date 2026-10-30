import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './style.css';

// Find the application's entry script (filtering out dev server scripts like /@vite/client)
const appScript = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'))
  .find((s) => s.src.includes('assets/index.js') || s.src.includes('main.tsx'));
const scriptPath = appScript ? new URL(appScript.src).pathname : '';
const appBasePath = scriptPath.replace(/\/(?:assets\/index\.js|src\/main\.tsx)$/, '') || '/';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter basename={appBasePath}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
