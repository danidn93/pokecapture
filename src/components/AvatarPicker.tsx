import { AVATARS } from "@/data/avatars";

interface AvatarPickerProps {
  selected: string | null;
  onSelect: (avatar: string) => void;
}

export default function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3 mt-3">
      {AVATARS.map((avatar) => (
        <div
          key={avatar.id}
          onClick={() => onSelect(avatar.src)}
          className={`
            cursor-pointer p-1 rounded-lg border 
            transition-all hover:scale-105 
            ${selected === avatar.src
              ? "border-yellow-400 ring-2 ring-yellow-400"
              : "border-border opacity-80"}
          `}
        >
          <img
            src={avatar.src}
            alt={avatar.name}
            className="rounded-md w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
