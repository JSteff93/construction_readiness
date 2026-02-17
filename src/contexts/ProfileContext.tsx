import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Profile } from '../utils/profileService';
import { fetchProfile } from '../utils/profileService';
import { useAuth } from './AuthContext';

type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const ProfileContext = createContext<ProfileState | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, authRequired } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user || !authRequired) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const p = await fetchProfile(user.id);
      setProfile(p);
    } catch (e) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id, authRequired]);

  const value: ProfileState = {
    profile,
    loading,
    refetch: loadProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
