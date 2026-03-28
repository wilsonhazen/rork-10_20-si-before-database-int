import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

const TOS_ACCEPTED_KEY = '@sourceimpact_tos_accepted';

export default function TermsOfServiceModal() {
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkTermsAcceptance();
  }, []);

  const checkTermsAcceptance = async () => {
    try {
      const accepted = await AsyncStorage.getItem(TOS_ACCEPTED_KEY);
      if (!accepted) {
        setVisible(true);
      }
    } catch (error) {
      console.error('Failed to check ToS acceptance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(TOS_ACCEPTED_KEY, 'true');
      setVisible(false);
      console.log('Terms of Service accepted');
    } catch (error) {
      console.error('Failed to save ToS acceptance:', error);
    }
  };

  if (isLoading) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {}}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.dark, Colors.darkBg]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <FileText size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Terms of Service</Text>
            <Text style={styles.subtitle}>
              Please read and accept our terms to continue
            </Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.sectionText}>
                By accessing and using SourceImpact, you accept and agree to be bound by the terms and provision of this agreement.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. User Responsibilities</Text>
              <Text style={styles.sectionText}>
                Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Payment Terms</Text>
              <Text style={styles.sectionText}>
                All transactions are subject to our payment processing terms. Payments are processed securely through Stripe. Users must maintain accurate payment information.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Content Guidelines</Text>
              <Text style={styles.sectionText}>
                Users must not post content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
              <Text style={styles.sectionText}>
                All content on SourceImpact is protected by intellectual property laws. Users retain ownership of their content but grant us a license to use it on the platform.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Dispute Resolution</Text>
              <Text style={styles.sectionText}>
                Any disputes arising from the use of this platform will be resolved through binding arbitration. Users waive their right to a jury trial.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Termination</Text>
              <Text style={styles.sectionText}>
                We reserve the right to terminate or suspend accounts that violate these terms without prior notice.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
              <Text style={styles.sectionText}>
                SourceImpact shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Privacy Policy</Text>
              <Text style={styles.sectionText}>
                Your privacy is important to us. We collect and process personal data in accordance with our Privacy Policy and applicable data protection laws.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
              <Text style={styles.sectionText}>
                We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
              </Text>
            </View>

            <View style={styles.lastUpdated}>
              <Text style={styles.lastUpdatedText}>
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleAccept}
              style={styles.acceptButton}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.acceptButtonGradient}
              >
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>I Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.footerNote}>
              By accepting, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkCard,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  lastUpdated: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.darkCard,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.darkCard,
  },
  acceptButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  footerNote: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
});
