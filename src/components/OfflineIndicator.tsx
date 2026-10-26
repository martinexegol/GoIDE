import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-14 right-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600/95 px-3 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-md border border-amber-400/40 animate-fade-in">
      <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-200" />
      <span>Mode hors-ligne — Vos fichiers restent sauvegardés localement.</span>
    </div>
  );
};
