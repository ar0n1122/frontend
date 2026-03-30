import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import type {DocumentItem} from '@/types'

interface DocumentCardProps {
    doc: DocumentItem
    onDelete: (id: string) => void
    onReindex: (id: string) => void
}

const STATUS_BADGE: Record<
    DocumentItem['status'],
    {variant: 'green' | 'yellow' | 'red' | 'gray'; label: string; dot: boolean}
> = {
    indexed: {variant: 'green', label: 'Indexed', dot: true},
    processing: {variant: 'yellow', label: 'Processing', dot: true},
    uploaded: {variant: 'yellow', label: 'Processing', dot: true},
    queued: {variant: 'gray', label: 'Queued', dot: false},
    failed: {variant: 'red', label: 'Failed', dot: true},
}

function fmtDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function fmtMB(bytes: number) {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

export default function DocumentCard({doc, onDelete, onReindex}: DocumentCardProps) {
    const {variant, label, dot} = STATUS_BADGE[doc.status]
    const iconClass = doc.status === 'indexed' ? 'success'
        : doc.status === 'failed' ? 'danger'
            : doc.status === 'processing' || doc.status === 'uploaded' ? 'warning'
                : 'accent'

    return (
        <div className="card-lift flex flex-col gap-3 p-[18px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-sm hover:shadow-md hover:border-[var(--border-secondary)] animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className={`icon-container ${iconClass} w-[42px] h-[42px]`}>
                    ⬡
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-[var(--text-primary)] truncate leading-tight">
                        {doc.title}
                    </div>
                    <div className="text-[12px] text-[var(--text-tertiary)] truncate">{doc.filename}</div>
                </div>
                <Badge variant={variant} dot={dot} className="flex-shrink-0">
                    {label}
                </Badge>
            </div>

            {/* Stats */}
            {doc.status === 'indexed' ? (
                <div className="grid grid-cols-3 gap-2">
                    {[
                        ['Pages', doc.pages.toLocaleString()],
                        ['Chunks', doc.chunks.toLocaleString()],
                        ['Images', doc.images.toLocaleString()],
                    ].map(([lbl, val]) => (
                        <div
                            key={lbl}
                            className="stat-chip text-center py-2.5 px-2 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
                        >
                            <div className="text-[16px] font-extrabold text-[var(--accent)] leading-tight">
                                {val}
                            </div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)] mt-0.5">
                                {lbl}
                            </div>
                        </div>
                    ))}
                </div>
            ) : doc.status === 'failed' ? (
                <button
                    onClick={() => onReindex(doc.id)}
                    className="w-full py-2.5 px-3 rounded-[var(--radius-md)] bg-[var(--danger)]/8 border border-[var(--danger)]/20 text-[var(--danger)] text-[13px] font-semibold hover:bg-[var(--danger)]/15 transition-all duration-200 flex items-center justify-center gap-2"
                >
                    ↻ Retry Ingestion
                </button>
            ) : (doc.status === 'processing' || doc.status === 'uploaded') && doc.progress !== undefined ? (
                <div className="flex flex-col gap-1">
                    <ProgressBar value={doc.progress} color="var(--warning)" height={6} showLabel />
                    {doc.processing_stage && (
                        <span className="text-[11px] text-[var(--text-tertiary)] capitalize">
                            {doc.processing_stage === 'complete' ? 'Finishing up…' : doc.processing_stage + '…'}
                        </span>
                    )}
                </div>
            ) : null}

            {/* Footer */}
            <div
                className="flex items-center justify-between pt-2.5"
                style={{borderTop: '1px solid var(--border-primary)'}}
            >
                <div className="text-[11px] text-[var(--text-tertiary)]">
                    {doc.indexed_at ? (
                        <>
                            Indexed {fmtDate(doc.indexed_at)}
                            {doc.processing_duration_s && ` · ${doc.processing_duration_s.toFixed(1)}s`}
                        </>
                    ) : (
                        fmtMB(doc.size_bytes)
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => onReindex(doc.id)}
                        disabled={doc.status === 'processing'}
                        title="Re-index"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-[14px]"
                    >
                        ↻
                    </button>
                    <button
                        onClick={() => onDelete(doc.id)}
                        title="Delete"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--danger)]/8 hover:text-[var(--danger)] transition-all duration-200 text-[14px]"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    )
}
