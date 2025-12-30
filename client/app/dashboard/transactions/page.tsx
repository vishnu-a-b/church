'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { TrendingUp } from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
    fetchTransactions();
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

  const fetchTransactions = async () => {
    try {
      const [transactionsRes, membersRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/members'),
      ]);
      setTransactions(transactionsRes.data?.data || []);
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

  const filteredTransactions = transactions.filter((txn: any) => {
    // Extract IDs from transaction (might be objects or strings)
    const txnChurchId = typeof txn.churchId === 'object' && txn.churchId?._id
      ? txn.churchId._id
      : txn.churchId;
    const txnUnitId = typeof txn.unitId === 'object' && txn.unitId?._id
      ? txn.unitId._id
      : txn.unitId;
    const txnHouseId = typeof txn.houseId === 'object' && txn.houseId?._id
      ? txn.houseId._id
      : txn.houseId;

    // Try direct properties first
    if (filters.church && txnChurchId && txnChurchId !== filters.church) return false;
    if (filters.unit && txnUnitId && txnUnitId !== filters.unit) return false;
    if (filters.house && txnHouseId && txnHouseId !== filters.house) return false;

    // If transaction has memberId, filter through member's hierarchy
    if (txn.memberId) {
      const member = getMemberData(txn.memberId);
      if (!member) return !filters.church && !filters.unit && !filters.bavanakutayima && !filters.house;

      // Extract houseId as string (might be object or string)
      const memberHouseId = typeof member.houseId === 'object' && member.houseId?._id
        ? member.houseId._id
        : member.houseId;

      if (!memberHouseId) return !filters.church && !filters.unit && !filters.bavanakutayima && !filters.house;

      // Filter by house first (direct comparison)
      if (filters.house && memberHouseId !== filters.house) return false;

      // Check if member has direct hierarchy properties
      if (filters.church && member.churchId && member.churchId !== filters.church) return false;
      if (filters.unit && member.unitId && member.unitId !== filters.unit) return false;
      if (filters.bavanakutayima && member.bavanakutayimaId && member.bavanakutayimaId !== filters.bavanakutayima) return false;

      // If member doesn't have direct hierarchy properties, check through house
      if (!member.churchId || !member.unitId || !member.bavanakutayimaId) {
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

    // If we need to filter by bavanakutayima and transaction doesn't have it directly
    if (filters.bavanakutayima && txnHouseId) {
      const house = getHouseData(txnHouseId);
      if (!house || (house as any).bavanakutayimaId !== filters.bavanakutayima) {
        return false;
      }
    }

    return true;
  });

  const getTotalAmount = () => {
    return filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        <p className="text-gray-600">View all financial transactions</p>
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
              <p className="text-sm text-gray-600">Filtered Transactions</p>
              <p className="text-2xl font-bold text-gray-800">{filteredTransactions.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total: {transactions.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-800">₹{getTotalAmount().toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Amount</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{filteredTransactions.length ? Math.round(getTotalAmount() / filteredTransactions.length).toLocaleString() : 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No transactions found</td></tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{txn.receiptNumber}</div>
                      <div className="text-sm text-gray-500 md:hidden capitalize">
                        {txn.transactionType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                        {txn.transactionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">₹{txn.totalAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900 capitalize">{txn.paymentMethod.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900">{formatDate(txn.paymentDate)}</div>
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
