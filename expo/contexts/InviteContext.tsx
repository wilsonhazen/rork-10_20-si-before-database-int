import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useMemo } from 'react';
import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
import type { Contact, Invite, InviteTemplate, InvitePerformanceMetrics, ReferralFunnel, ReferralFunnelStage, ContactPerformance, ABTestResults, ReferralInsights, ContactSegment, ContactReminder, ContactTag } from '@/types';

const CONTACTS_KEY = '@sourceimpact_contacts';
const INVITES_KEY = '@sourceimpact_invites';
const TEMPLATES_KEY = '@sourceimpact_invite_templates';
const REMINDERS_KEY = '@sourceimpact_contact_reminders';
const TAGS_KEY = '@sourceimpact_contact_tags';

const DEFAULT_TEMPLATES: InviteTemplate[] = [
  {
    id: 'default_1',
    name: 'Professional Invite',
    subject: 'Join Source Impact - Connect with Top Brands & Influencers',
    message: `Hi {{name}},

I wanted to personally invite you to join Source Impact, the premier platform connecting brands with influencers.

As an agent on the platform, I've seen incredible opportunities for both sponsors and influencers to create meaningful partnerships.

Use my referral code {{code}} when you sign up to get started: {{link}}

Benefits:
• Direct access to verified brands and influencers
• Secure payment processing with escrow protection
• Real-time deal tracking and analytics
• Exclusive rewards program

Looking forward to seeing you on the platform!

Best regards,
{{agentName}}`,
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default_2',
    name: 'Casual Invite',
    subject: 'Check out Source Impact!',
    message: `Hey {{name}}!

I've been using Source Impact to connect brands with influencers and it's been amazing. Thought you might be interested!

Join using my link: {{link}}
My referral code: {{code}}

It's super easy to get started and there are tons of opportunities. Let me know if you have any questions!

Cheers,
{{agentName}}`,
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default_3',
    name: 'Opportunity Focused',
    subject: 'Exclusive Opportunity on Source Impact',
    message: `Hi {{name}},

I'm reaching out because I think you'd be perfect for Source Impact - a platform that's revolutionizing influencer marketing.

Why join now:
✓ Growing marketplace with premium brands
✓ Transparent pricing and secure payments
✓ Professional tools for managing campaigns
✓ Earn rewards for your activity

Sign up with my referral code {{code}}: {{link}}

This is a great time to get in early and establish your presence!

Best,
{{agentName}}`,
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

export const [InviteProvider, useInvites] = createContextHook(() => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [templates, setTemplates] = useState<InviteTemplate[]>(DEFAULT_TEMPLATES);
  const [reminders, setReminders] = useState<ContactReminder[]>([]);
  const [tags, setTags] = useState<ContactTag[]>([]);
  const isLoading = false;

  const addContact = useCallback(async (contact: Contact) => {
    const updated = [...contacts, contact];
    setContacts(updated);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
    console.log('Contact added:', contact.name);
  }, [contacts]);

  const addContacts = useCallback(async (newContacts: Contact[]) => {
    const existingMap = new Map();
    contacts.forEach(c => {
      if (c.email) existingMap.set(c.email.toLowerCase(), true);
      if (c.phone) existingMap.set(c.phone.replace(/\D/g, ''), true);
    });
    
    const uniqueContacts = newContacts.filter(c => {
      const emailExists = c.email && existingMap.has(c.email.toLowerCase());
      const phoneExists = c.phone && existingMap.has(c.phone.replace(/\D/g, ''));
      const isDuplicate = emailExists || phoneExists;
      
      if (!isDuplicate) {
        if (c.email) existingMap.set(c.email.toLowerCase(), true);
        if (c.phone) existingMap.set(c.phone.replace(/\D/g, ''), true);
      }
      
      return !isDuplicate;
    });
    
    const updated = [...contacts, ...uniqueContacts];
    setContacts(updated);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
    console.log(`${uniqueContacts.length} new contacts added (${newContacts.length - uniqueContacts.length} duplicates skipped)`);
    return uniqueContacts.length;
  }, [contacts]);

  const fetchPhoneContacts = useCallback(async (): Promise<{ success: boolean; contacts: Contact[]; error?: string }> => {
    try {
      console.log('[ContactImport] Starting contact import process...');
      
      if (Platform.OS === 'web') {
        console.log('[ContactImport] Web platform detected, contact import not supported');
        return { success: false, contacts: [], error: 'Contact import is not available on web' };
      }

      console.log('[ContactImport] Requesting contacts permission...');
      const permissionResult = await Contacts.requestPermissionsAsync();
      console.log('[ContactImport] Permission result:', JSON.stringify(permissionResult));
      
      if (permissionResult.status !== 'granted') {
        console.log('[ContactImport] Permission denied:', permissionResult.status);
        return { 
          success: false, 
          contacts: [], 
          error: `Permission to access contacts was ${permissionResult.status}. Please enable contacts access in your device Settings > Privacy > Contacts.` 
        };
      }

      console.log('[ContactImport] Permission granted, fetching contacts...');
      
      let allContacts: any[] = [];
      let hasNextPage = true;
      let pageOffset = 0;
      
      while (hasNextPage) {
        const result = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
          pageSize: 1000,
          pageOffset,
        });
        
        console.log(`[ContactImport] Fetched page at offset ${pageOffset}: ${result.data?.length || 0} contacts, hasNextPage=${result.hasNextPage}`);
        
        if (result.data && result.data.length > 0) {
          allContacts = [...allContacts, ...result.data];
        }
        
        hasNextPage = result.hasNextPage || false;
        pageOffset += result.data?.length || 0;
        
        if (!hasNextPage || !result.data || result.data.length === 0) {
          break;
        }
      }

      console.log('[ContactImport] Total contacts fetched:', allContacts.length);

      if (allContacts.length === 0) {
        console.log('[ContactImport] No contacts found in device');
        return { success: false, contacts: [], error: 'No contacts found on your device. Please add some contacts first.' };
      }

      console.log(`[ContactImport] Processing ${allContacts.length} raw contacts...`);
      let filteredCount = 0;
      
      const phoneContacts: Contact[] = allContacts
        .filter(contact => {
          const hasName = contact.name && contact.name.trim().length > 0;
          const hasEmail = contact.emails && contact.emails.length > 0;
          const hasPhone = contact.phoneNumbers && contact.phoneNumbers.length > 0;
          const isValid = hasName && (hasEmail || hasPhone);
          
          if (!isValid) {
            filteredCount++;
            if (filteredCount <= 5) {
              console.log(`[ContactImport] Filtered out: name="${contact.name || 'NO_NAME'}", hasEmail=${hasEmail}, hasPhone=${hasPhone}`);
            }
          }
          
          return isValid;
        })
        .map((contact, index) => {
          const email = contact.emails?.[0]?.email;
          const phone = contact.phoneNumbers?.[0]?.number;
          
          const uniqueId = email || phone || contact.name || '';
          const idHash = uniqueId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const timestamp = Date.now();
          const randomPart = Math.random().toString(36).substr(2, 9);
          const uniqueContactId = `imported_${timestamp}_${index}_${idHash}_${randomPart}`;
          
          if (index < 3) {
            console.log(`[ContactImport] Valid contact ${index + 1}: name="${contact.name}", email=${email}, phone=${phone}, id=${uniqueContactId}`);
          }
          
          return {
            id: uniqueContactId,
            name: contact.name || 'Unknown',
            email: email,
            phone: phone,
            source: 'imported' as const,
            addedAt: new Date().toISOString(),
          };
        });

      console.log(`[ContactImport] ✅ Success: ${phoneContacts.length} valid contacts (${filteredCount} filtered out from ${allContacts.length} total)`);
      
      if (phoneContacts.length === 0) {
        return { 
          success: false, 
          contacts: [], 
          error: `Found ${allContacts.length} contacts but none have a name and email/phone. Please check your contacts app.` 
        };
      }
      
      return { success: true, contacts: phoneContacts };
    } catch (error) {
      console.error('[ContactImport] ❌ Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ContactImport] Error details:', errorMessage);
      return { 
        success: false, 
        contacts: [], 
        error: `Failed to fetch contacts: ${errorMessage}. Please try again or contact support.` 
      };
    }
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    const updated = contacts.map(c => c.id === id ? { ...c, ...updates } : c);
    setContacts(updated);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
    console.log('Contact updated:', id);
  }, [contacts]);

  const updateContactSegment = useCallback(async (contactId: string, segment: ContactSegment) => {
    await updateContact(contactId, { segment });
  }, [updateContact]);

  const addContactTag = useCallback(async (contactId: string, tagName: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const currentTags = contact.tags || [];
    if (!currentTags.includes(tagName)) {
      await updateContact(contactId, { tags: [...currentTags, tagName] });
    }
  }, [contacts, updateContact]);

  const removeContactTag = useCallback(async (contactId: string, tagName: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const currentTags = contact.tags || [];
    await updateContact(contactId, { tags: currentTags.filter(t => t !== tagName) });
  }, [contacts, updateContact]);

  const updateContactNotes = useCallback(async (contactId: string, notes: string) => {
    await updateContact(contactId, { notes });
  }, [updateContact]);

  const trackInviteOpened = useCallback(async (inviteId: string, contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const engagement = contact.engagement || {
      totalInvitesSent: 0,
      openedCount: 0,
      clickedCount: 0,
      responseRate: 0,
    };

    const updatedEngagement = {
      ...engagement,
      openedCount: engagement.openedCount + 1,
      lastOpenedAt: new Date().toISOString(),
      responseRate: engagement.totalInvitesSent > 0 
        ? ((engagement.openedCount + 1) / engagement.totalInvitesSent) * 100
        : 0,
    };

    await updateContact(contactId, { engagement: updatedEngagement });
    console.log(`Invite opened tracked for contact ${contactId}`);
  }, [contacts, updateContact]);

  const trackInviteClicked = useCallback(async (inviteId: string, contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const engagement = contact.engagement || {
      totalInvitesSent: 0,
      openedCount: 0,
      clickedCount: 0,
      responseRate: 0,
    };

    const updatedEngagement = {
      ...engagement,
      clickedCount: engagement.clickedCount + 1,
      lastClickedAt: new Date().toISOString(),
      responseRate: engagement.totalInvitesSent > 0 
        ? ((engagement.clickedCount + 1) / engagement.totalInvitesSent) * 100
        : 0,
    };

    await updateContact(contactId, { engagement: updatedEngagement });
    console.log(`Invite clicked tracked for contact ${contactId}`);
  }, [contacts, updateContact]);

  const deleteContact = useCallback(async (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
  }, [contacts]);

  const sendInvite = useCallback(async (invite: Invite) => {
    const inviteWithMetadata = {
      ...invite,
      templateId: invite.templateId,
      location: invite.location,
    };
    
    const updated = [...invites, inviteWithMetadata];
    setInvites(updated);
    await AsyncStorage.setItem(INVITES_KEY, JSON.stringify(updated));
    
    const contact = contacts.find(c => c.id === invite.contactId);
    if (contact) {
      const engagement = contact.engagement || {
        totalInvitesSent: 0,
        openedCount: 0,
        clickedCount: 0,
        responseRate: 0,
      };
      
      await updateContact(contact.id, {
        engagement: {
          ...engagement,
          totalInvitesSent: engagement.totalInvitesSent + 1,
          lastInviteSentAt: new Date().toISOString(),
        },
        lastContactedAt: new Date().toISOString(),
      });
    }
    
    console.log(`Invite sent to ${invite.contactName} via ${invite.method}`);
  }, [invites, contacts, updateContact]);

  const sendBulkInvites = useCallback(async (newInvites: Invite[]) => {
    const updated = [...invites, ...newInvites];
    setInvites(updated);
    await AsyncStorage.setItem(INVITES_KEY, JSON.stringify(updated));
    
    for (const invite of newInvites) {
      const contact = contacts.find(c => c.id === invite.contactId);
      if (contact) {
        const engagement = contact.engagement || {
          totalInvitesSent: 0,
          openedCount: 0,
          clickedCount: 0,
          responseRate: 0,
        };
        
        await updateContact(contact.id, {
          engagement: {
            ...engagement,
            totalInvitesSent: engagement.totalInvitesSent + 1,
            lastInviteSentAt: new Date().toISOString(),
          },
          lastContactedAt: new Date().toISOString(),
        });
      }
    }
    
    console.log(`${newInvites.length} invites sent`);
  }, [invites, contacts, updateContact]);

  const updateInvite = useCallback(async (id: string, updates: Partial<Invite>) => {
    const updated = invites.map(i => i.id === id ? { ...i, ...updates } : i);
    setInvites(updated);
    await AsyncStorage.setItem(INVITES_KEY, JSON.stringify(updated));
  }, [invites]);

  const markInviteAccepted = useCallback(async (referralCode: string, userId: string) => {
    const invite = invites.find(i => i.referralCode === referralCode && i.status === 'sent');
    if (invite) {
      await updateInvite(invite.id, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        userId,
      });
      console.log(`Invite accepted by ${invite.contactName}`);
    }
  }, [invites, updateInvite]);

  const markInviteVerified = useCallback(async (userId: string) => {
    const invite = invites.find(i => i.userId === userId && !i.isVerified);
    if (invite) {
      await updateInvite(invite.id, {
        isVerified: true,
        verifiedAt: new Date().toISOString(),
      });
      console.log(`Invite verified for user ${userId}`);
      return invite.agentId;
    }
    return null;
  }, [invites, updateInvite]);

  const sendReminder = useCallback(async (inviteId: string) => {
    await updateInvite(inviteId, {
      reminderSentAt: new Date().toISOString(),
    });
    console.log('Reminder sent for invite:', inviteId);
  }, [updateInvite]);

  const addTemplate = useCallback(async (template: InviteTemplate) => {
    const updated = [...templates, template];
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
  }, [templates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<InviteTemplate>) => {
    const updated = templates.map(t => t.id === id ? { ...t, ...updates } : t);
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
  }, [templates]);

  const deleteTemplate = useCallback(async (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
  }, [templates]);

  const getAgentInvites = useCallback((agentId: string): Invite[] => {
    return invites.filter(i => i.agentId === agentId);
  }, [invites]);

  const getInviteStats = useCallback((agentId: string) => {
    const agentInvites = invites.filter(i => i.agentId === agentId);
    const verifiedInvites = agentInvites.filter(i => i.isVerified === true);
    return {
      total: agentInvites.length,
      sent: agentInvites.filter(i => i.status === 'sent').length,
      accepted: agentInvites.filter(i => i.status === 'accepted').length,
      verified: verifiedInvites.length,
      pending: agentInvites.filter(i => i.status === 'pending').length,
      expired: agentInvites.filter(i => i.status === 'expired').length,
      acceptanceRate: agentInvites.length > 0 
        ? (agentInvites.filter(i => i.status === 'accepted').length / agentInvites.length * 100).toFixed(1)
        : '0',
    };
  }, [invites]);

  const getTemplatePerformance = useCallback((agentId: string): InvitePerformanceMetrics[] => {
    const agentInvites = invites.filter(i => i.agentId === agentId);
    const templateMap = new Map<string, { name: string; sent: number; accepted: number; verified: number; totalTime: number; contactIds: Set<string> }>();

    templates.forEach(t => {
      templateMap.set(t.id, {
        name: t.name,
        sent: 0,
        accepted: 0,
        verified: 0,
        totalTime: 0,
        contactIds: new Set(),
      });
    });

    agentInvites.forEach(invite => {
      const templateId = invite.message ? 
        templates.find(t => invite.message.includes(t.name))?.id || 'unknown' : 'unknown';
      
      const stats = templateMap.get(templateId);
      if (stats) {
        stats.sent++;
        stats.contactIds.add(invite.contactId);
        if (invite.status === 'accepted' || invite.isVerified) {
          stats.accepted++;
        }
        if (invite.isVerified) {
          stats.verified++;
          if (invite.sentAt && invite.acceptedAt) {
            const sentTime = new Date(invite.sentAt).getTime();
            const acceptedTime = new Date(invite.acceptedAt).getTime();
            stats.totalTime += (acceptedTime - sentTime) / (1000 * 60 * 60);
          }
        }
      }
    });

    return Array.from(templateMap.entries()).map(([templateId, stats]) => ({
      templateId,
      templateName: stats.name,
      sent: stats.sent,
      accepted: stats.accepted,
      verified: stats.verified,
      conversionRate: stats.sent > 0 ? (stats.accepted / stats.sent) * 100 : 0,
      avgTimeToAccept: stats.verified > 0 ? stats.totalTime / stats.verified : undefined,
      contactsReached: stats.contactIds.size,
    }));
  }, [invites, templates]);

  const getReferralFunnel = useCallback((agentId: string, timeRange?: { start: string; end: string }): ReferralFunnel => {
    let agentInvites = invites.filter(i => i.agentId === agentId);
    
    if (timeRange) {
      const startTime = new Date(timeRange.start).getTime();
      const endTime = new Date(timeRange.end).getTime();
      agentInvites = agentInvites.filter(i => {
        const sentTime = i.sentAt ? new Date(i.sentAt).getTime() : 0;
        return sentTime >= startTime && sentTime <= endTime;
      });
    }

    const contacted = contacts.filter(c => agentInvites.some(i => i.contactId === c.id)).length;
    const sent = agentInvites.filter(i => i.status === 'sent' || i.status === 'accepted').length;
    const signedUp = agentInvites.filter(i => i.status === 'accepted' || i.isVerified).length;
    const verified = agentInvites.filter(i => i.isVerified).length;

    const stages: ReferralFunnelStage[] = [
      { stage: 'contacted', count: contacted, percentage: 100 },
      { stage: 'sent', count: sent, percentage: contacted > 0 ? (sent / contacted) * 100 : 0, dropoffFromPrevious: contacted - sent },
      { stage: 'signed_up', count: signedUp, percentage: contacted > 0 ? (signedUp / contacted) * 100 : 0, dropoffFromPrevious: sent - signedUp },
      { stage: 'verified', count: verified, percentage: contacted > 0 ? (verified / contacted) * 100 : 0, dropoffFromPrevious: signedUp - verified },
    ];

    return {
      agentId,
      stages,
      overallConversionRate: contacted > 0 ? (verified / contacted) * 100 : 0,
      totalContacted: contacted,
      totalVerified: verified,
      timeRange: timeRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    };
  }, [invites, contacts]);

  const getContactPerformance = useCallback((agentId: string): ContactPerformance[] => {
    const agentInvites = invites.filter(i => i.agentId === agentId);
    const contactMap = new Map<string, ContactPerformance>();

    contacts.forEach(contact => {
      const contactInvites = agentInvites.filter(i => i.contactId === contact.id);
      if (contactInvites.length > 0) {
        const accepted = contactInvites.some(i => i.status === 'accepted' || i.isVerified);
        const verified = contactInvites.some(i => i.isVerified);
        const firstInvite = contactInvites[0];
        const verifiedInvite = contactInvites.find(i => i.isVerified);

        let daysToConversion: number | undefined;
        if (firstInvite.sentAt && verifiedInvite?.verifiedAt) {
          const sentTime = new Date(firstInvite.sentAt).getTime();
          const verifiedTime = new Date(verifiedInvite.verifiedAt).getTime();
          daysToConversion = (verifiedTime - sentTime) / (1000 * 60 * 60 * 24);
        }

        const engagementScore = (
          (verified ? 50 : 0) +
          (accepted ? 30 : 0) +
          (contactInvites.length > 1 ? 10 : 0) +
          (daysToConversion && daysToConversion < 7 ? 10 : 0)
        );

        contactMap.set(contact.id, {
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email,
          invitesSent: contactInvites.length,
          acceptanceStatus: verified ? 'accepted' : (accepted ? 'accepted' : 'pending'),
          signupDate: verifiedInvite?.acceptedAt,
          verificationDate: verifiedInvite?.verifiedAt,
          totalDealsValue: 0,
          commissionGenerated: 0,
          engagementScore,
          daysToConversion,
        });
      }
    });

    return Array.from(contactMap.values()).sort((a, b) => b.engagementScore - a.engagementScore);
  }, [invites, contacts]);

  const getReferralInsights = useCallback((agentId: string): ReferralInsights => {
    const templatePerformance = getTemplatePerformance(agentId);
    const contactPerformance = getContactPerformance(agentId);
    const agentInvites = invites.filter(i => i.agentId === agentId);
    
    const sortedTemplates = [...templatePerformance].sort((a, b) => b.conversionRate - a.conversionRate);
    const bestTemplate = sortedTemplates[0] || {
      templateId: '',
      templateName: 'N/A',
      sent: 0,
      accepted: 0,
      verified: 0,
      conversionRate: 0,
      contactsReached: 0,
    };
    const worstTemplate = sortedTemplates[sortedTemplates.length - 1] || bestTemplate;

    const acceptedInvites = agentInvites.filter(i => i.sentAt && i.acceptedAt);
    const totalTime = acceptedInvites.reduce((sum, invite) => {
      if (invite.sentAt && invite.acceptedAt) {
        return sum + (new Date(invite.acceptedAt).getTime() - new Date(invite.sentAt).getTime());
      }
      return sum;
    }, 0);
    const avgTimeToConversion = acceptedInvites.length > 0 ? totalTime / acceptedInvites.length / (1000 * 60 * 60 * 24) : 0;

    const methodComparison: { method: 'sms' | 'email' | 'both'; sent: number; accepted: number; conversionRate: number }[] = [
      { method: 'email', sent: 0, accepted: 0, conversionRate: 0 },
      { method: 'sms', sent: 0, accepted: 0, conversionRate: 0 },
      { method: 'both', sent: 0, accepted: 0, conversionRate: 0 },
    ];

    agentInvites.forEach(invite => {
      const methodData = methodComparison.find(m => m.method === invite.method);
      if (methodData) {
        methodData.sent++;
        if (invite.status === 'accepted' || invite.isVerified) {
          methodData.accepted++;
        }
      }
    });

    methodComparison.forEach(m => {
      m.conversionRate = m.sent > 0 ? (m.accepted / m.sent) * 100 : 0;
    });

    const geographicConversions: { location: string; count: number; conversionRate: number }[] = [];
    const locationMap = new Map<string, { sent: number; accepted: number }>();

    agentInvites.forEach(invite => {
      const location = invite.location || 'Unknown';
      const existing = locationMap.get(location) || { sent: 0, accepted: 0 };
      existing.sent++;
      if (invite.status === 'accepted' || invite.isVerified) {
        existing.accepted++;
      }
      locationMap.set(location, existing);
    });

    locationMap.forEach((stats, location) => {
      geographicConversions.push({
        location,
        count: stats.accepted,
        conversionRate: stats.sent > 0 ? (stats.accepted / stats.sent) * 100 : 0,
      });
    });

    geographicConversions.sort((a, b) => b.conversionRate - a.conversionRate);

    const recommendedActions: string[] = [];
    if (bestTemplate.conversionRate > worstTemplate.conversionRate * 1.5) {
      recommendedActions.push(`Focus on "${bestTemplate.templateName}" template - it has ${bestTemplate.conversionRate.toFixed(1)}% conversion rate`);
    }
    if (contactPerformance.length > 0) {
      const topContacts = contactPerformance.slice(0, 3);
      recommendedActions.push(`Follow up with ${topContacts.length} high-engagement contacts`);
    }
    if (avgTimeToConversion > 14) {
      recommendedActions.push('Send reminders after 7 days to improve conversion time');
    }

    const bestMethod = methodComparison.sort((a, b) => b.conversionRate - a.conversionRate)[0];
    if (bestMethod && bestMethod.conversionRate > 0) {
      recommendedActions.push(`${bestMethod.method.toUpperCase()} has the best ${bestMethod.conversionRate.toFixed(1)}% conversion rate`);
    }

    return {
      bestPerformingTemplate: bestTemplate,
      worstPerformingTemplate: worstTemplate,
      bestPerformingContacts: contactPerformance.slice(0, 10),
      avgTimeToConversion,
      peakSendingTimes: [],
      recommendedActions,
      geographicConversions: geographicConversions.slice(0, 10),
      methodComparison,
    };
  }, [invites, getTemplatePerformance, getContactPerformance]);

  const getContactInvites = useCallback((contactId: string): Invite[] => {
    return invites.filter(i => i.contactId === contactId);
  }, [invites]);

  const interpolateTemplate = useCallback((
    template: string,
    variables: {
      name: string;
      code: string;
      link: string;
      agentName: string;
    }
  ): string => {
    return template
      .replace(/\{\{name\}\}/g, variables.name)
      .replace(/\{\{code\}\}/g, variables.code)
      .replace(/\{\{link\}\}/g, variables.link)
      .replace(/\{\{agentName\}\}/g, variables.agentName);
  }, []);

  const generateReferralLink = useCallback((referralCode: string): string => {
    const webUrl = 'https://sourceimpact.app';
    return `${webUrl}/onboarding?ref=${referralCode}`;
  }, []);

  const generateShareableMessage = useCallback((referralCode: string, contactName: string, templateMessage: string): string => {
    const link = generateReferralLink(referralCode);
    return templateMessage
      .replace(/\{\{name\}\}/g, contactName)
      .replace(/\{\{code\}\}/g, referralCode)
      .replace(/\{\{link\}\}/g, link);
  }, [generateReferralLink]);

  const generateCSVTemplate = useCallback((): string => {
    return 'Name,Email,Phone\nJohn Doe,john@example.com,+1234567890\nJane Smith,jane@example.com,+0987654321';
  }, []);

  const exportContactsToCSV = useCallback((): string => {
    const headers = 'Name,Email,Phone';
    const rows = contacts.map(c => {
      const name = c.name.replace(/,/g, ' ');
      const email = c.email || '';
      const phone = c.phone || '';
      return `${name},${email},${phone}`;
    });
    return [headers, ...rows].join('\n');
  }, [contacts]);

  const importContactsFromCSV = useCallback(async (csvContent: string): Promise<{ success: boolean; added: number; errors: string[] }> => {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, added: 0, errors: ['CSV file is empty or invalid'] };
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const nameIndex = headers.findIndex(h => h === 'name');
      const emailIndex = headers.findIndex(h => h === 'email');
      const phoneIndex = headers.findIndex(h => h === 'phone');

      if (nameIndex === -1) {
        return { success: false, added: 0, errors: ['CSV must have a "Name" column'] };
      }

      const newContacts: Contact[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const name = values[nameIndex];
        const email = emailIndex !== -1 ? values[emailIndex] : undefined;
        const phone = phoneIndex !== -1 ? values[phoneIndex] : undefined;

        if (!name) {
          errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }

        if (!email && !phone) {
          errors.push(`Row ${i + 1}: Either email or phone is required`);
          continue;
        }

        newContacts.push({
          id: `csv_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          email: email || undefined,
          phone: phone || undefined,
          source: 'imported',
          addedAt: new Date().toISOString(),
        });
      }

      const added = await addContacts(newContacts);
      console.log(`CSV Import: ${added} contacts added, ${errors.length} errors`);
      
      return { success: true, added, errors };
    } catch (error) {
      console.error('CSV import error:', error);
      return { success: false, added: 0, errors: ['Failed to parse CSV file'] };
    }
  }, [addContacts]);

  const importGmailContacts = useCallback(async (): Promise<{ success: boolean; contacts: Contact[]; error?: string }> => {
    try {
      if (Platform.OS === 'web') {
        return { 
          success: false, 
          contacts: [], 
          error: 'Gmail import is only available on mobile. Please use CSV import on web.' 
        };
      }
      
      return { 
        success: false, 
        contacts: [], 
        error: 'Gmail import requires OAuth setup. Please use phone contacts or CSV import.' 
      };
    } catch (error) {
      console.error('Gmail import error:', error);
      return { success: false, contacts: [], error: 'Failed to import Gmail contacts' };
    }
  }, []);

  const importLinkedInContacts = useCallback(async (): Promise<{ success: boolean; contacts: Contact[]; error?: string }> => {
    try {
      console.log('[LinkedIn Import] LinkedIn integration not yet implemented');
      return { 
        success: false, 
        contacts: [], 
        error: 'LinkedIn integration coming soon. Please use CSV import for now or add your LinkedIn URL to contact notes.' 
      };
    } catch (error) {
      console.error('LinkedIn import error:', error);
      return { success: false, contacts: [], error: 'Failed to import LinkedIn contacts' };
    }
  }, []);

  const scheduleReminder = useCallback(async (contactId: string, scheduledFor: string, message: string): Promise<void> => {
    const reminder: ContactReminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId,
      scheduledFor,
      message,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...reminders, reminder];
    setReminders(updated);
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    console.log(`Reminder scheduled for contact ${contactId} at ${scheduledFor}`);
  }, [reminders]);

  const cancelReminder = useCallback(async (reminderId: string): Promise<void> => {
    const updated = reminders.map(r => 
      r.id === reminderId ? { ...r, status: 'cancelled' as const } : r
    );
    setReminders(updated);
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    console.log(`Reminder ${reminderId} cancelled`);
  }, [reminders]);

  const getContactReminders = useCallback((contactId: string): ContactReminder[] => {
    return reminders.filter(r => r.contactId === contactId && r.status === 'scheduled');
  }, [reminders]);

  const getContactsBySegment = useCallback((segment: ContactSegment): Contact[] => {
    return contacts.filter(c => c.segment === segment);
  }, [contacts]);

  const getContactsByTag = useCallback((tagName: string): Contact[] => {
    return contacts.filter(c => c.tags && c.tags.includes(tagName));
  }, [contacts]);

  const autoSegmentContacts = useCallback(async (): Promise<void> => {
    console.log('[Auto-Segment] Starting automatic contact segmentation...');
    
    for (const contact of contacts) {
      const engagement = contact.engagement || {
        totalInvitesSent: 0,
        openedCount: 0,
        clickedCount: 0,
        responseRate: 0,
      };
      
      const contactInvites = invites.filter(i => i.contactId === contact.id);
      const hasConverted = contactInvites.some(i => i.isVerified);
      
      let newSegment: ContactSegment;
      
      if (hasConverted) {
        newSegment = 'converted';
      } else if (engagement.totalInvitesSent === 0) {
        newSegment = 'cold';
      } else if (engagement.responseRate > 50) {
        newSegment = 'hot';
      } else if (engagement.responseRate > 20) {
        newSegment = 'warm';
      } else if (engagement.totalInvitesSent >= 3 && engagement.responseRate === 0) {
        newSegment = 'unresponsive';
      } else {
        newSegment = 'cold';
      }
      
      if (contact.segment !== newSegment) {
        await updateContact(contact.id, { segment: newSegment });
      }
    }
    
    console.log('[Auto-Segment] Segmentation complete');
  }, [contacts, invites, updateContact]);

  const processAutomatedWorkflows = useCallback(async (): Promise<void> => {
    console.log('[Workflow] Processing automated invite workflows...');
    const now = Date.now();
    
    for (const invite of invites) {
      if (invite.status === 'sent' && !invite.acceptedAt) {
        const sentTime = invite.sentAt ? new Date(invite.sentAt).getTime() : 0;
        const daysSinceSent = (now - sentTime) / (24 * 60 * 60 * 1000);
        
        if (daysSinceSent >= 7 && !invite.reminderSentAt) {
          console.log(`[Workflow] Sending 7-day reminder for invite ${invite.id}`);
          await updateInvite(invite.id, {
            reminderSentAt: new Date().toISOString(),
          });
        }
        
        else if (daysSinceSent >= 14 && invite.reminderSentAt && !invite.secondReminderSentAt) {
          console.log(`[Workflow] Sending 14-day reminder for invite ${invite.id}`);
          await updateInvite(invite.id, {
            secondReminderSentAt: new Date().toISOString(),
          });
        }
        
        else if (daysSinceSent >= 30 && !invite.expiresAt) {
          console.log(`[Workflow] Expiring invite ${invite.id} after 30 days`);
          await updateInvite(invite.id, {
            status: 'expired',
            expiresAt: new Date().toISOString(),
          });
        }
      }
      
      if (invite.status === 'accepted' && invite.isVerified && !invite.acceptedWithinDays) {
        const sentTime = invite.sentAt ? new Date(invite.sentAt).getTime() : 0;
        const acceptedTime = invite.acceptedAt ? new Date(invite.acceptedAt).getTime() : 0;
        const daysToAccept = (acceptedTime - sentTime) / (24 * 60 * 60 * 1000);
        
        await updateInvite(invite.id, {
          acceptedWithinDays: Math.round(daysToAccept),
        });
      }
    }
    
    console.log('[Workflow] Automated workflows processed');
  }, [invites, updateInvite]);

  return useMemo(() => ({
    contacts,
    invites,
    templates,
    reminders,
    tags,
    isLoading,
    addContact,
    addContacts,
    updateContact,
    updateContactSegment,
    addContactTag,
    removeContactTag,
    updateContactNotes,
    deleteContact,
    sendInvite,
    sendBulkInvites,
    updateInvite,
    markInviteAccepted,
    markInviteVerified,
    sendReminder,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getAgentInvites,
    getInviteStats,
    getContactInvites,
    interpolateTemplate,
    generateReferralLink,
    generateShareableMessage,
    fetchPhoneContacts,
    generateCSVTemplate,
    exportContactsToCSV,
    importContactsFromCSV,
    importGmailContacts,
    importLinkedInContacts,
    getTemplatePerformance,
    getReferralFunnel,
    getContactPerformance,
    getReferralInsights,
    trackInviteOpened,
    trackInviteClicked,
    scheduleReminder,
    cancelReminder,
    getContactReminders,
    getContactsBySegment,
    getContactsByTag,
    autoSegmentContacts,
  }), [
    contacts,
    invites,
    templates,
    reminders,
    tags,
    isLoading,
    addContact,
    addContacts,
    updateContact,
    updateContactSegment,
    addContactTag,
    removeContactTag,
    updateContactNotes,
    deleteContact,
    sendInvite,
    sendBulkInvites,
    updateInvite,
    markInviteAccepted,
    markInviteVerified,
    sendReminder,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getAgentInvites,
    getInviteStats,
    getContactInvites,
    interpolateTemplate,
    generateReferralLink,
    generateShareableMessage,
    fetchPhoneContacts,
    generateCSVTemplate,
    exportContactsToCSV,
    importContactsFromCSV,
    importGmailContacts,
    importLinkedInContacts,
    getTemplatePerformance,
    getReferralFunnel,
    getContactPerformance,
    getReferralInsights,
    trackInviteOpened,
    trackInviteClicked,
    scheduleReminder,
    cancelReminder,
    getContactReminders,
    getContactsBySegment,
    getContactsByTag,
    autoSegmentContacts,
  ]);
});
