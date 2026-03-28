import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, CheckCheck, Check, Heart, ThumbsUp, Star, Gift, Calendar, DollarSign, FileText } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import type { Message } from '@/types';

type QuickAction = {
  id: string;
  icon: any;
  label: string;
  color: string;
  action: () => void;
};

type MessageReaction = {
  emoji: string;
  userId: string;
  userName: string;
};

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { conversations, messages, addMessage, markConversationRead, users } = useData();
  const [inputText, setInputText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const conversation = conversations.find(c => c.id === conversationId);
  const conversationMessages = messages.filter(m => m.conversationId === conversationId);

  const otherParticipantIndex = conversation?.participants[0] === user?.id ? 1 : 0;
  const otherUserId = conversation?.participants[otherParticipantIndex];
  const otherUser = users.find(u => u.id === otherUserId);
  const otherName = conversation?.participantNames[otherParticipantIndex] || 'User';
  const otherAvatar = conversation?.participantAvatars[otherParticipantIndex];

  useEffect(() => {
    if (conversationId) {
      markConversationRead(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [conversationMessages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || !user) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    await addMessage(newMessage);
    setInputText('');
  };

  const quickActions: QuickAction[] = [
    {
      id: 'schedule',
      icon: Calendar,
      label: 'Schedule Meeting',
      color: Colors.primary,
      action: () => {
        Alert.alert('Schedule Meeting', 'Meeting scheduling feature coming soon!');
        setShowQuickActions(false);
      },
    },
    {
      id: 'deal',
      icon: DollarSign,
      label: 'Propose Deal',
      color: Colors.success,
      action: () => {
        Alert.alert('Propose Deal', 'Deal proposal feature coming soon!');
        setShowQuickActions(false);
      },
    },
    {
      id: 'contract',
      icon: FileText,
      label: 'Send Contract',
      color: Colors.warning,
      action: () => {
        Alert.alert('Send Contract', 'Contract sharing feature coming soon!');
        setShowQuickActions(false);
      },
    },
    {
      id: 'gift',
      icon: Gift,
      label: 'Send Gift',
      color: Colors.accent,
      action: () => {
        Alert.alert('Send Gift', 'Gift sending feature coming soon!');
        setShowQuickActions(false);
      },
    },
  ];

  const reactionEmojis = ['❤️', '👍', '🔥', '😂', '😮', '🎉', '👏', '⭐'];

  const handleReaction = (messageId: string, emoji: string) => {
    console.log('Reaction added:', emoji, 'to message:', messageId);
    setShowReactions(null);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === user?.id;
    const showAvatar = !isOwnMessage;
    const prevMessage = conversationMessages[index - 1];
    const showTimestamp = !prevMessage || 
      new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000;

    return (
      <View key={message.id}>
        {showTimestamp && (
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              {new Date(message.timestamp).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}
        
        <View style={[styles.messageRow, isOwnMessage && styles.messageRowOwn]}>
          {showAvatar && (
            <TouchableOpacity 
              onPress={() => router.push(`/view-profile?userId=${message.senderId}`)}
            >
              <Image 
                source={{ uri: message.senderAvatar || 'https://i.pravatar.cc/150' }} 
                style={styles.messageAvatar} 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => setShowReactions(message.id)}
            style={[styles.messageBubbleContainer, isOwnMessage && styles.messageBubbleContainerOwn]}
          >
            <LinearGradient
              colors={isOwnMessage ? [Colors.primary, Colors.accent] : [Colors.darkCard, Colors.backgroundSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.messageBubble}
            >
              <Text style={[styles.messageText, isOwnMessage && styles.messageTextOwn]}>
                {message.content}
              </Text>
              
              <View style={styles.messageFooter}>
                <Text style={[styles.messageTime, isOwnMessage && styles.messageTimeOwn]}>
                  {formatTime(message.timestamp)}
                </Text>
                {isOwnMessage && (
                  message.read ? (
                    <CheckCheck size={14} color="rgba(255,255,255,0.7)" />
                  ) : (
                    <Check size={14} color="rgba(255,255,255,0.5)" />
                  )
                )}
              </View>
            </LinearGradient>

            {showReactions === message.id && (
              <View style={[styles.reactionsPopup, isOwnMessage && styles.reactionsPopupOwn]}>
                {reactionEmojis.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.reactionButton}
                    onPress={() => handleReaction(message.id, emoji)}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!conversation) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Conversation not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
          headerTitle: () => (
            <TouchableOpacity 
              style={styles.headerTitleContainer}
              onPress={() => router.push(`/view-profile?userId=${otherUserId}`)}
            >
              <Image source={{ uri: otherAvatar || 'https://i.pravatar.cc/150' }} style={styles.headerAvatar} />
              <View>
                <Text style={styles.headerTitle}>{otherName}</Text>
                <Text style={styles.headerSubtitle}>Online</Text>
              </View>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => Alert.alert('Voice Call', 'Voice calling feature coming soon!')}
              >
                <Phone size={20} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => Alert.alert('Video Call', 'Video calling feature coming soon!')}
              >
                <Video size={20} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => Alert.alert('More Options', 'Additional options coming soon!')}
              >
                <MoreVertical size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {conversation.dealId && (
          <LinearGradient
            colors={[Colors.success + '30', Colors.success + '10']}
            style={styles.dealBanner}
          >
            <Star size={16} color={Colors.success} fill={Colors.success} />
            <Text style={styles.dealBannerText}>Active Deal in Progress</Text>
            <TouchableOpacity 
              onPress={() => router.push(`/gig-details?gigId=${conversation.dealId}`)}
            >
              <Text style={styles.dealBannerLink}>View Details</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {conversationMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptyText}>Send a message to {otherName}</Text>
            </View>
          ) : (
            conversationMessages.map((message, index) => renderMessage(message, index))
          )}
        </ScrollView>

        {showQuickActions && (
          <View style={styles.quickActionsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsContent}
            >
              {quickActions.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionButton}
                  onPress={action.action}
                >
                  <LinearGradient
                    colors={[action.color, action.color + 'CC']}
                    style={styles.quickActionGradient}
                  >
                    <action.icon size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 16 }]}>
          <TouchableOpacity
            style={styles.inputButton}
            onPress={() => setShowQuickActions(!showQuickActions)}
          >
            <Paperclip size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={styles.emojiButton}
              onPress={() => Alert.alert('Emoji Picker', 'Emoji picker coming soon!')}
            >
              <Smile size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <LinearGradient
              colors={inputText.trim() ? [Colors.primary, Colors.accent] : [Colors.darkBorder, Colors.darkBorder]}
              style={styles.sendButtonGradient}
            >
              <Send size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  keyboardView: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.darkBorder,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.success,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBorder,
  },
  dealBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  dealBannerLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 8,
  },
  timestampContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timestampText: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.darkCard,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.darkBorder,
  },
  messageBubbleContainer: {
    maxWidth: '75%',
    position: 'relative',
  },
  messageBubbleContainerOwn: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    minWidth: 60,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  reactionsPopup: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    flexDirection: 'row',
    backgroundColor: Colors.darkCard,
    borderRadius: 24,
    padding: 8,
    gap: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  reactionsPopupOwn: {
    left: 'auto',
    right: 0,
  },
  reactionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  quickActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.darkBorder,
    backgroundColor: Colors.backgroundSecondary,
  },
  quickActionsContent: {
    padding: 16,
    gap: 12,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 16,
    paddingTop: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.darkBorder,
  },
  inputButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.darkCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 4,
  },
  emojiButton: {
    padding: 4,
    marginLeft: 8,
  },
  sendButton: {
    marginBottom: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
