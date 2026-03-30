import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react'

export type Theme = 'light' | 'dark' | 'solarized'

interface ThemeContextValue {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({children}: {children: React.ReactNode}) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('rag-theme') as Theme | null
        return saved ?? 'light'
    })

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next)
        localStorage.setItem('rag-theme', next)
    }, [])

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    return (
        <ThemeContext.Provider value={{theme, setTheme}}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
    return ctx
}
