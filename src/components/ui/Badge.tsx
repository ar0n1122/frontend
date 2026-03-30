import clsx from 'clsx'

type Variant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'

interface BadgeProps {
    variant?: Variant
    children: React.ReactNode
    className?: string
    dot?: boolean
}

const variantStyles: Record<Variant, string> = {
    blue: 'bg-[var(--accent-light)] text-[var(--accent)] ring-1 ring-[var(--accent)]/15',
    green: 'bg-[var(--success-bg)] text-[var(--text-success)] ring-1 ring-[var(--success)]/15',
    yellow: 'bg-[var(--warning-bg)] text-[var(--text-warning)] ring-1 ring-[var(--warning)]/15',
    red: 'bg-[var(--danger)]/8 text-[var(--text-error)] ring-1 ring-[var(--danger)]/15',
    purple: 'bg-[var(--accent-secondary)]/8 text-[var(--accent-secondary)] ring-1 ring-[var(--accent-secondary)]/15',
    gray: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] ring-1 ring-[var(--text-tertiary)]/15',
}

export default function Badge({variant = 'blue', children, className, dot}: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide',
                variantStyles[variant],
                className,
            )}
        >
            {dot && (
                <span
                    className="w-1.5 h-1.5 rounded-full animate-[pulse-dot_2s_infinite]"
                    style={{background: 'currentColor'}}
                />
            )}
            {children}
        </span>
    )
}
