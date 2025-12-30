/**
 * API Services Integration Examples
 *
 * This file demonstrates how to use the API services with toast notifications
 * in your React components.
 */

import { useState } from 'react';
import { toastService } from './toastService';
import {
  authService,
  churchService,
  unitService,
  bavanakutayimaService,
  houseService,
  memberService,
  userService,
  transactionService,
  campaignService,
  spiritualActivityService,
} from './apiServices';

// ============================================
// AUTHENTICATION EXAMPLES
// ============================================

export function LoginExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const toastId = toastService.info('Logging in...');

    try {
      const response = await authService.login({ email, password });

      if (response.success) {
        // Store tokens
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));

        toastService.modify(toastId, 'Login successful!', { type: 'success' });
      } else {
        toastService.modify(toastId, response.error || 'Login failed', { type: 'error' });
      }
    } catch (error: any) {
      toastService.modify(toastId, error.response?.data?.error || 'Login failed', { type: 'error' });
    }
  };

  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

// ============================================
// CRUD EXAMPLES - CHURCHES
// ============================================

export function ChurchesExample() {
  const [churches, setChurches] = useState<any[]>([]);

  // GET ALL
  const fetchChurches = async () => {
    try {
      const response = await churchService.getAll();
      if (response.success) {
        setChurches(response.data || []);
        toastService.success('Churches loaded successfully');
      }
    } catch (error: any) {
      toastService.error(error.response?.data?.error || 'Failed to load churches');
    }
  };

  // GET BY ID
  const fetchChurch = async (id: string) => {
    const toastId = toastService.info('Loading church...');

    try {
      const response = await churchService.getById(id);
      if (response.success) {
        toastService.modify(toastId, 'Church loaded!', { type: 'success' });
        return response.data;
      }
    } catch (error: any) {
      toastService.modify(toastId, 'Failed to load church', { type: 'error' });
    }
  };

  // CREATE
  const createChurch = async (data: any) => {
    const toastId = toastService.info('Creating church...');

    try {
      const response = await churchService.create(data);
      if (response.success) {
        toastService.modify(toastId, 'Church created successfully!', { type: 'success' });
        fetchChurches(); // Refresh list
      }
    } catch (error: any) {
      toastService.modify(toastId, error.response?.data?.error || 'Failed to create church', { type: 'error' });
    }
  };

  // UPDATE
  const updateChurch = async (id: string, data: any) => {
    const toastId = toastService.info('Updating church...');

    try {
      const response = await churchService.update(id, data);
      if (response.success) {
        toastService.modify(toastId, 'Church updated successfully!', { type: 'success' });
        fetchChurches(); // Refresh list
      }
    } catch (error: any) {
      toastService.modify(toastId, error.response?.data?.error || 'Failed to update church', { type: 'error' });
    }
  };

  // DELETE
  const deleteChurch = async (id: string) => {
    const toastId = toastService.warning('Deleting church...');

    try {
      const response = await churchService.delete(id);
      if (response.success) {
        toastService.modify(toastId, 'Church deleted successfully!', { type: 'success' });
        fetchChurches(); // Refresh list
      }
    } catch (error: any) {
      toastService.modify(toastId, error.response?.data?.error || 'Failed to delete church', { type: 'error' });
    }
  };

  return (
    <div>
      <button onClick={fetchChurches}>Load Churches</button>
      {/* Render churches list */}
    </div>
  );
}

// ============================================
// CRUD EXAMPLES - TRANSACTIONS
// ============================================

export function TransactionsExample() {
  const [transactions, setTransactions] = useState<any[]>([]);

  const createTransaction = async (transactionData: any) => {
    const toastId = toastService.info('Creating transaction...');

    try {
      const response = await transactionService.create(transactionData);

      if (response.success) {
        toastService.modify(toastId, 'Transaction created successfully!', { type: 'success' });

        // Refresh transactions list
        const listResponse = await transactionService.getAll();
        if (listResponse.success) {
          setTransactions(listResponse.data || []);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create transaction';
      toastService.modify(toastId, errorMessage, { type: 'error' });
    }
  };

  const updateTransaction = async (id: string, updates: any) => {
    const toastId = toastService.info('Updating transaction...');

    try {
      const response = await transactionService.update(id, updates);

      if (response.success) {
        toastService.modify(toastId, 'Transaction updated!', { type: 'success' });
      }
    } catch (error: any) {
      toastService.modify(toastId, 'Update failed!', { type: 'error' });
    }
  };

  return (
    <div>
      {/* Transaction form and list */}
    </div>
  );
}

// ============================================
// CRUD EXAMPLES - CAMPAIGNS
// ============================================

export function CampaignsExample() {
  const createCampaign = async (campaignData: any) => {
    const toastId = toastService.info('Creating campaign...');

    try {
      const response = await campaignService.create(campaignData);

      if (response.success) {
        toastService.modify(toastId, 'Campaign created successfully!', { type: 'success' });
      }
    } catch (error: any) {
      toastService.modify(toastId, 'Failed to create campaign', { type: 'error' });
    }
  };

  const deleteCampaign = async (id: string) => {
    // Ask for confirmation first
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    const toastId = toastService.warning('Deleting campaign...');

    try {
      const response = await campaignService.delete(id);

      if (response.success) {
        toastService.modify(toastId, 'Campaign deleted!', { type: 'success' });
      }
    } catch (error: any) {
      toastService.modify(toastId, 'Delete failed!', { type: 'error' });
    }
  };

  return null;
}

// ============================================
// COMPLETE COMPONENT EXAMPLE
// ============================================

export function MembersManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all members
  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await memberService.getAll();
      if (response.success) {
        setMembers(response.data || []);
        toastService.success(`Loaded ${response.data?.length} members`);
      }
    } catch (error: any) {
      toastService.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  // Create member
  const handleCreateMember = async (memberData: any) => {
    const toastId = toastService.info('Creating member...');

    try {
      const response = await memberService.create(memberData);

      if (response.success) {
        toastService.modify(toastId, 'Member created successfully!', { type: 'success' });
        loadMembers(); // Refresh list
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create member';
      toastService.modify(toastId, errorMessage, { type: 'error' });
    }
  };

  // Update member
  const handleUpdateMember = async (id: string, updates: any) => {
    const toastId = toastService.info('Updating member...');

    try {
      const response = await memberService.update(id, updates);

      if (response.success) {
        toastService.modify(toastId, 'Member updated!', { type: 'success' });
        loadMembers(); // Refresh list
      }
    } catch (error: any) {
      toastService.modify(toastId, 'Update failed!', { type: 'error' });
    }
  };

  // Delete member
  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) {
      return;
    }

    const toastId = toastService.warning('Deleting member...');

    try {
      const response = await memberService.delete(id);

      if (response.success) {
        toastService.modify(toastId, 'Member deleted!', { type: 'success' });
        loadMembers(); // Refresh list
      }
    } catch (error: any) {
      toastService.modify(toastId, 'Delete failed!', { type: 'error' });
    }
  };

  return (
    <div>
      <h1>Members Management</h1>
      <button onClick={loadMembers} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Members'}
      </button>

      {/* Members list */}
      <div>
        {members.map((member) => (
          <div key={member._id}>
            <span>{member.firstName} {member.lastName}</span>
            <button onClick={() => handleUpdateMember(member._id, { /* updates */ })}>
              Edit
            </button>
            <button onClick={() => handleDeleteMember(member._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ERROR HANDLING PATTERN
// ============================================

export function ErrorHandlingExample() {
  const handleApiCall = async () => {
    const toastId = toastService.info('Processing...');

    try {
      const response = await churchService.create({ /* data */ });

      if (response.success) {
        toastService.modify(toastId, 'Success!', { type: 'success' });
      } else {
        // API returned success: false
        toastService.modify(toastId, response.error || 'Operation failed', { type: 'error' });
      }
    } catch (error: any) {
      // Network error or API threw an error
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
      toastService.modify(toastId, errorMessage, { type: 'error' });

      // Log for debugging
      console.error('API Error:', error);
    }
  };

  return <button onClick={handleApiCall}>Test API Call</button>;
}
