import ProgressBar from '@/components/ui/ProgressBar'
import type {ServiceHealth} from '@/types'

interface ServiceCardProps {
    service: ServiceHealth
}

function fmtUptime(s: number): string {
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

const STATUS_ICON: Record<string, string> = {
    fastapi: '⚡',
    qdrant: '🧠',
    elasticsearch: '🔎',
    ollama: '🤖',
    prometheus: '📡',
    grafana: '📊',
}

export default function ServiceCard({service}: ServiceCardProps) {
    const isHealthy = service.status === 'healthy'
    const icon =
        STATUS_ICON[service.name.toLowerCase()] ??
        STATUS_ICON[Object.keys(STATUS_ICON).find((k) => service.name.toLowerCase().includes(k)) ?? ''] ??
        '🔧'

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5 shadow-sm card-lift">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-bold text-[var(--text-primary)] flex items-center gap-2.5">
                    <span className="icon-container w-8 h-8 rounded-lg text-[16px]" style={{background: 'linear-gradient(135deg, var(--accent-light), transparent)', color: 'var(--accent)', border: '1px solid var(--accent)', borderColor: 'rgba(59,130,246,0.15)'}}>
                        {icon}
                    </span>
                    {service.name}
                </span>
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ring-1 ${isHealthy
                        ? 'bg-[var(--success-bg)] text-[var(--text-success)] ring-[var(--success)]/15'
                        : service.status === 'degraded'
                            ? 'bg-[var(--warning-bg)] text-[var(--text-warning)] ring-[var(--warning)]/15'
                            : 'bg-[#fef2f2] text-[var(--text-error)] ring-[var(--danger)]/15'
                        }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full bg-current ${isHealthy ? 'animate-[pulse-dot_2s_infinite]' : ''}`} />
                    {isHealthy ? 'Healthy' : service.status === 'degraded' ? 'Degraded' : 'Unhealthy'}
                </span>
            </div>

            {/* Details */}
            <div className="flex flex-col divide-y divide-[var(--border-primary)]">
                <ServiceRow label="URL" value={service.url} />
                {service.uptime_s > 0 && <ServiceRow label="Uptime" value={fmtUptime(service.uptime_s)} />}
                <ServiceRow
                    label="Latency"
                    value={`${service.latency_ms}ms`}
                    valueClass={service.latency_ms < 50 ? 'text-[var(--text-success)]' : undefined}
                />
                {service.version && <ServiceRow label="Version" value={service.version} />}
                {Object.entries(service.extra).map(([k, v]) => (
                    <ServiceRow key={k} label={k} value={String(v)} />
                ))}
            </div>

            {/* Latency bar */}
            {service.latency_ms > 0 && (
                <div className="mt-3">
                    <ProgressBar
                        value={Math.min((service.latency_ms / 500) * 100, 100)}
                        color={service.latency_ms < 100 ? 'var(--success)' : service.latency_ms < 300 ? 'var(--warning)' : 'var(--danger)'}
                        height={4}
                    />
                </div>
            )}
        </div>
    )
}

function ServiceRow({
    label,
    value,
    valueClass,
}: {
    label: string
    value: string
    valueClass?: string
}) {
    return (
        <div className="flex justify-between py-2 text-[13px]">
            <span className="text-[var(--text-secondary)]">{label}</span>
            <span className={`font-semibold text-[var(--text-primary)] ${valueClass ?? ''}`}>{value}</span>
        </div>
    )
}
