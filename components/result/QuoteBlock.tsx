'use client';

interface QuoteBlockProps {
  quote: string;
}

export function QuoteBlock({ quote }: QuoteBlockProps) {
  return (
    <div
      className="rounded-xl p-5 border-l-4 my-4"
      style={{
        backgroundColor: 'rgba(200,169,110,0.06)',
        borderLeftColor: '#c8a96e',
      }}
    >
      <p className="text-xs leading-relaxed italic" style={{ color: '#e0c898' }}>
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  );
}
