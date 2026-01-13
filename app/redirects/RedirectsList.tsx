'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createRedirectUrlAction, 
  deleteRedirectUrlAction, 
  toggleRedirectUrlAction, 
  updateGlobalLuckySettingsAction,
  createTimedRedirectUrlAction,
  deleteTimedRedirectUrlAction,
  toggleTimedRedirectUrlAction,
  updateTimedRedirectSettingsAction
} from './actions';

interface RedirectUrl {
  id: string;
  url: string;
  enabled: boolean;
  created_at: string;
}

interface GlobalSettings {
  id: string;
  user_id: string;
  telegram_url: string | null;
  web_url: string | null;
  lucky_enabled?: boolean;
  lucky_percentage?: number;
  lucky_type?: 'random' | 'daily';
  timed_redirect_enabled?: boolean;
  timed_redirect_delay?: number;
  created_at: string;
  updated_at: string;
}

interface RedirectsListProps {
  urls: RedirectUrl[];
  timedUrls: RedirectUrl[];
  userId: string;
  globalSettings: GlobalSettings | null;
}

export default function RedirectsList({ urls, timedUrls, userId, globalSettings }: RedirectsListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Lucky settings state
  const [luckyEnabled, setLuckyEnabled] = useState(globalSettings?.lucky_enabled || false);
  const [luckyPercentage, setLuckyPercentage] = useState(globalSettings?.lucky_percentage || 10);
  const [luckyType, setLuckyType] = useState<'random' | 'daily'>(globalSettings?.lucky_type || 'random');
  const [luckyLoading, setLuckyLoading] = useState(false);

  // ⏱️ Timed redirect settings state
  const [timedEnabled, setTimedEnabled] = useState(globalSettings?.timed_redirect_enabled || false);
  const [timedDelay, setTimedDelay] = useState(globalSettings?.timed_redirect_delay || 5);
  const [timedLoading, setTimedLoading] = useState(false);
  const [showTimedForm, setShowTimedForm] = useState(false);
  const [newTimedUrl, setNewTimedUrl] = useState('');
  const [timedUrlLoading, setTimedUrlLoading] = useState(false);
  const [timedDeleting, setTimedDeleting] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await createRedirectUrlAction(userId, newUrl);
      
      if (result.success) {
        setShowForm(false);
        setNewUrl('');
        router.refresh();
      } else {
        setError(result.error || 'Cannot add URL');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    await toggleRedirectUrlAction(id, !currentState);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return;
    
    setDeleting(id);
    await deleteRedirectUrlAction(id);
    router.refresh();
  };

  const handleSaveLuckySettings = async () => {
    setLuckyLoading(true);
    setError('');
    
    try {
      const result = await updateGlobalLuckySettingsAction(userId, {
        luckyEnabled,
        luckyPercentage,
        luckyType
      });
      
      if (result.success) {
        router.refresh();
        alert('✅ Lucky settings saved successfully!');
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLuckyLoading(false);
    }
  };

  // ⏱️ Timed redirect handlers
  const handleCreateTimedUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTimedUrlLoading(true);

    try {
      const result = await createTimedRedirectUrlAction(userId, newTimedUrl);
      
      if (result.success) {
        setShowTimedForm(false);
        setNewTimedUrl('');
        router.refresh();
      } else {
        setError(result.error || 'Cannot add URL');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setTimedUrlLoading(false);
    }
  };

  const handleTimedToggle = async (id: string, currentState: boolean) => {
    await toggleTimedRedirectUrlAction(id, !currentState);
    router.refresh();
  };

  const handleTimedDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return;
    
    setTimedDeleting(id);
    await deleteTimedRedirectUrlAction(id);
    router.refresh();
  };

  const handleSaveTimedSettings = async () => {
    setTimedLoading(true);
    setError('');
    
    try {
      const result = await updateTimedRedirectSettingsAction(userId, {
        timedRedirectEnabled: timedEnabled,
        timedRedirectDelay: timedDelay
      });
      
      if (result.success) {
        router.refresh();
        alert('✅ Timed redirect settings saved successfully!');
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setTimedLoading(false);
    }
  };

  const enabledUrls = urls.filter(u => u.enabled);
  const enabledTimedUrls = timedUrls.filter(u => u.enabled);

  return (
    <div className="space-y-6">
      {/* 🍀 LUCKY REDIRECT SETTINGS - Global for ALL links */}
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              🍀 Lucky Redirect <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">GLOBAL</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Automatically redirect a percentage of users to offer on click - Applies to <strong>ALL links</strong>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Toggle Enable */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Lucky Redirect</label>
              <p className="text-xs text-gray-500 mt-1">Apply to all links in your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={luckyEnabled}
                onChange={(e) => setLuckyEnabled(e.target.checked)}
                className="sr-only peer"
                disabled={luckyLoading}
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {luckyEnabled && (
            <div className="space-y-4 p-4 bg-white rounded-lg">
              {/* Percentage Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redirect rate: <span className="text-green-600 font-bold text-lg">{luckyPercentage}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={luckyPercentage}
                  onChange={(e) => setLuckyPercentage(parseInt(e.target.value))}
                  className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  disabled={luckyLoading}
                />
                
                {/* Quick Presets */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setLuckyPercentage(5)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition font-medium"
                    disabled={luckyLoading}
                  >
                    5%
                  </button>
                  <button
                    type="button"
                    onClick={() => setLuckyPercentage(10)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition font-medium"
                    disabled={luckyLoading}
                  >
                    10%
                  </button>
                  <button
                    type="button"
                    onClick={() => setLuckyPercentage(20)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition font-medium"
                    disabled={luckyLoading}
                  >
                    20%
                  </button>
                  <button
                    type="button"
                    onClick={() => setLuckyPercentage(50)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition font-medium"
                    disabled={luckyLoading}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setLuckyPercentage(100)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition font-medium"
                    disabled={luckyLoading}
                  >
                    100%
                  </button>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-gray-600 mb-2 font-medium">Preview:</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-4 transition-all duration-300"
                      style={{ width: `${luckyPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-24 text-right">
                    {luckyPercentage}% redirect
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  <span className="text-green-600 font-bold">{luckyPercentage} users</span> redirect ngay → 
                  <span className="text-blue-600 font-bold"> {100 - luckyPercentage} users</span> xem video
                  <span className="text-gray-400"> (out of 100 people)</span>
                </p>
              </div>

              {/* Redirect Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Redirect type:
                </label>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition" style={{ borderColor: luckyType === 'random' ? '#10b981' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="luckyType"
                      value="random"
                      checked={luckyType === 'random'}
                      onChange={(e) => setLuckyType(e.target.value as 'random' | 'daily')}
                      className="mt-1 w-5 h-5 text-green-600"
                      disabled={luckyLoading}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-800">🎲 Random Mode</span>
                      <p className="text-xs text-gray-500 mt-1">Each click = new chance (user can refresh to try again)</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition" style={{ borderColor: luckyType === 'daily' ? '#10b981' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="luckyType"
                      value="daily"
                      checked={luckyType === 'daily'}
                      onChange={(e) => setLuckyType(e.target.value as 'random' | 'daily')}
                      className="mt-1 w-5 h-5 text-green-600"
                      disabled={luckyLoading}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-800">📅 Daily Mode</span>
                      <p className="text-xs text-gray-500 mt-1">Fixed all day (user can't spam, resets tomorrow) - <strong>Recommended ✓</strong></p>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* Save Button - ALWAYS VISIBLE */}
          <button
            onClick={handleSaveLuckySettings}
            disabled={luckyLoading}
            className="w-full btn bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 font-semibold py-3 shadow-lg"
          >
            {luckyLoading ? '⏳ Saving...' : '💾 Save Lucky Settings'}
          </button>

          {/* Info */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>💡 Note:</strong> Lucky Redirect requires redirect URLs below. 
              If no URLs are enabled, users will watch videos normally.
            </p>
          </div>
        </div>
      </div>

      {/* ⏱️ TIMED REDIRECT SETTINGS - 5s delay before redirect */}
      <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              ⏱️ Timed Redirect <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">5s DELAY</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Redirect users after watching for X seconds - Separate URL list from Lucky Redirect
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Toggle Enable */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Timed Redirect</label>
              <p className="text-xs text-gray-500 mt-1">Redirect after delay (only if Lucky Redirect didn't trigger)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={timedEnabled}
                onChange={(e) => setTimedEnabled(e.target.checked)}
                className="sr-only peer"
                disabled={timedLoading}
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {timedEnabled && (
            <div className="space-y-4 p-4 bg-white rounded-lg">
              {/* Delay Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay before redirect: <span className="text-blue-600 font-bold text-lg">{timedDelay}s</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={timedDelay}
                  onChange={(e) => setTimedDelay(parseInt(e.target.value))}
                  className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  disabled={timedLoading}
                />
                
                {/* Quick Presets */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setTimedDelay(3)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition font-medium"
                    disabled={timedLoading}
                  >
                    3s
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimedDelay(5)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition font-medium"
                    disabled={timedLoading}
                  >
                    5s
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimedDelay(10)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition font-medium"
                    disabled={timedLoading}
                  >
                    10s
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimedDelay(15)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition font-medium"
                    disabled={timedLoading}
                  >
                    15s
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimedDelay(30)}
                    className="px-3 py-1.5 text-xs bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition font-medium"
                    disabled={timedLoading}
                  >
                    30s
                  </button>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-2 font-medium">Preview:</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-cyan-500 h-4 transition-all duration-300"
                      style={{ width: `${(timedDelay / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-24 text-right">
                    {timedDelay}s delay
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  User watches video for <span className="text-blue-600 font-bold">{timedDelay} seconds</span> → 
                  <span className="text-orange-600 font-bold"> then redirects</span> to random URL from timed list
                </p>
              </div>

            </div>
          )}

          {/* Save Button - ALWAYS VISIBLE */}
          <button
            onClick={handleSaveTimedSettings}
            disabled={timedLoading}
            className="w-full btn bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 font-semibold py-3 shadow-lg"
          >
            {timedLoading ? '⏳ Saving...' : '💾 Save Timed Redirect Settings'}
          </button>

          {/* Info */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>💡 Note:</strong> Timed Redirect only triggers if Lucky Redirect didn't redirect the user.
              Uses a separate URL list below.
            </p>
          </div>
        </div>
      </div>

      {/* ⏱️ Timed Redirect URLs Section */}
      {timedEnabled && (
        <>
          {/* Add Timed URL Form */}
          {!showTimedForm ? (
            <div className="card border-2 border-blue-200">
              <button
                onClick={() => setShowTimedForm(true)}
                className="btn bg-blue-500 hover:bg-blue-600 text-white w-full flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Timed Redirect URL</span>
              </button>
            </div>
          ) : (
            <div className="card border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Add New Timed Redirect URL</h3>
              <form onSubmit={handleCreateTimedUrl} className="space-y-4">
                <div>
                  <label htmlFor="timedUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Destination URL *
                  </label>
                  <input
                    id="timedUrl"
                    type="url"
                    value={newTimedUrl}
                    onChange={(e) => setNewTimedUrl(e.target.value)}
                    className="input"
                    placeholder="https://example.com/destination"
                    required
                    disabled={timedUrlLoading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="btn bg-blue-500 hover:bg-blue-600 text-white flex-1"
                    disabled={timedUrlLoading}
                  >
                    {timedUrlLoading ? 'Adding...' : '+ Add URL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTimedForm(false);
                      setError('');
                    }}
                    className="btn btn-secondary"
                    disabled={timedUrlLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timed URLs Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
              <div className="text-blue-100 text-sm font-medium mb-1">Total Timed URLs</div>
              <div className="text-3xl font-bold">{timedUrls.length}</div>
            </div>
            <div className="card bg-gradient-to-br from-cyan-500 to-teal-600 text-white">
              <div className="text-cyan-100 text-sm font-medium mb-1">Active Timed URLs</div>
              <div className="text-3xl font-bold">{enabledTimedUrls.length}</div>
            </div>
          </div>

          {/* Timed URLs List */}
          <div className="card border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Timed Redirect URLs List</h3>
            
            {timedUrls.length > 0 ? (
              <div className="space-y-3">
                {timedUrls.map((url, index) => (
                  <div
                    key={url.id}
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-200 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{url.url}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(url.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        url.enabled
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {url.enabled ? '✓ Active' : 'Disabled'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleTimedToggle(url.id, url.enabled)}
                        className={`btn text-sm ${
                          url.enabled
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'btn-secondary'
                        }`}
                      >
                        {url.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => handleTimedDelete(url.id)}
                        disabled={timedDeleting === url.id}
                        className="btn btn-danger text-sm"
                      >
                        {timedDeleting === url.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">⏱️</div>
                <p className="text-gray-600">No timed redirect URLs yet</p>
                <p className="text-sm text-gray-500 mt-2">Add URLs to use timed redirect feature</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add URL Form */}
      {!showForm ? (
        <div className="card">
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary w-full flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Redirect URL</span>
          </button>
        </div>
      ) : (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New URL</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Destination URL *
              </label>
              <input
                id="url"
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="input"
                placeholder="https://example.com/destination"
                required
                disabled={loading}
              />
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
                {loading ? 'Adding...' : '+ Add URL'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError('');
                }}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div className="text-blue-100 text-sm font-medium mb-1">Total URLs</div>
          <div className="text-3xl font-bold">{urls.length}</div>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="text-green-100 text-sm font-medium mb-1">Active URLs</div>
          <div className="text-3xl font-bold">{enabledUrls.length}</div>
        </div>
      </div>

      {/* URLs List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Redirect URLs List</h3>
        
        {urls.length > 0 ? (
          <div className="space-y-3">
            {urls.map((url, index) => (
              <div
                key={url.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{url.url}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(url.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    url.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {url.enabled ? '✓ Active' : 'Disabled'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggle(url.id, url.enabled)}
                    className={`btn text-sm ${
                      url.enabled
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'btn-secondary'
                    }`}
                  >
                    {url.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => handleDelete(url.id)}
                    disabled={deleting === url.id}
                    className="btn btn-danger text-sm"
                  >
                    {deleting === url.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔗</div>
            <p className="text-gray-600">No redirect URLs yet</p>
            <p className="text-sm text-gray-500 mt-2">Add URLs to start using smart redirect</p>
          </div>
        )}
      </div>
    </div>
  );
}

