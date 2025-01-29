import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './Context/AuthProvider';
import { StompProvider } from './Context/StompProvider';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const portalRootId = "portal-root";
let portalRoot = document.getElementById(portalRootId);
if (!portalRoot) {
  portalRoot = document.createElement("div");
  portalRoot.id = portalRootId;
  document.body.appendChild(portalRoot);
}


root.render(
    <AuthProvider>
        <StompProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </StompProvider>
    </AuthProvider>
);