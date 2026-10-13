import { useState, useEffect } from 'react';

import { ThemeContext } from './themeState';

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('admin-theme') === 'dark');

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('admin-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggleDark: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}
