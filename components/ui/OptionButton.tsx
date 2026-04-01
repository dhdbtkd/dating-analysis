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
      className="w-full text-left p-4 rounded-xl border transition-all duration-200 flex gap-3 items-start"
      style={{
        backgroundColor: selected ? 'rgba(200,169,110,0.12)' : '#111118',
        borderColor: selected ? '#c8a96e' : '#1e1e2e',
        color: selected ? '#c8a96e' : '#e8e8f0',
      }}
    >
      <span
        className="font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          backgroundColor: selected ? '#c8a96e' : '#1e1e2e',
          color: selected ? '#0a0a0f' : '#8a8a9a',
        }}
      >
        {label}
      </span>
      <span className="text-xs leading-relaxed">{text}</span>
    </button>
  );
}
