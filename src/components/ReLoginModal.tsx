import {useState} from 'react'
import {GoogleLogin} from '@react-oauth/google'
import {useAuth} from '@/context/AuthContext'

export default function ReLoginModal() {
    const {signIn, clearSessionExpired} = useAuth()
    const [error, setError] = useState<string | null>(null)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'}}
        >
            <div
                className="w-full max-w-sm p-8 text-center"
                style={{
                    background: 'var(--bg-modal)',
                    border: '2px solid var(--border-strong)',
                }}
            >
                <div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-xl font-bold text-white"
                    style={{background: 'var(--accent)'}}
                >
                    ⚡
                </div>

                <h2
                    className="mb-1 text-2xl font-bold tracking-tight"
                    style={{color: 'var(--text-primary)', fontFamily: 'var(--font-display)'}}
                >
                    Session Expired
                </h2>
                <p className="mb-6 text-sm" style={{color: 'var(--text-secondary)'}}>
                    Your session has expired. Please sign in again to continue.
                </p>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={async (response) => {
                            setError(null)
                            if (!response.credential) {
                                setError('No credential returned from Google')
                                return
                            }
                            try {
                                await signIn(response.credential)
                                // signIn sets isSessionExpired=false internally
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Sign-in failed')
                            }
                        }}
                        onError={() => setError('Google Sign-In failed')}
                        theme="outline"
                        size="large"
                        width={280}
                        text="signin_with"
                    />
                </div>

                {error && (
                    <p className="mt-4 text-xs" style={{color: 'var(--error, #ef4444)'}}>
                        {error}
                    </p>
                )}

                <button
                    onClick={clearSessionExpired}
                    className="mt-4 text-xs underline"
                    style={{color: 'var(--text-secondary)'}}
                >
                    Dismiss
                </button>
            </div>
        </div>
    )
}
