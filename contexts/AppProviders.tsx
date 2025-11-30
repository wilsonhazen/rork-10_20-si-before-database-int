import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { InviteProvider } from '@/contexts/InviteContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { MatchingProvider } from '@/contexts/MatchingContext';
import { RewardsProvider } from '@/contexts/RewardsContext';
import { AgentVerificationProvider } from '@/contexts/AgentVerificationContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { BrandCollaborationProvider } from '@/contexts/BrandCollaborationContext';
import { NegotiationProvider } from '@/contexts/NegotiationContext';
import { NotificationEngineProvider } from '@/contexts/NotificationEngine';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { CampaignProvider } from '@/contexts/CampaignContext';
import { ContentLibraryProvider } from '@/contexts/ContentLibraryContext';
import { MonetizationProvider } from '@/contexts/MonetizationContext';
import { ReportProvider } from '@/contexts/ReportContext';
import Colors from '@/constants/colors';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <Text style={styles.errorSubtext}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <DataProvider>
        <AuthProvider>
          <ReportProvider>
            <MonetizationProvider>
              <WalletProvider>
                <RewardsProvider>
                  <PaymentProvider>
                    <InviteProvider>
                      <MatchingProvider>
                        <AgentVerificationProvider>
                          <GamificationProvider>
                            <BrandCollaborationProvider>
                              <NegotiationProvider>
                                <NotificationEngineProvider>
                                  <AnalyticsProvider>
                                    <CampaignProvider>
                                      <ContentLibraryProvider>
                                        {children}
                                      </ContentLibraryProvider>
                                    </CampaignProvider>
                                  </AnalyticsProvider>
                                </NotificationEngineProvider>
                              </NegotiationProvider>
                            </BrandCollaborationProvider>
                          </GamificationProvider>
                        </AgentVerificationProvider>
                      </MatchingProvider>
                    </InviteProvider>
                  </PaymentProvider>
                </RewardsProvider>
              </WalletProvider>
            </MonetizationProvider>
          </ReportProvider>
        </AuthProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.danger,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
