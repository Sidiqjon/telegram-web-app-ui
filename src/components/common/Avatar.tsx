import { getAvatarColor, getInitials } from '../../utils/getInitials';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnlineDot?: boolean;
  isOnline?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
};

const DOT_SIZE: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
  xl: 'h-5 w-5',
};

export function Avatar({ src, name, size = 'md', showOnlineDot = false, isOnline = false }: AvatarProps) {
  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${SIZE_CLASSES[size]} rounded-full object-cover ring-1 ring-black/5`}
        />
      ) : (
        <div
          className={`${SIZE_CLASSES[size]} ${getAvatarColor(name)} flex items-center justify-center rounded-full font-semibold text-white ring-1 ring-black/5`}
        >
          {getInitials(name)}
        </div>
      )}
      {showOnlineDot && (
        <span
          className={`absolute bottom-0 right-0 ${DOT_SIZE[size]} rounded-full border-2 border-white ${
            isOnline ? 'bg-emerald-500' : 'bg-ink-faint'
          }`}
        />
      )}
    </div>
  );
}
