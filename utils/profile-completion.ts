import type { InfluencerProfile, SponsorProfile, AgentProfile, User } from '@/types';

export interface ProfileCompletionItem {
  label: string;
  isComplete: boolean;
  route?: string;
}

export interface ProfileCompletion {
  percentage: number;
  items: ProfileCompletionItem[];
  nextAction?: ProfileCompletionItem;
}

export function calculateInfluencerProfileCompletion(influencer: InfluencerProfile): ProfileCompletion {
  const items: ProfileCompletionItem[] = [
    {
      label: 'Add profile bio',
      isComplete: !!influencer.bio && influencer.bio.length > 20,
      route: '/edit-profile',
    },
    {
      label: 'Add profile photo',
      isComplete: !!influencer.avatar && !influencer.avatar.includes('pravatar'),
      route: '/edit-profile',
    },
    {
      label: 'Select influencer type',
      isComplete: !!influencer.influencerType,
      route: '/edit-profile',
    },
    {
      label: 'Add categories',
      isComplete: influencer.categories.length >= 2,
      route: '/edit-profile',
    },
    {
      label: 'Set location',
      isComplete: !!influencer.location,
      route: '/edit-profile',
    },
    {
      label: 'Set rate per post',
      isComplete: influencer.ratePerPost > 0,
      route: '/edit-profile',
    },
    {
      label: 'Verify social accounts',
      isComplete: influencer.socialAccounts ? influencer.socialAccounts.length >= 1 : false,
      route: '/verify-socials',
    },
    {
      label: 'Add portfolio items',
      isComplete: influencer.portfolio ? influencer.portfolio.length >= 2 : false,
      route: '/edit-profile',
    },
    {
      label: 'Verify Stripe account',
      isComplete: influencer.stripeVerificationStatus === 'verified',
      route: '/stripe-verification',
    },
    {
      label: 'Set payment preferences',
      isComplete: influencer.paymentPreferences ? influencer.paymentPreferences.length > 0 : false,
      route: '/edit-profile',
    },
  ];

  const completedCount = items.filter(item => item.isComplete).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const nextAction = items.find(item => !item.isComplete);

  return { percentage, items, nextAction };
}

export function calculateSponsorProfileCompletion(sponsor: SponsorProfile): ProfileCompletion {
  const items: ProfileCompletionItem[] = [
    {
      label: 'Add company description',
      isComplete: !!sponsor.description && sponsor.description.length > 20,
      route: '/edit-profile',
    },
    {
      label: 'Add profile photo',
      isComplete: !!sponsor.avatar && !sponsor.avatar.includes('pravatar'),
      route: '/edit-profile',
    },
    {
      label: 'Set company name',
      isComplete: !!sponsor.company,
      route: '/edit-profile',
    },
    {
      label: 'Set industry',
      isComplete: !!sponsor.industry,
      route: '/edit-profile',
    },
    {
      label: 'Set location',
      isComplete: !!sponsor.location,
      route: '/edit-profile',
    },
    {
      label: 'Add website',
      isComplete: !!sponsor.website,
      route: '/edit-profile',
    },
    {
      label: 'Verify Stripe account',
      isComplete: sponsor.stripeVerificationStatus === 'verified',
      route: '/stripe-verification',
    },
    {
      label: 'Post first gig',
      isComplete: false,
      route: '/manage-gigs',
    },
  ];

  const completedCount = items.filter(item => item.isComplete).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const nextAction = items.find(item => !item.isComplete);

  return { percentage, items, nextAction };
}

export function calculateAgentProfileCompletion(agent: AgentProfile): ProfileCompletion {
  const items: ProfileCompletionItem[] = [
    {
      label: 'Add bio',
      isComplete: !!agent.bio && agent.bio.length > 20,
      route: '/edit-profile',
    },
    {
      label: 'Add profile photo',
      isComplete: !!agent.avatar && !agent.avatar.includes('pravatar'),
      route: '/edit-profile',
    },
    {
      label: 'Add specialties',
      isComplete: agent.specialties ? agent.specialties.length >= 2 : false,
      route: '/edit-profile',
    },
    {
      label: 'Share referral code',
      isComplete: agent.recruits ? agent.recruits.length > 0 : false,
      route: '/agent-invites',
    },
    {
      label: 'Upgrade to Pro',
      isComplete: agent.isSubscribed,
      route: '/subscription-management',
    },
  ];

  const completedCount = items.filter(item => item.isComplete).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const nextAction = items.find(item => !item.isComplete);

  return { percentage, items, nextAction };
}

export function calculateProfileCompletion(
  user: InfluencerProfile | SponsorProfile | AgentProfile | User
): ProfileCompletion {
  switch (user.role) {
    case 'influencer':
      return calculateInfluencerProfileCompletion(user as InfluencerProfile);
    case 'sponsor':
      return calculateSponsorProfileCompletion(user as SponsorProfile);
    case 'agent':
      return calculateAgentProfileCompletion(user as AgentProfile);
    default:
      return { percentage: 0, items: [], nextAction: undefined };
  }
}
