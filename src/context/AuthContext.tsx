import {createContext, useCallback, useContext, useEffect, useState} from 'react'
import type {ReactNode} from 'react'
import type {AuthUser} from '@/types'
import {authApi} from '@/services/api'

interface AuthContextValue {
    user: AuthUser | null
    isLoading: boolean
    isSessionExpired: boolean
    signIn: (googleIdToken: string) => Promise<void>
    signOut: () => void
    clearSessionExpired: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'rag-token'
const USER_KEY = 'rag-user'

export function AuthProvider({children}: {children: ReactNode}) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSessionExpired, setIsSessionExpired] = useState(false)

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem(USER_KEY)
        const storedToken = localStorage.getItem(TOKEN_KEY)
        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser) as AuthUser)
            } catch {
                localStorage.removeItem(USER_KEY)
                localStorage.removeItem(TOKEN_KEY)
            }
        }
        setIsLoading(false)
    }, [])

    // Listen for 401 events from the API interceptor
    useEffect(() => {
        const handleExpired = () => {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
            setUser(null)
            setIsSessionExpired(true)
        }
        window.addEventListener('auth:expired', handleExpired)
        return () => window.removeEventListener('auth:expired', handleExpired)
    }, [])

    const signIn = useCallback(async (googleIdToken: string) => {
        const res = await authApi.googleSignIn(googleIdToken)
        localStorage.setItem(TOKEN_KEY, res.access_token)
        localStorage.setItem(USER_KEY, JSON.stringify(res.user))
        setUser(res.user)
        setIsSessionExpired(false)
    }, [])

    const signOut = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
    }, [])

    const clearSessionExpired = useCallback(() => {
        setIsSessionExpired(false)
    }, [])

    return (
        <AuthContext.Provider value={{user, isLoading, isSessionExpired, signIn, signOut, clearSessionExpired}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
    return ctx
}
