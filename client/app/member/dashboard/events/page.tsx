'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Calendar, MapPin, Image as ImageIcon, Video, Clock } from 'lucide-react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';

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
  createdAt: Date;
}

export default function MemberEventsPage() {
  const api = createRoleApi('member');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events/active/list');

      if (response.data.success) {
        setEvents(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
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

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (startDate: Date) => {
    return new Date(startDate) > new Date();
  };

  const isOngoing = (startDate: Date, endDate: Date) => {
    const now = new Date();
    return new Date(startDate) <= now && new Date(endDate) >= now;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const upcomingEvents = events.filter(e => isUpcoming(e.startDate));
  const ongoingEvents = events.filter(e => isOngoing(e.startDate, e.endDate));
  const pastEvents = events.filter(e => !isUpcoming(e.startDate) && !isOngoing(e.startDate, e.endDate));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Church Events</h1>
            <p className="text-purple-100">View and plan for upcoming church events</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <CalendarDays className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">Upcoming Events</p>
              <p className="text-4xl font-bold text-green-900">{upcomingEvents.length}</p>
              <p className="text-xs text-green-600 mt-1">Events to come</p>
            </div>
            <div className="bg-green-500 bg-opacity-20 rounded-full p-4">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Ongoing Events</p>
              <p className="text-4xl font-bold text-blue-900">{ongoingEvents.length}</p>
              <p className="text-xs text-blue-600 mt-1">Currently active</p>
            </div>
            <div className="bg-blue-500 bg-opacity-20 rounded-full p-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">Total Events</p>
              <p className="text-4xl font-bold text-purple-900">{events.length}</p>
              <p className="text-xs text-purple-600 mt-1">All active events</p>
            </div>
            <div className="bg-purple-500 bg-opacity-20 rounded-full p-4">
              <CalendarDays className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Ongoing Events */}
      {ongoingEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
            Ongoing Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ongoingEvents.map((event) => (
              <EventCard key={event._id} event={event} status="ongoing" />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
            Upcoming Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event._id} event={event} status="upcoming" />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-gray-600 to-gray-400 rounded-full"></div>
            Past Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pastEvents.map((event) => (
              <EventCard key={event._id} event={event} status="past" />
            ))}
          </div>
        </div>
      )}

      {/* No Events */}
      {events.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
          <CalendarDays className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No active events at the moment</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for upcoming events</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, status }: { event: EventItem; status: 'upcoming' | 'ongoing' | 'past' }) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusColors = {
    upcoming: 'from-green-500 to-emerald-500',
    ongoing: 'from-blue-500 to-indigo-500',
    past: 'from-gray-500 to-gray-400',
  };

  const statusBadges = {
    upcoming: 'bg-green-100 text-green-700',
    ongoing: 'bg-blue-100 text-blue-700 animate-pulse',
    past: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Header */}
      <div className={`bg-gradient-to-r ${statusColors[status]} text-white p-4`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold flex-1">{event.title}</h3>
          <span className={`px-3 py-1 ${statusBadges[status]} rounded-full text-xs font-medium bg-white bg-opacity-90`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-white text-sm bg-white bg-opacity-20 p-2 rounded-lg">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {/* Media */}
      {event.mediaUrl && event.contentType === 'image' && (
        <img
          src={event.mediaUrl}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      {event.mediaUrl && event.contentType === 'video' && (
        <video
          src={event.mediaUrl}
          controls
          className="w-full h-48"
        />
      )}

      {/* Content */}
      <div className="p-5">
        <p className="text-gray-700 mb-4 leading-relaxed">{event.content}</p>

        {/* Date Range */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <div className="font-semibold text-gray-700">
                {formatDate(event.startDate)}
              </div>
              {new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString() && (
                <div className="text-gray-600 text-xs">
                  to {formatDate(event.endDate)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
