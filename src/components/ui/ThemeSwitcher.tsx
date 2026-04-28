import clsx from 'clsx'
import {useTheme} from '@/context/ThemeContext'

export default function ThemeSwitcher() {
    const {theme, design, setTheme, setDesign} = useTheme()

    return (
        <div className="flex items-center gap-1.5">
            {/* ── Theme: light / dark ── */}
            <div
                className="flex items-center border-2 border-[var(--border-primary)] p-0.5 gap-0.5"
                style={{background: 'var(--bg-tertiary)'}}
                title="Color scheme"
            >
                {([
                    {id: 'colored', icon: '✦', label: 'Colored'},
                    {id: 'dark', icon: '☾', label: 'Dark'},
                ] as const).map((t) => (
                    <button
                        key={t.id}
                        title={t.label}
                        onClick={() => setTheme(t.id)}
                        className={clsx(
                            'w-8 h-8 flex items-center justify-center text-[15px] transition-all duration-150',
                            theme === t.id
                                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-[var(--accent)]'
                                : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                        )}
                    >
                        {t.icon}
                    </button>
                ))}
            </div>

            {/* ── Design system ── */}
            <div
                className="flex items-center border-2 border-[var(--border-primary)] p-0.5 gap-0.5"
                style={{background: 'var(--bg-tertiary)'}}
                title="Design system"
            >
                {([
                    {id: 'voicebox', label: 'VB', title: 'VoiceBox — editorial sharp'},
                    {id: 'ember', label: 'EM', title: 'Ember Studio — warm craft'},
                ] as const).map((d) => (
                    <button
                        key={d.id}
                        title={d.title}
                        onClick={() => setDesign(d.id)}
                        className={clsx(
                            'w-8 h-8 flex items-center justify-center text-[10px] font-bold tracking-wide transition-all duration-150',
                            design === d.id
                                ? 'bg-[var(--bg-primary)] text-[var(--accent)] border-2 border-[var(--accent)]'
                                : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                        )}
                    >
                        {d.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

