import clsx from 'clsx'

interface ProgressBarProps {
    value: number // 0–100
    color?: string // css color or var(...)
    height?: number
    className?: string
    showLabel?: boolean
}

export default function ProgressBar({
    value,
    color = 'var(--accent)',
    height = 8,
    className,
    showLabel = false,
}: ProgressBarProps) {
    const pct = Math.max(0, Math.min(100, value))
    const isAnimating = pct > 0 && pct < 100
    return (
        <div className={clsx('flex items-center gap-2', className)}>
            <div
                className="flex-1 rounded-full overflow-hidden"
                style={{height, background: 'var(--bg-progress)'}}
            >
                <div
                    className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{width: `${pct}%`, background: color, minWidth: pct > 0 ? 4 : 0}}
                >
                    {isAnimating && (
                        <div className="progress-shimmer absolute inset-0" />
                    )}
                </div>
            </div>
            {showLabel && (
                <span className="text-[12px] font-bold text-[var(--text-primary)] min-w-[36px] text-right">
                    {pct}%
                </span>
            )}
        </div>
    )
}
