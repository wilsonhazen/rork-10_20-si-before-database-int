import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import type { CryptoWallet } from '@/types';

const CONNECTED_WALLETS_KEY = '@sourceimpact_connected_wallets';
const IMPACT_TOKEN_BALANCES_KEY = '@sourceimpact_impact_balances';
const WITHDRAWAL_REQUESTS_KEY = '@sourceimpact_withdrawal_requests';

export interface ImpactTokenBalance {
  userId: string;
  walletAddress: string;
  balance: number;
  lockedBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastUpdated: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  walletAddress: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
  transactionHash?: string;
  failureReason?: string;
}

export interface ConnectedWallet extends CryptoWallet {
  provider?: 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'manual';
  isConnected: boolean;
  connectedAt?: string;
  lastUsedAt?: string;
}

const IMPACT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const IMPACT_TOKEN_CHAIN_ID = 1;

export const [WalletProvider, useWallet] = createContextHook(() => {
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [impactBalances, setImpactBalances] = useState<ImpactTokenBalance[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletsData, balancesData, withdrawalsData] = await Promise.all([
        AsyncStorage.getItem(CONNECTED_WALLETS_KEY),
        AsyncStorage.getItem(IMPACT_TOKEN_BALANCES_KEY),
        AsyncStorage.getItem(WITHDRAWAL_REQUESTS_KEY),
      ]);

      if (walletsData) setConnectedWallets(JSON.parse(walletsData));
      if (balancesData) setImpactBalances(JSON.parse(balancesData));
      if (withdrawalsData) setWithdrawalRequests(JSON.parse(withdrawalsData));
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = useCallback(async (
    userId: string,
    address: string,
    network: CryptoWallet['network'],
    provider?: ConnectedWallet['provider']
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Wallet] Connecting wallet:', address);
      
      const existingWallet = connectedWallets.find(
        w => w.userId === userId && w.address.toLowerCase() === address.toLowerCase()
      );

      if (existingWallet) {
        const updated = connectedWallets.map(w =>
          w.id === existingWallet.id
            ? { ...w, isConnected: true, lastUsedAt: new Date().toISOString() }
            : w
        );
        setConnectedWallets(updated);
        await AsyncStorage.setItem(CONNECTED_WALLETS_KEY, JSON.stringify(updated));
        
        console.log('[Wallet] Wallet reconnected:', address);
        return { success: true };
      }

      const newWallet: ConnectedWallet = {
        id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        address,
        network,
        provider,
        isConnected: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        connectedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };

      const updated = [...connectedWallets, newWallet];
      setConnectedWallets(updated);
      await AsyncStorage.setItem(CONNECTED_WALLETS_KEY, JSON.stringify(updated));

      const balance = await getOrCreateBalance(userId, address);
      console.log('[Wallet] Wallet connected successfully:', address);
      console.log('[Wallet] ImPAct token balance:', balance.balance);

      return { success: true };
    } catch (error) {
      console.error('[Wallet] Connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      };
    }
  }, [connectedWallets]);

  const disconnectWallet = useCallback(async (walletId: string) => {
    const updated = connectedWallets.map(w =>
      w.id === walletId ? { ...w, isConnected: false } : w
    );
    setConnectedWallets(updated);
    await AsyncStorage.setItem(CONNECTED_WALLETS_KEY, JSON.stringify(updated));
    console.log('[Wallet] Wallet disconnected:', walletId);
  }, [connectedWallets]);

  const removeWallet = useCallback(async (walletId: string) => {
    const updated = connectedWallets.filter(w => w.id !== walletId);
    setConnectedWallets(updated);
    await AsyncStorage.setItem(CONNECTED_WALLETS_KEY, JSON.stringify(updated));
    console.log('[Wallet] Wallet removed:', walletId);
  }, [connectedWallets]);

  const getOrCreateBalance = useCallback(async (
    userId: string,
    walletAddress: string
  ): Promise<ImpactTokenBalance> => {
    let balance = impactBalances.find(
      b => b.userId === userId && b.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (!balance) {
      balance = {
        userId,
        walletAddress,
        balance: 0,
        lockedBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        lastUpdated: new Date().toISOString(),
      };

      const updated = [...impactBalances, balance];
      setImpactBalances(updated);
      await AsyncStorage.setItem(IMPACT_TOKEN_BALANCES_KEY, JSON.stringify(updated));
    }

    return balance;
  }, [impactBalances]);

  const updateBalance = useCallback(async (
    userId: string,
    walletAddress: string,
    updates: Partial<ImpactTokenBalance>
  ) => {
    const updated = impactBalances.map(b =>
      b.userId === userId && b.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        ? { ...b, ...updates, lastUpdated: new Date().toISOString() }
        : b
    );
    setImpactBalances(updated);
    await AsyncStorage.setItem(IMPACT_TOKEN_BALANCES_KEY, JSON.stringify(updated));
    console.log('[Wallet] Balance updated for:', walletAddress);
  }, [impactBalances]);

  const depositImpactTokens = useCallback(async (
    userId: string,
    walletAddress: string,
    amount: number,
    metadata?: { source?: string; rewardId?: string }
  ) => {
    console.log('[Wallet] Depositing', amount, 'IMPACT tokens to:', walletAddress);
    console.log('[Wallet] Metadata:', metadata);
    
    const balance = await getOrCreateBalance(userId, walletAddress);
    await updateBalance(userId, walletAddress, {
      balance: balance.balance + amount,
      totalEarned: balance.totalEarned + amount,
    });

    console.log('[Wallet] Deposit successful. New balance:', balance.balance + amount);
  }, [getOrCreateBalance, updateBalance]);

  const requestWithdrawal = useCallback(async (
    userId: string,
    walletAddress: string,
    amount: number
  ): Promise<{ success: boolean; error?: string; requestId?: string }> => {
    try {
      console.log('[Wallet] Withdrawal requested:', amount, 'IMPACT to', walletAddress);

      const balance = impactBalances.find(
        b => b.userId === userId && b.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      );

      if (!balance) {
        return { success: false, error: 'Wallet not found' };
      }

      if (balance.balance < amount) {
        return {
          success: false,
          error: `Insufficient balance. Available: ${balance.balance} IMPACT`,
        };
      }

      const withdrawalRequest: WithdrawalRequest = {
        id: `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        walletAddress,
        amount,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };

      const updated = [...withdrawalRequests, withdrawalRequest];
      setWithdrawalRequests(updated);
      await AsyncStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(updated));

      await updateBalance(userId, walletAddress, {
        balance: balance.balance - amount,
        lockedBalance: balance.lockedBalance + amount,
      });

      console.log('[Wallet] Withdrawal request created:', withdrawalRequest.id);
      return { success: true, requestId: withdrawalRequest.id };
    } catch (error) {
      console.error('[Wallet] Withdrawal request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create withdrawal request',
      };
    }
  }, [impactBalances, withdrawalRequests, updateBalance]);

  const processWithdrawal = useCallback(async (
    withdrawalId: string,
    transactionHash: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Wallet] Processing withdrawal:', withdrawalId);

      const withdrawal = withdrawalRequests.find(w => w.id === withdrawalId);
      if (!withdrawal) {
        return { success: false, error: 'Withdrawal request not found' };
      }

      const updated = withdrawalRequests.map(w =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'completed' as const,
              processedAt: new Date().toISOString(),
              transactionHash,
            }
          : w
      );
      setWithdrawalRequests(updated);
      await AsyncStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(updated));

      const balance = impactBalances.find(
        b =>
          b.userId === withdrawal.userId &&
          b.walletAddress.toLowerCase() === withdrawal.walletAddress.toLowerCase()
      );

      if (balance) {
        await updateBalance(withdrawal.userId, withdrawal.walletAddress, {
          lockedBalance: balance.lockedBalance - withdrawal.amount,
          totalWithdrawn: balance.totalWithdrawn + withdrawal.amount,
        });
      }

      console.log('[Wallet] Withdrawal processed successfully:', transactionHash);
      return { success: true };
    } catch (error) {
      console.error('[Wallet] Withdrawal processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process withdrawal',
      };
    }
  }, [withdrawalRequests, impactBalances, updateBalance]);

  const failWithdrawal = useCallback(async (
    withdrawalId: string,
    reason: string
  ) => {
    const withdrawal = withdrawalRequests.find(w => w.id === withdrawalId);
    if (!withdrawal) return;

    const updated = withdrawalRequests.map(w =>
      w.id === withdrawalId
        ? {
            ...w,
            status: 'failed' as const,
            processedAt: new Date().toISOString(),
            failureReason: reason,
          }
        : w
    );
    setWithdrawalRequests(updated);
    await AsyncStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(updated));

    const balance = impactBalances.find(
      b =>
        b.userId === withdrawal.userId &&
        b.walletAddress.toLowerCase() === withdrawal.walletAddress.toLowerCase()
    );

    if (balance) {
      await updateBalance(withdrawal.userId, withdrawal.walletAddress, {
        balance: balance.balance + withdrawal.amount,
        lockedBalance: balance.lockedBalance - withdrawal.amount,
      });
    }

    console.log('[Wallet] Withdrawal failed:', withdrawalId, reason);
  }, [withdrawalRequests, impactBalances, updateBalance]);

  const openWalletApp = useCallback(async (provider: ConnectedWallet['provider']) => {
    try {
      const urls: Record<string, string> = {
        metamask: 'metamask://',
        trust: 'trust://',
        coinbase: 'cbwallet://',
        walletconnect: 'wc://',
      };

      const url = urls[provider || 'metamask'];
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return { success: true };
        } else {
          return {
            success: false,
            error: `${provider} app is not installed`,
          };
        }
      }
      return { success: false, error: 'Provider not supported' };
    } catch (error) {
      console.error('[Wallet] Error opening wallet app:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open wallet app',
      };
    }
  }, []);

  const getUserWallets = useCallback(
    (userId: string): ConnectedWallet[] => {
      return connectedWallets.filter(w => w.userId === userId);
    },
    [connectedWallets]
  );

  const getConnectedWallet = useCallback(
    (userId: string): ConnectedWallet | undefined => {
      return connectedWallets.find(w => w.userId === userId && w.isConnected);
    },
    [connectedWallets]
  );

  const getUserBalance = useCallback(
    (userId: string, walletAddress?: string): ImpactTokenBalance | undefined => {
      if (walletAddress) {
        return impactBalances.find(
          b =>
            b.userId === userId &&
            b.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );
      }
      return impactBalances.find(b => b.userId === userId);
    },
    [impactBalances]
  );

  const getUserWithdrawals = useCallback(
    (userId: string): WithdrawalRequest[] => {
      return withdrawalRequests.filter(w => w.userId === userId);
    },
    [withdrawalRequests]
  );

  const getPendingWithdrawals = useCallback((): WithdrawalRequest[] => {
    return withdrawalRequests.filter(w => w.status === 'pending' || w.status === 'processing');
  }, [withdrawalRequests]);

  return useMemo(
    () => ({
      connectedWallets,
      impactBalances,
      withdrawalRequests,
      isLoading,
      connectWallet,
      disconnectWallet,
      removeWallet,
      depositImpactTokens,
      requestWithdrawal,
      processWithdrawal,
      failWithdrawal,
      openWalletApp,
      getUserWallets,
      getConnectedWallet,
      getUserBalance,
      getUserWithdrawals,
      getPendingWithdrawals,
      getOrCreateBalance,
      updateBalance,
      IMPACT_TOKEN_ADDRESS,
      IMPACT_TOKEN_CHAIN_ID,
    }),
    [
      connectedWallets,
      impactBalances,
      withdrawalRequests,
      isLoading,
      connectWallet,
      disconnectWallet,
      removeWallet,
      depositImpactTokens,
      requestWithdrawal,
      processWithdrawal,
      failWithdrawal,
      openWalletApp,
      getUserWallets,
      getConnectedWallet,
      getUserBalance,
      getUserWithdrawals,
      getPendingWithdrawals,
      getOrCreateBalance,
      updateBalance,
    ]
  );
});
