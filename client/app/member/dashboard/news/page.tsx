'use client';

import { useState, useEffect } from 'react';
import { Newspaper, Calendar, Bell, Image as ImageIcon, Video } from 'lucide-react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  contentType: 'text' | 'image' | 'video';
  mediaUrl?: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export default function MemberNewsPage() {
  const api = createRoleApi('member');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await api.get('/news/active/list');

      if (response.data.success) {
        setNews(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Church News & Announcements</h1>
            <p className="text-blue-100">Stay updated with the latest church news</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <Newspaper className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700 font-medium mb-1">Active Announcements</p>
            <p className="text-4xl font-bold text-blue-900">{news.length}</p>
            <p className="text-xs text-blue-600 mt-1">Current news items</p>
          </div>
          <div className="bg-blue-500 bg-opacity-20 rounded-full p-4">
            <Bell className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {news.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No active news at the moment</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for updates</p>
          </div>
        ) : (
          news.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{item.title}</h2>
                    <div className="flex items-center gap-2 mt-1 text-blue-100 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Valid from {formatDate(item.startDate)} to {formatDate(item.endDate)}
                      </span>
                    </div>
                  </div>
                  {item.contentType === 'image' && (
                    <div className="bg-white bg-opacity-20 rounded-full p-2">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  {item.contentType === 'video' && (
                    <div className="bg-white bg-opacity-20 rounded-full p-2">
                      <Video className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Media */}
                {item.mediaUrl && item.contentType === 'image' && (
                  <div className="mb-4">
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="rounded-xl w-full max-h-96 object-cover shadow-md"
                    />
                  </div>
                )}
                {item.mediaUrl && item.contentType === 'video' && (
                  <div className="mb-4">
                    <video
                      src={item.mediaUrl}
                      controls
                      className="rounded-xl w-full max-h-96 shadow-md"
                    />
                  </div>
                )}

                {/* Description */}
                {item.description && (
                  <div className="mb-4">
                    <p className="text-gray-600 italic text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Main Content */}
                <div className="prose max-w-none">
                  <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Posted on {formatDate(item.createdAt)}</span>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
