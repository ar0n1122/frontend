interface BarChartProps {
    data: {label: string; value: number; color: string}[]
    height?: number
}

export default function BarChart({data, height = 120}: BarChartProps) {
    const max = Math.max(...data.map((d) => d.value), 0.01)

    return (
        <div className="flex items-flex-end gap-2" style={{height}}>
            {data.map((item) => {
                const pct = (item.value / max) * 100
                return (
                    <div
                        key={item.label}
                        className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                    >
                        <span className="text-[11px] text-[var(--text-secondary)] font-bold">
                            {typeof item.value === 'number' && item.value < 1
                                ? item.value.toFixed(2)
                                : item.value}
                        </span>
                        <div
                            className="w-full max-w-[36px] rounded-t-md rounded-b-sm transition-all duration-500"
                            style={{
                                height: `${pct}%`,
                                background: item.color,
                                minHeight: 4,
                            }}
                        />
                        <span className="text-[10px] text-[var(--text-tertiary)] font-semibold text-center leading-tight">
                            {item.label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
