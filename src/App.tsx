import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {GoogleOAuthProvider} from '@react-oauth/google'
import {ThemeProvider} from '@/context/ThemeContext'
import {AuthProvider, useAuth} from '@/context/AuthContext'
import Layout from '@/components/Layout'
import ChatPage from '@/pages/ChatPage'
import DocumentsPage from '@/pages/DocumentsPage'
import EvaluationPage from '@/pages/EvaluationPage'
import HealthPage from '@/pages/HealthPage'
import SettingsPage from '@/pages/SettingsPage'
import UsagePage from '@/pages/UsagePage'
import LoginPage from '@/pages/LoginPage'
import ReLoginModal from '@/components/ReLoginModal'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

function AuthenticatedRoutes() {
    const {user, isLoading, isSessionExpired} = useAuth()

    if (isLoading) return null
    // Session expired: show re-login modal only — do NOT render routes/pages
    // because their hooks would fire API calls and produce a cascade of 401s.
    if (isSessionExpired) return <ReLoginModal />
    if (!user) return <LoginPage />

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/chat" replace />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="evaluation" element={<EvaluationPage />} />
                <Route path="health" element={<HealthPage />} />
                <Route path="usage" element={<UsagePage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>
        </Routes>
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
