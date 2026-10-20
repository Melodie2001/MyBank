const paths = {
  home: ['M3 10 12 3l9 7v11h-6v-7H9v7H3Z'],
  dashboard: ['M3 3h7v7H3Z M14 3h7v7h-7Z M3 14h7v7H3Z M14 14h7v7h-7Z'],
  transfer: ['M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4'],
  tag: ['M3 3h8l10 10-8 8L3 11Z', 'M7 7h.01'],
  wallet: ['M3 6h17v15H3V6l15-3v3', 'M15 11h6v5h-6Z'],
  cart: ['M2 3h3l3 13h11l3-9H6', 'M9 21h.01M18 21h.01'],
  briefcase: ['M3 7h18v14H3Z M8 7V3h8v4M3 12h18M10 12v3h4v-3'],
  food: ['M4 3v6a3 3 0 0 0 6 0V3M7 3v18M20 3c-4 2-4 8 0 9V3v18'],
  coffee: ['M3 8h13v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5ZM16 8h2a3 3 0 0 1 0 6h-2M6 2v3M11 2v3'],
  bag: ['M4 7h16l1 14H3ZM8 7V5a4 4 0 0 1 8 0v2'],
  plane: ['m22 2-7 20-4-9-9-4 20-7ZM11 13 22 2'],
  train: ['M5 3h14v14H5ZM5 10h14M12 3v7M8 21l2-4m4 0 2 4M8 14h.01M16 14h.01'],
  heart: ['M12 21 3 12C-3 4 7-2 12 6c5-8 15-2 9 6Z'],
  activity: ['M2 12h5l3-8 4 16 3-8h5'],
  film: ['M3 3h18v18H3ZM7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4'],
  book: ['M12 5C8 2 4 3 2 4v16c3-2 7-1 10 1 3-2 7-3 10-1V4c-3-2-7-1-10 1Zm0 0v16'],
  laptop: ['M5 3h14v13H5ZM2 20l3-4h14l3 4Z'],
  phone: ['M7 2h10v20H7ZM11 18h2'],
  game: ['M7 6h10c4 0 6 12 3 13-2 1-4-3-5-3H9c-1 0-3 4-5 3C1 18 3 6 7 6ZM6 10v4M4 12h4M16 11h.01M19 14h.01'],
  paw: ['M6 20c-5-3 2-11 6-11s11 8 6 11c-2 1-3-1-6-1s-4 2-6 1ZM3 5h2v3H3ZM9 2h2v4H9ZM15 2h2v4h-2ZM20 5h2v3h-2Z'],
  pill: ['m5 19 14-14M4 11l7-7c6-6 15 3 9 9l-7 7c-6 6-15-3-9-9Z'],
  target: ['M22 12a10 10 0 1 1-10-10 10 10 0 0 1 10 10ZM18 12a6 6 0 1 1-6-6 6 6 0 0 1 6 6ZM14 12a2 2 0 1 1-2-2 2 2 0 0 1 2 2Z'],
  alert: ['m12 3 10 18H2ZM12 9v5M12 17h.01'],
  check: ['m4 12 5 5L20 6'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4'],
  mail: ['M3 5h18v14H3ZM3 5l9 8 9-8'],
  user: ['M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3'],
  calendar: ['M3 5h18v17H3ZM3 10h18M7 2v6M17 2v6'],
  key: ['M14 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-1 3 9 9-3 3-3-3 2-2'],
  lock: ['M5 10h14v12H5ZM8 10V6a4 4 0 0 1 8 0v4M12 15v3'],
  shield: ['m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z', 'm8 12 3 3 5-6'],
  eye: ['M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
  eyeOff: ['m3 3 18 18M9 5a10 10 0 0 1 3-1c6 0 10 8 10 8a20 20 0 0 1-3 4M6 6a23 23 0 0 0-4 6s4 8 10 8a12 12 0 0 0 5-2'],
  search: ['M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM15 15l7 7'],
  sun: ['M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1'],
  moon: ['M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z'],
  trash: ['M3 6h18M8 6V3h8v3M5 6l1 16h12l1-16M10 10v8M14 10v8'],
  ban: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM5 5l14 14'],
  clipboard: ['M8 4H4v18h16V4h-4M8 2h8v5H8ZM8 12h8M8 17h6'],
  globe: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2c-6 6-6 14 0 20 6-6 6-14 0-20Z'],
  info: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 11v6M12 7h.01'],
  up: ['M12 21V3m-7 7 7-7 7 7'],
  down: ['M12 3v18m-7-7 7 7 7-7'],
  bolt: ['M13 2 3 14h8l-1 8 11-13h-8Z'],
};

export default function Icon({ name, size = 20, style, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...props}>
      {(paths[name] || paths.wallet).map((d, index) => <path key={index} d={d} />)}
    </svg>
  );
}
