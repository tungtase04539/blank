'use client';

import { useState, useEffect } from 'react';
import GoogleAnalyticsEmbed from '@/components/GoogleAnalyticsEmbed';

interface TopOnlineLink {
  page: string;
  activeUsers: number;
}

interface DashboardHybridProps {
  totalLinks: number;
  totalClicks: number;
  totalTelegramClicks: number;
  totalWebClicks: number;
  topLinks: any[];
}

export default function DashboardHybrid({
  totalLinks,
  totalClicks,
  totalTelegramClicks,
  totalWebClicks,
  topLinks,
}: DashboardHybridProps) {
  const [topOnlineLinks, setTopOnlineLinks] = useState<TopOnlineLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopOnline = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setTopOnlineLinks(data.topOnlineLinks || []);
        }
      } catch (error) {
        console.error('Failed to fetch top online links:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopOnline();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTopOnline, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-100 text-sm font-medium">Total Links</div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold">{totalLinks}</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-100 text-sm font-medium">Total Button Clicks</div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold">{totalClicks.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-100 text-sm font-medium">📱 Telegram</div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold">{totalTelegramClicks.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-100 text-sm font-medium">🌐 Web</div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold">{totalWebClicks.toLocaleString()}</div>
        </div>
      </div>

      {/* Google Analytics removed from dashboard - tracking still active on links */}

      {/* Two Column Layout for Top Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Links by Button Clicks */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            🔥 Top Links (Button Clicks)
          </h2>
          {topLinks.length > 0 ? (
            <div className="space-y-4">
              {topLinks.map((link, index) => (
                <div 
                  key={link.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">/{link.slug}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {link.video_url}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{link.total_clicks}</p>
                    <p className="text-xs text-gray-600">clicks</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No links yet</p>
          )}
        </div>

        {/* Top 10 Online Links (API) */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              👥 Top 10 Online Now
            </h2>
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-gray-300 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : topOnlineLinks && topOnlineLinks.length > 0 ? (
            <div className="space-y-4">
              {topOnlineLinks.map((link, index) => {
                const slug = link.page.replace('/', '');
                
                return (
                  <div 
                    key={link.page}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">/{slug}</p>
                        <p className="text-xs text-green-600 flex items-center">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                          Live now
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{link.activeUsers}</p>
                      <p className="text-xs text-gray-600">online</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😴</div>
              <p className="text-gray-500">No one online right now</p>
              <p className="text-sm text-gray-400 mt-2">Come back later!</p>
            </div>
          )}
          
          {!loading && topOnlineLinks && topOnlineLinks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                🔄 Updates every 5 minutes • Via Google Analytics API
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

