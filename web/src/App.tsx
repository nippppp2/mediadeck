import { useState, useEffect } from 'react';
import { DesktopDashboard } from './app/DesktopDashboard';
import { MobileRemote } from './app/MobileRemote';
import { OutputDisplay } from './app/OutputDisplay';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const searchParams = new URLSearchParams(window.location.search);
  const viewParam = searchParams.get('view');

  // Route to Output Display
  if (currentPath === '/output' || viewParam === 'output') {
    return <OutputDisplay />;
  }

  // Route to Mobile Remote
  if (currentPath === '/remote' || viewParam === 'remote') {
    return <MobileRemote />;
  }

  // Auto-detect mobile screen on root URL if viewport is small (<640px)
  const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 640;
  if (isMobileScreen && searchParams.get('force') !== 'desktop') {
    return <MobileRemote />;
  }

  // Default to Desktop 3-Column Dashboard
  return <DesktopDashboard />;
}

export default App;
