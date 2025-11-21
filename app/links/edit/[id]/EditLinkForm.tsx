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
  const [luckyEnabled, setLuckyEnabled] = useState(link.lucky_enabled || false);
  const [luckyPercentage, setLuckyPercentage] = useState(link.lucky_percentage || 10);
  const [luckyType, setLuckyType] = useState<'random' | 'daily'>(link.lucky_type || 'random');
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
        luckyEnabled,
        luckyPercentage,
        luckyType,
      });

      if (result.success) {
        router.push('/links');
      } else {
        setError(result.error || 'Cannot update link');
      }
    } catch (err) {
      setError('An error occurred');
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

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          🍀 Lucky Redirect (Tùy chọn)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Tự động redirect một phần % người dùng đến offer ngay khi click vào link
        </p>
        
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={luckyEnabled}
              onChange={(e) => setLuckyEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <span className="text-sm font-medium text-gray-700">Bật Lucky Redirect</span>
          </label>
        </div>

        {luckyEnabled && (
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
            {/* Percentage Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tỷ lệ redirect: <span className="text-blue-600 font-bold">{luckyPercentage}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={luckyPercentage}
                onChange={(e) => setLuckyPercentage(parseInt(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                disabled={loading}
              />
              
              {/* Quick Presets */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setLuckyPercentage(5)}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  5%
                </button>
                <button
                  type="button"
                  onClick={() => setLuckyPercentage(10)}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  10%
                </button>
                <button
                  type="button"
                  onClick={() => setLuckyPercentage(20)}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  20%
                </button>
                <button
                  type="button"
                  onClick={() => setLuckyPercentage(50)}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setLuckyPercentage(100)}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  100%
                </button>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-xs text-gray-600 mb-2">Preview:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-3 transition-all duration-300"
                    style={{ width: `${luckyPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-20 text-right">
                  {luckyPercentage}% redirect
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <span className="text-green-600 font-semibold">{luckyPercentage} user</span> redirect → 
                <span className="text-blue-600 font-semibold"> {100 - luckyPercentage} user</span> xem video
                <span className="text-gray-400"> (trên 100 người)</span>
              </p>
            </div>

            {/* Redirect Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại redirect:
              </label>
              <div className="space-y-2">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="luckyType"
                    value="random"
                    checked={luckyType === 'random'}
                    onChange={(e) => setLuckyType(e.target.value as 'random' | 'daily')}
                    className="mt-1 w-4 h-4 text-blue-600"
                    disabled={loading}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">🎲 Random</span>
                    <p className="text-xs text-gray-500">Mỗi lần click = cơ hội mới (user có thể refresh để thử lại)</p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="luckyType"
                    value="daily"
                    checked={luckyType === 'daily'}
                    onChange={(e) => setLuckyType(e.target.value as 'random' | 'daily')}
                    className="mt-1 w-4 h-4 text-blue-600"
                    disabled={loading}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">📅 Daily</span>
                    <p className="text-xs text-gray-500">Cố định cả ngày (user không thể spam refresh, ngày mai mới thử lại)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <p className="text-xs text-yellow-800">
                <strong>💡 Lưu ý:</strong> Lucky Redirect cần cấu hình redirect URLs trong{' '}
                <span className="font-mono bg-yellow-100 px-1 rounded">Redirect URLs</span> section của dashboard.
                Nếu không có URL, user sẽ xem video bình thường.
              </p>
            </div>
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
          {loading ? 'Updating...' : 'Update Link'}
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

