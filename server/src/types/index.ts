import { Request } from 'express';
import { Document, Types } from 'mongoose';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: IUser;
}

// User Types
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'super_admin' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin' | 'member' | 'donor';
  churchId?: Types.ObjectId;
  unitId?: Types.ObjectId;
  bavanakutayimaId?: Types.ObjectId;
  memberId?: Types.ObjectId;
  donorId?: Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Church Types
export interface IChurch extends Document {
  churchNumber: number;
  uniqueId: string;
  name: string;
  location: string;
  diocese?: string;
  established?: Date;
  contactPerson?: string;
  phone?: string;
  email?: string;
  settings: {
    smsEnabled: boolean;
    smsProvider: 'fast2sms' | 'msg91';
    smsApiKey?: string;
    smsSenderId: string;
    currency: string;
    edvApiKey?: string;
  };
}

// Unit Types
export interface IUnit extends Document {
  churchId: Types.ObjectId;
  unitNumber: number;
  uniqueId: string;
  name: string;
  unitCode?: string;
  adminUserId?: Types.ObjectId;
}

// Bavanakutayima Types
export interface IBavanakutayima extends Document {
  unitId: Types.ObjectId;
  bavanakutayimaNumber: number;
  uniqueId: string;
  name: string;
  leaderName?: string;
}

// House Types
export interface IHouse extends Document {
  bavanakutayimaId: Types.ObjectId;
  houseNumber: number;
  uniqueId: string;
  familyName: string;
  headOfFamily?: string;
  address?: string;
  phone?: string;
  houseCode?: string;
  hierarchicalNumber?: string; // Virtual field
}

// Member Types (Merged with User - all in one model)
export interface IMember extends Document {
  // Hierarchy references for fast filtering (denormalized)
  churchId: Types.ObjectId;
  unitId: Types.ObjectId;
  bavanakutayimaId: Types.ObjectId;
  houseId: Types.ObjectId;

  // Member identification
  memberNumber: number;
  uniqueId: string;

  // Personal information
  firstName: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender: 'male' | 'female';
  phone?: string;
  email?: string;
  baptismName?: string;
  relationToHead: 'head' | 'spouse' | 'child' | 'parent' | 'other';

  // Login credentials (optional - not all members need login access)
  username?: string;
  password?: string;
  role: 'super_admin' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin' | 'member';
  lastLogin?: Date;
  refreshToken?: string;

  // Status and preferences
  isActive: boolean;
  smsPreferences: {
    enabled: boolean;
    paymentNotifications: boolean;
    receiptNotifications: boolean;
  };

  // Email verification and preferences
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailNotificationsEnabled: boolean;

  hierarchicalNumber?: string; // Virtual field

  // Method for password comparison
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Wallet Types
export interface IWallet extends Document {
  walletType: 'member' | 'house';
  ownerId: Types.ObjectId;
  ownerModel: 'Member' | 'House';
  ownerName: string;
  balance: number;
  transactions: Array<{
    transactionId: Types.ObjectId;
    amount: number;
    type: string;
    date: Date;
  }>;
}

// Transaction Types
export type TransactionType = 'lelam' | 'thirunnaal_panam' | 'dashamansham' | 'spl_contribution' | 'stothrakazhcha' | 'general_fund' | 'building_fund' | 'charity' | 'other' | 'monthly_support' | 'thirukkarmangal' | 'pathavarm';
export type ContributionMode = 'fixed' | 'variable';
export type Distribution = 'member_only' | 'house_only' | 'both';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque';

export interface ITransaction extends Document {
  receiptNumber: string;
  transactionType: TransactionType;
  contributionMode?: ContributionMode;
  campaignId?: Types.ObjectId;
  monthlySupportPlanId?: Types.ObjectId;
  distribution?: Distribution;
  memberAmount: number;
  houseAmount: number;
  totalAmount: number;
  memberId?: Types.ObjectId;
  houseId?: Types.ObjectId;
  donorId?: Types.ObjectId;
  unitId?: Types.ObjectId;
  churchId: Types.ObjectId;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  notes?: string;
  smsNotificationSent: boolean;
  smsLogId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  edvSynced: boolean;
  edvVoucherId?: string;
  edvSyncError?: string;
  edvSyncedAt?: Date;
  // Thirukkarmangal-only fields — populated only when transactionType === 'thirukkarmangal'
  riteId?: Types.ObjectId;
  splitBreakdown?: Array<{
    recipientLabel: string;
    percent: number;
    amount: number;
  }>;
}

// Thirukkarmangal (Sacred Rites) master rate list
export type ThirukkarmangalCategory = 'holy_masses' | 'feast_day_rites' | 'blessings' | 'deceased_rites' | 'other_rites';

export interface IThirukkarmangalRite extends Document {
  churchId: Types.ObjectId;
  category: ThirukkarmangalCategory;
  code: string;
  nameMalayalam: string;
  nameEnglish: string;
  amount: number;
  sortOrder: number;
  isActive: boolean;
  split: Array<{
    recipientLabel: string;
    percent: number;
  }>;
  splitConfigured: boolean;
  createdBy?: Types.ObjectId;
}

// Campaign Types
export type CampaignType = 'spl_contribution' | 'general_fund' | 'building_fund' | 'charity' | 'other';
export type AmountType = 'per_house' | 'per_member' | 'flexible';
export type CampaignTargetType = 'all' | 'specific_members' | 'specific_houses';

export interface ICampaign extends Document {
  churchId: Types.ObjectId;
  campaignType: CampaignType;
  name: string;
  description?: string;
  contributionMode: ContributionMode;
  fixedAmount?: number;
  minimumAmount?: number;
  amountType: AmountType;
  isCompulsory: boolean;
  targetType: CampaignTargetType;
  specificTargets?: Array<{
    targetId: Types.ObjectId;
    targetModel: 'Member' | 'House';
    amount: number;
  }>;
  contributors?: Array<{
    contributorId: Types.ObjectId;
    contributedAmount: number;
    contributedAt: Date;
  }>;
  duesProcessed: boolean;
  startDate: Date;
  endDate?: Date;
  dueDate?: Date;
  isActive: boolean;
  totalCollected: number;
  participantCount: number;
  createdBy?: Types.ObjectId;
}

// Stothrakazhcha Types
export type StothrakazhchaStatus = 'active' | 'closed' | 'processed';

export interface IStothrakazhcha extends Document {
  churchId: Types.ObjectId;
  weekNumber: number;
  year: number;
  weekStartDate: Date;
  weekEndDate: Date;
  dueDate: Date;
  defaultAmount: number;
  amountType: AmountType;
  status: StothrakazhchaStatus;
  contributors?: Array<{
    contributorId: Types.ObjectId;
    contributorType: 'Member' | 'House';
    amount: number;
    transactionId?: Types.ObjectId;
    contributedAt: Date;
    approvalStatus?: ApprovalStatus;
    markedBy?: Types.ObjectId;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    rejectedReason?: string;
  }>;
  totalCollected: number;
  totalContributors: number;
  duesProcessed: boolean;
  duesProcessedAt?: Date;
  createdBy?: Types.ObjectId;
}

// Stothrakazhcha Due Types
export interface IStothrakazhchaDue extends Document {
  churchId: Types.ObjectId;
  stothrakazhchaId: Types.ObjectId;
  weekNumber: number;
  year: number;
  dueForId: Types.ObjectId;
  dueForModel: 'Member' | 'House';
  dueForName: string;
  amount: number;
  isPaid: boolean;
  paidAmount: number;
  balance: number;
  transactionId?: Types.ObjectId;
  paidAt?: Date;
  dueDate: Date;
  createdAt: Date;
  notes?: string;
}

export interface ICampaignDue extends Document {
  churchId: Types.ObjectId;
  campaignId: Types.ObjectId;
  campaignName: string;
  dueForId: Types.ObjectId;
  dueForModel: 'Member' | 'House';
  dueForName: string;
  amount: number;
  isPaid: boolean;
  paidAmount: number;
  balance: number;
  transactionId?: Types.ObjectId;
  paidAt?: Date;
  dueDate: Date;
  createdAt: Date;
  notes?: string;
}

// Donor Types (outside supporters — not part of the church membership hierarchy)
export interface IDonor extends Document {
  churchId: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  // Login credentials (mirrors Member — a donor is not part of the House/Unit
  // hierarchy, so this can't reuse the shared User model's church-scoped auth)
  username?: string;
  password?: string;
  role: 'donor';
  lastLogin?: Date;
  refreshToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Monthly Support Types
export interface IMonthlySupportPlan extends Document {
  churchId: Types.ObjectId;
  name: string;
  description?: string;
  defaultAmount: number;
  treatment: 'income' | 'liability';
  dayOfMonth: number;
  members: Array<{
    memberId?: Types.ObjectId;
    donorId?: Types.ObjectId;
    amount?: number;
    drawnAt?: Date;
    drawId?: Types.ObjectId;
    skippedPeriods?: string[];
  }>;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdBy?: Types.ObjectId;
}

export interface IMonthlySupportDue extends Document {
  churchId: Types.ObjectId;
  planId: Types.ObjectId;
  planName: string;
  periodMonth: string; // "YYYY-MM"
  dueForId: Types.ObjectId;
  dueForModel: 'Member' | 'Donor';
  dueForName: string;
  amount: number;
  isPaid: boolean;
  paidAmount: number;
  balance: number;
  transactionId?: Types.ObjectId;
  paidAt?: Date;
  dueDate: Date;
  createdAt: Date;
  notes?: string;
}

// A single "draw of lots" event for a liability-treatment Monthly Support
// plan (e.g. hall booking deposits). 'complete' winners have their remaining
// installments waived from the following month onward (deposit treated as
// complete); 'skip_next' winners only skip skipPeriodMonth, then resume.
export interface IMonthlySupportDraw extends Document {
  churchId: Types.ObjectId;
  planId: Types.ObjectId;
  planName: string;
  drawnAt: Date;
  drawType: 'complete' | 'skip_next';
  skipPeriodMonth?: string; // "YYYY-MM", set only when drawType is 'skip_next'
  poolSize: number;
  winners: Array<{
    dueForId: Types.ObjectId;
    dueForModel: 'Member' | 'Donor';
    dueForName: string;
  }>;
  conductedBy?: Types.ObjectId;
  notes?: string;
}

// Spiritual Activity Types
export type ActivityType = 'mass' | 'fasting' | 'prayer';
export type PrayerType = 'rosary' | 'divine_mercy' | 'stations' | 'other';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ISpiritualActivity extends Document {
  memberId: Types.ObjectId;
  activityType: ActivityType;
  massDate?: Date;
  massAttended?: boolean;
  fastingWeek?: string;
  fastingDays?: DayOfWeek[];
  prayerType?: PrayerType;
  prayerCount?: number;
  prayerWeek?: string;
  selfReported: boolean;
  reportedAt?: Date;
  /** @deprecated superseded by approvalStatus/markedBy/approvedBy/approvedAt */
  verifiedBy?: Types.ObjectId;
  /** @deprecated superseded by approvalStatus/markedBy/approvedBy/approvedAt */
  verifiedAt?: Date;
  approvalStatus?: ApprovalStatus;
  markedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedReason?: string;
}

export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

// SMS Log Types
export interface ISMSLog extends Document {
  recipientType: 'member' | 'house_head';
  recipientId: Types.ObjectId;
  recipientModel: 'Member' | 'House';
  recipientName: string;
  phoneNumber: string;
  messageType: 'payment_added' | 'receipt_confirmation';
  templateUsed?: string;
  messageContent: string;
  transactionId?: Types.ObjectId;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'failed';
  deliveryStatus: {
    sentTo?: string;
    messageId?: string;
    deliveredAt?: Date;
    failureReason?: string;
  };
  cost: number;
}

// SMS Service Types
export interface SMSConfig {
  enabled: boolean;
  provider: string;
  fast2sms: {
    apiKey: string;
    senderId: string;
    baseUrl: string;
  };
}

export interface SMSPayload {
  phoneNumber: string;
  message: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// News Types
export type NewsContentType = 'text' | 'image' | 'video';

export interface INews extends Document {
  churchId: Types.ObjectId;
  title: string;
  contentType: NewsContentType;
  content: string; // Text content
  mediaUrl?: string; // URL for image or video
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
}

// Event Types
export type EventContentType = 'text' | 'image' | 'video';

export interface IEvent extends Document {
  churchId: Types.ObjectId;
  title: string;
  contentType: EventContentType;
  content: string; // Text content or description
  mediaUrl?: string; // URL for image or video
  location?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
}
