'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Campaign } from '@/types';
import { Wallet, TrendingUp } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeCampaigns = campaigns.filter((c) => c.isActive);
  const totalCollected = campaigns.reduce((sum, c) => sum + c.totalCollected, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Campaigns</h2>
        <p className="text-gray-600">Manage fundraising campaigns</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-800">{campaigns.length}</p>
            </div>
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-800">{activeCampaigns.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-800">₹{totalCollected.toLocaleString()}</p>
            </div>
            <Wallet className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))
        ) : campaigns.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No campaigns found</div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {campaign.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{campaign.name}</h3>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p className="capitalize">Type: {campaign.campaignType.replace('_', ' ')}</p>
                <p>Fixed Amount: ₹{campaign.fixedAmount}</p>
                <p className="capitalize">Amount Type: {campaign.amountType.replace('_', ' ')}</p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Collected:</span>
                  <span className="font-semibold text-gray-800">₹{campaign.totalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-semibold text-gray-800">{campaign.participantCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="text-gray-800">{formatDate(campaign.startDate)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
