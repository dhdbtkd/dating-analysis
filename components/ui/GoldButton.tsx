'use client';

interface GoldButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function GoldButton({ children, onClick, disabled, type = 'button', className = '' }: GoldButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-3 rounded-2xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] text-sm soft-lift ${className}`}
      style={{
        background: disabled ? '#74777f' : 'linear-gradient(135deg, #002045 0%, #1a365d 100%)',
        color: '#ffffff',
      }}
    >
      {children}
    </button>
  );
}
