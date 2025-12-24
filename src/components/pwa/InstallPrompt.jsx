'use client';

import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      setShowInstallButton(false);
      return;
    }

    // STORAGE KEY VERSIONING TO RESET DISMISSAL FOR USER
    const STORAGE_KEY = 'pwa-install-dismissed-v2';

    // Listen for the beforeinstallprompt event (Android/PC)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check dismissal status
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          return; 
        }
      }
      
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, simple check if it's not standalone
    if (isIOSDevice && !isStandalone) {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed > 7) {
          setShowInstallButton(true);
        }
      } else {
        setShowInstallButton(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
       alert("To install on iOS: tap the Share button and select 'Add to Home Screen'");
       return;
    }

    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallButton(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed-v2', Date.now().toString());
    setShowInstallButton(false);
  };

  if (!showInstallButton) {
    return null;
  }

  // Debug: Force show for now to ensure user sees it
  // In production we rely on beforeinstallprompt, but for now we trust the event fired or logic held true.

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-slide-up pb-safe">
      <div className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
          <img src="/room-hisaab.png" alt="Room Hisaab" className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">Install Room Hisaab</h3>
          <p className="text-slate-300 text-xs truncate">Add to home screen for better experience</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-full font-semibold text-xs shadow-lg transition-colors"
          >
            {isIOS ? 'Instructions' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  );
}
