'use client';

import { useState } from 'react';
import { LinkWithVisitCount } from '@/lib/types';
import { deleteLinkAction, toggleRedirectAction } from './actions';
import { useRouter } from 'next/navigation';

interface LinksListProps {
  links: LinkWithVisitCount[];
  appUrl: string;
}

export default function LinksList({ links, appUrl }: LinksListProps) {
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
    <div className="space-y-4">
      {links.map((link) => (
        <div key={link.id} className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">/{link.slug}</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {link.visit_count} lượt xem
                </span>
                {link.redirect_enabled && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                    ↗ Redirect
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Video URL:</span>
                  <p className="text-gray-900 break-all">{link.video_url}</p>
                </div>
                
                {link.destination_url && (
                  <div>
                    <span className="text-gray-600">Redirect URL:</span>
                    <p className="text-gray-900 break-all">{link.destination_url}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-600">Link công khai:</span>
                  <p className="text-blue-600 break-all">{appUrl}/{link.slug}</p>
                </div>
              </div>
            </div>
            
            <div className="ml-6 flex flex-col space-y-2">
              <button
                onClick={() => copyToClipboard(link.slug, link.id)}
                className="btn btn-secondary text-sm whitespace-nowrap"
              >
                {copiedId === link.id ? '✓ Đã copy' : '📋 Copy Link'}
              </button>
              
              <button
                onClick={() => handleToggleRedirect(link.id, link.redirect_enabled)}
                className={`btn text-sm whitespace-nowrap ${
                  link.redirect_enabled ? 'bg-green-500 text-white hover:bg-green-600' : 'btn-secondary'
                }`}
              >
                {link.redirect_enabled ? '✓ Redirect ON' : 'Redirect OFF'}
              </button>
              
              <a
                href={`/${link.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-sm text-center whitespace-nowrap"
              >
                👁️ Xem
              </a>
              
              <a
                href={`/links/edit/${link.id}`}
                className="btn btn-secondary text-sm text-center whitespace-nowrap"
              >
                ✏️ Sửa
              </a>
              
              <button
                onClick={() => handleDelete(link.id)}
                disabled={deleting === link.id}
                className="btn btn-danger text-sm whitespace-nowrap"
              >
                {deleting === link.id ? 'Đang xóa...' : '🗑️ Xóa'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

