'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { SpiritualActivity } from '@/types';
import { Activity } from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [allHouses, setAllHouses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    church: '',
    unit: '',
    bavanakutayima: '',
    house: '',
  });

  useEffect(() => {
    fetchActivities();
    fetchChurches();
    fetchAllHouses();
  }, []);

  useEffect(() => {
    if (filters.church) {
      fetchUnits(filters.church);
    } else {
      setUnits([]);
    }
  }, [filters.church]);

  useEffect(() => {
    if (filters.unit) {
      fetchBavanakutayimas(filters.unit);
    } else {
      setBavanakutayimas([]);
    }
  }, [filters.unit]);

  useEffect(() => {
    if (filters.bavanakutayima) {
      fetchHouses(filters.bavanakutayima);
    } else {
      setHouses([]);
    }
  }, [filters.bavanakutayima]);

  const fetchActivities = async () => {
    try {
      const [activitiesRes, membersRes] = await Promise.all([
        api.get('/spiritual-activities'),
        api.get('/members'),
      ]);
      setActivities(activitiesRes.data?.data || []);
      setMembers(membersRes.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurches = async () => {
    try {
      const response = await api.get('/churches');
      setChurches(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUnits = async (churchId: string) => {
    try {
      const response = await api.get(`/units?churchId=${churchId}`);
      setUnits(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBavanakutayimas = async (unitId: string) => {
    try {
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      setBavanakutayimas(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string) => {
    try {
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      setHouses(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllHouses = async () => {
    try {
      const response = await api.get('/houses');
      setAllHouses(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMemberData = (memberId: string) => {
    return members.find((m) => m._id === memberId);
  };

  const getHouseData = (houseId: string) => {
    return allHouses.find((h) => h._id === houseId);
  };

  const filteredActivities = activities.filter((activity: any) => {
    if (!activity.memberId) return !filters.church && !filters.unit && !filters.bavanakutayima && !filters.house;

    const member = getMemberData(activity.memberId);
    if (!member) return !filters.church && !filters.unit && !filters.bavanakutayima && !filters.house;

    // Extract houseId as string (might be object or string)
    const memberHouseId = typeof member.houseId === 'object' && member.houseId?._id
      ? member.houseId._id
      : member.houseId;

    // Filter by house first (direct comparison)
    if (filters.house && memberHouseId !== filters.house) return false;

    // Check if member has direct hierarchy properties
    if (filters.church && member.churchId && member.churchId !== filters.church) return false;
    if (filters.unit && member.unitId && member.unitId !== filters.unit) return false;
    if (filters.bavanakutayima && member.bavanakutayimaId && member.bavanakutayimaId !== filters.bavanakutayima) return false;

    // If member doesn't have direct hierarchy properties, check through house
    if (!member.churchId || !member.unitId || !member.bavanakutayimaId) {
      if (memberHouseId && (filters.church || filters.unit || filters.bavanakutayima)) {
        const house = getHouseData(memberHouseId);
        if (!house) return !filters.church && !filters.unit && !filters.bavanakutayima;

        // Filter by bavanakutayima
        if (filters.bavanakutayima && (house as any).bavanakutayimaId !== filters.bavanakutayima) return false;

        // Filter by unit
        if (filters.unit && (house as any).unitId !== filters.unit) return false;

        // Filter by church
        if (filters.church && (house as any).churchId !== filters.church) return false;
      }
    }

    return true;
  });

  const massActivities = filteredActivities.filter((a) => a.activityType === 'mass');
  const fastingActivities = filteredActivities.filter((a) => a.activityType === 'fasting');
  const prayerActivities = filteredActivities.filter((a) => a.activityType === 'prayer');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Spiritual Activities</h2>
        <p className="text-gray-600">Track member spiritual activities</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SearchableSelect
          label="Church"
          options={churches.map((church) => ({
            value: church._id,
            label: church.name,
          }))}
          value={filters.church}
          onChange={(value) =>
            setFilters({ ...filters, church: value, unit: '', bavanakutayima: '', house: '' })
          }
          placeholder="All Churches"
        />
        <SearchableSelect
          label="Unit"
          options={units.map((unit) => ({
            value: unit._id,
            label: unit.name,
          }))}
          value={filters.unit}
          onChange={(value) =>
            setFilters({ ...filters, unit: value, bavanakutayima: '', house: '' })
          }
          placeholder="All Units"
          disabled={!filters.church}
        />
        <SearchableSelect
          label="Bavanakutayima"
          options={bavanakutayimas.map((bk) => ({
            value: bk._id,
            label: bk.name,
          }))}
          value={filters.bavanakutayima}
          onChange={(value) => setFilters({ ...filters, bavanakutayima: value, house: '' })}
          placeholder="All Bavanakutayimas"
          disabled={!filters.unit}
        />
        <SearchableSelect
          label="House"
          options={houses.map((house) => ({
            value: house._id,
            label: house.familyName,
          }))}
          value={filters.house}
          onChange={(value) => setFilters({ ...filters, house: value })}
          placeholder="All Houses"
          disabled={!filters.bavanakutayima}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mass Attendance</p>
              <p className="text-2xl font-bold text-gray-800">{massActivities.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total: {activities.filter(a => a.activityType === 'mass').length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fasting Records</p>
              <p className="text-2xl font-bold text-gray-800">{fastingActivities.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total: {activities.filter(a => a.activityType === 'fasting').length}</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Prayer Records</p>
              <p className="text-2xl font-bold text-gray-800">{prayerActivities.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total: {activities.filter(a => a.activityType === 'prayer').length}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Self Reported</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : filteredActivities.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No activities found</td></tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={activity._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                        {activity.activityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {activity.activityType === 'mass' && activity.massAttended ? 'Attended' : ''}
                        {activity.activityType === 'fasting' &&
                          activity.fastingDays &&
                          `${activity.fastingDays.length} days`}
                        {activity.activityType === 'prayer' && activity.prayerCount
                          ? `${activity.prayerCount} times`
                          : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {activity.massDate && formatDate(activity.massDate)}
                        {activity.fastingWeek || ''}
                        {activity.prayerWeek || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.selfReported ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {activity.selfReported ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
