export type UserRole = 'influencer' | 'sponsor' | 'agent' | 'admin';

export type PaymentMethod = 'stripe' | 'coinbase';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  referralCode?: string;
  referredBy?: string;
  rating?: number;
  reviewCount?: number;
  password?: string;
  stripeConnectedAccountId?: string;
  stripeOnboardingComplete?: boolean;
  stripeVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'failed';
  stripeVerifiedAt?: string;
}

export interface SocialAccount {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook';
  username: string;
  url: string;
  followers: number;
  isVerified: boolean;
  verifiedAt?: string;
  lastSynced?: string;
}

export type PaymentPreference = 'fiat' | 'crypto';
export type CryptoType = 'BTC' | 'ETH' | 'USDT' | 'USDC' | 'SOL';

export interface InfluencerProfile extends User {
  role: 'influencer';
  bio: string;
  influencerType: string;
  sports?: string[];
  categories: string[];
  location: string;
  followers: number;
  engagementRate: number;
  platforms: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  socialAccounts?: SocialAccount[];
  portfolio: PortfolioItem[];
  ratePerPost: number;
  paymentPreferences?: PaymentPreference[];
  acceptedCryptos?: CryptoType[];
}

export interface SponsorProfile extends User {
  role: 'sponsor';
  company: string;
  industry: string;
  location: string;
  website?: string;
  description: string;
}

export type AgentTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface AgentTierConfig {
  minDeals: number;
  maxDeals: number | null;
  commissionRate: number;
}

export const AGENT_TIER_THRESHOLDS: Record<AgentTier, AgentTierConfig> = {
  bronze: { minDeals: 0, maxDeals: 9, commissionRate: 0.10 },
  silver: { minDeals: 10, maxDeals: 24, commissionRate: 0.12 },
  gold: { minDeals: 25, maxDeals: 49, commissionRate: 0.15 },
  platinum: { minDeals: 50, maxDeals: null, commissionRate: 0.18 },
};

export interface AgentPerformanceMetrics {
  totalDeals: number;
  totalReferrals: number;
  verifiedReferrals: number;
  totalEarnings: number;
  averageConversionTime: number;
  responseTime: number;
  satisfactionScore: number;
  performanceScore: number;
  lastCalculatedAt: string;
}

export type AgentVerificationLevel = 'unverified' | 'email_verified' | 'phone_verified' | 'id_verified' | 'fully_verified';

export type AgentBadge = 'verified' | 'top_performer' | 'rising_star' | 'elite' | 'trusted' | 'pro' | '100_deals' | '500_deals' | '1000_deals' | 'mentor';

export interface AgentVerification {
  level: AgentVerificationLevel;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  phoneVerified: boolean;
  phoneVerifiedAt?: string;
  idVerified: boolean;
  idVerifiedAt?: string;
  idDocumentType?: 'passport' | 'drivers_license' | 'national_id' | 'stripe';
  verificationNotes?: string;
  verifiedBy?: string;
  lastVerificationCheck?: string;
}

export interface AgentBadgeInfo {
  badge: AgentBadge;
  earnedAt: string;
  icon: string;
  color: string;
  description: string;
}

export interface AgentProfile extends User {
  role: 'agent';
  bio: string;
  specialties: string[];
  isSubscribed: boolean;
  subscriptionExpiry?: string;
  totalEarnings: number;
  recruits: string[];
  tier?: AgentTier;
  performanceMetrics?: AgentPerformanceMetrics;
  autoPayoutThreshold?: number;
  nextPayoutDate?: string;
  verification?: AgentVerification;
  badges?: AgentBadgeInfo[];
  recruitSatisfactionScore?: number;
  recruitSatisfactionCount?: number;
}

export interface AdminProfile extends User {
  role: 'admin';
  permissions: string[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
  };
}

export interface Gig {
  id: string;
  sponsorId: string;
  sponsorName: string;
  sponsorAvatar?: string;
  title: string;
  description: string;
  price: number;
  budget: {
    min: number;
    max: number;
  };
  categories: string[];
  influencerTypes: string[];
  athleteSports?: string[];
  location?: string;
  requirements: string[];
  deliverables: string[];
  deadline?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Deal {
  id: string;
  gigId: string;
  gigTitle: string;
  influencerId: string;
  influencerName: string;
  influencerAvatar?: string;
  sponsorId: string;
  sponsorName: string;
  sponsorAvatar?: string;
  agentId?: string;
  agentName?: string;
  amount: number;
  agentCommission: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  paymentMethod?: PaymentMethod;
  contractHash?: string;
}

export interface Match {
  id: string;
  userId: string;
  targetId: string;
  targetName: string;
  targetAvatar?: string;
  targetRole: UserRole;
  matchedAt: string;
  gigId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  participantAvatars: (string | undefined)[];
  lastMessage?: Message;
  unreadCount: number;
  dealId?: string;
}

export interface Commission {
  id: string;
  agentId: string;
  dealId: string;
  amount: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface GigApplication {
  id: string;
  gigId: string;
  influencerId: string;
  influencerName: string;
  influencerAvatar?: string;
  influencerProfile: InfluencerProfile;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
  message?: string;
}

export type NotificationType = 
  | 'application' 
  | 'approval' 
  | 'rejection' 
  | 'message' 
  | 'deal' 
  | 'reward'
  | 'match'
  | 'gig_posted'
  | 'deal_completed'
  | 'payment_received'
  | 'milestone'
  | 'reminder'
  | 'engagement'
  | 'achievement'
  | 'trending'
  | 'opportunity';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  metadata?: {
    [key: string]: any;
  };
}

export type RewardTriggerType = 
  | 'account_created'
  | 'first_deal_completed'
  | 'referral_signup'
  | 'deals_milestone'
  | 'earnings_milestone'
  | 'profile_completed'
  | 'social_verified'
  | 'profile_verified'
  | 'wallet_connected'
  | 'daily_login'
  | 'post_content'
  | 'review_given'
  | 'profile_views'
  | 'gig_posted'
  | 'application_sent'
  | 'monthly_active'
  | 'perfect_rating'
  | 'fast_responder'
  | 'social_butterfly'
  | 'verified_referrals'
  | 'custom';

export type RewardType = 'points' | 'cash' | 'crypto' | 'badge';

export interface RewardTrigger {
  id: string;
  type: RewardTriggerType;
  name: string;
  description: string;
  conditions: {
    dealsCount?: number;
    earningsAmount?: number;
    referralsCount?: number;
    verifiedReferralsCount?: number;
    consecutiveDays?: number;
    viewsCount?: number;
    reviewsCount?: number;
    fastResponses?: number;
    connectionsCount?: number;
    customCondition?: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface RewardDefinition {
  id: string;
  triggerId: string;
  name: string;
  description: string;
  rewardType: RewardType;
  amount: number;
  currency?: string;
  cryptoWalletAddress?: string;
  badgeIcon?: string;
  badgeColor?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardDefinitionId: string;
  rewardName: string;
  rewardType: RewardType;
  amount: number;
  currency?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  earnedAt: string;
  claimedAt?: string;
  transactionHash?: string;
  metadata?: {
    dealId?: string;
    referralId?: string;
    milestone?: string;
  };
}

export interface CryptoWallet {
  id: string;
  userId: string;
  address: string;
  network: 'ethereum' | 'polygon' | 'solana' | 'bitcoin';
  isVerified: boolean;
  createdAt: string;
}

export type TransactionType = 
  | 'payment_in'
  | 'escrow_lock'
  | 'release'
  | 'commission_deduct'
  | 'agent_commission'
  | 'withdrawal'
  | 'refund';

export type TransactionStatus = 'pending' | 'completed' | 'failed';

export type CurrencyType = 'usd' | 'btc' | 'eth';

export interface TransactionAttribution {
  agentId?: string;
  recruitedType?: 'sponsor' | 'influencer' | 'both';
  splitPercentage?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  jobId?: string;
  gigId?: string;
  fromUser: string;
  toUser: string;
  amount: number;
  currency: CurrencyType;
  fee: number;
  attribution?: TransactionAttribution;
  status: TransactionStatus;
  timestamp: string;
  paymentId?: string;
  description?: string;
}

export interface UserBalance {
  userId: string;
  availableBalance: number;
  escrowBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  currency: CurrencyType;
  lastUpdated: string;
}

export type EscrowStatus = 
  | 'pending_payment'
  | 'payment_processing'
  | 'locked'
  | 'work_in_progress'
  | 'work_submitted'
  | 'under_review'
  | 'approved'
  | 'releasing'
  | 'released'
  | 'refunding'
  | 'refunded'
  | 'disputed';

export interface EscrowJob {
  id: string;
  gigId: string;
  applicationId: string;
  sponsorId: string;
  influencerId: string;
  amount: number;
  currency: CurrencyType;
  status: EscrowStatus;
  lockedAt: string;
  releasedAt?: string;
  sponsorAgentId?: string;
  influencerAgentId?: string;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  workSubmittedAt?: string;
  reviewStartedAt?: string;
  approvedAt?: string;
  disputeReason?: string;
  disputedAt?: string;
  metadata?: {
    workDescription?: string;
    deliverables?: string[];
    reviewNotes?: string;
    [key: string]: any;
  };
}

export interface Referral {
  id: string;
  agentId: string;
  recruitedUserId: string;
  recruitedUserType: 'sponsor' | 'influencer';
  recruitedAt: string;
  totalCommissionsEarned: number;
  isActive: boolean;
}

export type FeedActivityType = 
  | 'deal_booked'
  | 'gig_posted'
  | 'deal_completed'
  | 'influencer_joined'
  | 'sponsor_joined'
  | 'agent_joined'
  | 'milestone_reached'
  | 'trending_gig'
  | 'hot_deal'
  | 'reward_earned'
  | 'reward_claimed';

export interface FeedActivity {
  id: string;
  type: FeedActivityType;
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserAvatar?: string;
  gigId?: string;
  gigTitle?: string;
  dealId?: string;
  amount?: number;
  metadata?: {
    category?: string;
    location?: string;
    followers?: number;
    applicants?: number;
    [key: string]: any;
  };
}

export type InviteStatus = 'pending' | 'sent' | 'accepted' | 'expired';

export type InviteMethod = 'sms' | 'email' | 'both';

export type ContactSegment = 'hot' | 'warm' | 'cold' | 'converted' | 'unresponsive';

export interface ContactTag {
  id: string;
  name: string;
  color: string;
}

export interface ContactEngagement {
  totalInvitesSent: number;
  lastInviteSentAt?: string;
  openedCount: number;
  clickedCount: number;
  lastOpenedAt?: string;
  lastClickedAt?: string;
  responseRate: number;
}

export interface ContactReminder {
  id: string;
  contactId: string;
  scheduledFor: string;
  message: string;
  status: 'scheduled' | 'sent' | 'cancelled';
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  source: 'manual' | 'imported' | 'linkedin';
  addedAt: string;
  segment?: ContactSegment;
  tags?: string[];
  engagement?: ContactEngagement;
  notes?: string;
  lastContactedAt?: string;
  nextFollowUpDate?: string;
}

export interface Invite {
  id: string;
  agentId: string;
  contactId: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  method: InviteMethod;
  status: InviteStatus;
  referralCode: string;
  message: string;
  sentAt?: string;
  acceptedAt?: string;
  expiresAt?: string;
  reminderSentAt?: string;
  secondReminderSentAt?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  userId?: string;
  location?: string;
  templateId?: string;
  openedAt?: string;
  clickedAt?: string;
  acceptedWithinDays?: number;
}

export interface InviteTemplate {
  id: string;
  name: string;
  subject?: string;
  message: string;
  isDefault: boolean;
  createdAt: string;
  abTestVariant?: 'A' | 'B';
  timesUsed?: number;
  acceptanceRate?: number;
}

export interface InvitePerformanceMetrics {
  templateId: string;
  templateName: string;
  sent: number;
  accepted: number;
  verified: number;
  conversionRate: number;
  avgTimeToAccept?: number;
  contactsReached: number;
  emailSent?: number;
  smsSent?: number;
  emailAcceptanceRate?: number;
  smsAcceptanceRate?: number;
  avgConversionDays?: number;
}

export interface ReferralFunnelStage {
  stage: 'contacted' | 'sent' | 'opened' | 'clicked' | 'signed_up' | 'verified' | 'first_deal';
  count: number;
  percentage: number;
  dropoffFromPrevious?: number;
}

export interface ReferralFunnel {
  agentId: string;
  stages: ReferralFunnelStage[];
  overallConversionRate: number;
  totalContacted: number;
  totalVerified: number;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface ContactPerformance {
  contactId: string;
  contactName: string;
  contactEmail?: string;
  invitesSent: number;
  acceptanceStatus: 'accepted' | 'pending' | 'not_responded';
  signupDate?: string;
  verificationDate?: string;
  firstDealDate?: string;
  totalDealsValue: number;
  commissionGenerated: number;
  engagementScore: number;
  daysToConversion?: number;
}

export interface ABTestResults {
  templateAId: string;
  templateBId: string;
  templateAName: string;
  templateBName: string;
  variantASent: number;
  variantBSent: number;
  variantAAccepted: number;
  variantBAccepted: number;
  variantAConversionRate: number;
  variantBConversionRate: number;
  winner?: 'A' | 'B' | 'tie';
  confidenceLevel?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface ReferralInsights {
  bestPerformingTemplate: InvitePerformanceMetrics;
  worstPerformingTemplate: InvitePerformanceMetrics;
  bestPerformingContacts: ContactPerformance[];
  avgTimeToConversion: number;
  peakSendingTimes: { dayOfWeek: string; hour: number; successRate: number }[];
  recommendedActions: string[];
  geographicConversions?: { location: string; count: number; conversionRate: number }[];
  methodComparison?: { method: InviteMethod; sent: number; accepted: number; conversionRate: number }[];
}

export interface Review {
  id: string;
  dealId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  reviewerRole: UserRole;
  reviewedUserId: string;
  reviewedUserName: string;
  reviewedUserRole: UserRole;
  rating: number;
  comment: string;
  categories: {
    communication?: number;
    professionalism?: number;
    quality?: number;
    timeliness?: number;
    collaboration?: number;
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentReview {
  id: string;
  agentId: string;
  recruitId: string;
  recruitName: string;
  recruitAvatar?: string;
  recruitRole: 'sponsor' | 'influencer';
  rating: number;
  comment: string;
  categories: {
    support?: number;
    responsiveness?: number;
    expertise?: number;
    transparency?: number;
    professionalism?: number;
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AnalyticsDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ContentPerformance {
  id: string;
  portfolioItemId: string;
  title: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  postedAt: string;
  reachRate?: number;
  clickThroughRate?: number;
}

export interface AudienceDemographics {
  ageGroups: { range: string; percentage: number }[];
  genders: { gender: string; percentage: number }[];
  locations: { country: string; percentage: number }[];
  interests: { interest: string; percentage: number }[];
}

export interface PostingInsight {
  dayOfWeek: string;
  hour: number;
  averageEngagement: number;
  postCount: number;
}

export interface ROICalculation {
  campaignId: string;
  investment: number;
  revenue: number;
  roi: number;
  engagementValue: number;
  reachValue: number;
  conversionValue: number;
}

export interface Campaign {
  id: string;
  dealId: string;
  title: string;
  description: string;
  sponsorId: string;
  influencerId: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  milestones: CampaignMilestone[];
  contentCalendar: ContentCalendarItem[];
  drafts: ContentDraft[];
  performanceTracking: PerformanceMetrics[];
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMilestone {
  id: string;
  title: string;
  description: string;
  percentage: number;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'paid';
  dueDate?: string;
  completedAt?: string;
  paidAt?: string;
}

export interface ContentCalendarItem {
  id: string;
  title: string;
  description: string;
  platform: string;
  scheduledDate: string;
  status: 'scheduled' | 'draft' | 'posted' | 'cancelled';
  notes?: string;
}

export interface ContentDraft {
  id: string;
  title: string;
  description: string;
  platform: string;
  contentType: 'image' | 'video' | 'carousel' | 'story';
  mediaUrls: string[];
  caption?: string;
  hashtags?: string[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface PerformanceMetrics {
  id: string;
  contentId: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks?: number;
  conversions?: number;
  engagementRate: number;
}

export interface SavedGig {
  id: string;
  userId: string;
  gigId: string;
  savedAt: string;
  notes?: string;
}

export interface GigComparison {
  id: string;
  userId: string;
  gigIds: string[];
  createdAt: string;
  name?: string;
}

export interface BrandReputation {
  sponsorId: string;
  overallRating: number;
  paymentSpeedRating: number;
  communicationRating: number;
  professionalismRating: number;
  totalDeals: number;
  averagePaymentTime: number;
  reviewCount: number;
}

export interface InfluencerWishlist {
  id: string;
  sponsorId: string;
  influencerIds: string[];
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Negotiation {
  id: string;
  gigId: string;
  influencerId: string;
  sponsorId: string;
  status: 'open' | 'accepted' | 'rejected' | 'expired';
  offers: NegotiationOffer[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface NegotiationOffer {
  id: string;
  fromUserId: string;
  fromUserRole: UserRole;
  amount: number;
  deliverables: string[];
  timeline: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  createdAt: string;
  respondedAt?: string;
}

export interface MarketRateData {
  influencerType: string;
  followerRange: { min: number; max: number };
  averageRate: number;
  minRate: number;
  maxRate: number;
  engagementFactor: number;
}

export interface PackageDeal {
  id: string;
  name: string;
  description: string;
  postCount: number;
  totalAmount: number;
  discount: number;
  platforms: string[];
  deliverables: string[];
}

export interface MediaAsset {
  id: string;
  userId: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  tags: string[];
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
}

export interface MediaKit {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage?: string;
  sections: MediaKitSection[];
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaKitSection {
  id: string;
  type: 'bio' | 'stats' | 'portfolio' | 'testimonials' | 'rates' | 'contact';
  title: string;
  content: any;
  order: number;
}

export interface CaseStudy {
  id: string;
  userId: string;
  dealId: string;
  title: string;
  description: string;
  challenge: string;
  solution: string;
  results: string;
  metrics: {
    before: { [key: string]: number };
    after: { [key: string]: number };
    improvement: { [key: string]: number };
  };
  testimonial?: string;
  images: string[];
  createdAt: string;
  isPublic: boolean;
}

export interface AgentBonus {
  id: string;
  agentId: string;
  period: 'monthly' | 'quarterly';
  periodStart: string;
  periodEnd: string;
  bonusType: 'performance' | 'milestone' | 'tier_upgrade';
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  earnedAt: string;
  paidAt?: string;
  criteria: {
    dealsCompleted?: number;
    earningsGenerated?: number;
    tierAchieved?: AgentTier;
    conversionRate?: number;
  };
}

export interface AgentLeaderboardEntry {
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  tier: AgentTier;
  rank: number;
  performanceScore: number;
  totalEarnings: number;
  totalDeals: number;
  totalReferrals: number;
  badge?: string;
}

export interface AutoPayout {
  id: string;
  agentId: string;
  threshold: number;
  nextScheduledDate: string;
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
