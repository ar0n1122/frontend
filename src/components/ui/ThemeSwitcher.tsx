import clsx from 'clsx'
import {useTheme, type Theme} from '@/context/ThemeContext'

interface ThemeDef {
    id: Theme
    icon: string
    label: string
}

const THEMES: ThemeDef[] = [
    {id: 'dark', icon: '🌙', label: 'Dark'},
    {id: 'solarized', icon: '🌿', label: 'Solarized'},
]

export default function ThemeSwitcher() {
    const {theme, setTheme} = useTheme()
    return (
        <div className="flex items-center bg-[var(--bg-tertiary)] border-2 border-[var(--border-primary)] p-0.5 gap-0.5">
            {THEMES.map((t) => (
                <button
                    key={t.id}
                    title={t.label}
                    onClick={() => setTheme(t.id)}
                    className={clsx(
                        'w-8 h-8 flex items-center justify-center text-[15px] transition-all duration-200',
                        theme === t.id
                            ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-[var(--accent)]'
                            : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                    )}
                >
                    {t.icon}
                </button>
            ))}
        </div>
    )
}
