'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('cebu-theme-v2') as 'dark' | 'light' | null
    const initial = saved || 'light'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('cebu-theme-v2', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-600" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}
