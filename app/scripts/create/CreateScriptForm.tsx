'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createScriptAction } from './actions';

interface CreateScriptFormProps {
  userId: string;
}

export default function CreateScriptForm({ userId }: CreateScriptFormProps) {
  const router = useRouter();
  const [location, setLocation] = useState<'head' | 'body'>('head');
  const [content, setContent] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await createScriptAction({
        userId,
        location,
        content,
        enabled,
      });

      if (result.success) {
        router.push('/scripts');
      } else {
        setError(result.error || 'Cannot create script');
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
          Script injection location *
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              value="head"
              checked={location === 'head'}
              onChange={() => setLocation('head')}
              className="w-4 h-4 text-blue-600"
              disabled={loading}
            />
            <span className="text-sm font-medium text-gray-700">&lt;head&gt;</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              value="body"
              checked={location === 'body'}
              onChange={() => setLocation('body')}
              className="w-4 h-4 text-blue-600"
              disabled={loading}
            />
            <span className="text-sm font-medium text-gray-700">&lt;body&gt;</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Script content *
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input font-mono text-sm"
          placeholder={`<!-- Google Analytics Example -->
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-XXXXX-Y', 'auto');
  ga('send', 'pageview');
</script>`}
          rows={12}
          required
          disabled={loading}
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter HTML/JavaScript code (including &lt;script&gt; tag)
        </p>
      </div>

      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <span className="text-sm font-medium text-gray-700">Enable script immediately after creation</span>
        </label>
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
          {loading ? 'Creating...' : 'Create Script'}
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

