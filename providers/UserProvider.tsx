import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AiTone, BudgetTier, EventCategory, EventStyle, NotificationChannel, User, UserRole } from '@/types';
import { backendService } from '@/services/backend';
import { authService } from '@/services/auth';

const USER_KEY = 'user';
const LOCAL_USERS_KEY = 'local_auth_users';

interface LocalUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar?: string;
  nickname?: string;
  role: UserRole;
  city?: string;
  budgetTier?: BudgetTier;
  styleTags?: EventStyle[];
  favoriteCategories?: EventCategory[];
  notificationChannels?: NotificationChannel[];
  aiTone?: AiTone;
}

const normalizeRole = (value: unknown): UserRole => {
  if (value === 'planner' || value === 'vendor' || value === 'customer') {
    return value;
  }
  return 'customer';
};

const getProfileCompletion = (userData: Partial<User>) => {
  let complete = 0;
  if (userData.name) complete += 25;
  if (userData.email) complete += 25;
  if (userData.phone) complete += 25;
  if (userData.avatar) complete += 25;
  return complete;
};

const readLocalUsers = async (): Promise<LocalUserRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
    return raw ? (JSON.parse(raw) as LocalUserRecord[]) : [];
  } catch (error) {
    console.log('Error loading local users:', error);
    return [];
  }
};

const writeLocalUsers = async (users: LocalUserRecord[]) => {
  try {
    await AsyncStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.log('Error saving local users:', error);
  }
};

const normalizeUser = (candidate: Partial<User>): User => ({
  id: candidate.id || `user_${Date.now()}`,
  name: candidate.name || 'User',
  email: candidate.email || '',
  phone: candidate.phone || '',
  avatar: candidate.avatar,
  nickname: candidate.nickname,
  city: candidate.city,
  budgetTier: candidate.budgetTier,
  styleTags: Array.isArray(candidate.styleTags) ? candidate.styleTags : [],
  favoriteCategories: Array.isArray(candidate.favoriteCategories) ? candidate.favoriteCategories : [],
  notificationChannels: Array.isArray(candidate.notificationChannels) ? candidate.notificationChannels : [],
  aiTone: candidate.aiTone,
  role: normalizeRole(candidate.role),
  onboardingCompleted: candidate.onboardingCompleted ?? false,
  profileCompletion: candidate.profileCompletion ?? getProfileCompletion(candidate),
});

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (stored) {
        setUser(normalizeUser(JSON.parse(stored) as Partial<User>));
        return;
      }

      if (authService.isSupabaseAuthEnabled()) {
        const session = await authService.getSession();
        if (session?.user) {
          const hydratedUser = normalizeUser({
            id: session.user.id,
            name: (session.user.user_metadata?.name as string) || 'User',
            email: session.user.email || '',
            phone: (session.user.user_metadata?.phone as string) || '',
            role: normalizeRole(session.user.user_metadata?.role),
          });
          setUser(hydratedUser);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(hydratedUser));
        }
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User) => {
    const enhancedUser = normalizeUser(userData);
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(enhancedUser));
      setUser(enhancedUser);
      backendService.syncUser(enhancedUser);
      if (!authService.isSupabaseAuthEnabled()) {
        const localUsers = await readLocalUsers();
        const next = localUsers.map((record) =>
          record.id === enhancedUser.id
            ? {
                ...record,
                name: enhancedUser.name,
                email: enhancedUser.email,
                phone: enhancedUser.phone,
                avatar: enhancedUser.avatar,
                nickname: enhancedUser.nickname,
                role: enhancedUser.role,
                city: enhancedUser.city,
                budgetTier: enhancedUser.budgetTier,
                styleTags: enhancedUser.styleTags,
                favoriteCategories: enhancedUser.favoriteCategories,
                notificationChannels: enhancedUser.notificationChannels,
                aiTone: enhancedUser.aiTone,
              }
            : record
        );
        await writeLocalUsers(next);
      }
    } catch (error) {
      console.log('Error saving user:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updated: User = {
      ...user,
      ...updates,
      role: normalizeRole(updates.role ?? user.role),
      profileCompletion: getProfileCompletion({ ...user, ...updates }),
    };
    await saveUser(updated);
  };

  const completeOnboarding = async (
    payload: Pick<User, 'name' | 'email' | 'phone'> & { role?: UserRole }
  ) => {
    const createdUser = normalizeUser({
      id: user?.id || `user_${Date.now()}`,
      ...payload,
      avatar: user?.avatar,
      nickname: user?.nickname,
      role: normalizeRole(payload.role || user?.role),
      onboardingCompleted: true,
      profileCompletion: getProfileCompletion(payload),
    });
    await saveUser(createdUser);
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    role: UserRole = 'customer'
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = normalizeRole(role);

    let result: Awaited<ReturnType<typeof authService.signUp>>;

    if (authService.isSupabaseAuthEnabled()) {
      result = await authService.signUp(normalizedEmail, password, {
        name: name || '',
        role: normalizedRole,
      });
    } else {
      const localUsers = await readLocalUsers();
      const existingUser = localUsers.find(
        (record) => record.email.toLowerCase() === normalizedEmail
      );

      if (existingUser) {
        throw new Error('An account already exists with this email.');
      }

      const newLocalUser: LocalUserRecord = {
        id: `local_${Date.now()}`,
        name: name?.trim() || 'User',
        email: normalizedEmail,
        phone: '',
        password,
        role: normalizedRole,
      };

      await writeLocalUsers([newLocalUser, ...localUsers]);
      result = {
        access_token: 'local',
        refresh_token: 'local',
        expires_in: 0,
        token_type: 'bearer',
        user: {
          id: newLocalUser.id,
          email: newLocalUser.email,
          user_metadata: {
            name: newLocalUser.name,
            phone: newLocalUser.phone,
            role: newLocalUser.role,
          },
        },
      };
    }

    const authUser = normalizeUser({
      id: result.user.id,
      name: name || 'User',
      email: normalizedEmail,
      phone: '',
      role: normalizedRole,
      profileCompletion: getProfileCompletion({ name, email }),
    });
    await saveUser(authUser);
    return result;
  };

  const signIn = async (email: string, password: string, role?: UserRole) => {
    const normalizedEmail = email.trim().toLowerCase();
    let result: Awaited<ReturnType<typeof authService.signIn>>;

    if (authService.isSupabaseAuthEnabled()) {
      result = await authService.signIn(normalizedEmail, password);
    } else {
      const localUsers = await readLocalUsers();
      const matched = localUsers.find(
        (record) => record.email.toLowerCase() === normalizedEmail
      );
      if (!matched || matched.password !== password) {
        throw new Error('Invalid email or password.');
      }
      result = {
        access_token: 'local',
        refresh_token: 'local',
        expires_in: 0,
        token_type: 'bearer',
        user: {
          id: matched.id,
          email: matched.email,
          user_metadata: {
            name: matched.name,
            phone: matched.phone,
            role: matched.role,
          },
        },
      };
    }

    const existing = await AsyncStorage.getItem(USER_KEY);
    const parsed = existing ? (JSON.parse(existing) as User) : null;
    const accountRole = normalizeRole(parsed?.role || (result.user.user_metadata?.role as string));
    const resolvedRole = normalizeRole(role || accountRole);

    if (role && accountRole !== role) {
      throw new Error(
        `This account is registered as "${accountRole}". Please select that role to continue.`
      );
    }

    const authUser = normalizeUser({
      id: result.user.id,
      name: parsed?.name || (result.user.user_metadata?.name as string) || 'User',
      email: result.user.email || normalizedEmail,
      phone: parsed?.phone || (result.user.user_metadata?.phone as string) || '',
      avatar: parsed?.avatar,
      nickname: parsed?.nickname,
      role: resolvedRole,
      onboardingCompleted: parsed?.onboardingCompleted || false,
      profileCompletion: parsed?.profileCompletion || getProfileCompletion({ email }),
    });
    await saveUser(authUser);
    return result;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_KEY);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  return {
    user,
    hasRole: (roles: UserRole[]) => !!user && roles.includes(user.role),
    isLoading,
    saveUser,
    updateUser,
    completeOnboarding,
    signUp,
    signIn,
    logout,
  };
});
