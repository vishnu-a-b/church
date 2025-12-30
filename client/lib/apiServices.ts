import api from './api';

// ============================================
// TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================
// GENERIC CRUD SERVICE
// ============================================

class CRUDService<T = any> {
  constructor(private endpoint: string) {}

  async getAll(): Promise<ApiResponse<T[]>> {
    const response = await api.get(`/${this.endpoint}`);
    return response.data;
  }

  async getById(id: string): Promise<ApiResponse<T>> {
    const response = await api.get(`/${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    const response = await api.post(`/${this.endpoint}`, data);
    return response.data;
  }

  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    const response = await api.put(`/${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/${this.endpoint}/${id}`);
    return response.data;
  }
}

// ============================================
// AUTHENTICATION SERVICE
// ============================================

export const authService = {
  async register(data: { username: string; email: string; password: string; role?: string }) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: { email: string; password: string }) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};

// ============================================
// ENTITY SERVICES
// ============================================

// Churches
export const churchService = new CRUDService('churches');

// Units
export const unitService = new CRUDService('units');

// Bavanakutayimas
export const bavanakutayimaService = new CRUDService('bavanakutayimas');

// Houses
export const houseService = new CRUDService('houses');

// Members
export const memberService = new CRUDService('members');

// Users
export const userService = new CRUDService('users');

// Transactions
export const transactionService = new CRUDService('transactions');

// Campaigns
export const campaignService = new CRUDService('campaigns');

// Spiritual Activities
export const spiritualActivityService = new CRUDService('spiritual-activities');

// ============================================
// EXPORT ALL SERVICES
// ============================================

export default {
  auth: authService,
  churches: churchService,
  units: unitService,
  bavanakutayimas: bavanakutayimaService,
  houses: houseService,
  members: memberService,
  users: userService,
  transactions: transactionService,
  campaigns: campaignService,
  spiritualActivities: spiritualActivityService,
};
