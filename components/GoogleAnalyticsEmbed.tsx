'use client';

import { useState } from 'react';

interface GoogleAnalyticsEmbedProps {
  viewId?: string;
}

export default function GoogleAnalyticsEmbed({ viewId }: GoogleAnalyticsEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);

  // If no viewId provided, show instructions
  if (!viewId) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Real-time Analytics (Google Analytics)
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                Setup Google Analytics Embed
              </h3>
              <p className="text-sm text-yellow-800 mb-3">
                To display real-time analytics without using API quota:
              </p>
              <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                <li>Go to Google Analytics → Admin → Property Settings</li>
                <li>Copy your Property ID</li>
                <li>Add to Vercel Environment Variables: <code className="bg-yellow-100 px-2 py-1 rounded">NEXT_PUBLIC_GA_VIEW_ID</code></li>
                <li>Redeploy your app</li>
              </ol>
              <p className="text-xs text-yellow-700 mt-3">
                ⚠️ Note: Users must be logged into Google account with GA access to view the embed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card relative">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        📊 Real-time Analytics (Last 30 Minutes)
      </h2>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-600">Loading Google Analytics...</p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
        <iframe
          src={`https://analytics.google.com/analytics/web/#/realtime/rt-overview/a${viewId}/`}
          width="100%"
          height="600"
          frameBorder="0"
          className="w-full"
          onLoad={() => setIsLoading(false)}
          title="Google Analytics Real-time Report"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span>Live data from Google Analytics</span>
        </div>
        <div>
          🔄 Updates in real-time
        </div>
      </div>
    </div>
  );
}

