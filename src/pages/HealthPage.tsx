import Button from '@/components/ui/Button'
import {Card, CardBody, CardHeader} from '@/components/ui/Card'
import HealthBadge from '@/components/ui/HealthBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import ServiceCard from '@/components/health/ServiceCard'
import {useHealth} from '@/hooks/useHealth'
import type {ServiceStatus} from '@/types'

const LATENCY_BARS: {label: string; key: 'dense_ms' | 'sparse_ms' | 'fusion_ms' | 'rerank_ms' | 'llm_ms'; color: string}[] = [
    {label: 'Dense Search (Qdrant)', key: 'dense_ms', color: '#3b82f6'},
    {label: 'Sparse Search (Elasticsearch)', key: 'sparse_ms', color: '#8b5cf6'},
    {label: 'RRF Fusion', key: 'fusion_ms', color: '#06b6d4'},
    {label: 'Reranking (Cross-Encoder)', key: 'rerank_ms', color: '#f59e0b'},
    {label: 'LLM Generation', key: 'llm_ms', color: '#10b981'},
]

const PLACEHOLDER_SERVICES = ['FastAPI', 'Qdrant', 'Elasticsearch', 'Ollama', 'Prometheus', 'Grafana']

function formatTs(ts: string | undefined) {
    if (!ts) return 'Never'
    try {
        return new Date(ts).toLocaleTimeString()
    } catch {
        return ts
    }
}

export default function HealthPage() {
    const {data: health, isLoading, isError, refetch, isFetching} = useHealth()

    const services = health?.services ?? []
    const healthyCount = services.filter((s) => s.status === 'healthy').length
    const overallStatus: ServiceStatus = isLoading
        ? 'unknown'
        : isError
            ? 'unhealthy'
            : (health?.overall ?? 'unknown') as ServiceStatus

    const pipeline = health?.pipeline
    const totalLatency = pipeline
        ? pipeline.dense_ms + pipeline.sparse_ms + pipeline.fusion_ms + pipeline.rerank_ms + pipeline.llm_ms
        : 0

    return (
        <div className="h-full overflow-y-auto px-6 py-6 space-y-5">
            {/* Overall status banner */}
            <Card className="overflow-visible">
                <CardBody>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div
                                className="icon-container w-16 h-16 rounded-2xl text-2xl flex-shrink-0 shadow-sm"
                                style={{
                                    background:
                                        overallStatus === 'healthy'
                                            ? 'linear-gradient(135deg, var(--success-bg), transparent)'
                                            : overallStatus === 'degraded'
                                                ? 'linear-gradient(135deg, var(--warning-bg), transparent)'
                                                : 'linear-gradient(135deg, #fef2f2, transparent)',
                                    color:
                                        overallStatus === 'healthy'
                                            ? 'var(--success)'
                                            : overallStatus === 'degraded'
                                                ? 'var(--warning)'
                                                : 'var(--danger)',
                                    border: '1px solid',
                                    borderColor:
                                        overallStatus === 'healthy'
                                            ? 'rgba(34,197,94,0.15)'
                                            : overallStatus === 'degraded'
                                                ? 'rgba(245,158,11,0.15)'
                                                : 'rgba(239,68,68,0.15)',
                                }}
                            >
                                {overallStatus === 'healthy' ? '✓' : overallStatus === 'degraded' ? '!' : '✗'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">System</h3>
                                    <HealthBadge status={overallStatus as any} />
                                </div>
                                <p className="text-[14px] text-[var(--text-secondary)]">
                                    {isLoading
                                        ? 'Checking services...'
                                        : isError
                                            ? 'Could not reach backend'
                                            : `${healthyCount} of ${services.length} services healthy`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                                    Last Check
                                </div>
                                <div className="text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
                                    {formatTs(health?.checked_at)}
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                loading={isFetching}
                                onClick={() => refetch(true)}
                            >
                                ↻ Refresh
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Service grid */}
            <div>
                <h4 className="text-[13px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-0.5">
                    Service Status
                </h4>
                {isLoading ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                        {PLACEHOLDER_SERVICES.map((name) => (
                            <div
                                key={name}
                                className="h-[200px] rounded-xl skeleton-shimmer"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                        {services.length === 0
                            ? PLACEHOLDER_SERVICES.map((name) => (
                                <ServiceCard
                                    key={name}
                                    service={{name, url: '', status: 'unknown', latency_ms: 0, uptime_s: 0, extra: {}}}
                                />
                            ))
                            : services.map((svc) => (
                                <ServiceCard
                                    key={svc.name}
                                    service={svc}
                                />
                            ))}
                    </div>
                )}
            </div>

            {/* Pipeline latency */}
            <Card>
                <CardHeader
                    title="Pipeline Latency Breakdown"
                    action={
                        <span className="text-[13px] font-bold text-[var(--accent)]">
                            ∑ {totalLatency > 0 ? `${totalLatency}ms` : '—'}
                        </span>
                    }
                />
                <CardBody>
                    <div className="space-y-4">
                        {LATENCY_BARS.map((bar) => {
                            const ms: number = pipeline?.[bar.key] ?? 0
                            const pct = totalLatency > 0 ? (ms / totalLatency) * 100 : 0
                            return (
                                <div key={bar.key}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
                                            {bar.label}
                                        </span>
                                        <span className="text-[13px] font-bold text-[var(--text-primary)]">
                                            {ms > 0 ? `${ms}ms` : '—'}
                                        </span>
                                    </div>
                                    <ProgressBar value={pct} color={bar.color} height={8} />
                                </div>
                            )
                        })}
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}
