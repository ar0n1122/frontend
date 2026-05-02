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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

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
