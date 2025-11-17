'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalSettings } from '@/lib/types';
import { saveGlobalSettingsAction } from './actions';

interface SettingsFormProps {
  userId: string;
  initialSettings: GlobalSettings | null;
}

export default function SettingsForm({ userId, initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [telegramUrl, setTelegramUrl] = useState(initialSettings?.telegram_url || '');
  const [webUrl, setWebUrl] = useState(initialSettings?.web_url || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await saveGlobalSettingsAction({
        userId,
        telegramUrl: telegramUrl || null,
        webUrl: webUrl || null,
      });

      if (result.success) {
        setSuccess('✓ Settings đã được lưu thành công!');
        router.refresh();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Không thể lưu settings');
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
        <p className="text-sm text-gray-500 mt-1">
          Your Telegram channel/group URL
        </p>
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
        <p className="text-sm text-gray-500 mt-1">
          URL website chính của bạn
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Saving...' : '💾 Save Settings'}
      </button>
    </form>
  );
}

