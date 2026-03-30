import {GoogleLogin} from '@react-oauth/google'
import {useAuth} from '@/context/AuthContext'
import {useState} from 'react'

export default function LoginPage() {
    const {signIn} = useAuth()
    const [error, setError] = useState<string | null>(null)

    return (
        <div className="flex min-h-screen items-center justify-center gradient-animate" style={{background: 'linear-gradient(135deg, var(--bg-primary), var(--accent-light), var(--bg-secondary), var(--accent-light))'}}>
            <div
                className="w-full max-w-md rounded-2xl p-10 text-center shadow-xl"
                style={{background: 'var(--bg-modal)', border: '1px solid var(--border-primary)'}}
            >
                {/* Logo */}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg" style={{background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'}}>
                    ⚡
                </div>
                <h1 className="mb-1 text-2xl font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>
                    RAG Platform
                </h1>
                <p className="mb-2 text-sm font-medium" style={{background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                    Enterprise Multimodal AI
                </p>
                <p className="mb-8 text-sm" style={{color: 'var(--text-secondary)'}}>
                    Sign in to access your documents and chat
                </p>

                {/* Google Sign-In button */}
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
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Sign-in failed')
                            }
                        }}
                        onError={() => setError('Google Sign-In failed')}
                        theme="outline"
                        size="large"
                        width={320}
                        text="signin_with"
                    />
                </div>

                {error && (
                    <p className="mt-4 text-sm font-medium rounded-lg px-3 py-2" style={{color: 'var(--danger)', background: '#fef2f2', border: '1px solid var(--danger)', borderColor: 'rgba(239,68,68,0.2)'}}>{error}</p>
                )}

                <div className="mt-8 pt-6" style={{borderTop: '1px solid var(--border-primary)'}}>
                    <p className="text-[11px] text-[var(--text-tertiary)]">Hybrid RAG with Dense + Sparse retrieval, Cross-encoder reranking, RAGAS evaluation</p>
                </div>
            </div>
        </div>
    )
}
