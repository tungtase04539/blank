'use client';

import { useState, useEffect } from 'react';

interface RealTimeStats {
  activeUsers: number;
  pageViews: number;
  topPages: Array<{ page: string; views: number }>;
}

export default function GoogleAnalyticsEmbed() {
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics/realtime');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch realtime stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Real-time Analytics (Last 30 Minutes)
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">Loading Google Analytics data...</p>
      </div>
    );
  }

  // Check if API is not configured
  const isApiNotConfigured = stats && stats.activeUsers === 0 && stats.pageViews === 0;
  
  if (isApiNotConfigured) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Real-time Analytics (Last 30 Minutes)
        </h2>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">ℹ️</div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg mb-2">
                Google Analytics Data API Setup Required
              </h3>
              <p className="text-blue-800 mb-4">
                Your Google Analytics is tracking visitors successfully! To display real-time data here, you need to setup the Google Analytics Data API.
              </p>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Quick Setup (5 minutes):</p>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Enable Google Analytics Data API in Google Cloud Console</li>
                  <li>Create Service Account & download JSON key</li>
                  <li>Grant Service Account access to your GA Property</li>
                  <li>Add 3 environment variables to Vercel:
                    <ul className="ml-6 mt-1 space-y-1">
                      <li>• <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">GA_PROPERTY_ID</code></li>
                      <li>• <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">GA_CLIENT_EMAIL</code></li>
                      <li>• <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">GA_PRIVATE_KEY</code></li>
                    </ul>
                  </li>
                  <li>Redeploy your app</li>
                </ol>
              </div>

              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <span>📚</span>
                <span>Check <code className="bg-blue-100 px-2 py-1 rounded">GOOGLE_ANALYTICS_SETUP.md</code> for detailed instructions</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Show current tracking status */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-800">
            <span>✅</span>
            <span className="font-semibold">Good News:</span>
          </div>
          <p className="text-sm text-green-700 mt-2">
            Your Google Analytics tracking is working! Visit your{' '}
            <a 
              href="https://analytics.google.com/analytics/web/#/realtime" 
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-green-900"
            >
              GA Realtime Report
            </a>
            {' '}to see live visitors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          📊 Real-time Analytics (Last 30 Minutes)
        </h2>
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </div>

      {stats ? (
        <>
          {/* Active Users & Page Views */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-green-100 text-sm font-medium">👥 Active Users</div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold">{stats.activeUsers}</div>
              <p className="text-green-100 text-xs mt-2">Currently viewing your links</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-purple-100 text-sm font-medium">📄 Page Views</div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold">{stats.pageViews}</div>
              <p className="text-purple-100 text-xs mt-2">Views in last 30 minutes</p>
            </div>
          </div>

          {/* Top Active Pages */}
          {stats.topPages && stats.topPages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Most Active Links Now</h3>
              <div className="space-y-3">
                {stats.topPages.slice(0, 5).map((page, index) => (
                  <div 
                    key={page.page}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{page.page}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{page.views} views</span>
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              🔄 Auto-refreshes every 30 seconds • Powered by Google Analytics
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😴</div>
          <p className="text-gray-500">No activity in the last 30 minutes</p>
          <p className="text-sm text-gray-400 mt-2">Data will appear when visitors access your links</p>
        </div>
      )}
    </div>
  );
}

