import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Send, Sparkles, ImagePlus, History, Trash2, Plus, X } from 'lucide-react-native';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import * as ImagePicker from 'expo-image-picker';
import { useChatHistory, ChatMessage } from '@/providers/ChatHistoryProvider';
import { AI_PLAYBOOKS } from '@/constants/aiPlaybooks';
import { buildPlaybookPrompt } from '@/utils/aiPromptBuilder';
import ScreenFrame from '@/components/ScreenFrame';
import { theme } from '@/constants/theme';

type DisplayMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
};

const detectEventType = (prompt: string) => {
  const lower = prompt.toLowerCase();
  if (lower.includes('wedding')) return 'Wedding';
  if (lower.includes('birthday')) return 'Birthday';
  if (lower.includes('corporate')) return 'Corporate';
  if (lower.includes('festival')) return 'Festival';
  if (lower.includes('engagement')) return 'Engagement';
  if (lower.includes('reception')) return 'Reception';
  return 'Custom Event';
};

const detectGuestCount = (prompt: string) => {
  const guestMatch = prompt.match(/(\d{2,4})\s*(guest|people|attendee)/i);
  if (guestMatch) return parseInt(guestMatch[1], 10);
  const numberMatch = prompt.match(/\b(\d{2,4})\b/);
  if (numberMatch) return parseInt(numberMatch[1], 10);
  return 120;
};

const detectBudget = (prompt: string, guests: number) => {
  const budgetMatch = prompt.match(/(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(k|lakh|lac|crore)?/i);
  if (budgetMatch) {
    const raw = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    const suffix = budgetMatch[2]?.toLowerCase();
    if (suffix === 'k') return raw * 1000;
    if (suffix === 'lakh' || suffix === 'lac') return raw * 100000;
    if (suffix === 'crore') return raw * 10000000;
    if (raw >= 50000) return raw;
  }
  return Math.round(guests * 2200);
};

const buildLocalPlannerResponse = (prompt: string, reason?: string) => {
  const eventType = detectEventType(prompt);
  const guests = detectGuestCount(prompt);
  const budget = detectBudget(prompt, guests);
  const venue = Math.round(budget * 0.34);
  const decor = Math.round(budget * 0.21);
  const catering = Math.round(budget * 0.25);
  const entertainment = Math.round(budget * 0.08);
  const logistics = Math.round(budget * 0.12);

  const note = reason
    ? `AI service is temporarily unavailable (${reason}). Sharing a local planning draft:`
    : 'Sharing a fast local planning draft:';

  return [
    note,
    '',
    `Event Type: ${eventType}`,
    `Guest Count (estimated): ${guests}`,
    `Recommended Budget: ₹${budget.toLocaleString()}`,
    '',
    'Budget Split:',
    `- Venue & Ops: ₹${venue.toLocaleString()}`,
    `- Decor & Styling: ₹${decor.toLocaleString()}`,
    `- Catering: ₹${catering.toLocaleString()}`,
    `- Entertainment: ₹${entertainment.toLocaleString()}`,
    `- Logistics & Buffer: ₹${logistics.toLocaleString()}`,
    '',
    'Execution Checklist:',
    '1. Lock venue and date first, then freeze guest count band (+/-10%).',
    '2. Finalize decor concept 3-4 weeks ahead and keep one backup vendor.',
    '3. Confirm vendor timelines 72 hours before event day.',
    '',
    'Send your city, exact budget, and target date for a sharper plan.',
  ].join('\n');
};

const extractTextFromMessage = (rawMessage: unknown): string => {
  if (!rawMessage || typeof rawMessage !== 'object') return '';
  const message = rawMessage as {
    parts?: unknown;
    content?: unknown;
  };

  if (Array.isArray(message.parts)) {
    const textParts = message.parts
      .map((part): string => {
        if (
          part &&
          typeof part === 'object' &&
          'type' in part &&
          'text' in part &&
          (part as { type?: unknown }).type === 'text' &&
          typeof (part as { text?: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text;
        }
        return '';
      })
      .filter(Boolean);
    if (textParts.length > 0) return textParts.join('\n');
  }

  if (typeof message.content === 'string') return message.content;

  if (Array.isArray(message.content)) {
    const textParts = message.content
      .map((part): string => {
        if (
          part &&
          typeof part === 'object' &&
          'type' in part &&
          'text' in part &&
          (part as { type?: unknown }).type === 'text' &&
          typeof (part as { text?: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text;
        }
        return '';
      })
      .filter(Boolean);
    if (textParts.length > 0) return textParts.join('\n');
  }

  return '';
};

const normalizeDisplayMessage = (rawMessage: unknown, index: number): DisplayMessage => {
  const message = (rawMessage || {}) as {
    id?: unknown;
    role?: unknown;
  };

  const role: DisplayMessage['role'] =
    message.role === 'user' || message.role === 'assistant' || message.role === 'system'
      ? message.role
      : 'assistant';

  return {
    id: typeof message.id === 'string' ? message.id : `msg_${Date.now()}_${index}`,
    role,
    text: extractTextFromMessage(rawMessage),
  };
};

export default function AIChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prefill?: string | string[] }>();
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showPlaybookComposer, setShowPlaybookComposer] = useState(false);

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
    updateSession,
    deleteSession,
  } = useChatHistory();

  const { messages, sendMessage, setMessages, status, error, clearError } = useRorkAgent({
    tools: {},
  });
  const isProcessing = status === 'submitted' || status === 'streaming';
  const sessionsRef = useRef(sessions);
  const lastLoadedSessionIdRef = useRef<string | null>(null);
  const lastSyncedPayloadRef = useRef<string>('');
  const lastHandledErrorRef = useRef<string>('');
  const didApplyPrefillRef = useRef(false);
  const displayMessages: DisplayMessage[] = messages
    .map((message, index) => normalizeDisplayMessage(message, index))
    .filter(message => message.text.trim().length > 0);

  const appendLocalPlannerMessage = useCallback(
    (seedPrompt: string, reason?: string) => {
      const fallbackText = buildLocalPlannerResponse(seedPrompt, reason);
      setMessages((prev: any) => [
        ...(Array.isArray(prev) ? prev : []),
        {
          id: `local_assistant_${Date.now()}`,
          role: 'assistant',
          parts: [{ type: 'text', text: fallbackText }],
        },
      ]);
    },
    [setMessages]
  );

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    if (!currentSessionId) {
      lastLoadedSessionIdRef.current = null;
      lastSyncedPayloadRef.current = '';
      return;
    }

    if (lastLoadedSessionIdRef.current === currentSessionId) {
      return;
    }

    const session = sessionsRef.current.find(item => item.id === currentSessionId);
    if (session) {
      lastLoadedSessionIdRef.current = currentSessionId;
      lastSyncedPayloadRef.current = JSON.stringify(session.messages || []);
      setMessages(session.messages as any);
    }
  }, [currentSessionId, setMessages]);

  useEffect(() => {
    if (!currentSessionId) return;

    const payload = JSON.stringify(messages);
    if (payload === lastSyncedPayloadRef.current) {
      return;
    }

    lastSyncedPayloadRef.current = payload;
    updateSession(currentSessionId, messages as ChatMessage[]);
  }, [messages, currentSessionId, updateSession]);

  useEffect(() => {
    if (!error) return;

    const lastUserMessage = [...displayMessages].reverse().find((m) => m.role === 'user')?.text || input;
    const fingerprint = `${error.message || 'unknown_error'}:${lastUserMessage}`;

    if (lastHandledErrorRef.current === fingerprint) return;
    lastHandledErrorRef.current = fingerprint;

    appendLocalPlannerMessage(lastUserMessage || 'Help me plan an event', error.message);
    clearError();
  }, [error, displayMessages, input, appendLocalPlannerMessage, clearError]);

  useEffect(() => {
    const rawPrefill = Array.isArray(params.prefill) ? params.prefill[0] : params.prefill;
    if (!rawPrefill || didApplyPrefillRef.current) return;

    let decodedPrefill = rawPrefill;
    try {
      if (/%[0-9A-Fa-f]{2}/.test(rawPrefill)) {
        decodedPrefill = decodeURIComponent(rawPrefill);
      }
    } catch {
      decodedPrefill = rawPrefill;
    }
    setInput(decodedPrefill);
    didApplyPrefillRef.current = true;
  }, [params.prefill]);

  const suggestions = [
    'Give me 7 unique event ideas with themes and budget tiers',
    'Plan a birthday party for 50 guests',
    'Wedding decoration ideas',
    'Corporate event checklist',
    'Budget-friendly festival setup',
  ];
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
  const [playbookFieldValues, setPlaybookFieldValues] = useState<Record<string, string>>({});

  const ensureSession = () => {
    if (currentSessionId) return currentSessionId;
    return createNewSession();
  };

  const triggerSend = (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || isProcessing) return;
    ensureSession();
    try {
      if (error) {
        clearError();
      }
      sendMessage(trimmed);
    } catch (sendError) {
      const detail = sendError instanceof Error ? sendError.message : 'Unable to send message.';
      appendLocalPlannerMessage(trimmed, detail);
      Alert.alert('AI Chat Error', detail);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['Images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      ensureSession();
      try {
        if (error) {
          clearError();
        }
        sendMessage({
          text: 'What can you tell me about this venue?',
          files: [{
            type: 'file',
            mimeType: 'image/jpeg',
            uri: result.assets[0].uri,
          } as any],
        });
      } catch (imageError) {
        const detail = imageError instanceof Error ? imageError.message : 'Unable to send image.';
        appendLocalPlannerMessage(
          'I uploaded a venue image and need decor recommendations with budget.',
          detail
        );
        Alert.alert('AI Chat Error', detail);
      }
    }
  };

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    triggerSend(input);
    setInput('');
  };

  const handleUsePlaybook = (playbookId: string) => {
    setSelectedPlaybookId(playbookId);
    const draft = buildPlaybookPrompt(playbookId, playbookFieldValues);
    setInput(draft);
  };

  const activePlaybook = AI_PLAYBOOKS.find((p) => p.id === selectedPlaybookId) || null;

  const handlePlaybookFieldChange = (key: string, value: string) => {
    setPlaybookFieldValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const usePlaybookTemplate = () => {
    if (!selectedPlaybookId) {
      Alert.alert('Select Playbook', 'Please choose a playbook first.');
      return;
    }
    handleUsePlaybook(selectedPlaybookId);
    setShowPlaybookComposer(false);
  };

  const runPlaybookNow = () => {
    if (!selectedPlaybookId) {
      Alert.alert('Select Playbook', 'Please choose a playbook first.');
      return;
    }
    if (isProcessing) return;
    const prompt = buildPlaybookPrompt(selectedPlaybookId, playbookFieldValues);
    triggerSend(prompt);
    setInput('');
    setShowPlaybookComposer(false);
  };

  const handleNewChat = () => {
    createNewSession();
    setMessages([]);
    setShowHistory(false);
  };

  const handleSelectChat = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowHistory(false);
  };

  const handleDeleteChat = (sessionId: string) => {
    deleteSession(sessionId);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <ScreenFrame>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Sparkles size={20} color="#3B82F6" />
            <Text style={styles.headerTitle}>AI Event Planner</Text>
          </View>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => setShowHistory(true)}
          >
            <History size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.playbookActions}>
          <TouchableOpacity
            style={styles.playbookComposerButton}
            onPress={() => setShowPlaybookComposer(true)}
          >
            <Sparkles size={16} color="#93C5FD" />
            <Text style={styles.playbookComposerButtonText}>Open Playbook Builder</Text>
          </TouchableOpacity>
        </View>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error.message || 'AI service unavailable right now.'}</Text>
            <TouchableOpacity onPress={clearError}>
              <X size={16} color="#FCA5A5" />
            </TouchableOpacity>
          </View>
        )}

        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          {displayMessages.length === 0 ? (
            <ScrollView 
              style={styles.emptyContainer}
              contentContainerStyle={styles.emptyContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.welcomeCard}>
                <LinearGradient
                  colors={['#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.welcomeGradient}
                >
                  <Sparkles size={48} color="#FFF" />
                  <Text style={styles.welcomeTitle}>AI Event Planner</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Let me help you plan the perfect event
                  </Text>
                </LinearGradient>
              </View>

              <Text style={styles.suggestionsTitle}>Try asking me about:</Text>
              <View style={styles.suggestionsGrid}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionCard}
                    onPress={() => {
                      triggerSend(suggestion);
                      setInput('');
                    }}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.suggestionsTitle, { marginTop: 24 }]}>AI Playbooks</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.playbookRow}
              >
                {AI_PLAYBOOKS.map((playbook) => (
                  <TouchableOpacity
                    key={playbook.id}
                    style={[
                      styles.playbookChip,
                      selectedPlaybookId === playbook.id && styles.playbookChipActive,
                    ]}
                    onPress={() => handleUsePlaybook(playbook.id)}
                  >
                    <Text
                      style={[
                        styles.playbookChipText,
                        selectedPlaybookId === playbook.id && styles.playbookChipTextActive,
                      ]}
                    >
                      {playbook.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
          ) : (
            <ScrollView 
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {displayMessages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.role === 'user' && styles.messageRowUser
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userBubble : styles.aiBubble
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.role === 'user' && styles.userMessageText
                      ]}
                    >
                      {message.text || '[No text content]'}
                    </Text>
                  </View>
                </View>
              ))}

              {isProcessing && (
                <View style={styles.messageRow}>
                  <View style={styles.aiBubble}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={[styles.typingDot, styles.typingDotDelay1]} />
                      <View style={[styles.typingDot, styles.typingDotDelay2]} />
                    </View>
                  </View>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          )}

          <SafeAreaView style={styles.inputContainer} edges={['bottom']}>
            <TouchableOpacity 
              style={styles.imageButton}
              onPress={pickImage}
            >
              <ImagePlus size={24} color="#3B82F6" />
            </TouchableOpacity>
            
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ask about event planning..."
                placeholderTextColor="#64748B"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!input.trim() || isProcessing) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isProcessing}
            >
              <LinearGradient
                colors={!input.trim() || isProcessing ? ['#475569', '#64748B'] : ['#3B82F6', '#8B5CF6']}
                style={styles.sendButtonGradient}
              >
                <Send size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </SafeAreaView>
        </KeyboardAvoidingView>
        </SafeAreaView>

      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.historyModal}>
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            style={StyleSheet.absoluteFill}
          />
          
          <SafeAreaView style={styles.historyContent} edges={['top', 'bottom']}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Chat History</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowHistory(false)}
              >
                <X size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.newChatButton}
              onPress={handleNewChat}
            >
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                style={styles.newChatGradient}
              >
                <Plus size={20} color="#FFF" />
                <Text style={styles.newChatText}>New Chat</Text>
              </LinearGradient>
            </TouchableOpacity>

            <FlatList
              data={sessions}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.historyList}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <TouchableOpacity
                    style={styles.historyItemMain}
                    onPress={() => handleSelectChat(item.id)}
                  >
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyItemTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.historyItemDate}>
                        {formatDate(item.updatedAt)}
                      </Text>
                    </View>
                    {currentSessionId === item.id && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteChat(item.id)}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyHistory}>
                  <History size={48} color="#475569" />
                  <Text style={styles.emptyHistoryText}>No chat history yet</Text>
                  <Text style={styles.emptyHistorySubtext}>
                    Start a conversation to see it here
                  </Text>
                </View>
              }
            />
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showPlaybookComposer}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlaybookComposer(false)}
      >
        <View style={styles.composerBackdrop}>
          <View style={styles.composerCard}>
            <View style={styles.composerHeader}>
              <Text style={styles.composerTitle}>AI Playbook Builder</Text>
              <TouchableOpacity onPress={() => setShowPlaybookComposer(false)}>
                <X size={22} color="#E2E8F0" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.composerBody}
              contentContainerStyle={styles.composerBodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.composerSectionLabel}>Choose a module</Text>
              <View style={styles.composerChipGrid}>
                {AI_PLAYBOOKS.map((playbook) => (
                  <TouchableOpacity
                    key={playbook.id}
                    style={[
                      styles.composerChip,
                      selectedPlaybookId === playbook.id && styles.composerChipActive,
                    ]}
                    onPress={() => setSelectedPlaybookId(playbook.id)}
                  >
                    <Text
                      style={[
                        styles.composerChipText,
                        selectedPlaybookId === playbook.id && styles.composerChipTextActive,
                      ]}
                    >
                      {playbook.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activePlaybook && (
                <>
                  <Text style={styles.composerSectionLabel}>Fill module fields</Text>
                  {activePlaybook.fields.map((field) => (
                    <View key={field.key} style={styles.composerInputGroup}>
                      <Text style={styles.composerInputLabel}>{field.label}</Text>
                      <TextInput
                        style={styles.composerInput}
                        placeholder={field.placeholder}
                        placeholderTextColor="#64748B"
                        value={playbookFieldValues[field.key] || ''}
                        onChangeText={(value) => handlePlaybookFieldChange(field.key, value)}
                        keyboardType={field.keyboardType === 'numeric' ? 'numeric' : 'default'}
                      />
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            <View style={styles.composerFooter}>
              <TouchableOpacity style={styles.composerSecondaryButton} onPress={usePlaybookTemplate}>
                <Text style={styles.composerSecondaryButtonText}>Use Template</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.composerPrimaryButton} onPress={runPlaybookNow}>
                <Text style={styles.composerPrimaryButtonText}>Run Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
  },
  keyboardView: {
    flex: 1,
  },
  playbookActions: {
    paddingHorizontal: 20,
    marginTop: -4,
    marginBottom: 10,
  },
  playbookComposerButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  playbookComposerButtonText: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#450A0A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    padding: 20,
    paddingTop: 40,
  },
  welcomeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 40,
  },
  welcomeGradient: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '700' as const,
    marginTop: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
  },
  suggestionsTitle: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  suggestionsGrid: {
    gap: 12,
  },
  suggestionCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suggestionText: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '500' as const,
  },
  playbookRow: {
    gap: 10,
    paddingRight: 20,
  },
  playbookChip: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  playbookChipActive: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
  },
  playbookChipText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  playbookChipTextActive: {
    color: '#93C5FD',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFF',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
  },
  typingDotDelay1: {
    opacity: 0.6,
  },
  typingDotDelay2: {
    opacity: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 12,
  },
  imageButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 22,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    color: '#FFF',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyModal: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  historyTitle: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  newChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  newChatText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600' as const,
  },
  historyList: {
    padding: 20,
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  historyItemContent: {
    flex: 1,
    gap: 4,
  },
  historyItemTitle: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  historyItemDate: {
    fontSize: 13,
    color: '#64748B',
  },
  activeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600' as const,
  },
  deleteButton: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyHistoryText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  composerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.84)',
    justifyContent: 'center',
    padding: 16,
  },
  composerCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  composerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  composerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  composerBody: {
    maxHeight: 520,
  },
  composerBodyContent: {
    padding: 16,
    gap: 14,
  },
  composerSectionLabel: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  composerChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  composerChip: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  composerChipActive: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
  },
  composerChipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  composerChipTextActive: {
    color: '#93C5FD',
  },
  composerInputGroup: {
    gap: 6,
  },
  composerInputLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  composerInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
  },
  composerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  composerSecondaryButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  composerSecondaryButtonText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  composerPrimaryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  composerPrimaryButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700' as const,
  },
});
