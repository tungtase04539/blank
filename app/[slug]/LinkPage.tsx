'use client';

import { useEffect } from 'react';
import { Link, Script, GlobalSettings } from '@/lib/types';
import { trackVisitAction } from './actions';

interface LinkPageProps {
  link: Link;
  scripts: Script[];
  globalSettings: GlobalSettings | null;
  userId: string;
}

export default function LinkPage({ link, scripts, globalSettings, userId }: LinkPageProps) {
  useEffect(() => {
    // Track visit
    trackVisitAction(link.id);
    
    // Handle smart redirect if enabled
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
  }, [link, userId]);

  const headScripts = scripts.filter(s => s.location === 'head');
  const bodyScripts = scripts.filter(s => s.location === 'body');
  
  // Use link-specific buttons if set, otherwise fallback to global settings
  const telegramUrl = link.telegram_url || globalSettings?.telegram_url;
  const webUrl = link.web_url || globalSettings?.web_url;

  return (
    <>
      <head>
        {headScripts.map((script) => (
          <script
            key={script.id}
            dangerouslySetInnerHTML={{ __html: script.content }}
          />
        ))}
      </head>
      
      <div className="min-h-screen bg-black flex flex-col">
        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center p-4">
          <video 
            controls 
            className="w-full max-w-4xl"
            autoPlay
            playsInline
          >
            <source src={link.video_url} type="video/webm" />
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
          <script
            key={script.id}
            dangerouslySetInnerHTML={{ __html: script.content }}
          />
        ))}
      </div>
    </>
  );
}

