import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bot, Send, Sparkles, User, TrendingUp, Target, FileText, Lightbulb } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const { messages, error, sendMessage } = useRorkAgent({
    tools: {
      navigateToScreen: createRorkTool({
        description: "Navigate to a specific screen in the app when user wants to go somewhere",
        zodSchema: z.object({
          screen: z.enum([
            'ai-matching',
            'deals',
            'profile',
            'manage-gigs',
            'my-applications',
            'ai-contract-generator',
            'ai-content-ideas',
            'ai-profile-optimizer',
            'analytics',
            'leaderboards',
            'achievements',
            'rewards'
          ]).describe('The screen to navigate to'),
        }),
        execute(input) {
          router.push(`/${input.screen}` as any);
          return `Navigating to ${input.screen}`;
        },
      }),
      suggestGigs: createRorkTool({
        description: "Suggest matching gigs based on user's profile and preferences",
        zodSchema: z.object({
          category: z.string().optional().describe('Category to filter by'),
          budget: z.number().optional().describe('Budget range'),
        }),
        execute(input) {
          console.log('Suggesting gigs with filters:', input);
          return 'Analyzing available gigs...';
        },
      }),
      analyzeProfile: createRorkTool({
        description: "Analyze the user's profile and provide optimization suggestions",
        zodSchema: z.object({
          userId: z.string().describe('User ID to analyze'),
        }),
        execute(input) {
          console.log('Analyzing profile for user:', input.userId);
          return 'Analyzing profile...';
        },
      }),
    },
  });

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const quickSuggestions = [
    { text: 'Find matching gigs', icon: Target },
    { text: 'Optimize my profile', icon: TrendingUp },
    { text: 'Generate contract', icon: FileText },
    { text: 'Content ideas', icon: Lightbulb },
  ];

  useEffect(() => {
    if (messages.length === 0) {
      const greeting = user?.role === 'influencer'
        ? "Hi! I'm your AI assistant. I can help you find perfect brand deals, optimize your profile, generate content ideas, and more. What would you like to do?"
        : user?.role === 'sponsor'
        ? "Hi! I'm your AI assistant. I can help you find the right influencers, manage campaigns, generate contracts, and optimize your ROI. How can I assist you?"
        : "Hi! I'm your AI assistant. I can help you manage your network, track commissions, find opportunities, and grow your business. What can I help with?";
      
      sendMessage(greeting);
    }
  }, []);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: 'AI Assistant',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <Bot size={32} color="#FFFFFF" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSubtitle}>Your 24/7 helper</Text>
        </View>
        <Sparkles size={24} color="#FFFFFF" />
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <View key={m.id} style={m.role === 'user' ? styles.userMessage : styles.aiMessage}>
            <View style={m.role === 'user' ? styles.userMessageBubble : styles.aiMessageBubble}>
              <View style={styles.messageHeader}>
                {m.role === 'user' ? (
                  <User size={16} color={Colors.text} />
                ) : (
                  <Bot size={16} color={Colors.primary} />
                )}
                <Text style={m.role === 'user' ? styles.userMessageLabel : styles.aiMessageLabel}>
                  {m.role === 'user' ? 'You' : 'AI Assistant'}
                </Text>
              </View>
              {m.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return (
                      <Text key={`${m.id}-${i}`} style={m.role === 'user' ? styles.userMessageText : styles.aiMessageText}>
                        {part.text}
                      </Text>
                    );
                  case 'tool':
                    const toolName = part.toolName;
                    switch (part.state) {
                      case 'input-streaming':
                      case 'input-available':
                        return (
                          <View key={`${m.id}-${i}`} style={styles.toolCallBubble}>
                            <Sparkles size={14} color={Colors.primary} />
                            <Text style={styles.toolCallText}>Executing: {toolName}...</Text>
                          </View>
                        );
                      case 'output-available':
                        return (
                          <View key={`${m.id}-${i}`} style={styles.toolCompleteBubble}>
                            <Text style={styles.toolCompleteText}>✓ Completed: {toolName}</Text>
                          </View>
                        );
                      case 'output-error':
                        return (
                          <View key={`${m.id}-${i}`} style={styles.toolErrorBubble}>
                            <Text style={styles.toolErrorText}>Error: {part.errorText}</Text>
                          </View>
                        );
                    }
                }
              })}
            </View>
          </View>
        ))}

        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].parts.some(p => p.type === 'tool' && p.state === 'input-streaming') && (
          <View style={styles.aiMessage}>
            <View style={styles.aiMessageBubble}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotDelay1]} />
                <View style={[styles.typingDot, styles.typingDotDelay2]} />
              </View>
            </View>
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Quick Actions</Text>
            {quickSuggestions.map((suggestion, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionButton}
                onPress={() => {
                  setInput(suggestion.text);
                  sendMessage(suggestion.text);
                }}
              >
                <suggestion.icon size={18} color={Colors.primary} />
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Error: {error.message}</Text>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <LinearGradient
            colors={input.trim() ? [Colors.primary, Colors.secondary] : [Colors.darkCard, Colors.darkCard]}
            style={styles.sendButtonGradient}
          >
            <Send size={20} color={input.trim() ? '#FFFFFF' : Colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  aiMessage: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  aiMessageBubble: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  userMessageLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  aiMessageLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  userMessageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  aiMessageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  toolCallBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  toolCallText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  toolCompleteBubble: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  toolCompleteText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  toolErrorBubble: {
    backgroundColor: Colors.danger + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  toolErrorText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    opacity: 0.6,
  },
  typingDotDelay1: {
    opacity: 0.4,
  },
  typingDotDelay2: {
    opacity: 0.2,
  },
  suggestionsContainer: {
    marginTop: 20,
    gap: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  errorBanner: {
    backgroundColor: Colors.danger,
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingTop: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.darkCard,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
