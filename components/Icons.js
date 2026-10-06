// Thin-line icons (inline SVG, inherit currentColor).
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

export const SearchIcon = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const BagIcon = () => (
  <svg {...base}>
    <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
export const UserIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);
export const MenuIcon = () => (
  <svg {...base}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const CloseIcon = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const GiftIcon = () => (
  <svg {...base}>
    <rect x="3" y="9" width="18" height="12" rx="1" />
    <path d="M2 9h20M12 9v12M12 9c-1.5-4-6-4-6-1.5S10 9 12 9Zm0 0c1.5-4 6-4 6-1.5S14 9 12 9Z" />
  </svg>
);
export const TagIcon = () => (
  <svg {...base}>
    <path d="M3 12V4h8l10 10-8 8L3 12Z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
);
export const TruckIcon = () => (
  <svg {...base}>
    <path d="M2 6h12v10H2zM14 10h4l4 4v2h-8" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);
export const SparkleIcon = () => (
  <svg {...base}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
  </svg>
);
export const ChatIcon = () => (
  <svg {...base}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.3L4 20Z" />
    <path d="M9 10h6M9 13h4" />
  </svg>
);
export const InstagramIcon = () => (
  <svg {...base}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);
