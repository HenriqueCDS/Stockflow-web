import React from 'react'
import { Monitor, Sun, Moon } from 'lucide-react'
import useTheme from '../hooks/useTheme'

const options = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
]

export default function ThemeSelector() {
  const [mode, setMode] = useTheme()
  return (
    <div role="radiogroup" aria-label="Tema" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(({ value, label, icon: Icon }) => (
        <button key={value} role="radio" aria-checked={mode === value} onClick={() => setMode(value)}
          className={`chip${mode === value ? ' active' : ''}`}>
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  )
}
