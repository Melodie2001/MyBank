const paths = {
  shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-4 10 3 3 5-6',
  key: 'M14 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-1 3 9 9-3 3-3-3 2-2',
  mail: 'M3 5h18v14H3ZM3 5l9 8 9-8',
  user: 'M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3',
  trash: 'M3 6h18M8 6V3h8v3M5 6l1 16h12l1-16M10 10v8M14 10v8',
  plus: 'M12 4v16M4 12h16',
  edit: 'm3 16 13-13 5 5L8 21H3ZM13 6l5 5',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM15 15l7 7',
  eye: 'M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  eyeOff: 'm3 3 18 18M9 5a10 10 0 0 1 3-1c6 0 10 8 10 8a20 20 0 0 1-3 4M6 6a23 23 0 0 0-4 6s4 8 10 8a12 12 0 0 0 5-2',
};

export default function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ verticalAlign: 'middle', flexShrink: 0 }}><path d={paths[name] || paths.user} /></svg>;
}
