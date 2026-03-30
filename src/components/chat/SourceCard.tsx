import type {SourceChunk} from '@/types'

interface SourceCardProps {
    source: SourceChunk
}

const MODALITY_ICON: Record<string, string> = {
    text: '📄',
    image: '🖼️',
    table: '📊',
}

export default function SourceCard({source}: SourceCardProps) {
    return (
        <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] cursor-pointer transition-all duration-200 max-w-[260px] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] hover:-translate-y-px bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm"
            title={source.text_preview}
        >
            <span className="icon-container w-7 h-7 rounded-lg text-[14px] flex-shrink-0 accent">
                {MODALITY_ICON[source.modality] ?? '📄'}
            </span>
            <div className="min-w-0">
                <div className="font-semibold text-[var(--text-primary)] truncate">
                    {source.document_title}
                </div>
                <div className="text-[var(--text-tertiary)] text-[11px] truncate">
                    Page {source.page} · {source.section}
                </div>
            </div>
            <span className="font-bold text-[var(--text-success)] ml-auto flex-shrink-0">
                {source.score.toFixed(2)}
            </span>
        </div>
    )
}
