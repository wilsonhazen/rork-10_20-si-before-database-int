import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  Share,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useInvites } from '@/contexts/InviteContext';
import { usePayment } from '@/contexts/PaymentContext';
import { 
  Mail, 
  MessageSquare, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Send,
  Plus,
  Trash2,
  Copy,
  TrendingUp,
  DollarSign,
  Smartphone,
  Search,
  Download,
  Upload,
  FileText,
  BarChart3,
  Target,
  Award,
  Zap
} from 'lucide-react-native';
import colors from '@/constants/colors';
import type { Contact, InviteMethod, InviteTemplate } from '@/types';

export default function AgentInvitesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    contacts, 
    invites, 
    templates,
    addContact, 
    addContacts,
    sendBulkInvites,
    deleteContact,
    getAgentInvites,
    getInviteStats,
    interpolateTemplate,
    generateReferralLink,
    fetchPhoneContacts,
    generateCSVTemplate,
    exportContactsToCSV,
    importContactsFromCSV,
    importGmailContacts,
    getTemplatePerformance,
    getReferralFunnel,
    getContactPerformance,
    getReferralInsights
  } = useInvites();
  const { getAgentReferrals } = usePayment();

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showSendInviteModal, setShowSendInviteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InviteTemplate | null>(null);
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>('email');
  const [isImporting, setIsImporting] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState<Contact[]>([]);
  const [selectedPhoneContacts, setSelectedPhoneContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [isProcessingCSV, setIsProcessingCSV] = useState(false);

  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
  });

  if (!user || user.role !== 'agent') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Agent role required.</Text>
      </View>
    );
  }

  const agentInvites = getAgentInvites(user.id);
  const stats = getInviteStats(user.id);
  const referrals = getAgentReferrals(user.id);
  const totalCommissions = referrals.reduce((sum, r) => sum + r.totalCommissionsEarned, 0);

  const handleImportContacts = async () => {
    if (Platform.OS === 'web') {
      handleCSVImport();
      return;
    }

    setShowImportOptions(true);
  };

  const handlePhoneContactsImport = async () => {
    setShowImportOptions(false);
    setIsImporting(true);
    const result = await fetchPhoneContacts();
    setIsImporting(false);

    if (result.success) {
      setPhoneContacts(result.contacts);
      setSelectedPhoneContacts([]);
      setSearchQuery('');
      setShowImportModal(true);
    } else {
      Alert.alert('Import Failed', result.error || 'Failed to fetch contacts');
    }
  };

  const handleGmailImport = async () => {
    setShowImportOptions(false);
    setIsImporting(true);
    const result = await importGmailContacts();
    setIsImporting(false);

    if (result.success && result.contacts.length > 0) {
      const added = await addContacts(result.contacts);
      Alert.alert('Success', `Imported ${added} contacts from Gmail`);
    } else {
      Alert.alert('Import Failed', result.error || 'Failed to import Gmail contacts');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const template = generateCSVTemplate();
      
      if (Platform.OS === 'web') {
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contacts_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Template downloaded successfully');
      } else {
        Alert.alert('Feature Unavailable', 'CSV download is only available on web. Please use the web version to download the template.');
      }
    } catch (error) {
      console.error('Download template error:', error);
      Alert.alert('Error', 'Failed to download template');
    }
  };

  const handleExportContacts = async () => {
    try {
      if (contacts.length === 0) {
        Alert.alert('No Contacts', 'You have no contacts to export');
        return;
      }

      const csv = exportContactsToCSV();
      
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Success', `Exported ${contacts.length} contacts`);
      } else {
        Alert.alert('Feature Unavailable', 'CSV export is only available on web. Please use the web version to export contacts.');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export contacts');
    }
  };

  const handleCSVImport = async () => {
    try {
      setShowImportOptions(false);
      
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,text/csv';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          
          setIsProcessingCSV(true);
          const reader = new FileReader();
          reader.onload = async (event) => {
            const csvContent = event.target?.result as string;
            const result = await importContactsFromCSV(csvContent);
            setIsProcessingCSV(false);
            
            if (result.success) {
              const errorMsg = result.errors.length > 0 
                ? `\n\nWarnings:\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? `\n...and ${result.errors.length - 5} more` : ''}` 
                : '';
              Alert.alert(
                'Import Complete', 
                `Successfully imported ${result.added} contacts.${errorMsg}`
              );
            } else {
              Alert.alert('Import Failed', result.errors[0] || 'Failed to import CSV');
            }
          };
          reader.readAsText(file);
        };
        input.click();
      } else {
        setIsProcessingCSV(true);
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/csv',
          copyToCacheDirectory: true,
        });
        
        if (result.canceled) {
          setIsProcessingCSV(false);
          return;
        }

        const fileUri = result.assets[0].uri;
        const csvContent = await FileSystem.readAsStringAsync(fileUri);
        const importResult = await importContactsFromCSV(csvContent);
        setIsProcessingCSV(false);
        
        if (importResult.success) {
          const errorMsg = importResult.errors.length > 0 
            ? `\n\nWarnings:\n${importResult.errors.slice(0, 5).join('\n')}${importResult.errors.length > 5 ? `\n...and ${importResult.errors.length - 5} more` : ''}` 
            : '';
          Alert.alert(
            'Import Complete', 
            `Successfully imported ${importResult.added} contacts.${errorMsg}`
          );
        } else {
          Alert.alert('Import Failed', importResult.errors[0] || 'Failed to import CSV');
        }
      }
    } catch (error) {
      setIsProcessingCSV(false);
      console.error('CSV import error:', error);
      Alert.alert('Error', 'Failed to import CSV file');
    }
  };

  const handleConfirmImport = async () => {
    if (selectedPhoneContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact to import');
      return;
    }

    const contactsToImport = phoneContacts.filter(c => selectedPhoneContacts.includes(c.id));
    const addedCount = await addContacts(contactsToImport);
    
    const remainingContacts = phoneContacts.filter(c => {
      return !selectedPhoneContacts.includes(c.id);
    });
    
    setPhoneContacts(remainingContacts);
    setSelectedPhoneContacts([]);
    setSearchQuery('');
    
    if (remainingContacts.length === 0) {
      setShowImportModal(false);
      Alert.alert(
        'Success',
        `Imported ${addedCount} contact${addedCount !== 1 ? 's' : ''} from your phone. All contacts have been imported.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Success',
        `Imported ${addedCount} contact${addedCount !== 1 ? 's' : ''} from your phone. You have ${remainingContacts.length} more contact${remainingContacts.length !== 1 ? 's' : ''} to review.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSelectPhoneContact = (contactId: string) => {
    if (selectedPhoneContacts.includes(contactId)) {
      setSelectedPhoneContacts(selectedPhoneContacts.filter(id => id !== contactId));
    } else {
      setSelectedPhoneContacts([...selectedPhoneContacts, contactId]);
    }
  };

  const handleSelectAllPhoneContacts = () => {
    const filtered = getFilteredPhoneContacts();
    if (selectedPhoneContacts.length === filtered.length) {
      setSelectedPhoneContacts([]);
    } else {
      setSelectedPhoneContacts(filtered.map(c => c.id));
    }
  };

  const getFilteredPhoneContacts = () => {
    const uniqueMap = new Map<string, Contact>();
    
    phoneContacts.forEach(c => {
      const key = `${c.email || ''}_${c.phone || ''}_${c.name}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, c);
      }
    });
    
    const uniqueContacts = Array.from(uniqueMap.values());
    
    if (!searchQuery.trim()) return uniqueContacts;
    const query = searchQuery.toLowerCase();
    return uniqueContacts.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    );
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim()) {
      Alert.alert('Error', 'Please enter a contact name');
      return;
    }

    if (!newContact.email.trim() && !newContact.phone.trim()) {
      Alert.alert('Error', 'Please enter either an email or phone number');
      return;
    }

    const contact: Contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newContact.name.trim(),
      email: newContact.email.trim() || undefined,
      phone: newContact.phone.trim() || undefined,
      source: 'manual',
      addedAt: new Date().toISOString(),
    };

    await addContact(contact);
    setNewContact({ name: '', email: '', phone: '' });
    setShowAddContactModal(false);
    Alert.alert('Success', 'Contact added successfully');
  };

  const handleSelectContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const handleSendInvites = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact');
      return;
    }

    if (!selectedTemplate) {
      Alert.alert('Error', 'Please select a message template');
      return;
    }

    const referralCode = user.referralCode || `AG${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const referralLink = generateReferralLink(referralCode);

    const invitesToSend = selectedContacts.map(contactId => {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return null;

      const message = interpolateTemplate(selectedTemplate.message, {
        name: contact.name,
        code: referralCode,
        link: referralLink,
        agentName: user.name,
      });

      return {
        id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: user.id,
        contactId: contact.id,
        contactName: contact.name,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        method: inviteMethod,
        status: 'sent' as const,
        referralCode,
        message,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }).filter(Boolean);

    if (invitesToSend.length > 0) {
      await sendBulkInvites(invitesToSend as any);
      
      if (Platform.OS === 'web') {
        Alert.alert(
          'Invites Sent',
          `${invitesToSend.length} invite(s) have been queued for sending via ${inviteMethod}.`
        );
      } else {
        const message = invitesToSend[0]?.message || '';
        await Share.share({
          message: message,
          title: selectedTemplate.subject || 'Join FameMatch',
        });
      }

      setSelectedContacts([]);
      setShowSendInviteModal(false);
      setSelectedTemplate(null);
    }
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteContact(contactId);
          },
        },
      ]
    );
  };

  const copyReferralCode = () => {
    const code = user.referralCode || '';
    Alert.alert('Copied!', `Referral code ${code} copied to clipboard`);
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={styles.statIconContainer}>
          <Send size={20} color={colors.primary} />
        </View>
        <Text style={styles.statValue}>{stats.sent}</Text>
        <Text style={styles.statLabel}>Sent</Text>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statIconContainer}>
          <CheckCircle2 size={20} color={colors.success} />
        </View>
        <Text style={styles.statValue}>{stats.accepted}</Text>
        <Text style={styles.statLabel}>Accepted</Text>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statIconContainer}>
          <TrendingUp size={20} color={colors.accent} />
        </View>
        <Text style={styles.statValue}>{stats.acceptanceRate}%</Text>
        <Text style={styles.statLabel}>Rate</Text>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statIconContainer}>
          <DollarSign size={20} color={colors.warning} />
        </View>
        <Text style={styles.statValue}>${totalCommissions.toFixed(0)}</Text>
        <Text style={styles.statLabel}>Earned</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.analyticsCard}
        onPress={() => router.push('/referral-analytics')}
      >
        <View style={styles.statIconContainer}>
          <BarChart3 size={20} color={colors.primary} />
        </View>
        <Text style={styles.analyticsLabel}>View Analytics</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReferralCodeCard = () => (
    <View style={styles.referralCard}>
      <Text style={styles.referralTitle}>Your Referral Code</Text>
      <View style={styles.referralCodeContainer}>
        <Text style={styles.referralCode}>{user.referralCode || 'Generate Code'}</Text>
        <TouchableOpacity onPress={copyReferralCode} style={styles.copyButton}>
          <Copy size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.referralSubtext}>
        Share this code to earn 10% commission on all deals
      </Text>
    </View>
  );

  const renderContactsList = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Contacts ({contacts.length})</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.importButton}
            onPress={handleImportContacts}
            disabled={isImporting || isProcessingCSV}
          >
            {isImporting || isProcessingCSV ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Upload size={18} color={colors.primary} />
                <Text style={styles.importButtonText}>Import</Text>
              </>
            )}
          </TouchableOpacity>
          {contacts.length > 0 && (
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={handleExportContacts}
            >
              <Download size={18} color={colors.accent} />
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddContactModal(true)}
          >
            <Plus size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No contacts yet</Text>
          <Text style={styles.emptyStateSubtext}>Add contacts to start sending invites</Text>
        </View>
      ) : (
        <View style={styles.contactsList}>
          {contacts.map((contact) => {
            const contactInvites = invites.filter(i => i.contactId === contact.id);
            const lastInvite = contactInvites[contactInvites.length - 1];
            const isSelected = selectedContacts.includes(contact.id);

            return (
              <TouchableOpacity
                key={contact.id}
                style={[styles.contactCard, isSelected && styles.contactCardSelected]}
                onPress={() => handleSelectContact(contact.id)}
                activeOpacity={0.7}
              >
                <View style={styles.contactInfo}>
                  <View style={styles.contactHeader}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {lastInvite && (
                      <View style={[
                        styles.statusBadge,
                        lastInvite.status === 'accepted' && styles.statusAccepted,
                        lastInvite.status === 'sent' && styles.statusSent,
                        lastInvite.status === 'pending' && styles.statusPending,
                      ]}>
                        <Text style={styles.statusText}>{lastInvite.status}</Text>
                      </View>
                    )}
                  </View>
                  {contact.email && (
                    <Text style={styles.contactDetail}>{contact.email}</Text>
                  )}
                  {contact.phone && (
                    <Text style={styles.contactDetail}>{contact.phone}</Text>
                  )}
                  {contactInvites.length > 0 && (
                    <Text style={styles.inviteCount}>
                      {contactInvites.length} invite(s) sent
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteContact(contact.id)}
                >
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {selectedContacts.length > 0 && (
        <TouchableOpacity
          style={styles.sendInvitesButton}
          onPress={() => setShowSendInviteModal(true)}
        >
          <Send size={20} color="#FFF" />
          <Text style={styles.sendInvitesButtonText}>
            Send Invites ({selectedContacts.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderInviteHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Invites</Text>
      {agentInvites.length === 0 ? (
        <View style={styles.emptyState}>
          <Mail size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No invites sent yet</Text>
        </View>
      ) : (
        <View style={styles.invitesList}>
          {agentInvites.slice(0, 10).map((invite) => (
            <View key={invite.id} style={styles.inviteCard}>
              <View style={styles.inviteInfo}>
                <Text style={styles.inviteName}>{invite.contactName}</Text>
                <Text style={styles.inviteMethod}>
                  via {invite.method === 'email' ? 'Email' : invite.method === 'sms' ? 'SMS' : 'Email & SMS'}
                </Text>
                <Text style={styles.inviteDate}>
                  {new Date(invite.sentAt || invite.expiresAt || '').toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.inviteStatusBadge,
                invite.status === 'accepted' && styles.statusAccepted,
                invite.status === 'sent' && styles.statusSent,
                invite.status === 'pending' && styles.statusPending,
                invite.status === 'expired' && styles.statusExpired,
              ]}>
                {invite.status === 'accepted' && <CheckCircle2 size={16} color={colors.success} />}
                {invite.status === 'sent' && <Clock size={16} color={colors.warning} />}
                {invite.status === 'pending' && <Clock size={16} color={colors.textSecondary} />}
                {invite.status === 'expired' && <XCircle size={16} color={colors.error} />}
                <Text style={styles.inviteStatusText}>{invite.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: 'Invite & Earn',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStatsCard()}
        {renderReferralCodeCard()}
        {renderContactsList()}
        {renderInviteHistory()}
      </ScrollView>

      <Modal
        visible={showAddContactModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddContactModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Add Contact</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name *"
              placeholderTextColor={colors.textSecondary}
              value={newContact.name}
              onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={newContact.email}
              onChangeText={(text) => setNewContact({ ...newContact, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor={colors.textSecondary}
              value={newContact.phone}
              onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddContactModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAddContact}
              >
                <Text style={styles.modalConfirmText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showSendInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSendInviteModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSendInviteModal(false)}
        >
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Send Invites</Text>
              <Text style={styles.modalSubtitle}>
                Sending to {selectedContacts.length} contact(s)
              </Text>

              <View style={styles.methodSection}>
                <Text style={styles.methodLabel}>Delivery Method</Text>
                <View style={styles.methodButtons}>
                  <TouchableOpacity
                    style={[styles.methodButton, inviteMethod === 'email' && styles.methodButtonActive]}
                    onPress={() => setInviteMethod('email')}
                  >
                    <Mail size={20} color={inviteMethod === 'email' ? '#FFF' : colors.primary} />
                    <Text style={[
                      styles.methodButtonText,
                      inviteMethod === 'email' && styles.methodButtonTextActive
                    ]}>Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodButton, inviteMethod === 'sms' && styles.methodButtonActive]}
                    onPress={() => setInviteMethod('sms')}
                  >
                    <MessageSquare size={20} color={inviteMethod === 'sms' ? '#FFF' : colors.primary} />
                    <Text style={[
                      styles.methodButtonText,
                      inviteMethod === 'sms' && styles.methodButtonTextActive
                    ]}>SMS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodButton, inviteMethod === 'both' && styles.methodButtonActive]}
                    onPress={() => setInviteMethod('both')}
                  >
                    <Send size={20} color={inviteMethod === 'both' ? '#FFF' : colors.primary} />
                    <Text style={[
                      styles.methodButtonText,
                      inviteMethod === 'both' && styles.methodButtonTextActive
                    ]}>Both</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sendInviteTemplateSection}>
                <Text style={styles.templateLabel}>Message Template</Text>
                <View style={styles.templateList}>
                  {templates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateCard,
                        selectedTemplate?.id === template.id && styles.templateCardActive
                      ]}
                      onPress={() => setSelectedTemplate(template)}
                    >
                      <View style={styles.templateHeader}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle2 size={20} color={colors.primary} />
                        )}
                      </View>
                      <Text style={styles.templatePreview} numberOfLines={2}>
                        {template.message.substring(0, 100)}...
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowSendInviteModal(false);
                    setSelectedTemplate(null);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleSendInvites}
                >
                  <Send size={18} color="#FFF" />
                  <Text style={styles.modalConfirmText}>Send Invites</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showImportOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImportOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImportOptions(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Import Contacts</Text>
            <Text style={styles.modalSubtitle}>Choose an import method</Text>

            <TouchableOpacity
              style={styles.importOptionButton}
              onPress={handlePhoneContactsImport}
            >
              <Smartphone size={24} color={colors.primary} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>Phone Contacts</Text>
                <Text style={styles.importOptionSubtitle}>Import from your device contacts</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.importOptionButton}
              onPress={handleCSVImport}
            >
              <FileText size={24} color={colors.accent} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>CSV File</Text>
                <Text style={styles.importOptionSubtitle}>Upload a CSV file with contacts</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.importOptionButton}
              onPress={handleGmailImport}
            >
              <Mail size={24} color={colors.warning} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>Gmail Contacts</Text>
                <Text style={styles.importOptionSubtitle}>Import from your Gmail account</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.templateSection}>
              <Text style={styles.templateSectionTitle}>Need a template?</Text>
              <TouchableOpacity
                style={styles.downloadTemplateButton}
                onPress={handleDownloadTemplate}
              >
                <Download size={18} color={colors.primary} />
                <Text style={styles.downloadTemplateText}>Download CSV Template</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowImportOptions(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.importModalContent}>
            <View style={styles.importModalHeader}>
              <Text style={styles.modalTitle}>Select Contacts to Import</Text>
              <TouchableOpacity
                onPress={() => setShowImportModal(false)}
                style={styles.closeButton}
              >
                <XCircle size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.selectAllContainer}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAllPhoneContacts}
              >
                <CheckCircle2 
                  size={20} 
                  color={selectedPhoneContacts.length === getFilteredPhoneContacts().length && getFilteredPhoneContacts().length > 0 ? colors.primary : colors.textSecondary} 
                />
                <Text style={styles.selectAllText}>
                  {selectedPhoneContacts.length === getFilteredPhoneContacts().length && getFilteredPhoneContacts().length > 0 ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.selectedCount}>
                {selectedPhoneContacts.length} selected
              </Text>
            </View>

            <ScrollView style={styles.phoneContactsList}>
              {getFilteredPhoneContacts().map((contact) => {
                const isSelected = selectedPhoneContacts.includes(contact.id);
                const alreadyExists = contacts.some(c => 
                  (c.email && contact.email && c.email === contact.email) ||
                  (c.phone && contact.phone && c.phone === contact.phone)
                );

                return (
                  <TouchableOpacity
                    key={contact.id}
                    style={[
                      styles.phoneContactCard,
                      isSelected && styles.phoneContactCardSelected,
                      alreadyExists && styles.phoneContactCardExists
                    ]}
                    onPress={() => !alreadyExists && handleSelectPhoneContact(contact.id)}
                    disabled={alreadyExists}
                  >
                    <View style={styles.phoneContactInfo}>
                      <Text style={styles.phoneContactName}>{contact.name}</Text>
                      {contact.email && (
                        <Text style={styles.phoneContactDetail}>{contact.email}</Text>
                      )}
                      {contact.phone && (
                        <Text style={styles.phoneContactDetail}>{contact.phone}</Text>
                      )}
                      {alreadyExists && (
                        <Text style={styles.existsLabel}>Already imported</Text>
                      )}
                    </View>
                    {!alreadyExists && (
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected
                      ]}>
                        {isSelected && <CheckCircle2 size={20} color={colors.primary} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.importModalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowImportModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  selectedPhoneContacts.length === 0 && styles.modalConfirmButtonDisabled
                ]}
                onPress={handleConfirmImport}
                disabled={selectedPhoneContacts.length === 0}
              >
                <Text style={styles.modalConfirmText}>
                  Import ({selectedPhoneContacts.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 75,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  analyticsCard: {
    flex: 1,
    minWidth: 75,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsLabel: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600' as const,
    marginTop: 4,
    textAlign: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  referralCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  referralTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primary,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  referralSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  importOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  importOptionText: {
    flex: 1,
  },
  importOptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  importOptionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  templateSection: {
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  downloadTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  downloadTemplateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contactCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  contactDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inviteCount: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.textSecondary,
  },
  statusAccepted: {
    backgroundColor: colors.success,
  },
  statusSent: {
    backgroundColor: colors.warning,
  },
  statusPending: {
    backgroundColor: colors.textSecondary,
  },
  statusExpired: {
    backgroundColor: colors.error,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFF',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 8,
  },
  sendInvitesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  sendInvitesButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  invitesList: {
    gap: 12,
  },
  inviteCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteInfo: {
    flex: 1,
  },
  inviteName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  inviteMethod: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  inviteDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inviteStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inviteStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF',
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodSection: {
    marginBottom: 20,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  methodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  methodButtonTextActive: {
    color: '#FFF',
  },
  sendInviteTemplateSection: {
    marginBottom: 20,
  },
  templateLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  templateList: {
    gap: 8,
  },
  templateCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  templatePreview: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  importModalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '90%',
    maxWidth: 600,
    height: '85%',
    overflow: 'hidden',
  },
  importModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  selectedCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  phoneContactsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  phoneContactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  phoneContactCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  phoneContactCardExists: {
    opacity: 0.5,
  },
  phoneContactInfo: {
    flex: 1,
  },
  phoneContactName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  phoneContactDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  existsLabel: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
  },
  importModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
});
