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
      className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: disabled ? '#8a7049' : '#c8a96e',
        color: '#0a0a0f',
      }}
    >
      {children}
    </button>
  );
}
