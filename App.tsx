import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import POS from './pages/POS';
import Tables from './pages/Tables';
import Reports from './pages/Reports';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import { StoreProvider } from './context/StoreContext';

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<POS />} />
            <Route path="tables" element={<Tables />} />
            <Route path="reports" element={<Reports />} />
            <Route path="finance" element={<Finance />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
};

export default App;