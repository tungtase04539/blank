'use client';

import { useState } from 'react';
import { LinkStats } from '@/lib/types';
import TrafficChart from './TrafficChart';

interface DashboardProps {
  initialLinks: LinkStats[];
  chartData: { date: string; visits: number }[];
  totalViews: number;
}

export default function DashboardHybrid({ 
  initialLinks, 
  chartData, 
  totalViews
}: DashboardProps) {
  const [links] = useState<LinkStats[]>(initialLinks);

  // Sort links by total views
  const sortedLinks = [...links].sort((a, b) => b.total_views - a.total_views);
  const topLinks = sortedLinks.slice(0, 10);

  // ✅ Calculate total views from current links (updates automatically)
  const currentTotalViews = links.reduce((sum, link) => sum + (link.total_views || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 gap-6">
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
          <div className="text-4xl font-bold">{currentTotalViews.toLocaleString()}</div>
          <p className="text-blue-100 text-xs mt-2">All time across all links</p>
        </div>
      </div>

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

      {/* Traffic Chart */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Last 7 Days Traffic</h2>
        <TrafficChart data={chartData} />
      </div>
    </div>
  );
}
