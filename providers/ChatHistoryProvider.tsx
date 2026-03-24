import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ChatPart = {
  type: string;
  text?: string;
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: ChatPart[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export const [ChatHistoryProvider, useChatHistory] = createContextHook(() => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const extractTextFromContent = (content: unknown): string => {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';

    const textParts = content
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

    return textParts.join('\n');
  };

  const normalizeMessage = useCallback((rawMessage: unknown, index: number): ChatMessage | null => {
    if (!rawMessage || typeof rawMessage !== 'object') return null;

    const message = rawMessage as {
      id?: unknown;
      role?: unknown;
      parts?: unknown;
      content?: unknown;
      timestamp?: unknown;
    };

    const role: ChatMessage['role'] =
      message.role === 'user' || message.role === 'assistant' || message.role === 'system'
        ? message.role
        : 'assistant';

    const partsFromPartsField: ChatPart[] = Array.isArray(message.parts)
      ? message.parts
          .map((part): ChatPart | null => {
            if (!part || typeof part !== 'object') return null;
            const p = part as { type?: unknown; text?: unknown };
            if (typeof p.type !== 'string') return null;
            return {
              type: p.type,
              text: typeof p.text === 'string' ? p.text : undefined,
            };
          })
          .filter((part): part is ChatPart => part !== null)
      : [];

    const fallbackText = extractTextFromContent(message.content);
    const normalizedParts =
      partsFromPartsField.length > 0
        ? partsFromPartsField
        : fallbackText
          ? [{ type: 'text', text: fallbackText }]
          : [];

    return {
      id: typeof message.id === 'string' ? message.id : `msg_${Date.now()}_${index}`,
      role,
      parts: normalizedParts,
      timestamp: typeof message.timestamp === 'number' ? message.timestamp : Date.now(),
    };
  }, []);

  const normalizeSession = useCallback((rawSession: unknown, index: number): ChatSession | null => {
    if (!rawSession || typeof rawSession !== 'object') return null;

    const session = rawSession as {
      id?: unknown;
      title?: unknown;
      messages?: unknown;
      createdAt?: unknown;
      updatedAt?: unknown;
    };

    const normalizedMessages: ChatMessage[] = Array.isArray(session.messages)
      ? session.messages
          .map((message, messageIndex) => normalizeMessage(message, messageIndex))
          .filter((message): message is ChatMessage => message !== null)
      : [];

    return {
      id: typeof session.id === 'string' ? session.id : `session_${Date.now()}_${index}`,
      title: typeof session.title === 'string' ? session.title : 'New Chat',
      messages: normalizedMessages,
      createdAt: typeof session.createdAt === 'number' ? session.createdAt : Date.now(),
      updatedAt: typeof session.updatedAt === 'number' ? session.updatedAt : Date.now(),
    };
  }, [normalizeMessage]);

  const getMessagePreview = (message: ChatMessage | undefined) => {
    if (!message) return 'New Chat';
    const firstTextPart = message.parts.find(
      part => part.type === 'text' && typeof part.text === 'string' && part.text.trim().length > 0
    );
    if (firstTextPart?.text) return firstTextPart.text.slice(0, 50);
    return 'New Chat';
  };

  const persistSessions = async (updatedSessions: ChatSession[]) => {
    try {
      await AsyncStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
    } catch (error) {
      console.log('Error saving chat sessions:', error);
    }
  };

  const loadSessions = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('chatSessions');
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((session, index) => normalizeSession(session, index))
            .filter((session): session is ChatSession => session !== null);
          setSessions(normalized);
          void persistSessions(normalized);
        } else {
          setSessions([]);
        }
      }
    } catch (error) {
      console.log('Error loading chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [normalizeSession]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSessions(prev => {
      const updatedSessions = [newSession, ...prev];
      void persistSessions(updatedSessions);
      return updatedSessions;
    });

    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const updateSession = (sessionId: string, messages: ChatMessage[]) => {
    const normalizedMessages = messages
      .map((message, index) => normalizeMessage(message, index))
      .filter((message): message is ChatMessage => message !== null);

    setSessions(prev => {
      let found = false;
      const updatedSessions = prev.map(session => {
        if (session.id === sessionId) {
          found = true;
          return {
            ...session,
            title: getMessagePreview(normalizedMessages[0]),
            messages: normalizedMessages,
            updatedAt: Date.now(),
          };
        }
        return session;
      });

      if (!found) {
        updatedSessions.unshift({
          id: sessionId,
          title: getMessagePreview(normalizedMessages[0]),
          messages: normalizedMessages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      void persistSessions(updatedSessions);
      return updatedSessions;
    });
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(s => s.id !== sessionId);
      void persistSessions(updatedSessions);
      return updatedSessions;
    });

    setCurrentSessionId(prev => {
      if (prev === sessionId) {
        return null;
      }
      return prev;
    });
  };

  const getCurrentSession = () => {
    if (!currentSessionId) return null;
    return sessions.find(s => s.id === currentSessionId) || null;
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
    updateSession,
    deleteSession,
    getCurrentSession,
    isLoading,
  };
});
