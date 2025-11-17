'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRedirectUrlAction, deleteRedirectUrlAction, toggleRedirectUrlAction } from './actions';

interface RedirectUrl {
  id: string;
  url: string;
  enabled: boolean;
  created_at: string;
}

interface RedirectsListProps {
  urls: RedirectUrl[];
  userId: string;
}

export default function RedirectsList({ urls, userId }: RedirectsListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

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
        setError(result.error || 'Không thể thêm URL');
      }
    } catch (err) {
      setError('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    await toggleRedirectUrlAction(id, !currentState);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa URL này?')) return;
    
    setDeleting(id);
    await deleteRedirectUrlAction(id);
    router.refresh();
  };

  const enabledUrls = urls.filter(u => u.enabled);

  return (
    <div className="space-y-6">
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
            <span>Thêm Redirect URL Mới</span>
          </button>
        </div>
      ) : (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm URL Mới</h3>
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
                {loading ? 'Đang thêm...' : '+ Thêm URL'}
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
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div className="text-blue-100 text-sm font-medium mb-1">Tổng URLs</div>
          <div className="text-3xl font-bold">{urls.length}</div>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="text-green-100 text-sm font-medium mb-1">URLs Đang Hoạt Động</div>
          <div className="text-3xl font-bold">{enabledUrls.length}</div>
        </div>
      </div>

      {/* URLs List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh Sách Redirect URLs</h3>
        
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
                    {deleting === url.id ? '...' : 'Xóa'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔗</div>
            <p className="text-gray-600">Chưa có redirect URL nào</p>
            <p className="text-sm text-gray-500 mt-2">Thêm URLs để bắt đầu sử dụng smart redirect</p>
          </div>
        )}
      </div>
    </div>
  );
}

