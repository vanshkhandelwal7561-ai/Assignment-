import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyTheme, getInitialTheme, THEME_KEY } from '../theme'

function ThemeToggle() {
  const [theme, setTheme] = useState(() => getInitialTheme())
  useEffect(() => applyTheme(theme), [theme])
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return <button type="button" onClick={() => { const next = nextTheme; setTheme(next); localStorage.setItem(THEME_KEY, next) }} aria-label={`Switch to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"><span className="sr-only">Switch to {nextTheme} mode</span>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
}

export default ThemeToggle
