import { useState, useRef, useEffect } from 'react';
import type { Profile } from '../utils/profileService';
import { getInitialsFromProfile, DEFAULT_AVATAR_COLOR } from '../utils/profileService';

interface TaskUserAvatarPickerProps {
  userId: string | undefined;
  profile: Profile | null | undefined;
  allProfiles: Profile[];
  onChange: (userId: string) => void; // pass '' to clear
  fieldLabel: 'Owner' | 'Assignee';
  size?: number;
  disabled?: boolean;
}

export default function TaskUserAvatarPicker({
  userId,
  profile,
  allProfiles,
  onChange,
  fieldLabel,
  size = 28,
  disabled = false,
}: TaskUserAvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const initials = userId ? getInitialsFromProfile(profile, userId) : '+';
  const displayTitle = profile ? `${profile.firstName} ${profile.lastName}` : (userId ? 'Assign ' + fieldLabel : `Select ${fieldLabel}`);
  const bgColor = (userId && profile?.avatarColor) ? profile.avatarColor : (userId ? DEFAULT_AVATAR_COLOR : 'rgba(22, 101, 52, 0.5)');

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        title={displayTitle}
        disabled={disabled}
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
          border: '2px solid transparent',
          cursor: disabled ? 'default' : 'pointer',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            minWidth: '160px',
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            padding: '4px 0',
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
            Change {fieldLabel}
          </div>
          <button
            type="button"
            role="option"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 10px',
              fontSize: '0.8rem',
              textAlign: 'left',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            — Clear
          </button>
          {allProfiles.map((p) => {
            const isSelected = p.userId === userId;
            const pInitials = getInitialsFromProfile(p, p.userId);
            const pColor = p.avatarColor || DEFAULT_AVATAR_COLOR;
            return (
              <button
                key={p.userId}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(p.userId);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: isSelected ? '#dcfce7' : 'transparent',
                  cursor: 'pointer',
                  color: '#14532d',
                }}
              >
                <span
                  style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: pColor,
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: size <= 24 ? '0.65rem' : '0.7rem',
                    flexShrink: 0,
                  }}
                >
                  {pInitials}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.firstName} {p.lastName}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
