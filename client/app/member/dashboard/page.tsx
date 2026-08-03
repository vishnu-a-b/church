'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Activity, Calendar, MapPin, Users, Home, Bell, CalendarDays, X, ChevronLeft, ChevronRight, Newspaper, Heart, Repeat } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

interface Transaction {
  _id: string;
  totalAmount: number;
  paymentDate: string;
}

interface SpiritualActivity {
  _id: string;
  activityType: string;
  activityDate: Date;
}

export default function MemberDashboardPage() {
  const router = useRouter();
  const api = createRoleApi('member');
  const [user, setUser] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spiritualActivities, setSpiritualActivities] = useState<SpiritualActivity[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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
            console.log('🔍 Fetching member profile...');

            const response = await api.get('/members/me');

            console.log('📦 Member details response:', response.data);

            if (response.data.success) {
              setMemberDetails(response.data.data);
              console.log('✅ Member details loaded:', response.data.data);
            }
          }
        } catch (error) {
          console.error('Error fetching member details:', error);
          toast.error('Failed to load your profile details');
        }
      }
      setLoading(false);
    };

    const fetchNewsAndEvents = async () => {
      try {
        // Fetch active news
        const newsResponse = await api.get('/news/active/list');
        if (newsResponse.data.success) {
          setNews(newsResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      }

      try {
        // Fetch active events
        const eventsResponse = await api.get('/events/active/list');
        if (eventsResponse.data.success) {
          setEvents(eventsResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchMemberDetails();
    fetchNewsAndEvents();
    fetchTransactions();
    fetchSpiritualActivities();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/members/me/transactions');
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load your contributions');
    }
  };

  const fetchSpiritualActivities = async () => {
    try {
      const response = await api.get('/members/me/spiritual-activities');
      if (response.data.success) {
        setSpiritualActivities(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching spiritual activities:', error);
    }
  };

  // Show popup when news or events are available
  useEffect(() => {
    if ((news.length > 0 || events.length > 0) && !loading) {
      // Check if popup was dismissed in this session
      const popupDismissed = sessionStorage.getItem('newsEventsPopupDismissed');
      if (!popupDismissed) {
        setShowPopup(true);
      }
    }
  }, [news, events, loading]);

  const allItems = [...news.map(item => ({ ...item, type: 'news' })), ...events.map(item => ({ ...item, type: 'event' }))];

  const closePopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('newsEventsPopupDismissed', 'true');
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % allItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allItems.length) % allItems.length);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const totalContributions = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

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
      {/* News & Events Popup Modal */}
      {showPopup && allItems.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 relative">
              <button
                onClick={closePopup}
                className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                {allItems[currentSlide].type === 'news' ? (
                  <Bell className="w-8 h-8" />
                ) : (
                  <CalendarDays className="w-8 h-8" />
                )}
                <div>
                  <h2 className="text-2xl font-bold">
                    {allItems[currentSlide].type === 'news' ? 'Latest Announcements' : 'Upcoming Events'}
                  </h2>
                  <p className="text-purple-100 text-sm">Stay updated with church activities</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">{allItems[currentSlide].title}</h3>

                {/* Media Content */}
                {allItems[currentSlide].mediaUrl && allItems[currentSlide].contentType === 'image' && (
                  <img
                    src={allItems[currentSlide].mediaUrl}
                    alt={allItems[currentSlide].title}
                    className="rounded-xl w-full max-h-80 object-cover shadow-lg"
                  />
                )}
                {allItems[currentSlide].mediaUrl && allItems[currentSlide].contentType === 'video' && (
                  <video
                    src={allItems[currentSlide].mediaUrl}
                    controls
                    className="rounded-xl w-full max-h-80 shadow-lg"
                  />
                )}

                {/* Description/Content */}
                <p className="text-gray-700 text-lg leading-relaxed">{allItems[currentSlide].content}</p>

                {/* Location for Events */}
                {allItems[currentSlide].type === 'event' && (allItems[currentSlide] as any).location && (
                  <div className="flex items-center gap-2 text-purple-600 bg-purple-50 p-3 rounded-lg">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">{(allItems[currentSlide] as any).location}</span>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <span className="font-semibold">From:</span> {formatDate(allItems[currentSlide].startDate)}
                    <span className="mx-2">•</span>
                    <span className="font-semibold">Until:</span> {formatDate(allItems[currentSlide].endDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Navigation */}
            <div className="bg-gray-50 p-4 flex items-center justify-between border-t">
              <button
                onClick={prevSlide}
                disabled={allItems.length <= 1}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {allItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentSlide ? 'bg-purple-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                disabled={allItems.length <= 1}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">Total Contributions</p>
              <p className="text-3xl font-bold text-green-900">{formatAmount(totalContributions)}</p>
              <p className="text-xs text-green-600 mt-1">All time</p>
            </div>
            <div className="bg-green-500 bg-opacity-20 rounded-full p-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Transactions</p>
              <p className="text-3xl font-bold text-blue-900">{transactions.length}</p>
              <p className="text-xs text-blue-600 mt-1">Total count</p>
            </div>
            <div className="bg-blue-500 bg-opacity-20 rounded-full p-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">Spiritual Activities</p>
              <p className="text-3xl font-bold text-purple-900">{spiritualActivities.length}</p>
              <p className="text-xs text-purple-600 mt-1">Total recorded</p>
            </div>
            <div className="bg-purple-500 bg-opacity-20 rounded-full p-4">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => router.push('/member/dashboard/transactions')}
            className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all duration-300 hover:scale-105 text-center"
          >
            <div className="bg-green-500 bg-opacity-20 rounded-full p-3 w-fit mx-auto mb-3 group-hover:bg-opacity-30 transition-all">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-green-700">Contributions</p>
            <p className="text-xs text-gray-500 mt-1">Track payments</p>
          </button>
          <button
            onClick={() => router.push('/member/dashboard/monthly-support')}
            className="group p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl hover:border-amber-400 hover:shadow-lg transition-all duration-300 hover:scale-105 text-center"
          >
            <div className="bg-amber-500 bg-opacity-20 rounded-full p-3 w-fit mx-auto mb-3 group-hover:bg-opacity-30 transition-all">
              <Repeat className="w-8 h-8 text-amber-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-amber-700">Monthly Support</p>
            <p className="text-xs text-gray-500 mt-1">Your pledge status</p>
          </button>
          <button
            onClick={() => router.push('/member/dashboard/news')}
            className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:scale-105 text-center"
          >
            <div className="bg-blue-500 bg-opacity-20 rounded-full p-3 w-fit mx-auto mb-3 group-hover:bg-opacity-30 transition-all">
              <Newspaper className="w-8 h-8 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-blue-700">News</p>
            <p className="text-xs text-gray-500 mt-1">View announcements</p>
          </button>
          <button
            onClick={() => router.push('/member/dashboard/events')}
            className="group p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-300 hover:scale-105 text-center"
          >
            <div className="bg-purple-500 bg-opacity-20 rounded-full p-3 w-fit mx-auto mb-3 group-hover:bg-opacity-30 transition-all">
              <CalendarDays className="w-8 h-8 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-purple-700">Events</p>
            <p className="text-xs text-gray-500 mt-1">Upcoming activities</p>
          </button>
          <button
            onClick={() => router.push('/member/dashboard/spiritual-activities')}
            className="group p-6 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-xl hover:border-pink-400 hover:shadow-lg transition-all duration-300 hover:scale-105 text-center"
          >
            <div className="bg-pink-500 bg-opacity-20 rounded-full p-3 w-fit mx-auto mb-3 group-hover:bg-opacity-30 transition-all">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-pink-700">Spiritual Life</p>
            <p className="text-xs text-gray-500 mt-1">Track activities</p>
          </button>
        </div>
      </div>

      {/* Announcements Section */}
      {news.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500 bg-opacity-20 rounded-lg p-2">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Latest Announcements</h2>
              <p className="text-sm text-gray-500">Stay informed about church updates</p>
            </div>
          </div>
          <div className="space-y-4">
            {news.map((item) => (
              <div key={item._id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-5 hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-700 mb-3 leading-relaxed">{item.content}</p>
                {item.mediaUrl && item.contentType === 'image' && (
                  <img src={item.mediaUrl} alt={item.title} className="rounded-lg max-h-64 w-full object-cover mb-3 shadow-md" />
                )}
                {item.mediaUrl && item.contentType === 'video' && (
                  <video src={item.mediaUrl} controls className="rounded-lg max-h-64 w-full mb-3 shadow-md" />
                )}
                <div className="flex items-center gap-3 text-sm bg-white bg-opacity-70 p-3 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">
                    <span className="font-semibold">Valid:</span> {formatDate(item.startDate)} - {formatDate(item.endDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Section */}
      {events.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-500 bg-opacity-20 rounded-lg p-2">
              <CalendarDays className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Upcoming Events</h2>
              <p className="text-sm text-gray-500">Mark your calendar for these events</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5 hover:shadow-xl hover:border-purple-400 transition-all duration-300 hover:scale-[1.02]">
                <h3 className="font-bold text-xl text-gray-900 mb-3">{event.title}</h3>
                {event.location && (
                  <div className="flex items-center gap-2 text-purple-700 bg-purple-100 bg-opacity-60 p-2 rounded-lg mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{event.location}</span>
                  </div>
                )}
                <p className="text-gray-700 mb-3 leading-relaxed">{event.content}</p>
                {event.mediaUrl && event.contentType === 'image' && (
                  <img src={event.mediaUrl} alt={event.title} className="rounded-xl max-h-48 w-full object-cover mb-3 shadow-md" />
                )}
                {event.mediaUrl && event.contentType === 'video' && (
                  <video src={event.mediaUrl} controls className="rounded-xl max-h-48 w-full mb-3 shadow-md" />
                )}
                <div className="flex items-center gap-2 bg-white bg-opacity-70 p-3 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    {formatDate(event.startDate)} - {formatDate(event.endDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
