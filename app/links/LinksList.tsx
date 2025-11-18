'use client';

import { useState, useEffect } from 'react';
import { LinkStats } from '@/lib/types';
import { deleteLinkAction, toggleRedirectAction } from './actions';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface LinksListProps {
  links: LinkStats[];
  appUrl: string;
  currentSort: string;
}

export default function LinksList({ links, appUrl, currentSort }: LinksListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewLinksModal, setShowNewLinksModal] = useState(false);
  const [newLinks, setNewLinks] = useState<LinkStats[]>([]);

  // Check for newly created links
  useEffect(() => {
    const newSlugs = searchParams.get('new');
    if (newSlugs) {
      const slugsArray = newSlugs.split(',');
      const createdLinks = links.filter(link => slugsArray.includes(link.slug));
      if (createdLinks.length > 0) {
        setNewLinks(createdLinks);
        setShowNewLinksModal(true);
        // Clean URL
        router.replace('/links', { scroll: false });
      }
    }
  }, [searchParams, links, router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
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
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50"></div>
        
        <div className="relative card text-center py-16 border-2 border-dashed border-gray-300">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No links yet</h3>
          <p className="text-gray-600 mb-6">Create your first link to start tracking and analytics</p>
          <Link href="/links/create" className="btn btn-primary inline-flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Link Now</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalClicks = links.reduce((sum, link) => sum + link.total_views, 0);
  const totalOnline = links.reduce((sum, link) => sum + link.online_count, 0);

  const closeModal = () => {
    setShowNewLinksModal(false);
    setNewLinks([]);
  };

  const exportLinksToFile = () => {
    // Create text content with each link on a new line
    const linksText = newLinks
      .map(link => `${appUrl}/${link.slug}`)
      .join('\n');

    // Create blob and download
    const blob = new Blob([linksText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `links-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* New Links Modal */}
      {showNewLinksModal && newLinks.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Successfully created {newLinks.length} link{newLinks.length > 1 ? 's' : ''}!
                    </h3>
                    <p className="text-green-100 text-sm">Click to copy link and share now</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-3">
                {newLinks.map((link, index) => (
                  <div
                    key={link.id}
                    className="group bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-gray-600 mb-1">/{link.slug}</div>
                          <div className="text-xs text-blue-600 truncate font-medium">
                            {appUrl}/{link.slug}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => copyToClipboard(link.slug, link.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          {copiedId === link.id ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                          title="View link"
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={exportLinksToFile}
                  className="flex-1 btn btn-secondary py-3 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export to .txt</span>
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 btn btn-primary py-3"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-100 text-sm font-medium">Total Links</div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">{links.length}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-100 text-sm font-medium">Total Clicks</div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">{totalClicks.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-purple-100 text-sm font-medium">Online Now</div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold flex items-center">
            {totalOnline}
            <span className="ml-2 w-2 h-2 bg-green-300 rounded-full animate-ping"></span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <div className="text-orange-100 text-sm font-medium">Avg Click/Link</div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">{links.length > 0 ? Math.round(totalClicks / links.length) : 0}</div>
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-700">Sort by:</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                onClick={() => handleSortChange('created')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  currentSort === 'created'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Newest</span>
                </span>
              </button>
              <button
                onClick={() => handleSortChange('clicks')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  currentSort === 'clicks'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Most clicks</span>
                </span>
              </button>
              <button
                onClick={() => handleSortChange('online')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  currentSort === 'online'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Trending</span>
                </span>
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing <strong className="text-gray-900">{links.length}</strong> links
          </div>
        </div>
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {links.map((link) => (
          <div
            key={link.id}
            className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold text-lg border border-white/30">
                    {link.slug.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center space-x-2">
                      <span>/{link.slug}</span>
                      {link.redirect_enabled && (
                        <span className="px-2 py-0.5 bg-green-400 text-green-900 text-xs rounded-full font-semibold">
                          ↗ Redirect
                        </span>
                      )}
                    </h3>
                    <p className="text-white/80 text-xs">
                      {new Date(link.created_at).toLocaleDateString('vi-VN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="px-5 py-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Total Views</div>
                      <div className="text-2xl font-bold text-gray-900">{link.total_views.toLocaleString()}</div>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Online Now</div>
                      <div className="text-2xl font-bold text-green-600 flex items-center">
                        {link.online_count}
                        {link.online_count > 0 && (
                          <span className="ml-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Actions */}
            <div className="px-5 py-4 bg-white border-t border-gray-100">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => copyToClipboard(link.slug, link.id)}
                  className="flex-1 btn btn-secondary text-sm flex items-center justify-center space-x-1"
                  title="Copy link"
                >
                  {copiedId === link.id ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleToggleRedirect(link.id, link.redirect_enabled)}
                  className={`btn text-sm flex items-center space-x-1 ${
                    link.redirect_enabled
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'btn-secondary'
                  }`}
                  title={link.redirect_enabled ? 'Tắt redirect' : 'Bật redirect'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                
                <a
                  href={`/${link.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-sm"
                  title="View link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </a>
                
                <Link
                  href={`/links/edit/${link.id}`}
                  className="btn btn-secondary text-sm"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                
                <button
                  onClick={() => handleDelete(link.id)}
                  disabled={deleting === link.id}
                  className="btn btn-danger text-sm"
                  title="Delete"
                >
                  {deleting === link.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
