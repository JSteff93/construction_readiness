import { supabase } from '../lib/supabase';

export const DEFAULT_AVATAR_COLOR = '#166534';

export type Profile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  company?: string;
  avatarColor?: string;
  createdAt: string;
  updatedAt: string;
};

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    firstName: data.first_name,
    lastName: data.last_name,
    role: data.role,
    company: data.company || undefined,
    avatarColor: data.avatar_color || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

const rowToProfile = (data: {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  company: string | null;
  avatar_color?: string | null;
  created_at: string;
  updated_at: string;
}): Profile => ({
  id: data.id,
  userId: data.user_id,
  firstName: data.first_name,
  lastName: data.last_name,
  role: data.role,
  company: data.company || undefined,
  avatarColor: data.avatar_color || undefined,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

/** Fetch multiple profiles by user IDs (for task owner/assignee display). */
export const fetchProfiles = async (userIds: string[]): Promise<Map<string, Profile>> => {
  const map = new Map<string, Profile>();
  if (!supabase || userIds.length === 0) return map;
  const unique = [...new Set(userIds)].filter(Boolean);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', unique);
  if (error || !data) return map;
  for (const row of data as Array<{
    id: string; user_id: string; first_name: string; last_name: string;
    role: string; company: string | null; avatar_color?: string | null; created_at: string; updated_at: string;
  }>) {
    map.set(row.user_id, rowToProfile(row));
  }
  return map;
};

/** List all profiles (for task owner/assignee picker). Requires RLS "Users can view all profiles". */
export const listProfiles = async (): Promise<Profile[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('profiles').select('*').order('first_name');
  if (error || !data) return [];
  return (data as Array<{
    id: string; user_id: string; first_name: string; last_name: string;
    role: string; company: string | null; avatar_color?: string | null; created_at: string; updated_at: string;
  }>).map(rowToProfile);
};

/** Get initials for display (profile or fallback from userId). */
export const getInitialsFromProfile = (profile: Profile | null | undefined, fallbackUserId?: string): string => {
  if (profile?.firstName && profile?.lastName) {
    return (profile.firstName[0] + profile.lastName[0]).toUpperCase();
  }
  if (fallbackUserId) {
    return fallbackUserId.slice(0, 2).toUpperCase();
  }
  return '?';
};

export const createProfile = async (params: {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  company?: string;
  avatarColor?: string;
}): Promise<Profile> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: params.userId,
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
      role: params.role.trim(),
      company: params.company?.trim() || null,
      avatar_color: (params.avatarColor?.trim() || DEFAULT_AVATAR_COLOR) || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    firstName: data.first_name,
    lastName: data.last_name,
    role: data.role,
    company: data.company || undefined,
    avatarColor: data.avatar_color || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const updateProfile = async (
  userId: string,
  params: {
    firstName: string;
    lastName: string;
    role: string;
    company?: string;
    avatarColor?: string;
  }
): Promise<Profile> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
      role: params.role.trim(),
      company: params.company?.trim() || null,
      avatar_color: params.avatarColor?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    firstName: data.first_name,
    lastName: data.last_name,
    role: data.role,
    company: data.company || undefined,
    avatarColor: data.avatar_color || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/** Preset colors for profile avatar (all work with white text). */
export const AVATAR_COLOR_PRESETS = [
  '#166534', '#1e40af', '#7c2d12', '#4c1d95', '#155e75',
  '#b45309', '#be123c', '#0f766e', '#6366f1', '#64748b',
] as const;
