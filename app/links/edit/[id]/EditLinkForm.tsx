'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/lib/types';
import { updateLinkAction } from './actions';

interface EditLinkFormProps {
  link: Link;
}

export default function EditLinkForm({ link }: EditLinkFormProps) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState(link.video_url);
  const [destinationUrl, setDestinationUrl] = useState(link.destination_url || '');
  const [redirectEnabled, setRedirectEnabled] = useState(link.redirect_enabled);
  const [telegramUrl, setTelegramUrl] = useState(link.telegram_url || '');
  const [webUrl, setWebUrl] = useState(link.web_url || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await updateLinkAction({
        linkId: link.id,
        videoUrl,
        destinationUrl: destinationUrl || null,
        redirectEnabled,
        telegramUrl: telegramUrl || null,
        webUrl: webUrl || null,
      });

      if (result.success) {
        router.push('/links');
      } else {
        setError(result.error || 'Không thể cập nhật link');
      }
    } catch (err) {
      setError('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slug (URL ngắn)
        </label>
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">/</span>
          <input
            type="text"
            value={link.slug}
            className="input bg-gray-100"
            disabled
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">Slug không thể thay đổi</p>
      </div>

      <div>
        <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Video URL *
        </label>
        <input
          id="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="input"
          placeholder="https://example.com/video.webm"
          required
          disabled={loading}
        />
        <p className="text-sm text-gray-500 mt-1">URL của video (định dạng WebM)</p>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buttons Ở Bottom (Tùy chọn)</h3>
        
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
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài Đặt Redirect (Tùy chọn)</h3>
        
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={redirectEnabled}
              onChange={(e) => setRedirectEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <span className="text-sm font-medium text-gray-700">Bật redirect tự động</span>
          </label>
        </div>

        {redirectEnabled && (
          <div>
            <label htmlFor="destinationUrl" className="block text-sm font-medium text-gray-700 mb-2">
              URL đích
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
            <p className="text-sm text-gray-500 mt-1">Người xem sẽ được chuyển hướng đến URL này</p>
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
          {loading ? 'Đang cập nhật...' : 'Cập Nhật Link'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary"
          disabled={loading}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

