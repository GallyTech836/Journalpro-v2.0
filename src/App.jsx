import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import Layout from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import CalendarPage from './pages/Calendar';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';

function AppShell() {
  const { isLoading } = useApp();

  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </HashRouter>
  );
}
