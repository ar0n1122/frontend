import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {GoogleOAuthProvider} from '@react-oauth/google'
import {ThemeProvider} from '@/context/ThemeContext'
import {AuthProvider, useAuth} from '@/context/AuthContext'
import Layout from '@/components/Layout'
import ChatPage from '@/pages/ChatPage'
import DocumentsPage from '@/pages/DocumentsPage'
import UsagePage from '@/pages/UsagePage'
import LoginPage from '@/pages/LoginPage'
import ReLoginModal from '@/components/ReLoginModal'
import {appUnavailableMessage, isAppUnavailable} from '@/config/appStatus'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

function UnavailableApp() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="border-b-2 border-[var(--danger)] bg-[var(--warning-bg)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] sm:px-6">
                Service notice: {appUnavailableMessage}
            </div>
            <main className="flex min-h-[calc(100vh-58px)] items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-2xl border-2 border-[var(--border-strong)] bg-[var(--bg-modal)] p-8 sm:p-10">
                    <div className="mb-5 inline-flex h-16 w-16 items-center justify-center bg-[var(--danger)] text-2xl font-bold text-white">
                        !
                    </div>
                    <h1 className="mb-3 text-3xl leading-tight tracking-[-0.02em] sm:text-4xl" style={{fontFamily: 'var(--font-display)'}}>
                        App temporarily unavailable
                    </h1>
                    <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                        {appUnavailableMessage} Uploads and all app actions are disabled until service is restored.
                    </p>
                </div>
            </main>
        </div>
    )
}

function AuthenticatedRoutes() {
    const {user, isLoading, isSessionExpired, isRateLimited, rateLimitMessage, clearRateLimited} = useAuth()

    if (isLoading) return null
    // Session expired: show re-login modal only — do NOT render routes/pages
    // because their hooks would fire API calls and produce a cascade of 401s.
    if (isSessionExpired) return <ReLoginModal />
    if (!user) return <LoginPage />

    return (
        <>
            {isRateLimited && (
                <div
                    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 text-sm font-medium"
                    style={{
                        background: 'var(--danger, #ef4444)',
                        color: '#fff',
                    }}
                >
                    <span>⛔ {rateLimitMessage || 'You have exhausted your free use limit. Contact Admin'}</span>
                    <button
                        onClick={clearRateLimited}
                        className="ml-4 rounded px-2 py-0.5 text-xs font-semibold opacity-80 hover:opacity-100"
                        style={{background: 'rgba(255,255,255,0.2)'}}
                    >
                        Dismiss
                    </button>
                </div>
            )}
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/chat" replace />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="usage" element={<UsagePage />} />
                </Route>
            </Routes>
        </>
    )
}

export default function App() {
    if (isAppUnavailable) return <UnavailableApp />

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <AuthenticatedRoutes />
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </GoogleOAuthProvider>
    )
}
