import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './style.css';
const appScript = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
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
