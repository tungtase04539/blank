'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createLinkAction, createMultiLinksAction } from './actions';
import { generateSlug } from '@/lib/utils';

interface CreateLinkFormProps {
  userId: string;
}

export default function CreateLinkForm({ userId }: CreateLinkFormProps) {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [videoUrls, setVideoUrls] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [redirectEnabled, setRedirectEnabled] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [useCustomButtons, setUseCustomButtons] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-generate slug on mount
  useEffect(() => {
    setSlug(generateSlug());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Parse video URLs
      const urls = videoUrls.split('\n').map(url => url.trim()).filter(url => url.length > 0);
      
      if (urls.length === 0) {
        setError('Please enter at least 1 video URL');
        setLoading(false);
        return;
      }

      // If multiple URLs, create multiple links
      if (urls.length > 1) {
        const result = await createMultiLinksAction({
          userId,
          videoUrls: urls,
          destinationUrl: destinationUrl || null,
          redirectEnabled,
          telegramUrl: useCustomButtons ? (telegramUrl || null) : null,
          webUrl: useCustomButtons ? (webUrl || null) : null,
        });

        if (result.success && result.slugs) {
          // Redirect with new slugs in URL params
          router.push(`/links?new=${result.slugs.join(',')}`);
        } else {
          setError(result.error || 'Failed to create links');
        }
      } else {
        // Single link
        const result = await createLinkAction({
          userId,
          slug,
          videoUrl: urls[0],
          destinationUrl: destinationUrl || null,
          redirectEnabled,
          telegramUrl: useCustomButtons ? (telegramUrl || null) : null,
          webUrl: useCustomButtons ? (webUrl || null) : null,
        });

        if (result.success) {
          // Redirect with single new slug
          router.push(`/links?new=${slug}`);
        } else {
          setError(result.error || 'Failed to create link');
        }
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const regenerateSlug = () => {
    setSlug(generateSlug());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
          Slug (Short URL) - Auto-generated *
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">/</span>
          <input
            id="slug"
            type="text"
            value={slug}
            className="input flex-1 bg-gray-50"
            readOnly
            disabled={loading}
          />
          <button
            type="button"
            onClick={regenerateSlug}
            className="btn btn-secondary whitespace-nowrap"
            disabled={loading}
          >
            🔄 Regenerate
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Format: 5 random characters + "mp4" (Example: {slug})
        </p>
      </div>

      <div>
        <label htmlFor="videoUrls" className="block text-sm font-medium text-gray-700 mb-2">
          Video URLs *
        </label>
        <textarea
          id="videoUrls"
          value={videoUrls}
          onChange={(e) => setVideoUrls(e.target.value)}
          className="input font-mono text-sm"
          placeholder="https://example.com/video1.webm
https://example.com/video2.webm
https://example.com/video3.webm

(One URL per line - Auto create multiple links)"
          rows={6}
          required
          disabled={loading}
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter one URL per line. Multiple URLs → auto create multiple links with random slugs
        </p>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bottom Buttons (Optional)</h3>
        
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomButtons}
              onChange={(e) => setUseCustomButtons(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <span className="text-sm font-medium text-gray-700">
              Use custom buttons for this link (default uses global settings)
            </span>
          </label>
        </div>

        {useCustomButtons && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="telegramUrl" className="block text-sm font-medium text-gray-700 mb-2">
                📱 Telegram Button URL
              </label>
              <input
                id="telegramUrl"
                type="url"
                value={telegramUrl}
                onChange={(e) => setTelegramUrl(e.target.value)}
                className="input"
                placeholder="https://t.me/your_channel"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="webUrl" className="block text-sm font-medium text-gray-700 mb-2">
                🌐 Web Button URL
              </label>
              <input
                id="webUrl"
                type="url"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                className="input"
                placeholder="https://your-website.com"
                disabled={loading}
              />
            </div>
          </div>
        )}
        
        {!useCustomButtons && (
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            💡 This link will use buttons from <strong>Global Settings</strong>. 
            Go to <strong>Settings</strong> menu to configure global buttons for all links.
          </p>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Redirect Settings (Optional)</h3>
        
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={redirectEnabled}
              onChange={(e) => setRedirectEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <span className="text-sm font-medium text-gray-700">Enable auto redirect</span>
          </label>
        </div>

        {redirectEnabled && (
          <div>
            <label htmlFor="destinationUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Destination URL
            </label>
            <input
              id="destinationUrl"
              type="url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="input"
              placeholder="https://example.com/destination"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">Visitors will be redirected to this URL</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Link'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

