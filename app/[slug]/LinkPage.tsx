'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Script from 'next/script';
import { Link, Script as ScriptType, GlobalSettings } from '@/lib/types';

interface LinkPageProps {
  link: Link;
  scripts: ScriptType[];
  globalSettings: GlobalSettings | null;
  redirectUrls: string[];
  timedRedirectUrls: string[];
  userId: string;
}

// 🍀 LUCKY REDIRECT: Pure random (each visit = new chance)
function shouldRedirectRandom(percentage: number): boolean {
  return Math.random() * 100 < percentage;
}

// 🍀 LUCKY REDIRECT: Daily consistent (same user + same day = same result)
function shouldRedirectDaily(userId: string, percentage: number): boolean {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = `${userId}-${today}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Get 0-99 from hash, return true if < percentage
  return Math.abs(hash % 100) < percentage;
}

export default function LinkPage({ link, scripts, globalSettings, redirectUrls, timedRedirectUrls, userId }: LinkPageProps) {
  const [loadingRandom, setLoadingRandom] = useState(false);
  
  // ✅ OPTIMIZED: Cache link slugs in memory to avoid repeated API calls
  const [cachedSlugs, setCachedSlugs] = useState<string[] | null>(null);

  // ⏱️ TIMED REDIRECT: Countdown state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [luckyRedirected, setLuckyRedirected] = useState(false);

  // ✅ OPTIMIZED: Get random URL from props (no API call needed!)
  const getRandomRedirectUrl = useCallback(() => {
    if (!redirectUrls || redirectUrls.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * redirectUrls.length);
    return redirectUrls[randomIndex];
  }, [redirectUrls]);

  // 🍀 LUCKY REDIRECT: Client-side random (0 API calls, FREE!)
  useEffect(() => {
    // Debug log
    console.log('🔍 Redirect check:', {
      'link.redirect_enabled': link.redirect_enabled,
      'globalSettings?.lucky_enabled': globalSettings?.lucky_enabled,
      'globalSettings?.lucky_percentage': globalSettings?.lucky_percentage,
      'redirectUrls.length': redirectUrls?.length,
      'globalSettings?.timed_redirect_enabled': globalSettings?.timed_redirect_enabled,
      'timedRedirectUrls.length': timedRedirectUrls?.length
    });

    // 🍀 LUCKY REDIRECT (GLOBAL): Áp dụng cho tất cả links khi lucky_enabled = true
    if (globalSettings?.lucky_enabled && globalSettings.lucky_percentage && globalSettings.lucky_percentage > 0) {
      // Không có redirect URLs thì không làm gì
      if (!redirectUrls || redirectUrls.length === 0) {
        console.log('🔍 No redirect URLs configured for Lucky Redirect');
        return;
      }

      let shouldRedirect = false;

      // Determine redirect chance based on type
      if (globalSettings.lucky_type === 'daily') {
        shouldRedirect = shouldRedirectDaily(userId, globalSettings.lucky_percentage);
        console.log(`🍀 Lucky check (daily): ${shouldRedirect ? 'YES' : 'NO'} (${globalSettings.lucky_percentage}% chance)`);
      } else {
        // Default: random
        shouldRedirect = shouldRedirectRandom(globalSettings.lucky_percentage);
        console.log(`🍀 Lucky check (random): ${shouldRedirect ? 'YES' : 'NO'} (${globalSettings.lucky_percentage}% chance)`);
      }

      if (shouldRedirect) {
        setLuckyRedirected(true);
        const randomIndex = Math.floor(Math.random() * redirectUrls.length);
        const selectedUrl = redirectUrls[randomIndex];
        
        console.log(`🍀 Lucky redirect to: ${selectedUrl} (${randomIndex + 1}/${redirectUrls.length})`);
        
        setTimeout(() => {
          window.location.href = selectedUrl;
        }, 100);
        return;
      }
      // Lucky enabled nhưng không trúng -> tiếp tục xuống kiểm tra timed redirect
    }

    // ✅ PER-LINK REDIRECT: Chỉ redirect nếu link.redirect_enabled = true (không có lucky)
    if (!globalSettings?.lucky_enabled && link.redirect_enabled && redirectUrls && redirectUrls.length > 0) {
      console.log('🔄 Per-link redirect enabled');
      const randomUrl = getRandomRedirectUrl();
      if (randomUrl) {
        setLuckyRedirected(true);
        setTimeout(() => {
          window.location.href = randomUrl;
        }, 100);
        return;
      }
    }
  }, [link.id, link.redirect_enabled, userId, globalSettings, redirectUrls, timedRedirectUrls, getRandomRedirectUrl]);

  // ⏱️ TIMED REDIRECT: Start countdown after Lucky Redirect check completes
  useEffect(() => {
    // Nếu đã bị Lucky redirect thì không cần timed redirect
    if (luckyRedirected) {
      console.log('⏱️ Timed redirect skipped - Lucky redirect already triggered');
      return;
    }

    // Kiểm tra timed redirect enabled và có URLs
    if (!globalSettings?.timed_redirect_enabled) {
      console.log('⏱️ Timed redirect disabled');
      return;
    }

    if (!timedRedirectUrls || timedRedirectUrls.length === 0) {
      console.log('⏱️ No timed redirect URLs configured');
      return;
    }

    const delay = globalSettings?.timed_redirect_delay || 5;
    console.log(`⏱️ Starting timed redirect countdown: ${delay}s`);
    setCountdown(delay);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Redirect to random URL from timed list
          const randomIndex = Math.floor(Math.random() * timedRedirectUrls.length);
          const selectedUrl = timedRedirectUrls[randomIndex];
          console.log(`⏱️ Timed redirect to: ${selectedUrl} (${randomIndex + 1}/${timedRedirectUrls.length})`);
          window.location.href = selectedUrl;
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [luckyRedirected, globalSettings?.timed_redirect_enabled, globalSettings?.timed_redirect_delay, timedRedirectUrls]);

  // Helper function to parse script content and extract src or inline code
  const parseScriptContent = useCallback((content: string) => {
    // Remove HTML comments
    const cleaned = content.replace(/<!--[\s\S]*?-->/g, '').trim();
    
    // Check if content contains a <script> tag
    const scriptTagMatch = cleaned.match(/<script([^>]*)>([\s\S]*?)<\/script>/i);
    
    if (scriptTagMatch) {
      const attributes = scriptTagMatch[1];
      const innerContent = scriptTagMatch[2];
      
      // Extract src attribute if exists
      const srcMatch = attributes.match(/src=['"]([^'"]+)['"]/i);
      
      return {
        src: srcMatch ? srcMatch[1] : null,
        content: srcMatch ? null : innerContent.trim(),
        async: attributes.includes('async'),
        defer: attributes.includes('defer'),
        type: attributes.match(/type=['"]([^'"]+)['"]/i)?.[1] || 'text/javascript'
      };
    }
    
    // If no script tag, treat as inline content
    return {
      src: null,
      content: cleaned,
      async: false,
      defer: false,
      type: 'text/javascript'
    };
  }, []);

  const headScripts = useMemo(() => scripts.filter(s => s.location === 'head'), [scripts]);
  const bodyScripts = useMemo(() => scripts.filter(s => s.location === 'body'), [scripts]);
  
  // Use link-specific buttons if set, otherwise fallback to global settings
  const telegramUrl = link.telegram_url || globalSettings?.telegram_url;
  const webUrl = link.web_url || globalSettings?.web_url;

  // ✅ Button click handlers to open link (hide from bots, no tracking)
  const handleTelegramClick = useCallback(() => {
    // Open link in new tab (hidden from bot crawlers)
    if (telegramUrl) {
      window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    }
  }, [telegramUrl]);

  const handleWebClick = useCallback(() => {
    // Open link in new tab (hidden from bot crawlers)
    if (webUrl) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, [webUrl]);

  // 🎲 Random link handler - OPTIMIZED with caching
  const handleRandomLink = useCallback(async () => {
    if (loadingRandom) return;
    
    setLoadingRandom(true);
    try {
      // ✅ OPTIMIZED: Use cached slugs if available
      if (cachedSlugs && cachedSlugs.length > 0) {
        const filteredSlugs = cachedSlugs.filter(s => s !== link.slug);
        if (filteredSlugs.length > 0) {
          const randomSlug = filteredSlugs[Math.floor(Math.random() * filteredSlugs.length)];
          window.location.href = `/${randomSlug}`;
          return;
        }
      }
      
      // First time: fetch from Edge API (FREE invocation)
      const response = await fetch(`/api/random-link?current=${link.slug}`);
      if (response.ok) {
        const data = await response.json();
        if (data.slug) {
          // Cache the result for future use
          if (data.allSlugs) {
            setCachedSlugs(data.allSlugs);
          }
          window.location.href = `/${data.slug}`;
        }
      } else {
        console.log('No other links available');
      }
    } catch (error) {
      console.error('Random link error:', error);
    } finally {
      setLoadingRandom(false);
    }
  }, [loadingRandom, cachedSlugs, link.slug]);

  // 🎬 Video ended handler - OPTIMIZED: Use props instead of API call!
  const handleVideoEnded = useCallback(() => {
    console.log('Video ended, redirecting...');
    
    // ✅ OPTIMIZED: Use redirectUrls from props (no API call!)
    if (redirectUrls && redirectUrls.length > 0) {
      const randomIndex = Math.floor(Math.random() * redirectUrls.length);
      const selectedUrl = redirectUrls[randomIndex];
      console.log('Redirecting to:', selectedUrl);
      
      // ✅ INSTANT redirect - no API latency!
      window.location.href = selectedUrl;
    } else {
      console.log('No redirect URL configured');
    }
  }, [redirectUrls]);

  return (
    <>
      {/* Inject head scripts using Next.js Script component */}
      {headScripts.map((script) => {
        const parsed = parseScriptContent(script.content);
        
        if (parsed.src) {
          // External script with src
          return (
            <Script
              key={script.id}
              id={`head-script-${script.id}`}
              src={parsed.src}
              strategy="afterInteractive"
              async={parsed.async}
            />
          );
        } else {
          // Inline script
          return (
            <Script
              key={script.id}
              id={`head-script-${script.id}`}
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{ __html: parsed.content || '' }}
            />
          );
        }
      })}
      
      <div className="min-h-screen bg-black flex flex-col relative">

        {/* 🎲 Random Video Button - Fixed Top Right */}
        <button
          onClick={handleRandomLink}
          disabled={loadingRandom}
          className={`fixed top-16 right-6 z-50 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full transition-all transform hover:scale-110 shadow-2xl ${
            loadingRandom ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'
          }`}
          title="Watch random video"
        >
          <svg 
            className={`w-5 h-5 ${loadingRandom ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          <span className="text-sm">Random Video</span>
        </button>

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
            onEnded={handleVideoEnded}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        
        {/* Fixed Bottom Buttons */}
        {(telegramUrl || webUrl) && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className={`max-w-4xl mx-auto grid gap-4 ${telegramUrl && webUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {telegramUrl && (
                <button
                  onClick={handleTelegramClick}
                  className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg cursor-pointer"
                  title="Open Telegram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  <span>Telegram</span>
                </button>
              )}
              
              {webUrl && (
                <button
                  onClick={handleWebClick}
                  className="flex items-center justify-center space-x-2 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg cursor-pointer"
                  style={{ backgroundColor: '#1877F2' }}
                  title="Join Facebook Group"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Group Facebook</span>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Body Scripts */}
        {bodyScripts.map((script) => {
          const parsed = parseScriptContent(script.content);
          
          if (parsed.src) {
            // External script with src
            return (
              <Script
                key={script.id}
                id={`body-script-${script.id}`}
                src={parsed.src}
                strategy="afterInteractive"
                async={parsed.async}
              />
            );
          } else {
            // Inline script
            return (
              <Script
                key={script.id}
                id={`body-script-${script.id}`}
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: parsed.content || '' }}
              />
            );
          }
        })}
      </div>
    </>
  );
}
