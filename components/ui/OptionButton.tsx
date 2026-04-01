'use client';

interface OptionButtonProps {
  label: string;
  text: string;
  selected?: boolean;
  onClick: () => void;
}

export function OptionButton({ label, text, selected, onClick }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl transition-all duration-200 flex gap-3 items-center active:scale-[0.98]"
      style={{
        backgroundColor: selected ? '#dbeafe' : '#f2f4f6',
        color: selected ? '#002045' : '#191c1e',
      }}
    >
      <span
        className="font-semibold text-xs w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: selected ? '#002045' : '#e6e8ea',
          color: selected ? '#ffffff' : '#43474e',
        }}
      >
        {label}
      </span>
      <span className="text-sm leading-relaxed">{text}</span>
    </button>
  );
}
