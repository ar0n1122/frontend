import clsx from 'clsx'
import type {ServiceStatus} from '@/types'

interface HealthBadgeProps {
    status: ServiceStatus
    label?: string
    className?: string
}

const MAP: Record<ServiceStatus, {dot: string; bg: string; text: string; label: string}> = {
    healthy: {
        dot: 'bg-[var(--success)]',
        bg: 'bg-[var(--success-bg)]',
        text: 'text-[var(--text-success)]',
        label: 'All Systems Operational',
    },
    degraded: {
        dot: 'bg-[var(--warning)]',
        bg: 'bg-[var(--warning-bg)]',
        text: 'text-[var(--text-warning)]',
        label: 'Degraded Performance',
    },
    unhealthy: {
        dot: 'bg-[var(--danger)]',
        bg: 'bg-[#fef2f2]',
        text: 'text-[var(--text-error)]',
        label: 'Service Outage',
    },
    unknown: {
        dot: 'bg-[var(--text-tertiary)]',
        bg: 'bg-[var(--bg-tertiary)]',
        text: 'text-[var(--text-secondary)]',
        label: 'Checking...',
    },
}

export default function HealthBadge({status, label, className}: HealthBadgeProps) {
    const s = MAP[status]
    return (
        <div
            className={clsx(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-wide',
                'ring-1 shadow-sm',
                s.bg,
                s.text,
                status === 'healthy'
                    ? 'ring-[var(--success)]/20'
                    : status === 'degraded'
                        ? 'ring-[var(--warning)]/20'
                        : status === 'unhealthy'
                            ? 'ring-[var(--danger)]/20'
                            : 'ring-[var(--border-primary)]',
                className,
            )}
        >
            <span
                className={clsx(
                    'w-2 h-2 rounded-full',
                    s.dot,
                    status === 'healthy' && 'animate-[pulse-dot_2s_infinite]',
                )}
            />
            {label ?? s.label}
        </div>
    )
}
