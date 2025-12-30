'use client';

import { useState, useEffect } from 'react';
import { User, DollarSign, Activity, Calendar, MapPin, Users, Home, Bell, CalendarDays } from 'lucide-react';
import axios from 'axios';

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
}

interface EventItem {
  _id: string;
  title: string;
  content: string;
  contentType: 'text' | 'image' | 'video';
  mediaUrl?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export default function MemberDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      // Get user from localStorage
      const userStr = localStorage.getItem('member_user');
      const token = localStorage.getItem('member_accessToken');

      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);

          // Fetch full member details with populated church, unit, bavanakutayima
          if (token) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            console.log('🔍 Fetching member profile...');

            const response = await axios.get(`${apiUrl}/members/me`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            console.log('📦 Member details response:', response.data);

            if (response.data.success) {
              setMemberDetails(response.data.data);
              console.log('✅ Member details loaded:', response.data.data);
            }
          }
        } catch (error) {
          console.error('Error fetching member details:', error);
        }
      }
      setLoading(false);
    };

    const fetchNewsAndEvents = async () => {
      const token = localStorage.getItem('member_accessToken');
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        try {
          // Fetch active news
          const newsResponse = await axios.get(`${apiUrl}/news/active/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (newsResponse.data.success) {
            setNews(newsResponse.data.data);
          }
        } catch (error) {
          console.error('Error fetching news:', error);
        }

        try {
          // Fetch active events
          const eventsResponse = await axios.get(`${apiUrl}/events/active/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (eventsResponse.data.success) {
            setEvents(eventsResponse.data.data);
          }
        } catch (error) {
          console.error('Error fetching events:', error);
        }
      }
    };

    fetchMemberDetails();
    fetchNewsAndEvents();
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No user data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Church Hierarchy Information */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-5 text-white">
        <div className="flex flex-wrap gap-6 items-center justify-start">
          {memberDetails ? (
            <>
              {memberDetails.churchId && (
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-100 uppercase tracking-wide">Church</p>
                    <p className="font-bold text-lg">
                      {typeof memberDetails.churchId === 'object'
                        ? memberDetails.churchId.name
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {memberDetails.unitId && (
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-100 uppercase tracking-wide">Unit</p>
                    <p className="font-bold text-lg">
                      {typeof memberDetails.unitId === 'object'
                        ? memberDetails.unitId.name
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {memberDetails.bavanakutayimaId && (
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-100 uppercase tracking-wide">Bavanakutayima</p>
                    <p className="font-bold text-lg">
                      {typeof memberDetails.bavanakutayimaId === 'object'
                        ? memberDetails.bavanakutayimaId.name
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-indigo-100">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <p className="text-sm">Loading hierarchy information...</p>
            </div>
          )}
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-3">
          Welcome, {user.firstName} {user.lastName}!
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="bg-blue-700 bg-opacity-50 rounded-lg p-3">
            <p className="text-xs text-blue-200">Username</p>
            <p className="font-semibold">{user.username}</p>
          </div>
          <div className="bg-blue-700 bg-opacity-50 rounded-lg p-3">
            <p className="text-xs text-blue-200">Email</p>
            <p className="font-semibold">{user.email || 'N/A'}</p>
          </div>
          <div className="bg-blue-700 bg-opacity-50 rounded-lg p-3">
            <p className="text-xs text-blue-200">Role</p>
            <p className="font-semibold capitalize">{user.role}</p>
          </div>
          <div className="bg-blue-700 bg-opacity-50 rounded-lg p-3">
            <p className="text-xs text-blue-200">Status</p>
            <p className="font-semibold">{user.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Contributions</p>
              <p className="text-2xl font-bold text-gray-800">₹0</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Spiritual Activities</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
            <Activity className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <User className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-medium">My Profile</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="font-medium">View Contributions</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="font-medium">Spiritual Activities</p>
          </button>
        </div>
      </div>

      {/* Announcements Section */}
      {news.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Announcements</h2>
          </div>
          <div className="space-y-4">
            {news.map((item) => (
              <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-700 mb-3">{item.content}</p>
                {item.mediaUrl && item.contentType === 'image' && (
                  <img src={item.mediaUrl} alt={item.title} className="rounded-lg max-h-64 mb-3" />
                )}
                {item.mediaUrl && item.contentType === 'video' && (
                  <video src={item.mediaUrl} controls className="rounded-lg max-h-64 mb-3" />
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Valid from {formatDate(item.startDate)}</span>
                  <span>•</span>
                  <span>Until {formatDate(item.endDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Section */}
      {events.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">Upcoming Events</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{event.title}</h3>
                {event.location && (
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                )}
                <p className="text-gray-700 mb-3">{event.content}</p>
                {event.mediaUrl && event.contentType === 'image' && (
                  <img src={event.mediaUrl} alt={event.title} className="rounded-lg max-h-48 w-full object-cover mb-3" />
                )}
                {event.mediaUrl && event.contentType === 'video' && (
                  <video src={event.mediaUrl} controls className="rounded-lg max-h-48 w-full mb-3" />
                )}
                <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Welcome to Your Dashboard!</h3>
        <p className="text-blue-800 text-sm">
          You have successfully logged in as a member. This is your personal dashboard where you can view your contributions, spiritual activities, and manage your profile.
        </p>
      </div>
    </div>
  );
}
