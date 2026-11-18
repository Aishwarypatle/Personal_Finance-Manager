export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.5 18.5V13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 18.5V9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15.5 18.5V5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M3.5 20.5H20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity=".55" />
      <circle cx="18.5" cy="6" r="2.5" fill="#F4B942" />
    </svg>
  );
}
