import {GoogleLogin} from '@react-oauth/google'
import {useAuth} from '@/context/AuthContext'
import {useState} from 'react'

export default function LoginPage() {
    const {signIn} = useAuth()
    const [error, setError] = useState<string | null>(null)

    return (
        <div className="flex min-h-screen items-center justify-center px-4" style={{background: 'var(--bg-primary)'}}>
            <div
                className="w-full max-w-md p-10 text-center"
                style={{background: 'var(--bg-modal)', border: '2px solid var(--border-strong)'}}
            >
                {/* Logo */}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center text-2xl font-bold text-white" style={{background: 'var(--accent)'}}>
                    ⚡
                </div>
                <h1 className="mb-1 text-[38px] leading-[1.1] tracking-[-0.02em]" style={{color: 'var(--text-primary)', fontFamily: 'var(--font-display)'}}>
                    RAG Platform
                </h1>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em]" style={{color: 'var(--text-secondary)'}}>
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
                    <p className="mt-4 text-sm font-medium px-3 py-2" style={{color: 'var(--danger)', background: '#FEF2F2', border: '2px solid var(--danger)'}}>{error}</p>
                )}

                <div className="mt-8 pt-6" style={{borderTop: '1px solid var(--border-primary)'}}>
                    <p className="text-[11px] text-[var(--text-tertiary)]">Hybrid RAG with Dense + Sparse retrieval, Cross-encoder reranking, RAGAS evaluation</p>
                </div>
            </div>
        </div>
    )
}
