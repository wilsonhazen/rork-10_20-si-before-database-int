import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { useInvites } from './InviteContext';
import type { Notification, NotificationType, NotificationPriority } from '@/types';

const NOTIFICATION_INTERVALS = {
  DAILY_REMINDER: 24 * 60 * 60 * 1000,
  ENGAGEMENT_CHECK: 6 * 60 * 60 * 1000,
  TRENDING_UPDATE: 12 * 60 * 60 * 1000,
  QUICK_CHECK: 2 * 60 * 60 * 1000,
  HOURLY_PULSE: 60 * 60 * 1000,
};

export const [NotificationEngineProvider, useNotificationEngine] = createContextHook(() => {
  const { user } = useAuth();
  const { 
    addNotification, 
    gigs, 
    deals, 
    applications, 
    matches, 
    conversations,
    notifications 
  } = useData();
  const { invites } = useInvites();

  const createNotification = useCallback((
    type: NotificationType,
    priority: NotificationPriority,
    title: string,
    message: string,
    options?: {
      relatedId?: string;
      actionUrl?: string;
      actionLabel?: string;
      imageUrl?: string;
      metadata?: any;
    }
  ) => {
    if (!user) return;

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type,
      priority,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      ...options,
    };

    addNotification(notification);
  }, [user, addNotification]);

  const checkNewMessages = useCallback(() => {
    if (!user) return;

    const unreadConversations = conversations.filter(
      c => c.participants.includes(user.id) && c.unreadCount > 0
    );

    if (unreadConversations.length > 0) {
      const recentMessageNotif = notifications
        .filter(n => n.userId === user.id && n.type === 'message')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      const lastNotifTime = recentMessageNotif ? new Date(recentMessageNotif.createdAt).getTime() : 0;
      const timeSinceLastNotif = Date.now() - lastNotifTime;
      
      if (timeSinceLastNotif < 5 * 60 * 1000) return;
      
      const totalUnread = unreadConversations.reduce((sum, c) => sum + c.unreadCount, 0);
      
      createNotification(
        'message',
        'high',
        `${totalUnread} New Message${totalUnread > 1 ? 's' : ''}`,
        `You have unread messages from ${unreadConversations.length} conversation${unreadConversations.length > 1 ? 's' : ''}`,
        {
          actionUrl: '/messages',
          actionLabel: 'View Messages',
        }
      );
    }
  }, [user, conversations, notifications, createNotification]);

  const checkPendingApplications = useCallback(() => {
    if (!user || user.role !== 'sponsor') return;

    const myGigs = gigs.filter(g => g.sponsorId === user.id);
    const pendingApps = applications.filter(
      a => myGigs.some(g => g.id === a.gigId) && a.status === 'pending'
    );

    if (pendingApps.length > 0) {
      const recentAppNotif = notifications
        .filter(n => n.userId === user.id && n.type === 'application')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      const lastNotifTime = recentAppNotif ? new Date(recentAppNotif.createdAt).getTime() : 0;
      const timeSinceLastNotif = Date.now() - lastNotifTime;
      
      if (timeSinceLastNotif < 30 * 60 * 1000) return;
      
      createNotification(
        'application',
        'high',
        `${pendingApps.length} Pending Application${pendingApps.length > 1 ? 's' : ''}`,
        `Review applications from talented influencers waiting for your response`,
        {
          actionUrl: '/gig-applicants',
          actionLabel: 'Review Now',
        }
      );
    }
  }, [user, gigs, applications, notifications, createNotification]);

  const checkNewMatches = useCallback(() => {
    if (!user) return;

    const recentMatches = matches.filter(m => {
      const matchDate = new Date(m.matchedAt);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return m.userId === user.id && matchDate > dayAgo;
    });

    if (recentMatches.length > 0) {
      createNotification(
        'match',
        'medium',
        `${recentMatches.length} New Match${recentMatches.length > 1 ? 'es' : ''}!`,
        `You have new potential collaborations waiting`,
        {
          actionUrl: '/ai-matching',
          actionLabel: 'View Matches',
        }
      );
    }
  }, [user, matches, createNotification]);

  const sendEngagementReminders = useCallback(() => {
    if (!user) return;

    const lastNotification = notifications
      .filter(n => n.userId === user.id && n.type === 'engagement')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const lastNotifTime = lastNotification ? new Date(lastNotification.createdAt).getTime() : 0;
    const timeSinceLastNotif = Date.now() - lastNotifTime;

    if (timeSinceLastNotif < NOTIFICATION_INTERVALS.ENGAGEMENT_CHECK) return;

    if (user.role === 'influencer') {
      const myApplications = applications.filter(a => a.influencerId === user.id);
      const activeDeals = deals.filter(d => d.influencerId === user.id && d.status === 'active');

      if (myApplications.length === 0) {
        createNotification(
          'engagement',
          'medium',
          '🎯 New Opportunities Available',
          'Browse trending gigs and apply to start earning today!',
          {
            actionUrl: '/search',
            actionLabel: 'Find Gigs',
          }
        );
      } else if (activeDeals.length === 0 && myApplications.length > 0) {
        createNotification(
          'engagement',
          'medium',
          '⏰ Applications Pending',
          'Your applications are being reviewed. Check for updates!',
          {
            actionUrl: '/my-applications',
            actionLabel: 'Check Status',
          }
        );
      }
    } else if (user.role === 'sponsor') {
      const myGigs = gigs.filter(g => g.sponsorId === user.id && g.status === 'open');
      
      if (myGigs.length === 0) {
        createNotification(
          'engagement',
          'medium',
          '📢 Post Your First Gig',
          'Connect with talented influencers by posting your campaign',
          {
            actionUrl: '/manage-gigs',
            actionLabel: 'Create Gig',
          }
        );
      } else {
        const gigsWithApps = myGigs.filter(g => 
          applications.some(a => a.gigId === g.id)
        );
        
        if (gigsWithApps.length > 0) {
          createNotification(
            'engagement',
            'medium',
            '👥 Influencers Are Interested!',
            'Check out who applied to your campaigns',
            {
              actionUrl: '/gig-applicants',
              actionLabel: 'View Applicants',
            }
          );
        }
      }
    } else if (user.role === 'agent') {
      const myDeals = deals.filter(d => d.agentId === user.id);
      
      if (myDeals.length === 0) {
        createNotification(
          'engagement',
          'medium',
          '💼 Start Earning Commissions',
          'Use AI matching to connect sponsors with influencers',
          {
            actionUrl: '/ai-matching',
            actionLabel: 'Start Matching',
          }
        );
      }
    }
  }, [user, applications, deals, gigs, notifications, createNotification]);

  const sendTrendingNotifications = useCallback(() => {
    if (!user || user.role !== 'influencer') return;

    const lastTrendingNotif = notifications
      .filter(n => n.userId === user.id && n.type === 'trending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const lastNotifTime = lastTrendingNotif ? new Date(lastTrendingNotif.createdAt).getTime() : 0;
    const timeSinceLastNotif = Date.now() - lastNotifTime;

    if (timeSinceLastNotif < NOTIFICATION_INTERVALS.TRENDING_UPDATE) return;

    const recentGigs = gigs
      .filter(g => g.status === 'open')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    if (recentGigs.length > 0) {
      const topGig = recentGigs[0];
      createNotification(
        'trending',
        'low',
        '🔥 Trending Opportunity',
        `${topGig.title} - $${topGig.price.toLocaleString()}`,
        {
          actionUrl: `/gig-details?id=${topGig.id}`,
          actionLabel: 'View Details',
          relatedId: topGig.id,
          imageUrl: topGig.sponsorAvatar,
        }
      );
    }
  }, [user, gigs, notifications, createNotification]);

  const sendMilestoneNotifications = useCallback(() => {
    if (!user) return;

    if (user.role === 'influencer') {
      const completedDeals = deals.filter(
        d => d.influencerId === user.id && d.status === 'completed'
      );
      const totalEarnings = completedDeals.reduce((sum, d) => sum + d.amount, 0);

      const milestones = [
        { count: 1, message: '🎉 First Deal Completed!' },
        { count: 5, message: '⭐ 5 Deals Milestone!' },
        { count: 10, message: '🏆 10 Deals Achievement!' },
        { count: 25, message: '💎 25 Deals - You\'re a Pro!' },
        { count: 50, message: '👑 50 Deals - Elite Status!' },
      ];

      const milestone = milestones.find(m => m.count === completedDeals.length);
      if (milestone) {
        createNotification(
          'milestone',
          'high',
          milestone.message,
          `You've earned $${totalEarnings.toLocaleString()} total. Keep it up!`,
          {
            actionUrl: '/profile',
            actionLabel: 'View Profile',
          }
        );
      }

      const earningMilestones = [1000, 5000, 10000, 25000, 50000, 100000];
      const earningMilestone = earningMilestones.find(m => 
        totalEarnings >= m && totalEarnings < m + 1000
      );
      
      if (earningMilestone) {
        createNotification(
          'milestone',
          'high',
          `💰 $${(earningMilestone / 1000)}K Earnings Milestone!`,
          `You've reached $${earningMilestone.toLocaleString()} in total earnings!`,
          {
            actionUrl: '/transactions',
            actionLabel: 'View Earnings',
          }
        );
      }
    }
  }, [user, deals, createNotification]);

  const sendOpportunityAlerts = useCallback(() => {
    if (!user || user.role !== 'influencer') return;

    const userProfile = user as any;
    const matchingGigs = gigs.filter(g => {
      if (g.status !== 'open') return false;
      
      const hasMatchingCategory = g.categories.some(cat => 
        userProfile.categories?.includes(cat)
      );
      
      const hasMatchingType = g.influencerTypes.includes(userProfile.influencerType);
      
      const isRecent = new Date(g.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
      
      return (hasMatchingCategory || hasMatchingType) && isRecent;
    });

    if (matchingGigs.length > 0) {
      const topMatch = matchingGigs[0];
      createNotification(
        'opportunity',
        'medium',
        '✨ Perfect Match Found!',
        `${topMatch.title} matches your profile - $${topMatch.price.toLocaleString()}`,
        {
          actionUrl: `/gig-details?id=${topMatch.id}`,
          actionLabel: 'Apply Now',
          relatedId: topMatch.id,
        }
      );
    }
  }, [user, gigs, createNotification]);

  const sendDealCompletionReminders = useCallback(() => {
    if (!user) return;

    const activeDeals = deals.filter(d => 
      (d.influencerId === user.id || d.sponsorId === user.id) && 
      d.status === 'active'
    );

    activeDeals.forEach(deal => {
      const dealAge = Date.now() - new Date(deal.createdAt).getTime();
      const daysOld = Math.floor(dealAge / (24 * 60 * 60 * 1000));

      if (daysOld >= 7 && daysOld % 7 === 0) {
        createNotification(
          'reminder',
          'medium',
          '⏰ Active Deal Reminder',
          `${deal.gigTitle} - Don't forget to complete your deliverables`,
          {
            actionUrl: '/deal-management',
            actionLabel: 'View Deal',
            relatedId: deal.id,
          }
        );
      }
    });
  }, [user, deals, createNotification]);

  const sendInactivityReminders = useCallback(() => {
    if (!user) return;

    const lastNotification = notifications
      .filter(n => n.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const lastActivityTime = lastNotification ? new Date(lastNotification.createdAt).getTime() : 0;
    const hoursSinceActivity = (Date.now() - lastActivityTime) / (60 * 60 * 1000);

    if (hoursSinceActivity >= 48) {
      createNotification(
        'engagement',
        'medium',
        '👋 We Miss You!',
        'Check out new opportunities and messages waiting for you',
        {
          actionUrl: '/home',
          actionLabel: 'Open App',
        }
      );
    }
  }, [user, notifications, createNotification]);

  const sendSuccessStories = useCallback(() => {
    if (!user) return;

    const recentCompletedDeals = deals.filter(d => {
      const completedDate = d.completedAt ? new Date(d.completedAt).getTime() : 0;
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return d.status === 'completed' && completedDate > dayAgo;
    });

    if (recentCompletedDeals.length >= 3) {
      createNotification(
        'achievement',
        'high',
        '🎊 Amazing Progress!',
        `${recentCompletedDeals.length} deals completed in the last 24 hours!`,
        {
          actionUrl: '/transactions',
          actionLabel: 'View Earnings',
        }
      );
    }
  }, [user, deals, createNotification]);

  const sendCompetitiveAlerts = useCallback(() => {
    if (!user || user.role !== 'influencer') return;

    const hotGigs = gigs.filter(g => {
      if (g.status !== 'open') return false;
      const gigAge = Date.now() - new Date(g.createdAt).getTime();
      const hoursOld = gigAge / (60 * 60 * 1000);
      return hoursOld < 6;
    });

    if (hotGigs.length > 0) {
      const topGig = hotGigs[0];
      createNotification(
        'opportunity',
        'high',
        '🔥 Hot Opportunity Alert!',
        `${topGig.title} just posted - Apply now before it fills up!`,
        {
          actionUrl: `/gig-details?id=${topGig.id}`,
          actionLabel: 'Apply Now',
          relatedId: topGig.id,
        }
      );
    }
  }, [user, gigs, createNotification]);

  const sendSocialProofNotifications = useCallback(() => {
    if (!user) return;

    const recentDeals = deals.filter(d => {
      const createdDate = new Date(d.createdAt).getTime();
      const hourAgo = Date.now() - 60 * 60 * 1000;
      return createdDate > hourAgo;
    });

    if (recentDeals.length >= 5) {
      createNotification(
        'trending',
        'medium',
        '🚀 Platform is Buzzing!',
        `${recentDeals.length} new deals created in the last hour. Don't miss out!`,
        {
          actionUrl: '/discover',
          actionLabel: 'Explore Now',
        }
      );
    }
  }, [user, deals, createNotification]);

  const sendPersonalizedRecommendations = useCallback(() => {
    if (!user || user.role !== 'influencer') return;

    const userProfile = user as any;
    const perfectMatches = gigs.filter(g => {
      if (g.status !== 'open') return false;
      
      const categoryMatch = g.categories.some(cat => 
        userProfile.categories?.includes(cat)
      );
      const typeMatch = g.influencerTypes.includes(userProfile.influencerType);
      const priceMatch = g.price >= (userProfile.ratePerPost * 0.8);
      
      return categoryMatch && typeMatch && priceMatch;
    });

    if (perfectMatches.length >= 3) {
      createNotification(
        'opportunity',
        'high',
        '💎 Perfect Matches Found!',
        `${perfectMatches.length} gigs match your profile perfectly`,
        {
          actionUrl: '/search',
          actionLabel: 'View Matches',
        }
      );
    }
  }, [user, gigs, createNotification]);

  const sendReEngagementPrompts = useCallback(() => {
    if (!user) return;

    const myApplications = applications.filter(a => a.influencerId === user.id);
    const pendingApps = myApplications.filter(a => a.status === 'pending');

    if (pendingApps.length > 0) {
      createNotification(
        'reminder',
        'medium',
        '⏳ Applications Pending Review',
        `You have ${pendingApps.length} application${pendingApps.length > 1 ? 's' : ''} waiting for sponsor response`,
        {
          actionUrl: '/my-applications',
          actionLabel: 'Check Status',
        }
      );
    }

    const unreadConvos = conversations.filter(
      c => c.participants.includes(user.id) && c.unreadCount > 0
    );

    if (unreadConvos.length > 0) {
      createNotification(
        'message',
        'high',
        '💬 Unread Messages',
        `${unreadConvos.length} conversation${unreadConvos.length > 1 ? 's' : ''} need${unreadConvos.length === 1 ? 's' : ''} your attention`,
        {
          actionUrl: '/messages',
          actionLabel: 'Reply Now',
        }
      );
    }
  }, [user, applications, conversations, createNotification]);

  const sendInviteWorkflowNotifications = useCallback(() => {
    if (!user || user.role !== 'agent') return;

    const agentInvites = invites.filter(i => i.agentId === user.id);
    const now = Date.now();

    agentInvites.forEach(invite => {
      if (invite.status === 'sent' && !invite.acceptedAt) {
        const sentTime = invite.sentAt ? new Date(invite.sentAt).getTime() : 0;
        const daysSinceSent = (now - sentTime) / (24 * 60 * 60 * 1000);

        if (daysSinceSent >= 7 && !invite.reminderSentAt) {
          const hasRecentReminder = notifications
            .filter(n => n.userId === user.id && n.relatedId === invite.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          
          const lastNotifTime = hasRecentReminder ? new Date(hasRecentReminder.createdAt).getTime() : 0;
          if (now - lastNotifTime < 24 * 60 * 60 * 1000) return;

          createNotification(
            'reminder',
            'medium',
            '⏰ Follow Up Needed',
            `${invite.contactName} hasn't responded to your invite in 7 days`,
            {
              actionUrl: '/agent-invites',
              actionLabel: 'Send Reminder',
              relatedId: invite.id,
            }
          );
        }

        if (daysSinceSent >= 14 && invite.reminderSentAt && !invite.secondReminderSentAt) {
          createNotification(
            'reminder',
            'medium',
            '📅 Second Follow Up',
            `Consider sending a second reminder to ${invite.contactName}`,
            {
              actionUrl: '/agent-invites',
              actionLabel: 'Follow Up',
              relatedId: invite.id,
            }
          );
        }

        if (daysSinceSent >= 28 && daysSinceSent < 30) {
          createNotification(
            'reminder',
            'low',
            '⌛ Invite Expiring Soon',
            `Your invite to ${invite.contactName} expires in ${Math.ceil(30 - daysSinceSent)} days`,
            {
              actionUrl: '/agent-invites',
              actionLabel: 'View Invite',
              relatedId: invite.id,
            }
          );
        }
      }

      if (invite.status === 'accepted' && invite.isVerified) {
        const hasSuccessNotif = notifications.some(
          n => n.userId === user.id && n.type === 'achievement' && n.relatedId === invite.id
        );

        if (!hasSuccessNotif) {
          const conversionDays = invite.acceptedWithinDays || 0;
          const isFastConversion = conversionDays <= 3;
          
          createNotification(
            'achievement',
            'high',
            isFastConversion ? '🎉 Lightning Fast Conversion!' : '✅ Invite Accepted!',
            isFastConversion 
              ? `${invite.contactName} joined in just ${conversionDays} day${conversionDays !== 1 ? 's' : ''}! Amazing work!`
              : `Great news! ${invite.contactName} has joined the platform through your invite`,
            {
              actionUrl: '/agent-invites',
              actionLabel: 'View Details',
              relatedId: invite.id,
            }
          );
        }
      }
    });
  }, [user, invites, notifications, createNotification]);

  useEffect(() => {
    if (!user) return;

    const hourlyInterval = setInterval(() => {
      sendCompetitiveAlerts();
      sendSocialProofNotifications();
      sendReEngagementPrompts();
      sendInviteWorkflowNotifications();
    }, NOTIFICATION_INTERVALS.HOURLY_PULSE);

    const quickCheckInterval = setInterval(() => {
      checkNewMessages();
      sendPersonalizedRecommendations();
    }, NOTIFICATION_INTERVALS.QUICK_CHECK);

    const engagementInterval = setInterval(() => {
      sendEngagementReminders();
      sendTrendingNotifications();
      sendOpportunityAlerts();
    }, NOTIFICATION_INTERVALS.ENGAGEMENT_CHECK);

    const dailyInterval = setInterval(() => {
      checkPendingApplications();
      checkNewMatches();
      sendMilestoneNotifications();
      sendDealCompletionReminders();
      sendInactivityReminders();
      sendSuccessStories();
    }, NOTIFICATION_INTERVALS.DAILY_REMINDER);

    return () => {
      clearInterval(hourlyInterval);
      clearInterval(quickCheckInterval);
      clearInterval(engagementInterval);
      clearInterval(dailyInterval);
    };
  }, [
    user,
    checkNewMessages,
    checkPendingApplications,
    checkNewMatches,
    sendEngagementReminders,
    sendTrendingNotifications,
    sendMilestoneNotifications,
    sendOpportunityAlerts,
    sendDealCompletionReminders,
    sendInactivityReminders,
    sendSuccessStories,
    sendCompetitiveAlerts,
    sendSocialProofNotifications,
    sendPersonalizedRecommendations,
    sendReEngagementPrompts,
    sendInviteWorkflowNotifications,
  ]);

  return useMemo(() => ({
    createNotification,
  }), [createNotification]);
});
