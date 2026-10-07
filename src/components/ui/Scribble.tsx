/** Metnin altına elle çizilmiş gibi duran çizgi. */
export function Scribble({
  children,
  color = "text-kiremit",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-block whitespace-nowrap ${className}`}>
      {children}
      <svg
        aria-hidden
        className={`absolute -bottom-[0.28em] left-[-2%] h-[0.45em] w-[104%] ${color}`}
        viewBox="0 0 200 14"
        preserveAspectRatio="none"
      >
        <path
          d="M2 9.5c22-4.8 45-6.4 68-5.2 18 .9 30 3.6 48 3.3 25-.4 45-4.6 80-3.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M14 12.2c30-2.6 62-2.4 96-1.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity=".7"
        />
      </svg>
    </span>
  );
}
