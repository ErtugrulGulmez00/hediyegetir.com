/** Dikiş çizgisi üstünde küçük bir kurdele fiyonku. */
export function RibbonDivider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`relative my-10 flex items-center ${className}`}>
      <span className="h-0 flex-1 border-t-2 border-dashed border-kraft-koyu" />
      <svg viewBox="0 0 64 32" className="mx-3 h-7 w-14 text-kiremit" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M32 16c-6-9-17-13-22-8-4 4 0 12 8 12 5 0 10-2 14-4Z" fill="currentColor" fillOpacity=".15" />
        <path d="M32 16c6-9 17-13 22-8 4 4 0 12-8 12-5 0-10-2-14-4Z" fill="currentColor" fillOpacity=".15" />
        <path d="M30 18l-7 12M34 18l8 11" strokeLinecap="round" />
        <circle cx="32" cy="16.5" r="3.4" fill="currentColor" />
      </svg>
      <span className="h-0 w-1/5 border-t-2 border-dashed border-kraft-koyu" />
    </div>
  );
}
