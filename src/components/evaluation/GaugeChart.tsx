interface GaugeChartProps {
    value: number // 0–1
    label: string
    color: string
    size?: number
}

export default function GaugeChart({value, label, color, size = 110}: GaugeChartProps) {
    const pct = Math.max(0, Math.min(1, value))
    const deg = pct * 360

    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className="rounded-full flex items-center justify-center"
                style={{
                    width: size,
                    height: size,
                    background: `conic-gradient(${color} 0deg, ${color} ${deg}deg, var(--chart-bar-bg) ${deg}deg)`,
                }}
            >
                <div
                    className="rounded-full flex flex-col items-center justify-center"
                    style={{
                        width: size * 0.73,
                        height: size * 0.73,
                        background: 'var(--bg-card)',
                    }}
                >
                    <span
                        className="font-extrabold text-[var(--text-primary)]"
                        style={{fontSize: size * 0.2}}
                    >
                        {pct.toFixed(2)}
                    </span>
                    <span
                        className="text-[var(--text-tertiary)] font-semibold uppercase tracking-wide"
                        style={{fontSize: size * 0.09}}
                    >
                        {label}
                    </span>
                </div>
            </div>
        </div>
    )
}
