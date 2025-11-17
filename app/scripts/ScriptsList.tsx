'use client';

import { useState } from 'react';
import { Script } from '@/lib/types';
import { deleteScriptAction, toggleScriptAction } from './actions';
import { useRouter } from 'next/navigation';

interface ScriptsListProps {
  scripts: Script[];
}

export default function ScriptsList({ scripts }: ScriptsListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this script?')) return;
    
    setDeleting(id);
    await deleteScriptAction(id);
    router.refresh();
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    await toggleScriptAction(id, !currentState);
    router.refresh();
  };

  if (scripts.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No scripts yet</h3>
        <p className="text-gray-600">Add your first script to start tracking</p>
      </div>
    );
  }

  const headScripts = scripts.filter(s => s.location === 'head');
  const bodyScripts = scripts.filter(s => s.location === 'body');

  const renderScriptList = (scriptList: Script[], title: string) => (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {scriptList.length > 0 ? (
          scriptList.map((script) => (
            <div key={script.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      script.enabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {script.enabled ? '✓ Enabled' : 'Disabled'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(script.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
                      <code>{script.content}</code>
                    </pre>
                  </div>
                </div>
                
                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => handleToggle(script.id, script.enabled)}
                    className={`btn text-sm whitespace-nowrap ${
                      script.enabled 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : 'btn-secondary'
                    }`}
                  >
                    {script.enabled ? '✓ Enabled' : 'Enable'}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(script.id)}
                    disabled={deleting === script.id}
                    className="btn btn-danger text-sm whitespace-nowrap"
                  >
                    {deleting === script.id ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No scripts at this location</p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {renderScriptList(headScripts, '📄 Head Scripts')}
      {renderScriptList(bodyScripts, '📄 Body Scripts')}
    </div>
  );
}

