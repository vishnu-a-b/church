// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin' | 'member';
  churchId?: string;
  unitId?: string;
  memberId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: 'super_admin' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin' | 'member';
  churchId?: string;
  unitId?: string;
  memberId?: string;
}

// Church Types
export interface Church {
  _id: string;
  name: string;
  location: string;
  diocese?: string;
  established?: Date;
  contactPerson?: string;
  phone?: string;
  email?: string;
  settings: ChurchSettings;
  churchNumber?: number;
  hierarchicalNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChurchSettings {
  smsEnabled: boolean;
  smsProvider: 'fast2sms' | 'msg91';
  smsApiKey?: string;
  smsSenderId: string;
  currency: string;
}

// Unit Types
export interface Unit {
  _id: string;
  churchId: string;
  name: string;
  unitNumber?: string;
  adminUserId?: string;
  hierarchicalNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bavanakutayima Types
export interface Bavanakutayima {
  _id: string;
  unitId: string;
  name: string;
  leaderName?: string;
  hierarchicalNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// House Types
export interface House {
  _id: string;
  bavanakutayimaId: string;
  familyName: string;
  headOfFamily?: string;
  address?: string;
  phone?: string;
  houseNumber?: string;
  hierarchicalNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Member Types
export interface Member {
  _id: string;
  houseId: string;
  firstName: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender: 'male' | 'female';
  phone?: string;
  email?: string;
  baptismName?: string;
  relationToHead: 'head' | 'spouse' | 'child' | 'parent' | 'other';
  isActive: boolean;
  smsPreferences: SMSPreferences;
  hierarchicalNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSPreferences {
  enabled: boolean;
  paymentNotifications: boolean;
  receiptNotifications: boolean;
}

// Wallet Types
export interface Wallet {
  _id: string;
  walletType: 'member' | 'house';
  ownerId: string;
  ownerModel: 'Member' | 'House';
  ownerName: string;
  balance: number;
  transactions: WalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  transactionId: string;
  amount: number;
  type: string;
  date: Date;
}

// Transaction Types
export type TransactionType = 'lelam' | 'thirunnaal_panam' | 'dashamansham' | 'spl_contribution' | 'stothrakazhcha';
export type ContributionMode = 'fixed' | 'variable';
export type Distribution = 'member_only' | 'house_only' | 'both';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque';

export interface Transaction {
  _id: string;
  receiptNumber: string;
  transactionType: TransactionType;
  contributionMode?: ContributionMode;
  campaignId?: string | { _id: string; name: string };
  distribution?: Distribution;
  memberAmount: number;
  houseAmount: number;
  totalAmount: number;
  memberId?: string | { _id: string; firstName: string; lastName: string; houseId?: string };
  houseId?: string | { _id: string; familyName: string };
  unitId?: string;
  churchId: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
  smsNotificationSent: boolean;
  smsLogId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign Types
export type CampaignType = 'stothrakazhcha' | 'spl_contribution';
export type AmountType = 'per_house' | 'per_member';

export interface Campaign {
  _id: string;
  churchId: string;
  campaignType: CampaignType;
  name: string;
  description?: string;
  contributionMode?: ContributionMode;
  fixedAmount: number;
  minimumAmount?: number;
  amountType: AmountType;
  startDate: Date;
  endDate?: Date;
  dueDate?: Date;
  isActive: boolean;
  totalCollected: number;
  participantCount: number;
  duesProcessed: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Spiritual Activity Types
export type ActivityType = 'mass' | 'fasting' | 'prayer';
export type PrayerType = 'rosary' | 'divine_mercy' | 'stations' | 'other';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface SpiritualActivity {
  _id: string;
  memberId: string;
  activityType: ActivityType;
  // Mass
  massDate?: Date;
  massAttended?: boolean;
  // Fasting
  fastingWeek?: string;
  fastingDays?: DayOfWeek[];
  // Prayer
  prayerType?: PrayerType;
  prayerCount?: number;
  prayerWeek?: string;
  // Self-reporting
  selfReported: boolean;
  reportedAt?: Date;
  // Verification
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// SMS Types
export interface SMSLog {
  _id: string;
  recipientType: 'member' | 'house_head';
  recipientId: string;
  recipientModel: 'Member' | 'House';
  recipientName: string;
  phoneNumber: string;
  messageType: 'payment_added' | 'receipt_confirmation';
  templateUsed?: string;
  messageContent: string;
  transactionId?: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'failed';
  deliveryStatus: DeliveryStatus;
  cost: number;
  createdAt: Date;
}

export interface DeliveryStatus {
  sentTo?: string;
  messageId?: string;
  deliveredAt?: Date;
  failureReason?: string;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Form Types
export interface TransactionFormData {
  transactionType: TransactionType;
  contributionMode?: ContributionMode;
  campaignId?: string;
  distribution?: Distribution;
  memberAmount?: number;
  houseAmount?: number;
  totalAmount: number;
  memberId?: string;
  houseId?: string;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  notes?: string;
}
