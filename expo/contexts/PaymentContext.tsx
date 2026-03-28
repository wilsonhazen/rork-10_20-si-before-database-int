import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { 
  Transaction, 
  UserBalance, 
  EscrowJob, 
  Referral,
  TransactionAttribution,
  CurrencyType,
  GigApplication,
  Gig,
  EscrowStatus,
  Notification,
  AgentTier,
  AgentPerformanceMetrics,
  AgentBonus,
  AgentLeaderboardEntry,
  AutoPayout,
} from '@/types';
import { AGENT_TIER_THRESHOLDS } from '@/types';
import { StripeEscrowIntegration } from '@/utils/payment-integration';

const TRANSACTIONS_KEY = '@sourceimpact_transactions';
const BALANCES_KEY = '@sourceimpact_balances';
const ESCROW_JOBS_KEY = '@sourceimpact_escrow_jobs';
const REFERRALS_KEY = '@sourceimpact_referrals';
const AGENT_BONUSES_KEY = '@sourceimpact_agent_bonuses';
const AUTO_PAYOUTS_KEY = '@sourceimpact_auto_payouts';

const PLATFORM_FEE_RATE = 0.10;

export const [PaymentProvider, usePayment] = createContextHook(() => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [escrowJobs, setEscrowJobs] = useState<EscrowJob[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [agentBonuses, setAgentBonuses] = useState<AgentBonus[]>([]);
  const [autoPayouts, setAutoPayouts] = useState<AutoPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transactionsData, balancesData, escrowJobsData, referralsData, bonusesData, payoutsData] = await Promise.all([
        AsyncStorage.getItem(TRANSACTIONS_KEY),
        AsyncStorage.getItem(BALANCES_KEY),
        AsyncStorage.getItem(ESCROW_JOBS_KEY),
        AsyncStorage.getItem(REFERRALS_KEY),
        AsyncStorage.getItem(AGENT_BONUSES_KEY),
        AsyncStorage.getItem(AUTO_PAYOUTS_KEY),
      ]);

      if (transactionsData) setTransactions(JSON.parse(transactionsData));
      if (balancesData) setBalances(JSON.parse(balancesData));
      if (escrowJobsData) setEscrowJobs(JSON.parse(escrowJobsData));
      if (referralsData) setReferrals(JSON.parse(referralsData));
      if (bonusesData) setAgentBonuses(JSON.parse(bonusesData));
      if (payoutsData) setAutoPayouts(JSON.parse(payoutsData));
    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrCreateBalance = useCallback(async (userId: string, currency: CurrencyType = 'usd'): Promise<UserBalance> => {
    let balance = balances.find(b => b.userId === userId && b.currency === currency);
    
    if (!balance) {
      balance = {
        userId,
        availableBalance: 0,
        escrowBalance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
        currency,
        lastUpdated: new Date().toISOString(),
      };
      const updated = [...balances, balance];
      setBalances(updated);
      await AsyncStorage.setItem(BALANCES_KEY, JSON.stringify(updated));
    }
    
    return balance;
  }, [balances]);

  const updateBalance = useCallback(async (userId: string, updates: Partial<UserBalance>) => {
    const updated = balances.map(b => 
      b.userId === userId ? { ...b, ...updates, lastUpdated: new Date().toISOString() } : b
    );
    setBalances(updated);
    await AsyncStorage.setItem(BALANCES_KEY, JSON.stringify(updated));
  }, [balances]);

  const addTransaction = useCallback(async (transaction: Transaction) => {
    const updated = [...transactions, transaction];
    setTransactions(updated);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));

  }, [transactions]);

  const getAttributingAgent = useCallback((
    sponsorId: string,
    influencerId: string
  ): TransactionAttribution | null => {
    const sponsorReferral = referrals.find(r => r.recruitedUserId === sponsorId && r.isActive);
    const influencerReferral = referrals.find(r => r.recruitedUserId === influencerId && r.isActive);

    if (sponsorReferral && influencerReferral) {
      if (sponsorReferral.agentId === influencerReferral.agentId) {
        return {
          agentId: sponsorReferral.agentId,
          recruitedType: 'both',
          splitPercentage: 100,
        };
      } else {

        return {
          agentId: sponsorReferral.agentId,
          recruitedType: 'both',
          splitPercentage: 50,
        };
      }
    } else if (sponsorReferral) {

      return {
        agentId: sponsorReferral.agentId,
        recruitedType: 'sponsor',
        splitPercentage: 100,
      };
    } else if (influencerReferral) {

      return {
        agentId: influencerReferral.agentId,
        recruitedType: 'influencer',
        splitPercentage: 100,
      };
    }

    return null;
  }, [referrals]);

  const sendNotification = useCallback(async (notification: Notification) => {

  }, []);

  const updateEscrowStatus = useCallback(async (
    escrowJobId: string,
    status: EscrowStatus,
    metadata?: Partial<EscrowJob>
  ) => {
    const updatedEscrowJobs = escrowJobs.map(e => 
      e.id === escrowJobId 
        ? { ...e, status, ...metadata }
        : e
    );
    setEscrowJobs(updatedEscrowJobs);
    await AsyncStorage.setItem(ESCROW_JOBS_KEY, JSON.stringify(updatedEscrowJobs));
  }, [escrowJobs]);

  const lockFundsInEscrow = useCallback(async (
    gig: Gig,
    application: GigApplication,
    amount: number,
    currency: CurrencyType = 'usd',
    onNotification?: (notification: Notification) => Promise<void>
  ) => {
    const commission = amount * PLATFORM_FEE_RATE;
    const totalAmount = amount + commission;
    
    const sponsorBalance = await getOrCreateBalance(gig.sponsorId, currency);
    
    if (sponsorBalance.availableBalance < totalAmount) {
      throw new Error(`Insufficient funds. Need ${totalAmount.toFixed(2)} (${amount.toFixed(2)} to influencer + ${commission.toFixed(2)} platform fee)`);
    }


    const stripeResult = await StripeEscrowIntegration.createEscrowPayment(
      gig.sponsorId,
      application.influencerId,
      totalAmount,
      currency,
      {
        gigId: gig.id,
        applicationId: application.id,
        gigTitle: gig.title,
        influencerAmount: amount.toFixed(2),
        platformFee: commission.toFixed(2),
      }
    );

    if (!stripeResult.success) {
      throw new Error(stripeResult.error || 'Failed to process payment');
    }

    const escrowJob: EscrowJob = {
      id: `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gigId: gig.id,
      applicationId: application.id,
      sponsorId: gig.sponsorId,
      influencerId: application.influencerId,
      amount: totalAmount,
      currency,
      status: 'locked',
      lockedAt: new Date().toISOString(),
      stripePaymentIntentId: stripeResult.paymentIntentId,
    };

    const sponsorReferral = referrals.find(r => r.recruitedUserId === gig.sponsorId && r.isActive);
    const influencerReferral = referrals.find(r => r.recruitedUserId === application.influencerId && r.isActive);
    
    if (sponsorReferral) escrowJob.sponsorAgentId = sponsorReferral.agentId;
    if (influencerReferral) escrowJob.influencerAgentId = influencerReferral.agentId;

    const updatedEscrowJobs = [...escrowJobs, escrowJob];
    setEscrowJobs(updatedEscrowJobs);
    await AsyncStorage.setItem(ESCROW_JOBS_KEY, JSON.stringify(updatedEscrowJobs));

    console.log(`[Escrow Workflow] Step 2: Updating sponsor balance`);
    await updateBalance(gig.sponsorId, {
      availableBalance: sponsorBalance.availableBalance - totalAmount,
      escrowBalance: sponsorBalance.escrowBalance + totalAmount,
    });

    await addTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'escrow_lock',
      jobId: escrowJob.id,
      gigId: gig.id,
      fromUser: gig.sponsorId,
      toUser: 'escrow',
      amount: totalAmount,
      currency,
      fee: commission,
      status: 'completed',
      timestamp: new Date().toISOString(),
      description: `Funds locked for ${gig.title} (${amount.toFixed(2)} to influencer + ${commission.toFixed(2)} platform fee)`,
    });

    console.log(`[Escrow Workflow] Step 3: Sending notifications`);
    const influencerNotification: Notification = {
      id: `notif_${Date.now()}_1`,
      userId: application.influencerId,
      type: 'deal',
      priority: 'high',
      title: 'Funds Locked in Escrow! 🎉',
      message: `${gig.sponsorName} has locked ${amount.toFixed(2)} in escrow for "${gig.title}". You can now start working on the project!`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: gig.id,
    };

    const sponsorNotification: Notification = {
      id: `notif_${Date.now()}_2`,
      userId: gig.sponsorId,
      type: 'deal',
      priority: 'medium',
      title: 'Escrow Payment Successful',
      message: `${totalAmount.toFixed(2)} has been locked in escrow for "${gig.title}" (${amount.toFixed(2)} to ${application.influencerName} + ${commission.toFixed(2)} platform fee). They will be notified to begin work.`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: gig.id,
    };

    await sendNotification(influencerNotification);
    await sendNotification(sponsorNotification);

    if (onNotification) {
      await onNotification(influencerNotification);
      await onNotification(sponsorNotification);
    }

    if (escrowJob.sponsorAgentId) {
      const agentNotification: Notification = {
        id: `notif_${Date.now()}_3`,
        userId: escrowJob.sponsorAgentId,
        type: 'deal',
        priority: 'medium',
        title: 'Commission Pending',
        message: `A deal you referred has been funded! Commission will be paid when the work is completed.`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedId: gig.id,
      };
      await sendNotification(agentNotification);
      if (onNotification) await onNotification(agentNotification);
    }

    console.log(`[Escrow Workflow] Complete: Escrow locked successfully`);
    console.log(`Escrow locked: ${totalAmount.toFixed(2)} total (${amount.toFixed(2)} to influencer + ${commission.toFixed(2)} fee) for gig ${gig.title}`);
    return escrowJob;
  }, [escrowJobs, referrals, getOrCreateBalance, updateBalance, addTransaction, sendNotification]);

  const releaseFunds = useCallback(async (
    escrowJobId: string,
    onCommissionRouted?: (agentId: string, amount: number) => void,
    onNotification?: (notification: Notification) => Promise<void>
  ) => {
    const escrowJob = escrowJobs.find(e => e.id === escrowJobId);
    if (!escrowJob) {
      throw new Error('Escrow job not found');
    }
    if (escrowJob.status !== 'locked' && escrowJob.status !== 'approved') {
      throw new Error(`Cannot release funds from status: ${escrowJob.status}`);
    }

    console.log(`[Escrow Workflow] Step 1: Initiating fund release`);
    await updateEscrowStatus(escrowJobId, 'releasing');

    const releaseResult = await StripeEscrowIntegration.releaseEscrowFunds(
      escrowJob,
      `influencer_stripe_account_${escrowJob.influencerId}`
    );

    if (!releaseResult.success) {
      await updateEscrowStatus(escrowJobId, 'locked');
      throw new Error(releaseResult.error || 'Failed to release funds');
    }

    const commission = escrowJob.amount * (PLATFORM_FEE_RATE / (1 + PLATFORM_FEE_RATE));
    const influencerAmount = escrowJob.amount - commission;

    console.log(`[Escrow Workflow] Step 2: Updating balances`);
    const sponsorBalance = await getOrCreateBalance(escrowJob.sponsorId, escrowJob.currency);
    await updateBalance(escrowJob.sponsorId, {
      escrowBalance: sponsorBalance.escrowBalance - escrowJob.amount,
    });

    const influencerBalance = await getOrCreateBalance(escrowJob.influencerId, escrowJob.currency);
    await updateBalance(escrowJob.influencerId, {
      availableBalance: influencerBalance.availableBalance + influencerAmount,
      totalEarnings: influencerBalance.totalEarnings + influencerAmount,
    });

    await addTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'release',
      jobId: escrowJob.id,
      gigId: escrowJob.gigId,
      fromUser: 'escrow',
      toUser: escrowJob.influencerId,
      amount: influencerAmount,
      currency: escrowJob.currency,
      fee: 0,
      status: 'completed',
      timestamp: new Date().toISOString(),
      description: `Payment released to influencer (full agreed amount)`,
    });

    console.log(`[Escrow Workflow] Step 3: Processing agent commissions`);
    console.log(`[Commission Routing] Influencer receives: ${influencerAmount.toFixed(2)} (full agreed amount)`);
    console.log(`[Commission Routing] Total commission to distribute: ${commission.toFixed(2)} (platform fee added on top)`);
    const attribution = getAttributingAgent(escrowJob.sponsorId, escrowJob.influencerId);

    if (attribution && attribution.agentId) {
      console.log(`[Commission Routing] ✅ Agent(s) found - routing commission to agent(s)`);
      const agentCommission = commission * (attribution.splitPercentage! / 100);
      
      const agentBalance = await getOrCreateBalance(attribution.agentId, escrowJob.currency);
      await updateBalance(attribution.agentId, {
        availableBalance: agentBalance.availableBalance + agentCommission,
        totalEarnings: agentBalance.totalEarnings + agentCommission,
      });

      await addTransaction({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'agent_commission',
        jobId: escrowJob.id,
        gigId: escrowJob.gigId,
        fromUser: 'escrow',
        toUser: attribution.agentId,
        amount: agentCommission,
        currency: escrowJob.currency,
        fee: 0,
        attribution,
        status: 'completed',
        timestamp: new Date().toISOString(),
        description: `Agent commission for referral`,
      });

      const updatedReferrals = referrals.map(r => 
        r.agentId === attribution.agentId && 
        (r.recruitedUserId === escrowJob.sponsorId || r.recruitedUserId === escrowJob.influencerId)
          ? { ...r, totalCommissionsEarned: r.totalCommissionsEarned + agentCommission }
          : r
      );
      setReferrals(updatedReferrals);
      await AsyncStorage.setItem(REFERRALS_KEY, JSON.stringify(updatedReferrals));

      if (onCommissionRouted) {
        onCommissionRouted(attribution.agentId, agentCommission);
      }

      console.log(`[Commission Routing] ✅ Agent commission: ${agentCommission.toFixed(2)} routed to agent ${attribution.agentId}`);

      if (attribution.splitPercentage === 50 && escrowJob.sponsorAgentId && escrowJob.influencerAgentId) {
        const secondAgentId = escrowJob.sponsorAgentId === attribution.agentId 
          ? escrowJob.influencerAgentId 
          : escrowJob.sponsorAgentId;
        
        const secondAgentBalance = await getOrCreateBalance(secondAgentId, escrowJob.currency);
        await updateBalance(secondAgentId, {
          availableBalance: secondAgentBalance.availableBalance + agentCommission,
          totalEarnings: secondAgentBalance.totalEarnings + agentCommission,
        });

        await addTransaction({
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'agent_commission',
          jobId: escrowJob.id,
          gigId: escrowJob.gigId,
          fromUser: 'escrow',
          toUser: secondAgentId,
          amount: agentCommission,
          currency: escrowJob.currency,
          fee: 0,
          attribution: { agentId: secondAgentId, recruitedType: 'both', splitPercentage: 50 },
          status: 'completed',
          timestamp: new Date().toISOString(),
          description: `Agent commission for referral (split)`,
        });

        if (onCommissionRouted) {
          onCommissionRouted(secondAgentId, agentCommission);
        }

        console.log(`[Commission Routing] ✅ Agent commission: ${agentCommission.toFixed(2)} routed to second agent ${secondAgentId}`);
      }
    } else {
      console.log(`[Commission Routing] ℹ️ No agent attribution - commission goes to platform`);
      await addTransaction({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'commission_deduct',
        jobId: escrowJob.id,
        gigId: escrowJob.gigId,
        fromUser: 'escrow',
        toUser: 'platform',
        amount: commission,
        currency: escrowJob.currency,
        fee: 0,
        status: 'completed',
        timestamp: new Date().toISOString(),
        description: `Platform commission (no agent recruited either party)`,
      });

      console.log(`[Commission Routing] ✅ Platform commission: ${commission.toFixed(2)} (neither sponsor nor influencer recruited by an agent)`);
    }

    await updateEscrowStatus(escrowJobId, 'released', {
      releasedAt: new Date().toISOString(),
      stripeTransferId: releaseResult.transferId,
    });

    console.log(`[Escrow Workflow] Step 4: Sending release notifications`);
    const influencerNotification: Notification = {
      id: `notif_${Date.now()}_1`,
      userId: escrowJob.influencerId,
      type: 'deal',
      priority: 'high',
      title: 'Payment Released! 💰',
      message: `${influencerAmount.toFixed(2)} has been released to your account! Great work on completing the project.`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: escrowJob.gigId,
    };

    const sponsorNotification: Notification = {
      id: `notif_${Date.now()}_2`,
      userId: escrowJob.sponsorId,
      type: 'deal',
      priority: 'medium',
      title: 'Payment Released',
      message: `${influencerAmount.toFixed(2)} has been released to the influencer. The deal is now complete!`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: escrowJob.gigId,
    };

    await sendNotification(influencerNotification);
    await sendNotification(sponsorNotification);

    if (onNotification) {
      await onNotification(influencerNotification);
      await onNotification(sponsorNotification);
    }

    console.log(`[Escrow Workflow] Complete: Funds released successfully`);
    console.log(`Funds released: ${influencerAmount.toFixed(2)} to influencer (full amount), commission: ${commission.toFixed(2)} distributed`);
  }, [escrowJobs, referrals, getOrCreateBalance, updateBalance, addTransaction, getAttributingAgent, updateEscrowStatus, sendNotification]);

  const refundEscrow = useCallback(async (
    escrowJobId: string,
    onNotification?: (notification: Notification) => Promise<void>
  ) => {
    const escrowJob = escrowJobs.find(e => e.id === escrowJobId);
    if (!escrowJob) {
      throw new Error('Escrow job not found');
    }
    if (escrowJob.status !== 'locked') {
      throw new Error(`Cannot refund from status: ${escrowJob.status}`);
    }

    console.log(`[Escrow Workflow] Step 1: Initiating refund`);
    await updateEscrowStatus(escrowJobId, 'refunding');

    const refundResult = await StripeEscrowIntegration.refundEscrowPayment(escrowJob);

    if (!refundResult.success) {
      await updateEscrowStatus(escrowJobId, 'locked');
      throw new Error(refundResult.error || 'Failed to process refund');
    }

    console.log(`[Escrow Workflow] Step 2: Updating sponsor balance`);
    const sponsorBalance = await getOrCreateBalance(escrowJob.sponsorId, escrowJob.currency);
    await updateBalance(escrowJob.sponsorId, {
      availableBalance: sponsorBalance.availableBalance + escrowJob.amount,
      escrowBalance: sponsorBalance.escrowBalance - escrowJob.amount,
    });

    await addTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'refund',
      jobId: escrowJob.id,
      gigId: escrowJob.gigId,
      fromUser: 'escrow',
      toUser: escrowJob.sponsorId,
      amount: escrowJob.amount,
      currency: escrowJob.currency,
      fee: 0,
      status: 'completed',
      timestamp: new Date().toISOString(),
      description: `Refund to sponsor`,
    });

    await updateEscrowStatus(escrowJobId, 'refunded');

    console.log(`[Escrow Workflow] Step 3: Sending refund notifications`);
    const sponsorNotification: Notification = {
      id: `notif_${Date.now()}_1`,
      userId: escrowJob.sponsorId,
      type: 'deal',
      priority: 'medium',
      title: 'Refund Processed',
      message: `${escrowJob.amount.toFixed(2)} has been refunded to your account.`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: escrowJob.gigId,
    };

    const influencerNotification: Notification = {
      id: `notif_${Date.now()}_2`,
      userId: escrowJob.influencerId,
      type: 'deal',
      priority: 'medium',
      title: 'Deal Cancelled',
      message: `The deal has been cancelled and funds have been refunded to the sponsor.`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: escrowJob.gigId,
    };

    await sendNotification(sponsorNotification);
    await sendNotification(influencerNotification);

    if (onNotification) {
      await onNotification(sponsorNotification);
      await onNotification(influencerNotification);
    }

    console.log(`[Escrow Workflow] Complete: Refund processed successfully`);
    console.log(`Escrow refunded: $${escrowJob.amount} to sponsor`);
  }, [escrowJobs, getOrCreateBalance, updateBalance, addTransaction, updateEscrowStatus, sendNotification]);

  const addFunds = useCallback(async (
    userId: string,
    amount: number,
    currency: CurrencyType = 'usd',
    paymentMethod: string = 'stripe'
  ) => {
    const balance = await getOrCreateBalance(userId, currency);
    await updateBalance(userId, {
      availableBalance: balance.availableBalance + amount,
    });

    await addTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'payment_in',
      fromUser: userId,
      toUser: userId,
      amount,
      currency,
      fee: 0,
      status: 'completed',
      timestamp: new Date().toISOString(),
      paymentId: `${paymentMethod}_${Date.now()}`,
      description: `Funds added via ${paymentMethod}`,
    });

    console.log(`Funds added: $${amount} to user ${userId}`);
  }, [getOrCreateBalance, updateBalance, addTransaction]);

  const withdrawFunds = useCallback(async (
    userId: string,
    amount: number,
    currency: CurrencyType = 'usd',
    paymentMethod: string = 'stripe'
  ) => {
    const balance = await getOrCreateBalance(userId, currency);
    
    if (balance.availableBalance < amount) {
      throw new Error('Insufficient funds');
    }

    await updateBalance(userId, {
      availableBalance: balance.availableBalance - amount,
      totalWithdrawals: balance.totalWithdrawals + amount,
    });

    await addTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'withdrawal',
      fromUser: userId,
      toUser: 'external',
      amount,
      currency,
      fee: 0,
      status: 'completed',
      timestamp: new Date().toISOString(),
      paymentId: `${paymentMethod}_${Date.now()}`,
      description: `Withdrawal via ${paymentMethod}`,
    });

    console.log(`Withdrawal: $${amount} from user ${userId}`);
  }, [getOrCreateBalance, updateBalance, addTransaction]);

  const addReferral = useCallback(async (referral: Referral) => {
    const updated = [...referrals, referral];
    setReferrals(updated);
    await AsyncStorage.setItem(REFERRALS_KEY, JSON.stringify(updated));
    console.log(`Referral added: Agent ${referral.agentId} recruited ${referral.recruitedUserType} ${referral.recruitedUserId}`);
  }, [referrals]);

  const getUserBalance = useCallback((userId: string, currency: CurrencyType = 'usd'): UserBalance | undefined => {
    return balances.find(b => b.userId === userId && b.currency === currency);
  }, [balances]);

  const getUserTransactions = useCallback((userId: string): Transaction[] => {
    return transactions.filter(t => t.fromUser === userId || t.toUser === userId);
  }, [transactions]);

  const getAgentReferrals = useCallback((agentId: string): Referral[] => {
    return referrals.filter(r => r.agentId === agentId && r.isActive);
  }, [referrals]);

  const getEscrowJobByApplication = useCallback((applicationId: string): EscrowJob | undefined => {
    return escrowJobs.find(e => e.applicationId === applicationId);
  }, [escrowJobs]);

  const processAgentPayout = useCallback(async (
    agentId: string,
    amount: number,
    currency: CurrencyType = 'usd',
    stripeConnectedAccountId: string,
    metadata?: { dealId?: string; description?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    console.log(`[Agent Payout] Processing payout for agent ${agentId}`);
    console.log(`[Agent Payout] Amount: ${amount} ${currency}`);
    console.log(`[Agent Payout] Stripe Account: ${stripeConnectedAccountId}`);

    try {
      const balance = await getOrCreateBalance(agentId, currency);
      
      if (balance.availableBalance < amount) {
        throw new Error('Insufficient balance for payout');
      }

      const payoutResult = await StripeEscrowIntegration.processAgentPayout(
        stripeConnectedAccountId,
        amount,
        currency,
        metadata
      );

      if (!payoutResult.success) {
        throw new Error(payoutResult.error || 'Payout failed');
      }

      await updateBalance(agentId, {
        availableBalance: balance.availableBalance - amount,
        totalWithdrawals: balance.totalWithdrawals + amount,
      });

      await addTransaction({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'withdrawal',
        fromUser: agentId,
        toUser: 'external',
        amount,
        currency,
        fee: 0,
        status: 'completed',
        timestamp: new Date().toISOString(),
        paymentId: payoutResult.payoutId,
        description: metadata?.description || 'Agent commission payout',
      });

      console.log(`[Agent Payout] Payout successful: ${payoutResult.payoutId}`);
      return { success: true };
    } catch (error) {
      console.error('[Agent Payout] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payout failed',
      };
    }
  }, [getOrCreateBalance, updateBalance, addTransaction]);

  const canAgentWithdraw = useCallback((agentId: string, stripeVerified: boolean): { canWithdraw: boolean; reason?: string } => {
    if (!stripeVerified) {
      return {
        canWithdraw: false,
        reason: 'Stripe verification required',
      };
    }

    const balance = balances.find(b => b.userId === agentId);
    if (!balance || balance.availableBalance <= 0) {
      return {
        canWithdraw: false,
        reason: 'No available balance',
      };
    }

    return { canWithdraw: true };
  }, [balances]);

  const calculateAgentTier = useCallback((totalDeals: number): AgentTier => {
    if (totalDeals >= AGENT_TIER_THRESHOLDS.platinum.minDeals) return 'platinum';
    if (totalDeals >= AGENT_TIER_THRESHOLDS.gold.minDeals) return 'gold';
    if (totalDeals >= AGENT_TIER_THRESHOLDS.silver.minDeals) return 'silver';
    return 'bronze';
  }, []);

  const getAgentCommissionRate = useCallback((agentId: string): number => {
    const completedDeals = transactions.filter(
      t => t.type === 'agent_commission' && t.toUser === agentId
    ).length;
    
    const tier = calculateAgentTier(completedDeals);
    return AGENT_TIER_THRESHOLDS[tier].commissionRate;
  }, [transactions, calculateAgentTier]);

  const calculateAgentPerformanceMetrics = useCallback((agentId: string): AgentPerformanceMetrics => {
    const agentReferrals = referrals.filter(r => r.agentId === agentId && r.isActive);
    const agentTransactions = transactions.filter(
      t => t.type === 'agent_commission' && t.toUser === agentId
    );
    
    const totalDeals = agentTransactions.length;
    const totalReferrals = agentReferrals.length;
    const verifiedReferrals = agentReferrals.length;
    const totalEarnings = agentTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const performanceScore = (
      (totalDeals * 10) +
      (verifiedReferrals * 15) +
      (totalEarnings / 100)
    );

    return {
      totalDeals,
      totalReferrals,
      verifiedReferrals,
      totalEarnings,
      averageConversionTime: 7,
      responseTime: 2,
      satisfactionScore: 4.5,
      performanceScore,
      lastCalculatedAt: new Date().toISOString(),
    };
  }, [referrals, transactions]);

  const createAgentBonus = useCallback(async (bonus: AgentBonus) => {
    const updated = [...agentBonuses, bonus];
    setAgentBonuses(updated);
    await AsyncStorage.setItem(AGENT_BONUSES_KEY, JSON.stringify(updated));
    console.log(`Bonus created for agent ${bonus.agentId}: ${bonus.amount}`);
  }, [agentBonuses]);

  const processMonthlyBonuses = useCallback(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const allAgents = new Set(referrals.map(r => r.agentId));
    
    for (const agentId of allAgents) {
      const metrics = calculateAgentPerformanceMetrics(agentId);
      const currentTier = calculateAgentTier(metrics.totalDeals);
      
      if (metrics.totalDeals >= 10) {
        const bonusAmount = metrics.totalDeals >= 50 ? 500 : metrics.totalDeals >= 25 ? 200 : 100;
        
        const bonus: AgentBonus = {
          id: `bonus_${Date.now()}_${agentId}`,
          agentId,
          period: 'monthly',
          periodStart: monthStart,
          periodEnd: monthEnd,
          bonusType: 'performance',
          amount: bonusAmount,
          status: 'pending',
          earnedAt: now.toISOString(),
          criteria: {
            dealsCompleted: metrics.totalDeals,
            earningsGenerated: metrics.totalEarnings,
            tierAchieved: currentTier,
          },
        };
        
        await createAgentBonus(bonus);
      }
    }
  }, [referrals, calculateAgentPerformanceMetrics, calculateAgentTier, createAgentBonus]);

  const getAgentBonuses = useCallback((agentId: string): AgentBonus[] => {
    return agentBonuses.filter(b => b.agentId === agentId);
  }, [agentBonuses]);

  const setupAutoPayout = useCallback(async (agentId: string, threshold: number) => {
    const existing = autoPayouts.find(p => p.agentId === agentId);
    
    if (existing) {
      const updated = autoPayouts.map(p => 
        p.agentId === agentId 
          ? { ...p, threshold, isActive: true, updatedAt: new Date().toISOString() }
          : p
      );
      setAutoPayouts(updated);
      await AsyncStorage.setItem(AUTO_PAYOUTS_KEY, JSON.stringify(updated));
    } else {
      const autoPayout: AutoPayout = {
        id: `autopayout_${Date.now()}_${agentId}`,
        agentId,
        threshold,
        nextScheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updated = [...autoPayouts, autoPayout];
      setAutoPayouts(updated);
      await AsyncStorage.setItem(AUTO_PAYOUTS_KEY, JSON.stringify(updated));
    }
    
    console.log(`Auto-payout setup for agent ${agentId} with threshold ${threshold}`);
  }, [autoPayouts]);

  const checkAndProcessAutoPayouts = useCallback(async () => {
    const activePayouts = autoPayouts.filter(p => p.isActive);
    
    for (const payout of activePayouts) {
      const balance = balances.find(b => b.userId === payout.agentId);
      
      if (balance && balance.availableBalance >= payout.threshold) {
        console.log(`Processing auto-payout for agent ${payout.agentId}: ${balance.availableBalance}`);
      }
    }
  }, [autoPayouts, balances]);

  const getAgentLeaderboard = useCallback((): AgentLeaderboardEntry[] => {
    const allAgents = new Set(referrals.map(r => r.agentId));
    const leaderboard: AgentLeaderboardEntry[] = [];

    for (const agentId of allAgents) {
      const metrics = calculateAgentPerformanceMetrics(agentId);
      const tier = calculateAgentTier(metrics.totalDeals);
      
      leaderboard.push({
        agentId,
        agentName: `Agent ${agentId.slice(0, 8)}`,
        tier,
        rank: 0,
        performanceScore: metrics.performanceScore,
        totalEarnings: metrics.totalEarnings,
        totalDeals: metrics.totalDeals,
        totalReferrals: metrics.totalReferrals,
      });
    }

    leaderboard.sort((a, b) => b.performanceScore - a.performanceScore);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
      if (index === 0) entry.badge = '🥇';
      else if (index === 1) entry.badge = '🥈';
      else if (index === 2) entry.badge = '🥉';
    });

    return leaderboard;
  }, [referrals, calculateAgentPerformanceMetrics, calculateAgentTier]);

  return useMemo(() => ({
    transactions,
    balances,
    escrowJobs,
    referrals,
    agentBonuses,
    autoPayouts,
    isLoading,
    lockFundsInEscrow,
    releaseFunds,
    refundEscrow,
    updateEscrowStatus,
    addFunds,
    withdrawFunds,
    addReferral,
    getUserBalance,
    getUserTransactions,
    getAgentReferrals,
    getEscrowJobByApplication,
    getOrCreateBalance,
    processAgentPayout,
    canAgentWithdraw,
    calculateAgentTier,
    getAgentCommissionRate,
    calculateAgentPerformanceMetrics,
    createAgentBonus,
    processMonthlyBonuses,
    getAgentBonuses,
    setupAutoPayout,
    checkAndProcessAutoPayouts,
    getAgentLeaderboard,
  }), [
    transactions,
    balances,
    escrowJobs,
    referrals,
    agentBonuses,
    autoPayouts,
    isLoading,
    lockFundsInEscrow,
    releaseFunds,
    refundEscrow,
    updateEscrowStatus,
    addFunds,
    withdrawFunds,
    addReferral,
    getUserBalance,
    getUserTransactions,
    getAgentReferrals,
    getEscrowJobByApplication,
    getOrCreateBalance,
    processAgentPayout,
    canAgentWithdraw,
    calculateAgentTier,
    getAgentCommissionRate,
    calculateAgentPerformanceMetrics,
    createAgentBonus,
    processMonthlyBonuses,
    getAgentBonuses,
    setupAutoPayout,
    checkAndProcessAutoPayouts,
    getAgentLeaderboard,
  ]);
});
