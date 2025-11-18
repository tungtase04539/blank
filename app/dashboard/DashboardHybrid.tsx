'use client';

import { useState, useEffect } from 'react';
import { LinkStats } from '@/lib/types';
import TrafficChart from './TrafficChart';

interface DashboardProps {
  initialLinks: LinkStats[];
  chartData: { date: string; visits: number }[];
  totalViews: number;
  totalOnline: number;
}

export default function DashboardHybrid({ 
  initialLinks, 
  chartData, 
  totalViews, 
  totalOnline 
}: DashboardProps) {
  const [links, setLinks] = useState<LinkStats[]>(initialLinks);

  // Auto-refresh online count every 30 seconds
  useEffect(() => {
    const refreshStats = async () => {
      try {
        const response = await fetch('/api/dashboard-stats');
        if (response.ok) {
          const data = await response.json();
          setLinks(data.links);
        }
      } catch (error) {
        console.error('Failed to refresh stats:', error);
      }
    };

    const interval = setInterval(refreshStats, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Sort links by total views
  const sortedLinks = [...links].sort((a, b) => b.total_views - a.total_views);
  const topLinks = sortedLinks.slice(0, 10);

  // Sort links by online count
  const onlineLinks = [...links]
    .filter(l => l.online_count > 0)
    .sort((a, b) => b.online_count - a.online_count)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-100 text-sm font-medium">📊 Total Views</div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold">{totalViews.toLocaleString()}</div>
          <p className="text-blue-100 text-xs mt-2">All time across all links</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-100 text-sm font-medium flex items-center space-x-2">
              <span>👥 Active Users</span>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold">{totalOnline.toLocaleString()}</div>
          <p className="text-green-100 text-xs mt-2">Currently viewing your links</p>
        </div>
      </div>

      {/* Google Analytics removed from dashboard - tracking still active on links */}

      {/* Two Column Layout for Top Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Links by Views */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🔥 Top Links by Views</h2>
          <div className="space-y-3">
            {topLinks.length > 0 ? (
              topLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <a 
                        href={`/${link.slug}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {link.slug}
                      </a>
                      {link.online_count > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-green-600 mt-1">
                          <span className="flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                          </span>
                          <span>{link.online_count} online</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {link.total_views.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">views</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-500">No views yet</p>
                <p className="text-sm text-gray-400 mt-2">Create and share your first link!</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Links by Online Users */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🌟 Currently Active Links</h2>
          <div className="space-y-3">
            {onlineLinks.length > 0 ? (
              onlineLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <a 
                        href={`/${link.slug}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-green-600"
                      >
                        {link.slug}
                      </a>
                      <div className="text-xs text-gray-500 mt-1">
                        {link.total_views.toLocaleString()} total views
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <div className="text-lg font-bold text-green-600">
                        {link.online_count}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">online now</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😴</div>
                <p className="text-gray-500">No active users right now</p>
                <p className="text-sm text-gray-400 mt-2">Stats will appear when visitors access your links</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Last 7 Days Traffic</h2>
        <TrafficChart data={chartData} />
      </div>
    </div>
  );
}
