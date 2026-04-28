import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react'

export type Theme = 'light' | 'dark'
export type Design = 'voicebox' | 'ember'

interface ThemeContextValue {
    theme: Theme
    design: Design
    setTheme: (theme: Theme) => void
    setDesign: (design: Design) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const THEME_KEY = 'rag-theme'
const DESIGN_KEY = 'rag-design'

function resolveTheme(): Theme {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    // migrate old values ('dark'/'solarized' were voicebox-light)
    return 'light'
}

function resolveDesign(): Design {
    const saved = localStorage.getItem(DESIGN_KEY)
    if (saved === 'voicebox' || saved === 'ember') return saved
    return 'voicebox'
}

export function ThemeProvider({children}: {children: React.ReactNode}) {
    const [theme, setThemeState] = useState<Theme>(resolveTheme)
    const [design, setDesignState] = useState<Design>(resolveDesign)

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next)
        localStorage.setItem(THEME_KEY, next)
    }, [])

    const setDesign = useCallback((next: Design) => {
        setDesignState(next)
        localStorage.setItem(DESIGN_KEY, next)
    }, [])

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.setAttribute('data-design', design)
    }, [theme, design])

    return (
        <ThemeContext.Provider value={{theme, design, setTheme, setDesign}}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
    return ctx
}

