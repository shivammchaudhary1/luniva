import type { PropsWithChildren } from 'react';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { Session, User } from '@supabase/supabase-js';

import type { Profile } from '../profile/types';

import { supabase } from '../../lib/supabase/client';

const profileColumns = `
  id,
  display_name,
  gender,
  age_confirmed_at,
  timezone,
  cycle_module_enabled,
  journal_module_enabled,
  onboarding_completed,
  created_at,
  updated_at
`;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileError: string | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getFallbackDisplayName(user: User): string {
  const metadataName = user.user_metadata?.display_name;

  if (typeof metadataName === 'string' && metadataName.trim().length >= 2) {
    return metadataName.trim().slice(0, 80);
  }

  const emailName = user.email?.split('@')[0]?.trim();

  if (emailName && emailName.length >= 2) {
    return emailName.slice(0, 80);
  }

  return 'Luniva user';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [profileError, setProfileError] = useState<string | null>(null);

  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const [loadedProfileUserId, setLoadedProfileUserId] = useState<string | null>(null);

  const profileRequestId = useRef(0);

  const loadProfile = useCallback(async (user: User) => {
    const requestId = profileRequestId.current + 1;

    profileRequestId.current = requestId;

    setProfileError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(profileColumns)
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      let profileData = data;

      if (!profileData) {
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              display_name: getFallbackDisplayName(user),
            },
            {
              onConflict: 'id',
            },
          )
          .select(profileColumns)
          .single();

        if (createError) {
          throw createError;
        }

        profileData = createdProfile;
      }

      if (profileRequestId.current !== requestId) {
        return;
      }

      setProfile(profileData as Profile);
    } catch (error: unknown) {
      if (profileRequestId.current !== requestId) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Unable to load your profile.';

      setProfile(null);
      setProfileError(message);
    } finally {
      if (profileRequestId.current === requestId) {
        setLoadedProfileUserId(user.id);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsSessionLoading(false);
    };

    void loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const user = session?.user;

    if (!user) {
      profileRequestId.current += 1;
      setProfile(null);
      setProfileError(null);
      setLoadedProfileUserId(null);
      return;
    }

    setProfile(null);
    setLoadedProfileUserId(null);

    void loadProfile(user);
  }, [session?.user, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      return;
    }

    setLoadedProfileUserId(null);

    await loadProfile(session.user);
  }, [session?.user, loadProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const isProfileLoading = Boolean(session?.user) && loadedProfileUserId !== session?.user.id;

  const isLoading = isSessionLoading || isProfileLoading;

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      isLoading,
      refreshProfile,
      signOut,
    }),
    [session, profile, profileError, isLoading, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
