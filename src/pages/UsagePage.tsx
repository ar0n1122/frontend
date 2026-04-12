import {useState} from 'react'
import {useUsage} from '@/hooks/useUsage'
import type {OperationBreakdown, UsageRecord} from '@/types'

/* ── Helpers ─────────────────────────────────────────────── */

function fmt$(n: number): string {
    if (n === 0) return '$0.00'
    if (n < 0.001) return `$${n.toFixed(6)}`
    if (n < 0.01) return `$${n.toFixed(4)}`
    return `$${n.toFixed(2)}`
}

function fmtTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}

const OP_LABELS: Record<string, string> = {
    generation: 'Answer Generation',
    grading: 'Document Grading',
    reflection: 'Hallucination Check',
    query_rewrite: 'Query Rewrite',
    document_resolve: 'Document Resolution',
    embedding: 'Embeddings',
    rerank: 'Reranking',
    raw: 'Other LLM',
}

function opLabel(op: string): string {
    return OP_LABELS[op] ?? op.replace(/_/g, ' ')
}

const OP_COLORS: Record<string, string> = {
    generation: '#6366f1',
    grading: '#f59e0b',
    reflection: '#ef4444',
    query_rewrite: '#10b981',
    document_resolve: '#8b5cf6',
    embedding: '#06b6d4',
    rerank: '#ec4899',
    raw: '#64748b',
}

function opColor(op: string): string {
    return OP_COLORS[op] ?? '#94a3b8'
}

/* ── Mini bar helper ─────────────────────────────────────── */

function BarSegment({label, value, max, color}: {label: string; value: number; max: number; color: string}) {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
        <div className="flex items-center gap-3 text-[13px]">
            <span className="w-[140px] truncate text-[var(--text-secondary)]">{label}</span>
            <div className="flex-1 h-[10px] rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{width: `${Math.max(pct, 0.5)}%`, background: color}}
                />
            </div>
            <span className="w-[60px] text-right font-mono text-[var(--text-primary)]">{fmtTokens(value)}</span>
        </div>
    )
}

/* ── Stat Card ───────────────────────────────────────────── */

function StatCard({label, value, sub, accent}: {label: string; value: string; sub?: string; accent?: boolean}) {
    return (
        <div
            className="rounded-2xl p-5 border transition-shadow hover:shadow-md"
            style={{
                background: accent
                    ? 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'
                    : 'var(--bg-primary)',
                borderColor: accent ? 'transparent' : 'var(--border-primary)',
            }}
        >
            <div className={`text-[12px] font-medium uppercase tracking-wide ${accent ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>{label}</div>
            <div className={`text-[28px] font-bold mt-1 tracking-tight ${accent ? 'text-white' : 'text-[var(--text-primary)]'}`}>{value}</div>
            {sub && <div className={`text-[12px] mt-0.5 ${accent ? 'text-white/60' : 'text-[var(--text-tertiary)]'}`}>{sub}</div>}
        </div>
    )
}

/* ── Daily Cost Sparkline ─────────────────────────────────── */

function DailyCostChart({data}: {data: Record<string, number>}) {
    const entries = Object.entries(data).slice(-30) // last 30 days
    if (entries.length === 0) return <div className="text-[var(--text-tertiary)] text-sm py-8 text-center">No daily data yet</div>
    const maxCost = Math.max(...entries.map(([, v]) => v), 0.001)

    return (
        <div className="flex items-end gap-[3px] h-[120px]">
            {entries.map(([day, cost]) => {
                const pct = (cost / maxCost) * 100
                return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                            className="w-full rounded-t transition-all duration-300 min-h-[2px]"
                            style={{
                                height: `${Math.max(pct, 2)}%`,
                                background: 'linear-gradient(to top, var(--accent), var(--accent-secondary))',
                                opacity: 0.85,
                            }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-[var(--bg-primary)] border border-[var(--border-primary)] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {day}: {fmt$(cost)}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/* ── Breakdown Table ──────────────────────────────────────── */

function BreakdownTable({data, keyLabel}: {data: Record<string, OperationBreakdown>; keyLabel: string}) {
    const entries = Object.entries(data).sort(([, a], [, b]) => b.cost - a.cost)
    if (entries.length === 0) return <div className="text-[var(--text-tertiary)] text-sm py-4 text-center">No data</div>

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
                <thead>
                    <tr className="text-left text-[var(--text-tertiary)] text-[11px] uppercase tracking-wider">
                        <th className="pb-2 font-medium">{keyLabel}</th>
                        <th className="pb-2 font-medium text-right">Calls</th>
                        <th className="pb-2 font-medium text-right">Input Tokens</th>
                        <th className="pb-2 font-medium text-right">Output Tokens</th>
                        <th className="pb-2 font-medium text-right">Total Tokens</th>
                        <th className="pb-2 font-medium text-right">Cost</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(([key, b]) => (
                        <tr key={key} className="border-t border-[var(--border-secondary)]">
                            <td className="py-2.5 font-medium text-[var(--text-primary)]">
                                <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{background: opColor(key)}} />
                                {keyLabel === 'Operation' ? opLabel(key) : key}
                            </td>
                            <td className="py-2.5 text-right text-[var(--text-secondary)] font-mono">{b.calls}</td>
                            <td className="py-2.5 text-right text-[var(--text-secondary)] font-mono">{fmtTokens(b.prompt_tokens)}</td>
                            <td className="py-2.5 text-right text-[var(--text-secondary)] font-mono">{fmtTokens(b.completion_tokens)}</td>
                            <td className="py-2.5 text-right text-[var(--text-primary)] font-mono font-semibold">{fmtTokens(b.total_tokens)}</td>
                            <td className="py-2.5 text-right text-[var(--text-primary)] font-mono font-semibold">{fmt$(b.cost)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/* ── Query History Row ────────────────────────────────────── */

function QueryRow({record, expanded, onToggle}: {record: UsageRecord; expanded: boolean; onToggle: () => void}) {
    return (
        <div className="border-b border-[var(--border-secondary)]">
            <button onClick={onToggle} className="w-full text-left py-3 px-4 flex items-center gap-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <span className="flex-1 truncate text-[13px] text-[var(--text-primary)]">{record.query_text || '(no query text)'}</span>
                <span className="text-[12px] font-mono text-[var(--text-secondary)]">{fmtTokens(record.total_tokens)} tokens</span>
                <span className="text-[12px] font-mono font-semibold text-[var(--text-primary)]">{fmt$(record.total_cost)}</span>
                <span className="text-[12px] text-[var(--text-tertiary)]">{new Date(record.created_at).toLocaleString()}</span>
                <span className="text-[var(--text-tertiary)] text-xs">{expanded ? '▲' : '▼'}</span>
            </button>
            {expanded && (
                <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-[12px]">
                            <span className="text-[var(--text-tertiary)]">Input: </span>
                            <span className="font-mono text-[var(--text-primary)]">{fmtTokens(record.total_prompt_tokens)}</span>
                        </div>
                        <div className="text-[12px]">
                            <span className="text-[var(--text-tertiary)]">Output: </span>
                            <span className="font-mono text-[var(--text-primary)]">{fmtTokens(record.total_completion_tokens)}</span>
                        </div>
                        <div className="text-[12px]">
                            <span className="text-[var(--text-tertiary)]">LLM Calls: </span>
                            <span className="font-mono text-[var(--text-primary)]">{record.events.length}</span>
                        </div>
                    </div>
                    {/* Per-event details */}
                    <div className="space-y-1">
                        {record.events.map((ev, i) => (
                            <div key={i} className="flex items-center gap-3 text-[12px] py-1 px-2 rounded bg-[var(--bg-tertiary)]">
                                <span className="inline-block w-2 h-2 rounded-full" style={{background: opColor(ev.operation)}} />
                                <span className="w-[120px] text-[var(--text-secondary)]">{opLabel(ev.operation)}</span>
                                <span className="text-[var(--text-tertiary)]">{ev.provider}/{ev.model}</span>
                                <span className="ml-auto font-mono text-[var(--text-secondary)]">{fmtTokens(ev.prompt_tokens)}+{fmtTokens(ev.completion_tokens)}</span>
                                <span className="font-mono font-semibold text-[var(--text-primary)]">{fmt$(ev.cost_total)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ── Main Page ────────────────────────────────────────────── */

export default function UsagePage() {
    const {summary, history, loading, error, refresh} = useUsage()
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [tab, setTab] = useState<'operation' | 'model'>('operation')

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-[var(--text-tertiary)] text-lg">Loading usage data...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-red-500 text-lg mb-2">Failed to load usage data</div>
                    <div className="text-[var(--text-tertiary)] text-sm mb-4">{error}</div>
                    <button onClick={refresh} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm hover:opacity-90">
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const s = summary

    // Get max tokens for bar chart
    const opEntries = Object.entries(s?.breakdown_by_operation ?? {})
    const maxOpTokens = Math.max(...opEntries.map(([, v]) => v.total_tokens), 1)

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">

                {/* ── Summary Cards ────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Cost"
                        value={fmt$(s?.total_cost ?? 0)}
                        sub={`${s?.total_queries ?? 0} queries`}
                        accent
                    />
                    <StatCard
                        label="Total Tokens"
                        value={fmtTokens(s?.total_tokens ?? 0)}
                        sub={`${fmtTokens(s?.total_prompt_tokens ?? 0)} in / ${fmtTokens(s?.total_completion_tokens ?? 0)} out`}
                    />
                    <StatCard
                        label="Avg Cost / Query"
                        value={fmt$(s?.avg_cost_per_query ?? 0)}
                    />
                    <StatCard
                        label="Avg Tokens / Query"
                        value={fmtTokens(s?.avg_tokens_per_query ?? 0)}
                    />
                </div>

                {/* ── Daily Cost Chart ─────────────────────────────── */}
                <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5">
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">Daily Cost (Last 30 days)</h3>
                    <DailyCostChart data={s?.daily_costs ?? {}} />
                </div>

                {/* ── Operation Token Bars ─────────────────────────── */}
                <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5">
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">Tokens by Operation</h3>
                    <div className="space-y-2.5">
                        {opEntries
                            .sort(([, a], [, b]) => b.total_tokens - a.total_tokens)
                            .map(([op, data]) => (
                                <BarSegment
                                    key={op}
                                    label={opLabel(op)}
                                    value={data.total_tokens}
                                    max={maxOpTokens}
                                    color={opColor(op)}
                                />
                            ))
                        }
                    </div>
                </div>

                {/* ── Breakdown Tables ─────────────────────────────── */}
                <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Cost Breakdown</h3>
                        <div className="ml-auto flex rounded-lg overflow-hidden border border-[var(--border-primary)]">
                            <button
                                onClick={() => setTab('operation')}
                                className={`px-3 py-1 text-[12px] font-medium transition-colors ${tab === 'operation' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                            >
                                By Operation
                            </button>
                            <button
                                onClick={() => setTab('model')}
                                className={`px-3 py-1 text-[12px] font-medium transition-colors ${tab === 'model' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                            >
                                By Model
                            </button>
                        </div>
                    </div>
                    {tab === 'operation'
                        ? <BreakdownTable data={s?.breakdown_by_operation ?? {}} keyLabel="Operation" />
                        : <BreakdownTable data={s?.breakdown_by_model ?? {}} keyLabel="Model" />
                    }
                </div>

                {/* ── Query History ────────────────────────────────── */}
                <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5">
                    <div className="flex items-center mb-4">
                        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Query Cost History</h3>
                        <button onClick={refresh} className="ml-auto text-[12px] text-[var(--accent)] hover:underline">
                            Refresh
                        </button>
                    </div>
                    {history.length === 0 ? (
                        <div className="text-[var(--text-tertiary)] text-sm py-8 text-center">No queries recorded yet. Ask a question to start tracking costs.</div>
                    ) : (
                        <div className="rounded-xl overflow-hidden border border-[var(--border-secondary)]">
                            {history.map((record) => (
                                <QueryRow
                                    key={record.id}
                                    record={record}
                                    expanded={expandedId === record.id}
                                    onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
