import { Check } from 'lucide-react';
import { AVATAR_OPTIONS } from '../constants/avatars';

interface AvatarPickerProps {
  selected: string;
  onChange: (avatarId: string) => void;
}

export default function AvatarPicker({ selected, onChange }: AvatarPickerProps) {
  return (
    <div>
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Choose Avatar</p>
      <div className="grid grid-cols-5 gap-3">
        {AVATAR_OPTIONS.map(avatar => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.id)}
            title={avatar.label}
            className={`relative group rounded-2xl p-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selected === avatar.id
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/40 scale-105 shadow-lg shadow-blue-500/20'
                : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-blue-300 dark:hover:ring-blue-700 hover:scale-105 hover:shadow-md'
            }`}
          >
            <img
              src={avatar.url}
              alt={avatar.label}
              className="w-full aspect-square rounded-xl object-cover"
              loading="lazy"
            />
            {selected === avatar.id && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
