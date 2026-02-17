import type { Profile } from '../utils/profileService';
import { getInitialsFromProfile, DEFAULT_AVATAR_COLOR } from '../utils/profileService';

interface TaskUserAvatarProps {
  userId: string | undefined;
  profile: Profile | null | undefined;
  size?: number;
  title?: string;
}

export default function TaskUserAvatar({ userId, profile, size = 28, title }: TaskUserAvatarProps) {
  if (!userId) return null;
  const initials = getInitialsFromProfile(profile, userId);
  const displayTitle = title ?? (profile ? `${profile.firstName} ${profile.lastName}` : undefined);
  const bgColor = profile?.avatarColor || DEFAULT_AVATAR_COLOR;
  return (
    <span
      className="task-user-avatar"
      title={displayTitle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: 'white',
        fontWeight: 600,
        fontSize: size <= 24 ? '0.65rem' : '0.75rem',
      }}
    >
      {initials}
    </span>
  );
}
