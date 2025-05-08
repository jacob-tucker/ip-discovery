"use client";

interface WaveformPlaceholderProps {
  className?: string;
}

export default function WaveformPlaceholder({
  className = "",
}: WaveformPlaceholderProps) {
  // Create an array of 32 bars with random heights
  const bars = Array.from({ length: 32 }, () => Math.random() * 80 + 20);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-cardBg ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="flex items-end h-[60%] w-[80%] space-x-1">
          {bars.map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-accentPurple rounded-t"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
      <div className="z-10 bg-accentPurple rounded-full h-16 w-16 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-white"
        >
          <path d="M10 16l6-4-6-4v8z" />
        </svg>
      </div>
    </div>
  );
}
