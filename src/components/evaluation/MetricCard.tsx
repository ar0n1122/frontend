interface MetricCardProps {
    icon: string
    iconBg: string
    iconColor: string
    value: string | number
    label: string
    delta?: string
    deltaDir?: 'up' | 'down' | 'neutral'
}

export default function MetricCard({
    icon,
    iconBg,
    iconColor,
    value,
    label,
    delta,
    deltaDir = 'neutral',
}: MetricCardProps) {
    const deltaStyle =
        deltaDir === 'up'
            ? 'bg-[var(--success-bg)] text-[var(--text-success)]'
            : deltaDir === 'down'
                ? 'bg-[#fef2f2] text-[var(--text-error)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5 shadow-sm card-lift">
            <div
                className="icon-container w-[42px] h-[42px] rounded-xl mb-3.5"
                style={{background: `linear-gradient(135deg, ${iconBg}, transparent)`, color: iconColor, border: `1px solid ${iconColor}20`}}
            >
                {icon}
            </div>
            <div className="text-[28px] font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
                {value}
            </div>
            <div className="text-[13px] text-[var(--text-secondary)] font-medium mt-1">{label}</div>
            {delta && (
                <div
                    className={`inline-flex items-center gap-1 text-[12px] font-semibold mt-2.5 px-2.5 py-0.5 rounded-full ring-1 ring-current/10 ${deltaStyle}`}
                >
                    {delta}
                </div>
            )}
        </div>
    )
}
