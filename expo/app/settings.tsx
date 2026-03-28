import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { 
  Bell, 
  Lock, 
  Globe, 
  Moon, 
  Eye, 
  Shield, 
  CreditCard,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2,
  Database,
  Trash2,
  Download,
  FileText,
  HelpCircle,
  ChevronRight,
  CheckCircle2
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

type SettingItem = {
  icon: any;
  label: string;
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  badge?: string;
  type: 'toggle' | 'navigation' | 'action';
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [dealAlerts, setDealAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  const [darkMode, setDarkMode] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be prepared and sent to your email within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Exporting data...') }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been scheduled for deletion.');
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and may improve app performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const sections: SettingSection[] = [
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          label: 'Push Notifications',
          value: pushNotifications,
          onToggle: setPushNotifications,
          type: 'toggle',
        },
        {
          icon: Mail,
          label: 'Email Notifications',
          value: emailNotifications,
          onToggle: setEmailNotifications,
          type: 'toggle',
        },
        {
          icon: Smartphone,
          label: 'SMS Notifications',
          value: smsNotifications,
          onToggle: setSmsNotifications,
          type: 'toggle',
        },
        {
          icon: CreditCard,
          label: 'Deal Alerts',
          value: dealAlerts,
          onToggle: setDealAlerts,
          type: 'toggle',
        },
        {
          icon: MessageSquare,
          label: 'Message Alerts',
          value: messageAlerts,
          onToggle: setMessageAlerts,
          type: 'toggle',
        },
        {
          icon: CheckCircle2,
          label: 'Application Updates',
          value: applicationUpdates,
          onToggle: setApplicationUpdates,
          type: 'toggle',
        },
        {
          icon: Mail,
          label: 'Marketing Emails',
          value: marketingEmails,
          onToggle: setMarketingEmails,
          type: 'toggle',
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: Moon,
          label: 'Dark Mode',
          value: darkMode,
          onToggle: setDarkMode,
          type: 'toggle',
        },
        {
          icon: Volume2,
          label: 'Sound Effects',
          value: soundEffects,
          onToggle: setSoundEffects,
          type: 'toggle',
        },
        {
          icon: Smartphone,
          label: 'Haptic Feedback',
          value: hapticFeedback,
          onToggle: setHapticFeedback,
          type: 'toggle',
        },
        {
          icon: Globe,
          label: 'Language',
          badge: 'English',
          onPress: () => Alert.alert('Language', 'Language settings coming soon'),
          type: 'navigation',
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          icon: Eye,
          label: 'Profile Visibility',
          value: profileVisibility,
          onToggle: setProfileVisibility,
          type: 'toggle',
        },
        {
          icon: Mail,
          label: 'Show Email',
          value: showEmail,
          onToggle: setShowEmail,
          type: 'toggle',
        },
        {
          icon: Smartphone,
          label: 'Show Phone',
          value: showPhone,
          onToggle: setShowPhone,
          type: 'toggle',
        },
        {
          icon: MessageSquare,
          label: 'Allow Messages',
          value: allowMessages,
          onToggle: setAllowMessages,
          type: 'toggle',
        },
        {
          icon: FileText,
          label: 'Privacy Policy',
          onPress: () => Alert.alert('Privacy Policy', 'View our privacy policy'),
          type: 'navigation',
        },
        {
          icon: FileText,
          label: 'Terms of Service',
          onPress: () => Alert.alert('Terms', 'View our terms of service'),
          type: 'navigation',
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          label: 'Two-Factor Authentication',
          value: twoFactorAuth,
          onToggle: setTwoFactorAuth,
          type: 'toggle',
        },
        {
          icon: Smartphone,
          label: 'Biometric Login',
          value: biometricAuth,
          onToggle: setBiometricAuth,
          type: 'toggle',
        },
        {
          icon: Lock,
          label: 'Change Password',
          onPress: () => Alert.alert('Change Password', 'Password change coming soon'),
          type: 'navigation',
        },
        {
          icon: Shield,
          label: 'Active Sessions',
          onPress: () => Alert.alert('Sessions', 'View active sessions'),
          type: 'navigation',
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          icon: Database,
          label: 'Storage Usage',
          badge: '124 MB',
          onPress: () => Alert.alert('Storage', 'View storage details'),
          type: 'navigation',
        },
        {
          icon: Trash2,
          label: 'Clear Cache',
          onPress: handleClearCache,
          type: 'action',
        },
        {
          icon: Download,
          label: 'Export My Data',
          onPress: handleExportData,
          type: 'action',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help Center',
          onPress: () => router.push('/help'),
          type: 'navigation',
        },
        {
          icon: MessageSquare,
          label: 'Contact Support',
          onPress: () => Alert.alert('Support', 'Contact support coming soon'),
          type: 'navigation',
        },
        {
          icon: FileText,
          label: 'Report a Problem',
          onPress: () => Alert.alert('Report', 'Report problem coming soon'),
          type: 'navigation',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: Trash2,
          label: 'Delete Account',
          onPress: handleDeleteAccount,
          type: 'action',
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem, index: number) => {
    const Icon = item.icon;

    if (item.type === 'toggle') {
      return (
        <View key={index} style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Icon size={20} color={Colors.primary} />
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: Colors.backgroundSecondary, true: Colors.primary + '60' }}
            thumbColor={item.value ? Colors.primary : Colors.textMuted}
            ios_backgroundColor={Colors.backgroundSecondary}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.settingItem}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <Icon 
              size={20} 
              color={item.type === 'action' && item.label === 'Delete Account' ? Colors.danger : Colors.primary} 
            />
          </View>
          <Text 
            style={[
              styles.settingLabel,
              item.type === 'action' && item.label === 'Delete Account' && styles.dangerText
            ]}
          >
            {item.label}
          </Text>
        </View>
        <View style={styles.settingRight}>
          {item.badge && (
            <Text style={styles.badgeText}>{item.badge}</Text>
          )}
          <ChevronRight size={20} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerStyle: {
            backgroundColor: Colors.dark,
          },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              <LinearGradient
                colors={[Colors.darkCard, Colors.backgroundSecondary]}
                style={styles.cardGradient}
              >
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex}>
                    {renderSettingItem(item, itemIndex)}
                    {itemIndex < section.items.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                ))}
              </LinearGradient>
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerSubtext}>© 2025 SourceImpact</Text>
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
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  dangerText: {
    color: Colors.danger,
  },
  badgeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.backgroundSecondary,
    marginLeft: 60,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
