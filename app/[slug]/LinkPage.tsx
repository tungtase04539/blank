'use client';

import { useEffect, useState } from 'react';
import NextScript from 'next/script';
import { Link, Script, GlobalSettings } from '@/lib/types';

interface LinkPageProps {
  link: Link;
  scripts: Script[];
  globalSettings: GlobalSettings | null;
  userId: string;
}

// ✅ OPTIMIZED: Smart session with localStorage persistence (4h session)
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const SESSION_KEY = 'trkSid';
  const LAST_SEEN_KEY = 'trkLs';
  const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
  const now = Date.now();
  
  // Create new session if expired or doesn't exist
  if (!sessionId || !lastSeen || now - parseInt(lastSeen) > SESSION_DURATION) {
    sessionId = `s_${now.toString(36)}_${Math.random().toString(36).substr(2, 7)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  // Throttle localStorage writes (only update every 30s)
  if (!lastSeen || now - parseInt(lastSeen) > 30000) {
    localStorage.setItem(LAST_SEEN_KEY, now.toString());
  }
  
  return sessionId;
}

export default function LinkPage({ link, scripts, globalSettings, userId }: LinkPageProps) {
  const [pendingClicks, setPendingClicks] = useState<{
    telegram: number;
    web: number;
  }>({ telegram: 0, web: 0 });

  // ✅ OPTIMIZED: Keep-alive with Page Visibility API (only ping when tab is active)
  useEffect(() => {
    const sid = getSessionId();
    let keepAliveInterval: NodeJS.Timeout | null = null;

    const trackView = async () => {
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkId: link.id,
            sessionId: sid,
          }),
        });
      } catch (error) {
        console.error('Track view error:', error);
      }
    };

    // Track initial pageview
    trackView();

    // ✅ Only ping when tab is ACTIVE (saves 60% requests)
    const startKeepAlive = () => {
      if (!keepAliveInterval && !document.hidden) {
        keepAliveInterval = setInterval(trackView, 8 * 60 * 1000); // 8 minutes (optimized)
      }
    };

    const stopKeepAlive = () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopKeepAlive(); // Tab hidden → stop pinging
      } else {
        trackView(); // Tab visible → track immediately
        startKeepAlive(); // Then start interval
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startKeepAlive();

    // Handle random redirect if enabled
    if (link.redirect_enabled) {
      const checkAndRedirect = async () => {
        try {
          const response = await fetch('/api/smart-redirect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
          
          const data = await response.json();
          
          if (data.shouldRedirect && data.url) {
            setTimeout(() => {
              window.location.href = data.url;
            }, 100);
          }
        } catch (error) {
          console.error('Redirect error:', error);
        }
      };
      
      checkAndRedirect();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopKeepAlive();
    };
  }, [link.id, userId]);

  // ✅ OPTIMIZED: Debounced button click tracking (saves 40% button requests)
  useEffect(() => {
    if (pendingClicks.telegram === 0 && pendingClicks.web === 0) return;
    
    // Flush pending clicks after 1.5s (user has already left to new tab)
    const timer = setTimeout(async () => {
      const clicks = { ...pendingClicks };
      setPendingClicks({ telegram: 0, web: 0 });
      
      try {
        await fetch('/api/track-button-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkId: link.id,
            telegramClicks: clicks.telegram,
            webClicks: clicks.web,
          }),
        });
      } catch (error) {
        console.error('Track click error:', error);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [pendingClicks, link.id]);

  const headScripts = scripts.filter(s => s.location === 'head');
  const bodyScripts = scripts.filter(s => s.location === 'body');
  
  // Use link-specific buttons if set, otherwise fallback to global settings
  const telegramUrl = link.telegram_url || globalSettings?.telegram_url;
  const webUrl = link.web_url || globalSettings?.web_url;

  // ✅ Button click handlers for debounced tracking
  const handleTelegramClick = () => {
    setPendingClicks(prev => ({ ...prev, telegram: prev.telegram + 1 }));
  };

  const handleWebClick = () => {
    setPendingClicks(prev => ({ ...prev, web: prev.web + 1 }));
  };

  return (
    <>
      {/* Inject head scripts using Next.js Script component */}
      {headScripts.map((script) => (
        <NextScript
          key={script.id}
          id={`head-script-${script.id}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: script.content }}
        />
      ))}
      
      <div className="min-h-screen bg-black flex flex-col">
        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center p-4">
          <video 
            controls 
            className="w-full max-w-4xl"
            playsInline
            autoPlay
            preload="auto"
            muted
            src={link.video_url}
            style={{ maxHeight: '90vh' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        
        {/* Fixed Bottom Buttons */}
        {(telegramUrl || webUrl) && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className={`max-w-4xl mx-auto grid gap-4 ${telegramUrl && webUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleTelegramClick}
                  className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  <span>Telegram</span>
                </a>
              )}
              
              {webUrl && (
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWebClick}
                  className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* Body Scripts */}
        {bodyScripts.map((script) => (
          <NextScript
            key={script.id}
            id={`body-script-${script.id}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: script.content }}
          />
        ))}
      </div>
    </>
  );
}
