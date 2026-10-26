import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode, don't show
  if (isInstalled) {
    return null;
  }

  // Android / Desktop Chromium flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-1 text-xs font-medium hover:bg-sky-500/30 transition shadow-sm active:scale-95"
        title="Installer GopherPad sur votre appareil Android / Chrome"
      >
        <Download className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">Installer l'app</span>
        <span className="sm:hidden">Installer</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-1 text-xs font-medium hover:bg-sky-500/30 transition shadow-sm active:scale-95"
          title="Installer sur iPhone ou iPad"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>Installer</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <span className="text-sky-400">GopherPad</span> sur iOS
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <Share2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">1. Partager</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Touchez le bouton Partager dans la barre d'outils Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <PlusSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">2. Sur l'écran d'accueil</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Faites défiler vers le bas et touchez « Sur l'écran d'accueil ».
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-sky-500 py-2 text-sm font-semibold text-white hover:bg-sky-400 transition"
              >
                Compris !
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
