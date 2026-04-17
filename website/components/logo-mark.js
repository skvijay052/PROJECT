export default function LogoMark({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.96)" />
      <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
      <path
        d="M40 54.6 24.6 39.9a10 10 0 0 1 0-14.4 10.8 10.8 0 0 1 15.2 0l.2.2.2-.2a10.8 10.8 0 0 1 15.2 0 10 10 0 0 1 0 14.4L40 54.6Z"
        fill="#111114"
      />
    </svg>
  );
}
