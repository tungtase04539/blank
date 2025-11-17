'use client';

import { useState } from 'react';
import { LinkWithVisitCount } from '@/lib/types';
import { deleteLinkAction, toggleRedirectAction } from './actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LinksListProps {
  links: LinkWithVisitCount[];
  appUrl: string;
  currentSort: string;
}

export default function LinksList({ links, appUrl, currentSort }: LinksListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa link này?')) return;
    
    setDeleting(id);
    await deleteLinkAction(id);
    router.refresh();
  };

  const handleToggleRedirect = async (id: string, currentState: boolean) => {
    await toggleRedirectAction(id, !currentState);
    router.refresh();
  };

  const copyToClipboard = (slug: string, id: string) => {
    const url = `${appUrl}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSortChange = (sort: string) => {
    router.push(`/links?sort=${sort}`);
  };

  if (links.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có link nào</h3>
        <p className="text-gray-600">Tạo link đầu tiên của bạn để bắt đầu</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort Options */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
            <button
              onClick={() => handleSortChange('created')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                currentSort === 'created'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📅 Mới nhất
            </button>
            <button
              onClick={() => handleSortChange('clicks')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                currentSort === 'clicks'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🔥 Click nhiều nhất
            </button>
            <button
              onClick={() => handleSortChange('online')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                currentSort === 'online'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              👥 Online nhiều nhất
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Tổng: <strong>{links.length}</strong> links
          </div>
        </div>
      </div>

      {/* Compact Links List */}
      <div className="grid grid-cols-1 gap-4">
        {links.map((link) => (
          <div key={link.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              {/* Left: Link Info */}
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {link.slug.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      /{link.slug}
                    </h3>
                    {link.redirect_enabled && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        ↗ Redirect
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      📊 <strong className="ml-1">{link.visit_count}</strong> clicks
                    </span>
                    <span className="flex items-center">
                      👥 <strong className="ml-1 text-green-600">{link.online_count}</strong> online
                    </span>
                    <span className="text-gray-400">
                      {new Date(link.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right: Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => copyToClipboard(link.slug, link.id)}
                  className="btn btn-secondary text-sm"
                  title="Copy link"
                >
                  {copiedId === link.id ? '✓' : '📋'}
                </button>
                
                <a
                  href={`/${link.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-sm"
                  title="Xem link"
                >
                  👁️
                </a>
                
                <Link
                  href={`/links/edit/${link.id}`}
                  className="btn btn-secondary text-sm"
                  title="Sửa"
                >
                  ✏️
                </Link>
                
                <button
                  onClick={() => handleDelete(link.id)}
                  disabled={deleting === link.id}
                  className="btn btn-danger text-sm"
                  title="Xóa"
                >
                  {deleting === link.id ? '...' : '🗑️'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
