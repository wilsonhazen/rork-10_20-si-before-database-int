import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  Users,
  Briefcase,
  TrendingUp,
  Search,
  MessageCircle,
  DollarSign,
  Gift,
  CheckCircle2,
  FileText,
  Star,
  Shield,
  Award,
  Coins,
  BadgeCheck,
  Trophy,
  UserCheck,
  Bell,
  Tag
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  items: HelpItem[];
}

interface HelpItem {
  question: string;
  answer: string;
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Star,
    items: [
      {
        question: 'How do I create an account?',
        answer: 'When you first open the app, you\'ll see the onboarding screen. Choose your role (Influencer, Sponsor, or Agent) and complete the profile setup with your information. You can always switch roles later from your profile settings.'
      },
      {
        question: 'What are the different user roles?',
        answer: 'Influencer: Showcase your portfolio and apply for brand deals.\nSponsor: Post gigs and find influencers for your campaigns.\nAgent: Recruit users and earn 15% commission on their deals.\nAdmin: Manage platform operations and rewards.'
      },
      {
        question: 'How do I switch between roles?',
        answer: 'Go to your Profile tab, tap "Switch Role", and select your desired role. Your profile data will be preserved when switching.'
      }
    ]
  },
  {
    id: 'influencers',
    title: 'For Influencers',
    icon: Users,
    items: [
      {
        question: 'How do I verify my social accounts?',
        answer: 'Go to Profile > Verify Social Accounts. Add your social media platforms (Instagram, TikTok, YouTube, Twitter, Facebook) with your username, URL, and follower count. Verified accounts build trust with sponsors and increase your chances of getting deals.'
      },
      {
        question: 'How do I find and apply for gigs?',
        answer: 'Use the Discover tab to browse available gigs, or use the Search tab to filter by category, location, budget, and influencer type. Tap on any gig to view details, then tap "Apply" to submit your application.'
      },
      {
        question: 'How do I track my applications?',
        answer: 'Go to Profile > My Applications to see all gigs you\'ve applied to. Applications are organized by status: Pending (awaiting review), Approved (you got the gig!), or Rejected.'
      },
      {
        question: 'What happens after I\'m approved?',
        answer: 'Once approved, the sponsor will initiate payment through escrow. You\'ll receive a notification and can start working on the deliverables. After completion, the sponsor releases payment from escrow to your account.'
      },
      {
        question: 'How do I get paid?',
        answer: 'Payments are held in escrow until you complete the deliverables. Once the sponsor approves your work, funds are released to your account. You can withdraw via Stripe or Coinbase from the Earnings section.'
      }
    ]
  },
  {
    id: 'sponsors',
    title: 'For Sponsors',
    icon: Briefcase,
    items: [
      {
        question: 'How do I create a gig?',
        answer: 'Go to Profile > Manage Gigs and tap the "+" button. Fill in the gig details including title, description, budget range, categories, influencer types, requirements, and deliverables. For athletes, you can select specific sports subcategories.'
      },
      {
        question: 'How do I review applications?',
        answer: 'Go to Profile > Manage Gigs, select a gig, and tap "View Applicants". Review each influencer\'s profile, stats, and verified social accounts. Approve or reject applications with optional feedback.'
      },
      {
        question: 'How does payment work?',
        answer: 'When you approve an influencer, you\'ll be prompted to lock funds in escrow. The payment is held securely until the influencer completes the deliverables. Review their work and release payment when satisfied.'
      },
      {
        question: 'Can I edit or cancel a gig?',
        answer: 'Yes, go to Profile > Manage Gigs and select the gig you want to modify. You can edit details or change the status to cancelled. Note: Active deals cannot be cancelled without mutual agreement.'
      },
      {
        question: 'How do I find the right influencer?',
        answer: 'Use the Search tab to filter influencers by type (athlete, lifestyle, tech, etc.), location, follower count, and engagement rate. Review their verified social accounts and portfolio before posting a gig or sending a direct offer.'
      }
    ]
  },
  {
    id: 'agents',
    title: 'For Agents',
    icon: TrendingUp,
    items: [
      {
        question: 'How does the agent program work?',
        answer: 'As an agent, you earn commission on all deals made by users you recruit. The platform earns commission on deals by default, but when you recruit an influencer or sponsor, you earn the commission from their deals instead. Share your unique referral code to grow your network.'
      },
      {
        question: 'What are agent tiers?',
        answer: 'Agents are ranked in three tiers based on performance:\n\nBronze: Entry level (0-10 recruits) - Standard commission rates\nSilver: Mid-level (11-25 recruits) - Enhanced commission rates + priority support\nGold: Elite level (26+ recruits) - Highest commission rates + exclusive benefits + dedicated account manager\n\nYour tier is automatically updated as you grow your network.'
      },
      {
        question: 'What are auto-payout thresholds?',
        answer: 'Configure automatic payouts when your balance reaches your chosen threshold:\n\n• $100 threshold - Weekly auto-payouts\n• $500 threshold - Bi-weekly auto-payouts\n• $1,000 threshold - Monthly auto-payouts\n\nSet this up in Profile > Agent Dashboard > Payment Settings. You can also manually withdraw anytime.'
      },
      {
        question: 'Where is my referral code?',
        answer: 'Your referral code is displayed prominently on your Profile screen. Tap the copy icon to share it with potential recruits via social media, email, or messaging apps.'
      },
      {
        question: 'How do I track my earnings?',
        answer: 'Go to Profile > Agent Dashboard to see your total earnings, active recruits, pending commissions, agent tier, performance score, and payment history. View detailed analytics and transaction breakdowns.'
      },
      {
        question: 'What is agent performance score?',
        answer: 'Your performance score is calculated based on:\n• Number of active recruits\n• Total deal volume from your network\n• Recruit retention rate\n• Deal completion rate\n\nHigher scores unlock bonus structures and better commission rates.'
      },
      {
        question: 'When do I get paid?',
        answer: 'Commissions are paid when the deals your recruits complete are finalized. Funds are added to your available balance and can be withdrawn via Stripe or Coinbase. Set up auto-payouts for automatic transfers at your chosen threshold.'
      },
      {
        question: 'How does agent verification work?',
        answer: 'Complete Stripe verification to receive payments and earn verified badges. Verified agents get:\n• Verified Agent badge on profile\n• Higher trust from potential recruits\n• Access to payment features\n• Performance badges (Top Performer, Rising Star)\n\nGo to Profile > Agent Dashboard > Verify Account to start.'
      },
      {
        question: 'What is the Pro subscription?',
        answer: 'The Pro subscription ($80/month) unlocks advanced agent features including priority support, detailed analytics, bulk referral tools, and higher commission rates on certain deal types.'
      }
    ]
  },
  {
    id: 'search-discover',
    title: 'Search & Discovery',
    icon: Search,
    items: [
      {
        question: 'How do I use the Search tab?',
        answer: 'The Search tab lets you filter opportunities by multiple criteria: influencer type, sports (for athletes), location, budget range, and categories. Apply filters and tap "Find Opportunities" to see matching gigs.'
      },
      {
        question: 'What is the Discover tab?',
        answer: 'The Discover tab shows all available gigs in a scrollable feed. Each card displays the gig title, sponsor, budget, categories, and key details. Tap any gig to view full details and apply.'
      },
      {
        question: 'How do I view gig details?',
        answer: 'Tap on any gig card from Discover or Search results. You\'ll see the full description, requirements, deliverables, deadline, and sponsor information. From here you can apply or save for later.'
      },
      {
        question: 'Can I save gigs to apply later?',
        answer: 'Currently, you can view gig details and apply immediately. We recommend applying quickly as popular gigs receive many applications and may close early.'
      }
    ]
  },
  {
    id: 'messaging',
    title: 'Messaging & Communication',
    icon: MessageCircle,
    items: [
      {
        question: 'How do I message other users?',
        answer: 'Go to the Messages tab to see all your conversations. You can message sponsors, influencers, or agents you\'re working with. Conversations are automatically created when you match or start a deal.'
      },
      {
        question: 'Can I message before applying to a gig?',
        answer: 'Currently, messaging is enabled after you apply to a gig or are approved. This helps maintain quality interactions and reduces spam.'
      },
      {
        question: 'How do I know if I have new messages?',
        answer: 'The Messages tab shows a badge with your unread message count. You\'ll also receive push notifications for new messages (if enabled in settings).'
      }
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Transactions',
    icon: DollarSign,
    items: [
      {
        question: 'What payment methods are supported?',
        answer: 'We support Stripe (for USD payments) and Coinbase (for cryptocurrency). You can add and manage payment methods in Profile > Payment Methods.'
      },
      {
        question: 'How does escrow work?',
        answer: 'Escrow protects both parties. Sponsors lock payment when approving an influencer. Funds are held securely until the influencer completes deliverables. The sponsor then releases payment, ensuring fair transactions.'
      },
      {
        question: 'What are the fees?',
        answer: 'Platform fee is 10% added on top of the payment amount. For example, if a sponsor pays an influencer $100, the total payment is $110 ($100 to influencer + $10 fee). The platform earns the commission unless an agent recruited either party - then the agent earns the commission. Agent commissions vary by tier (Bronze/Silver/Gold). Payment processing fees (Stripe/Coinbase) are deducted from withdrawals. View detailed fee breakdowns in the Transactions section.'
      },
      {
        question: 'How do I withdraw my earnings?',
        answer: 'Go to Profile > Earnings, select your available balance, choose a payment method (Stripe or Coinbase), enter the amount, and confirm. Withdrawals typically process within 2-5 business days.'
      },
      {
        question: 'Can I view my transaction history?',
        answer: 'Yes, go to Profile > Transactions to see all your payment activity including incoming payments, escrow locks, releases, commissions, and withdrawals with timestamps and status.'
      }
    ]
  },
  {
    id: 'rewards',
    title: 'Rewards & Incentives',
    icon: Gift,
    items: [
      {
        question: 'How does the rewards system work?',
        answer: 'The Source Impact rewards system incentivizes platform engagement and success. Complete milestones to earn rewards in multiple forms: Points (redeemable for benefits), Cash (USD added to your balance), Crypto (IMPACT tokens valued at $1 each), and Badges (displayed on your profile). Rewards are automatically tracked and awarded when you complete milestones. You can claim pending rewards from the Rewards tab. All crypto rewards will be integrated with your wallet soon.'
      },
      {
        question: 'What rewards can I earn?',
        answer: 'See the Rewards Table below for a complete breakdown of all available rewards, their requirements, and what you\'ll receive for each milestone. Rewards range from welcome bonuses to major milestone achievements.'
      },
      {
        question: 'Where can I see my rewards?',
        answer: 'Go to the Rewards tab to view all your earned rewards, pending rewards, and available rewards to claim. Each reward shows its type (Points, Cash, Crypto, Badge), amount, status (Pending, Processing, Completed), and when you earned it.'
      },
      {
        question: 'How do I claim rewards?',
        answer: 'In the Rewards tab, tap on any reward with "Pending" status and select "Claim Reward". Cash rewards are added to your available balance for withdrawal. Crypto rewards will be sent to your connected wallet (coming soon). Points are added to your points balance. Badges appear on your profile automatically.'
      },
      {
        question: 'What are reward points used for?',
        answer: 'Points can be redeemed for platform benefits like featured profile placement, priority support, exclusive access to premium gigs, or converted to cash/crypto at specified rates. Check the Rewards section for current redemption options and point values.'
      },
      {
        question: 'How do crypto rewards work?',
        answer: 'Crypto rewards are paid in IMPACT tokens, our platform cryptocurrency valued at $1 per token. Add your crypto wallet in the Rewards tab to receive payments. Once you claim a crypto reward, it will be processed and sent to your wallet address. You\'ll receive a transaction hash for verification. Crypto integration is coming soon - rewards will be held until wallets are connected.'
      },
      {
        question: 'Can I lose rewards or badges?',
        answer: 'Once claimed, cash and crypto rewards are permanently yours. Points remain in your account until redeemed. Badges are permanent achievements that cannot be removed. Unclaimed rewards remain available indefinitely - there\'s no expiration.'
      }
    ]
  },
  {
    id: 'feed',
    title: 'Activity Feed',
    icon: FileText,
    items: [
      {
        question: 'What is the Feed tab?',
        answer: 'The Feed shows real-time platform activity: new deals booked, gigs posted, deals completed, new users joining, and trending opportunities. It\'s a great way to stay updated and discover hot deals.'
      },
      {
        question: 'How can I use the feed to find opportunities?',
        answer: 'Watch for "Gig Posted" activities to see new opportunities as they\'re created. Tap on any feed item to view details and take action. Popular gigs often appear as "Trending" or "Hot Deal" items.'
      },
      {
        question: 'Can I filter the feed?',
        answer: 'Currently, the feed shows all activity types. You can scroll through to find relevant updates. We recommend checking the feed daily to stay on top of new opportunities.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Settings',
    icon: Shield,
    items: [
      {
        question: 'How do I edit my profile?',
        answer: 'Go to Profile > Edit Profile to update your name, bio, location, categories, rate per post (influencers), company info (sponsors), or specialties (agents). Changes are saved automatically.'
      },
      {
        question: 'How do I change my password?',
        answer: 'Go to Profile > Settings > Security to change your password. You\'ll need to enter your current password and confirm the new one.'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, go to Profile > Settings > Account and select "Delete Account". Note: This action is permanent and will remove all your data, including active deals and earnings history.'
      },
      {
        question: 'How do I enable notifications?',
        answer: 'Go to Profile > Settings > Notifications to customize which alerts you receive: new messages, deal updates, application status, rewards earned, and more.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes, we use industry-standard encryption for all data transmission and storage. Payment information is handled by Stripe and Coinbase, never stored on our servers. Your social account data is only used for verification.'
      }
    ]
  },
  {
    id: 'invites',
    title: 'Invite System',
    icon: UserCheck,
    items: [
      {
        question: 'How do I invite contacts?',
        answer: 'Go to Profile > Invite Contacts to import from your phone or manually add contacts. You can invite via SMS or email using customizable templates. Track all your invites and their status in one place.'
      },
      {
        question: 'What are contact segments?',
        answer: 'Organize contacts with tags:\n\n• Hot Leads - High priority, ready to join\n• Warm Leads - Interested, need follow-up\n• Cold Leads - Initial contact, low engagement\n\nUse segments to target your outreach and track which contacts convert best.'
      },
      {
        question: 'What are automated reminders?',
        answer: 'The system automatically sends:\n\n• 7-day reminder - First follow-up if no action\n• 14-day reminder - Second follow-up if no action\n• 30-day expiration - Invite expires and archives\n\nYou can also manually resend invites anytime before expiration.'
      },
      {
        question: 'How do I track invite performance?',
        answer: 'Go to Profile > Agent Dashboard > Invite Analytics to see:\n• Acceptance rate by method (SMS vs Email)\n• Best performing templates\n• Time-to-conversion metrics\n• Geographic conversion patterns\n• Open rates and engagement tracking\n\nUse these insights to optimize your invite strategy.'
      },
      {
        question: 'Can I customize invite messages?',
        answer: 'Yes! When sending invites, you can choose from pre-made templates or write custom messages. Personalized messages typically have higher acceptance rates.'
      },
      {
        question: 'What happens when someone accepts?',
        answer: 'When your invite is accepted, you\'ll receive a success notification. The contact becomes part of your network, and you start earning commission on their deals. They\'re automatically linked to your referral code.'
      }
    ]
  },
  {
    id: 'gamification',
    title: 'Leaderboards & Achievements',
    icon: Trophy,
    items: [
      {
        question: 'What are leaderboards?',
        answer: 'Compete with other agents on multiple leaderboards:\n\n• Top Earners This Month\n• Most Recruits This Quarter\n• Highest Conversion Rate\n• Fastest Growing Agent\n\nLeaderboards reset monthly/quarterly and winners receive bonus rewards.'
      },
      {
        question: 'How do achievements work?',
        answer: 'Earn achievement badges by hitting milestones:\n\n• "First Recruit" - Recruit your first user\n• "10 Active Recruits" - Build a network of 10+\n• "Platinum Agent" - Reach Gold tier status\n• "$10K Earnings Club" - Earn $10,000+ total\n\nAchievements appear on your profile and earn you rewards.'
      },
      {
        question: 'What do I win on leaderboards?',
        answer: 'Top positions earn monthly/quarterly bonuses:\n\n1st Place: Cash bonus + Exclusive badge + Feature placement\n2nd-3rd Place: Cash bonus + Recognition badge\n4th-10th Place: Points + Recognition\n\nExact rewards vary by leaderboard and competition period.'
      },
      {
        question: 'Where can I see my achievements?',
        answer: 'Go to Profile > Achievements to view all your earned badges, progress toward locked achievements, and achievement rarity stats. Your most prestigious badges display on your public profile.'
      },
      {
        question: 'How do I climb the leaderboards?',
        answer: 'Focus on:\n• Recruiting quality users who complete deals\n• Maintaining high conversion rates\n• Building an active network\n• Consistent monthly performance\n\nStrategic recruiting beats volume - engaged recruits drive better results.'
      }
    ]
  },
  {
    id: 'contact-management',
    title: 'Contact Management',
    icon: Tag,
    items: [
      {
        question: 'How do I import contacts?',
        answer: 'Go to Profile > Invite Contacts and tap "Import from Phone". Grant contacts permission when prompted. You can also manually add contacts by entering their name, phone, and email.'
      },
      {
        question: 'How do I segment my contacts?',
        answer: 'Tag contacts as Hot/Warm/Cold leads to organize your outreach:\n\n• Hot: Ready to join, high priority\n• Warm: Interested, needs nurturing\n• Cold: Initial contact only\n\nTap any contact to add or change tags. Filter by tag to view specific segments.'
      },
      {
        question: 'What is engagement tracking?',
        answer: 'Track invite interactions:\n• Message opened/viewed\n• Link clicked\n• App downloaded\n• Sign-up completed\n\nEngagement data helps you identify interested prospects and optimize follow-up timing.'
      },
      {
        question: 'How do automated follow-ups work?',
        answer: 'Set up automatic follow-up sequences in Profile > Agent Dashboard > Automation Settings:\n\n• Choose follow-up intervals (3, 7, 14 days)\n• Select message templates\n• Set maximum follow-up attempts\n\nThe system handles reminders automatically while you focus on high-value activities.'
      },
      {
        question: 'Can I import from LinkedIn?',
        answer: 'LinkedIn integration coming soon! You\'ll be able to import professional contacts and track professional network growth. For now, use phone contacts or manual entry.'
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications & Alerts',
    icon: Bell,
    items: [
      {
        question: 'What notifications can I receive?',
        answer: 'Customize alerts for:\n• New messages\n• Deal updates\n• Application status changes\n• Rewards earned\n• Invite acceptances\n• Payment confirmations\n• Agent milestone achievements\n• Leaderboard position changes\n\nManage preferences in Profile > Settings > Notifications.'
      },
      {
        question: 'How do invite reminders work?',
        answer: 'Receive automatic reminders to follow up on pending invites:\n• Daily digest of pending invites\n• Alerts when contacts engage\n• Expiration warnings (3 days before)\n• Success celebrations on acceptance\n\nKeep your pipeline active without manual tracking.'
      },
      {
        question: 'What are smart notifications?',
        answer: 'The notification engine learns your patterns and sends intelligent alerts:\n• Best time to send invites\n• Optimal follow-up timing\n• Deal opportunities for your recruits\n• Performance insights\n\nSmart notifications help you work more efficiently.'
      }
    ]
  },
  {
    id: 'verification',
    title: 'Agent Verification & Trust',
    icon: BadgeCheck,
    items: [
      {
        question: 'Why should I verify my account?',
        answer: 'Verified agents enjoy:\n• Verified Agent badge on profile\n• Higher trust and conversion rates\n• Access to payment features\n• Ability to earn and withdraw commissions\n• Performance badges eligibility\n• Priority support access\n\nVerification is required to receive payments.'
      },
      {
        question: 'How do I verify with Stripe?',
        answer: 'Go to Profile > Agent Dashboard > Verify Account. Complete Stripe identity verification by providing:\n• Government-issued ID\n• Personal information\n• Bank account details\n\nVerification typically completes within 24-48 hours. You must verify before earning commissions.'
      },
      {
        question: 'What are performance badges?',
        answer: 'Earn badges based on achievements:\n• Top Performer - Top 10% in earnings\n• Rising Star - Fastest growth rate\n• Consistent Achiever - 6+ months active\n• Quality Recruiter - High recruit retention\n\nBadges display on your profile and build credibility.'
      },
      {
        question: 'What are recruit satisfaction scores?',
        answer: 'Your recruits can rate their experience with you. High satisfaction scores (4.5+) unlock benefits:\n• Featured agent placement\n• Bonus commission rates\n• Exclusive opportunities\n\nProvide great support to your recruits to maintain high scores.'
      },
      {
        question: 'Can I add a bio or specialization?',
        answer: 'Yes! Go to Profile > Edit Profile to add:\n• Agent bio (your story and approach)\n• Specialization areas (influencer types, industries)\n• Experience level\n• Success stories\n\nDetailed profiles attract better recruits.'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: CheckCircle2,
    items: [
      {
        question: 'I can\'t see my applications',
        answer: 'Make sure you\'re logged in as an Influencer and have applied to at least one gig. Go to Profile > My Applications. If the issue persists, try logging out and back in.'
      },
      {
        question: 'My gig isn\'t showing in search results',
        answer: 'Ensure your gig status is "open" in Manage Gigs. Check that you\'ve filled in all required fields including categories and influencer types. New gigs may take a few minutes to appear in search.'
      },
      {
        question: 'Payment is stuck in escrow',
        answer: 'Escrow payments require sponsor approval after deliverables are completed. Contact the sponsor via Messages to confirm completion. If there\'s a dispute, contact support from Profile > Settings > Help.'
      },
      {
        question: 'I\'m not receiving notifications',
        answer: 'Check Profile > Settings > Notifications to ensure alerts are enabled. Also verify your device notification settings allow the app to send notifications.'
      },
      {
        question: 'The app is running slowly',
        answer: 'Try closing and reopening the app. Clear your device cache if the issue persists. Make sure you\'re running the latest version of the app.'
      },
      {
        question: 'Contact import shows duplicate contacts',
        answer: 'If you see duplicate contacts or incorrect data when importing from your phone, try:\n1. Grant fresh contacts permission (Settings > App Permissions)\n2. Close and reopen the app\n3. Use "Refresh Contacts" button\n4. Manually remove duplicates by tapping the contact\n\nIf issues persist, contact support.'
      },
      {
        question: 'My invites are not being delivered',
        answer: 'Check that:\n• Contact has valid phone/email\n• You have SMS/email permissions enabled\n• Contact hasn\'t blocked messages\n• Invite template is not marked as spam\n\nTry resending or using alternate method (SMS vs Email).'
      },
      {
        question: 'Leaderboard ranking is not updating',
        answer: 'Leaderboards update hourly. If your stats aren\'t showing:\n• Wait for next hourly update\n• Ensure recent deals are finalized\n• Check that you\'re viewing correct time period (monthly vs quarterly)\n\nRankings appear within 1 hour of deal completion.'
      }
    ]
  }
];

interface RewardRow {
  action: string;
  requirement: string;
  points?: number;
  cash?: string;
  crypto?: string;
  badge?: string;
}

const rewardsTable: RewardRow[] = [
  {
    action: 'Create Account',
    requirement: 'Sign up and complete onboarding',
    points: 100,
    crypto: '0.5 IMPACT',
    badge: 'Welcome Badge',
  },
  {
    action: 'Complete Profile',
    requirement: 'Fill in all profile information',
    points: 25,
  },
  {
    action: 'Verify Social Accounts',
    requirement: 'Verify at least one social platform',
    points: 50,
    badge: 'Verified Badge',
  },
  {
    action: 'First Deal',
    requirement: 'Complete your first deal',
    cash: '$50',
    crypto: '2 IMPACT',
    badge: 'First Deal Badge',
  },
  {
    action: 'Refer 1 Person',
    requirement: 'Someone signs up with your referral code',
    points: 50,
    crypto: '1 IMPACT',
  },
  {
    action: '5 Deals Milestone',
    requirement: 'Complete 5 deals',
    cash: '$100',
    crypto: '3 IMPACT',
  },
  {
    action: 'Refer 5 People',
    requirement: 'Recruit 5 users to the platform',
    cash: '$100',
    crypto: '5 IMPACT',
    badge: 'Recruiter Badge',
  },
  {
    action: '10 Deals Milestone',
    requirement: 'Complete 10 deals',
    cash: '$200',
    crypto: '5 IMPACT',
    badge: 'Rising Star Badge',
  },
  {
    action: 'Refer 10 People',
    requirement: 'Recruit 10 users to the platform',
    cash: '$250',
    crypto: '12 IMPACT',
    badge: 'Super Recruiter Badge',
  },
  {
    action: '$1,000 Earnings',
    requirement: 'Earn $1,000 total from deals',
    crypto: '10 IMPACT',
    badge: 'High Earner Badge',
  },
  {
    action: '25 Deals Milestone',
    requirement: 'Complete 25 deals',
    cash: '$500',
    crypto: '15 IMPACT',
    badge: 'Elite Performer Badge',
  },
  {
    action: '$5,000 Earnings',
    requirement: 'Earn $5,000 total from deals',
    crypto: '25 IMPACT',
    badge: 'Top Earner Badge',
  },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showRewardsTable, setShowRewardsTable] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleItem = (itemKey: string) => {
    setExpandedItems(prev => 
      prev.includes(itemKey) 
        ? prev.filter(key => key !== itemKey)
        : [...prev, itemKey]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Help & Support',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
        }} 
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>How can we help you?</Text>
          <Text style={styles.headerSubtitle}>
            Find answers to common questions and learn how to use all features
          </Text>
        </LinearGradient>

        <View style={styles.sectionsContainer}>
          {helpSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.includes(section.id);

            return (
              <View key={section.id} style={styles.sectionCard}>
                <TouchableOpacity
                  onPress={() => toggleSection(section.id)}
                  style={styles.sectionHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <View style={styles.sectionIconContainer}>
                      <Icon size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronDown size={20} color={Colors.textSecondary} />
                  ) : (
                    <ChevronRight size={20} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.itemsContainer}>
                    {section.items.map((item, index) => {
                      const itemKey = `${section.id}-${index}`;
                      const isItemExpanded = expandedItems.includes(itemKey);

                      return (
                        <View key={itemKey} style={styles.itemCard}>
                          <TouchableOpacity
                            onPress={() => toggleItem(itemKey)}
                            style={styles.itemHeader}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.itemQuestion}>{item.question}</Text>
                            {isItemExpanded ? (
                              <ChevronDown size={16} color={Colors.primary} />
                            ) : (
                              <ChevronRight size={16} color={Colors.textSecondary} />
                            )}
                          </TouchableOpacity>

                          {isItemExpanded && (
                            <Text style={styles.itemAnswer}>{item.answer}</Text>
                          )}
                        </View>
                      );
                    })}

                    {section.id === 'rewards' && (
                      <View style={styles.rewardsTableContainer}>
                        <TouchableOpacity
                          onPress={() => setShowRewardsTable(!showRewardsTable)}
                          style={styles.rewardsTableButton}
                          activeOpacity={0.7}
                        >
                          <View style={styles.rewardsTableButtonLeft}>
                            <Award size={20} color={Colors.primary} />
                            <Text style={styles.rewardsTableButtonText}>View Rewards Table</Text>
                          </View>
                          {showRewardsTable ? (
                            <ChevronDown size={20} color={Colors.primary} />
                          ) : (
                            <ChevronRight size={20} color={Colors.textSecondary} />
                          )}
                        </TouchableOpacity>

                        {showRewardsTable && (
                          <View style={styles.rewardsTable}>
                            <View style={styles.tableHeader}>
                              <Text style={[styles.tableHeaderText, styles.tableColAction]}>Action</Text>
                              <Text style={[styles.tableHeaderText, styles.tableColReward]}>Rewards</Text>
                            </View>

                            {rewardsTable.map((row, index) => (
                              <View key={index} style={styles.tableRow}>
                                <View style={styles.tableColAction}>
                                  <Text style={styles.tableActionText}>{row.action}</Text>
                                  <Text style={styles.tableRequirementText}>{row.requirement}</Text>
                                </View>
                                <View style={styles.tableColReward}>
                                  {row.points && (
                                    <View style={styles.rewardItem}>
                                      <Coins size={14} color={Colors.warning} />
                                      <Text style={styles.rewardText}>{row.points} pts</Text>
                                    </View>
                                  )}
                                  {row.cash && (
                                    <View style={styles.rewardItem}>
                                      <DollarSign size={14} color={Colors.success} />
                                      <Text style={styles.rewardText}>{row.cash}</Text>
                                    </View>
                                  )}
                                  {row.crypto && (
                                    <View style={styles.rewardItem}>
                                      <TrendingUp size={14} color={Colors.accent} />
                                      <Text style={styles.rewardText}>{row.crypto}</Text>
                                    </View>
                                  )}
                                  {row.badge && (
                                    <View style={styles.rewardItem}>
                                      <BadgeCheck size={14} color={Colors.primary} />
                                      <Text style={styles.rewardText}>{row.badge}</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            ))}

                            <View style={styles.tableFooter}>
                              <Text style={styles.tableFooterText}>
                                All rewards are automatically tracked. IMPACT tokens are valued at $1 each and will be sent to your connected wallet once integration is complete.
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.contactCard}>
          <LinearGradient
            colors={[Colors.darkCard, Colors.backgroundSecondary]}
            style={styles.contactGradient}
          >
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactText}>
              Contact our support team for personalized assistance
            </Text>
            <TouchableOpacity style={styles.contactButton}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.contactButtonGradient}
              >
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Contact Support</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  headerGradient: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  sectionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  itemCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemQuestion: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  itemAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.darkCard,
  },
  contactCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  contactGradient: {
    padding: 24,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  contactButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  rewardsTableContainer: {
    marginTop: 12,
  },
  rewardsTableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  rewardsTableButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardsTableButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  rewardsTable: {
    marginTop: 12,
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '20',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '40',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  tableColAction: {
    flex: 1.2,
    paddingRight: 12,
  },
  tableColReward: {
    flex: 1,
    gap: 6,
  },
  tableActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  tableRequirementText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  tableFooter: {
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  tableFooterText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic' as const,
  },
});
