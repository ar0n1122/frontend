import {useState, useEffect, useRef} from 'react'
import Button from '@/components/ui/Button'
import {Card, CardBody, CardHeader} from '@/components/ui/Card'
import {useTheme} from '@/context/ThemeContext'

/* ---- helpers ---- */
function loadSettings() {
    return {
        apiUrl: localStorage.getItem('rag_api_url') ?? 'http://localhost:8000',
        apiKey: localStorage.getItem('rag_api_key') ?? '',
        llmProvider: localStorage.getItem('rag_llm_provider') ?? 'ollama',
        topK: parseInt(localStorage.getItem('rag_top_k') ?? '5', 10),
        openaiKey: localStorage.getItem('rag_openai_key') ?? '',
        includeImages: localStorage.getItem('rag_include_images') !== 'false',
        autoRagas: localStorage.getItem('rag_auto_ragas') === 'true',
    }
}

function saveConnSettings(url: string, key: string) {
    localStorage.setItem('rag_api_url', url)
    localStorage.setItem('rag_api_key', key)
}

function saveQuerySettings(provider: string, topK: number, okey: string, images: boolean, ragas: boolean) {
    localStorage.setItem('rag_llm_provider', provider)
    localStorage.setItem('rag_top_k', String(topK))
    localStorage.setItem('rag_openai_key', okey)
    localStorage.setItem('rag_include_images', String(images))
    localStorage.setItem('rag_auto_ragas', String(ragas))
}

/* ---- section wrapper ---- */
function Section({title, children}: {title: string; children: React.ReactNode}) {
    return (
        <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-0.5">
                {title}
            </h4>
            {children}
        </div>
    )
}

/* ---- input wrapper ---- */
function Field({label, children}: {label: string; children: React.ReactNode}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">{label}</label>
            {children}
        </div>
    )
}

const INPUT =
    'w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[14px] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-200'
const SELECT = INPUT + ' cursor-pointer'

/* ---- Toast ---- */
function Toast({msg, onClose}: {msg: string; onClose: () => void}) {
    useEffect(() => {
        const t = setTimeout(onClose, 2500)
        return () => clearTimeout(t)
    }, [onClose])
    return (
        <div
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-[14px] font-semibold text-white flex items-center gap-2.5"
            style={{background: 'linear-gradient(135deg, var(--success), var(--accent))'}}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            {msg}
        </div>
    )
}

/* ============================================================ */
export default function SettingsPage() {
    const {theme, setTheme, design, setDesign} = useTheme()
    const [settings, setSettings] = useState(loadSettings)
    const [toast, setToast] = useState<string | null>(null)
    const apiKeyRef = useRef<HTMLInputElement>(null)

    const showToast = (msg: string) => setToast(msg)

    /* --- connection save --- */
    const handleSaveConnection = () => {
        saveConnSettings(settings.apiUrl, settings.apiKey)
        showToast('Connection settings saved')
    }

    /* --- query save --- */
    const handleSaveQuery = () => {
        saveQuerySettings(settings.llmProvider, settings.topK, settings.openaiKey, settings.includeImages, settings.autoRagas)
        showToast('Query settings saved')
    }

    const DESIGNS: {id: 'voicebox' | 'ember'; label: string; icon: string; desc: string}[] = [
        {id: 'voicebox', label: 'VoiceBox', icon: '📰', desc: 'High-contrast editorial — angular, stark black & red'},
        {id: 'ember', label: 'Ember Studio', icon: '🔥', desc: 'Warm craft aesthetic — terracotta, serif, soft radius'},
    ]

    const THEMES: {id: 'colored' | 'dark'; label: string; icon: string; desc: string}[] = [
        {id: 'colored', label: 'Colored', icon: '✦', desc: 'Original brand colors exactly as designed'},
        {id: 'dark', label: 'Dark', icon: '☾', desc: 'Dark backgrounds — easy on the eyes at night'},
    ]

    return (
        <div className="h-full overflow-y-auto px-6 py-6 space-y-6">

            <Section title="Appearance">
                <Card>
                    <CardBody>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Design System</p>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-5">
                            {DESIGNS.map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => setDesign(d.id)}
                                    className={`theme-card-glow relative flex flex-col items-start gap-2 p-4 border-2 text-left w-full ${design === d.id
                                        ? 'selected border-[var(--accent)] bg-[var(--accent)]/10'
                                        : 'border-[var(--border-primary)] hover:border-[var(--border-medium)] bg-[var(--bg-secondary)]'
                                        }`}
                                    style={{borderRadius: 'var(--radius-lg)'}}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-2xl">{d.icon}</span>
                                        {design === d.id && (
                                            <span
                                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                                                style={{background: 'var(--accent)'}}
                                            >
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[14px] font-bold text-[var(--text-primary)]">{d.label}</span>
                                    <span className="text-[12px] text-[var(--text-secondary)] leading-snug">{d.desc}</span>
                                </button>
                            ))}
                        </div>

                        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Color Scheme</p>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`theme-card-glow relative flex flex-col items-start gap-2 p-4 border-2 text-left w-full ${theme === t.id
                                        ? 'selected border-[var(--accent)] bg-[var(--accent)]/10'
                                        : 'border-[var(--border-primary)] hover:border-[var(--border-medium)] bg-[var(--bg-secondary)]'
                                        }`}
                                    style={{borderRadius: 'var(--radius-lg)'}}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-2xl">{t.icon}</span>
                                        {theme === t.id && (
                                            <span
                                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                                                style={{background: 'var(--accent)'}}
                                            >
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[14px] font-bold text-[var(--text-primary)]">{t.label}</span>
                                    <span className="text-[12px] text-[var(--text-secondary)] leading-snug">{t.desc}</span>
                                </button>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </Section>

            {/* === BACKEND CONNECTION === */}
            <Section title="Backend Connection">
                <Card>
                    <CardBody>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="API Base URL">
                                <input
                                    type="text"
                                    className={INPUT}
                                    value={settings.apiUrl}
                                    onChange={(e) => setSettings((s) => ({...s, apiUrl: e.target.value}))}
                                    placeholder="http://localhost:8000"
                                />
                            </Field>
                            <Field label="API Key (optional)">
                                <input
                                    ref={apiKeyRef}
                                    type="password"
                                    className={INPUT}
                                    value={settings.apiKey}
                                    onChange={(e) => setSettings((s) => ({...s, apiKey: e.target.value}))}
                                    placeholder="sk-••••••••"
                                />
                            </Field>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button variant="primary" onClick={handleSaveConnection}>
                                💾 Save Connection
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </Section>

            {/* === DEFAULT QUERY SETTINGS === */}
            <Section title="Default Query Settings">
                <Card>
                    <CardBody>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Default LLM Provider">
                                <select
                                    className={SELECT}
                                    value={settings.llmProvider}
                                    onChange={(e) => setSettings((s) => ({...s, llmProvider: e.target.value}))}
                                >
                                    <option value="ollama">Ollama (Local — Mistral 7B)</option>
                                    <option value="openai">OpenAI (GPT-4o-mini)</option>
                                    <option value="anthropic">Anthropic (Claude 3 Haiku)</option>
                                </select>
                            </Field>

                            <Field label="Top-K Chunks">
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    className={INPUT}
                                    value={settings.topK}
                                    onChange={(e) => setSettings((s) => ({...s, topK: parseInt(e.target.value) || 5}))}
                                />
                            </Field>

                            <Field label="OpenAI API Key (for RAGAS / cloud LLM)">
                                <input
                                    type="password"
                                    className={INPUT}
                                    value={settings.openaiKey}
                                    onChange={(e) => setSettings((s) => ({...s, openaiKey: e.target.value}))}
                                    placeholder="sk-••••••••"
                                />
                            </Field>
                        </div>

                        <div className="mt-4 space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                                    checked={settings.includeImages}
                                    onChange={(e) => setSettings((s) => ({...s, includeImages: e.target.checked}))}
                                />
                                <span className="text-[13px] font-semibold text-[var(--text-primary)]">Include image chunks in retrieval</span>
                                <span className="text-[12px] text-[var(--text-secondary)] ml-1">(enables multimodal RAG)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                                    checked={settings.autoRagas}
                                    onChange={(e) => setSettings((s) => ({...s, autoRagas: e.target.checked}))}
                                />
                                <span className="text-[13px] font-semibold text-[var(--text-primary)]">Auto-evaluate RAGAS scores per query</span>
                                <span className="text-[12px] text-[var(--text-secondary)] ml-1">(adds ~500ms latency)</span>
                            </label>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <Button variant="primary" onClick={handleSaveQuery}>
                                💾 Save Query Settings
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </Section>

            {/* === ABOUT === */}
            <Section title="About">
                <Card>
                    <CardHeader title="Enterprise Multimodal Hybrid RAG Platform" />
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                ['Version', '1.0.0 (beta)'],
                                ['Backend', 'Python · FastAPI · LlamaIndex · LangGraph'],
                                ['Frontend', 'React 18 · TypeScript · Vite · TailwindCSS'],
                                ['Vector DB', 'Qdrant + Elasticsearch (Hybrid RRF)'],
                                ['Reranker', 'ColBERT + Cross-Encoder'],
                                ['Evaluation', 'RAGAS framework'],
                                ['License', 'MIT'],
                            ].map(([k, v]) => (
                                <div
                                    key={k}
                                    className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    <span className="text-[12px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{k}</span>
                                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{v}</span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </Section>

            {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
        </div>
    )
}
