import {useEffect, useState} from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import DocumentCard from '@/components/documents/DocumentCard'
import UploadZone from '@/components/documents/UploadZone'
import {useDeleteDocument, useDocuments, useReindexDocument, useUploadDocument} from '@/hooks/useDocuments'

export default function DocumentsPage() {
    const {data: docs, isLoading, isError, refetch, isFetching} = useDocuments()
    const {mutate: deleteDoc} = useDeleteDocument()
    const {mutate: reindexDoc} = useReindexDocument()
    const forceRefetch = () => refetch(true)
    const {uploads, upload, clearDone, checkStatus} = useUploadDocument(forceRefetch)
    const [search, setSearch] = useState('')

    const pendingDocs = (docs ?? []).filter((d) => d.status === 'processing' || d.status === 'uploaded' || d.status === 'queued')
    const indexedDocs = (docs ?? []).filter((d) => d.status === 'indexed' || d.status === 'failed')

    // Auto-refresh every 5 min while there are pending documents
    useEffect(() => {
        if (pendingDocs.length === 0) return
        const id = setInterval(() => refetch(true), 300_000)
        return () => clearInterval(id)
    }, [pendingDocs.length, refetch])

    const filteredIndexed = indexedDocs.filter(
        (d) =>
            d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.filename.toLowerCase().includes(search.toLowerCase()),
    )
    const filteredPending = pendingDocs.filter(
        (d) =>
            d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.filename.toLowerCase().includes(search.toLowerCase()),
    )

    const renderGrid = (items: typeof docs) =>
        items && items.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                {items.map((doc) => (
                    <DocumentCard
                        key={doc.id}
                        doc={doc}
                        onDelete={(id) => {
                            if (confirm(`Delete "${doc.title}"?`)) deleteDoc(id, {onSuccess: forceRefetch})
                        }}
                        onReindex={(id) => reindexDoc(id, {onSuccess: forceRefetch})}
                    />
                ))}
            </div>
        ) : null

    return (
        <div className="h-full overflow-y-auto px-6 py-6">
            {/* Upload */}
            <UploadZone onDrop={upload} uploads={uploads} onClear={clearDone} onCheckStatus={checkStatus} />

            {/* Header with refresh */}
            <div className="flex items-center justify-between mt-7 mb-4 flex-wrap gap-3">
                <h3 className="text-[16px] font-bold text-[var(--text-primary)]">
                    Documents
                </h3>
                <div className="flex gap-2 items-center">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-[13px] pointer-events-none">⌕</span>
                        <input
                            className="pl-8 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] text-[13px] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent)]/15 w-[240px] transition-all"
                            placeholder="Search documents..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" size="sm" onClick={forceRefetch} disabled={isFetching}>
                        {isFetching ? 'Refreshing...' : '↻ Refresh'}
                    </Button>
                </div>
            </div>

            {/* Disclaimer banner under header */}
            <div className="px-0 mb-4">
                <div className="text-[12px] rounded-lg px-3.5 py-2.5 border border-[var(--warning)]/20 bg-[var(--warning-bg)] text-[var(--text-warning)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--warning)]/15 flex items-center justify-center text-[11px] flex-shrink-0">!</span>
                    Image processing (image text, image infographics) is disregarded for simplicity and cost reduction.
                </div>
            </div>

            {/* Loading skeletons */}
            {isLoading ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-[200px] rounded-xl animate-pulse" style={{background: 'var(--bg-skeleton)'}} />
                    ))}
                </div>
            ) : isError ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--danger)]/8 flex items-center justify-center text-[var(--danger)] text-2xl">⚠</div>
                    <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-2">Could not load documents</h3>
                    <p className="text-[14px] text-[var(--text-secondary)]">
                        Make sure the backend API is running on{' '}
                        <code className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-xs font-mono">localhost:8000</code>
                    </p>
                </div>
            ) : (
                <>
                    {/* Pending / Processing section */}
                    {filteredPending.length > 0 && (
                        <section className="mb-8">
                            <div className="flex items-center gap-2 mb-3">
                                <h4 className="text-[14px] font-semibold text-[var(--text-secondary)]">Uploaded & Processing</h4>
                                <Badge variant="yellow">{filteredPending.length}</Badge>
                            </div>
                            {renderGrid(filteredPending)}
                        </section>
                    )}

                    {/* Indexed / Failed section */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-[14px] font-semibold text-[var(--text-secondary)]">Indexed Documents</h4>
                            <Badge variant="blue">{filteredIndexed.length}</Badge>
                        </div>
                        {filteredIndexed.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] text-2xl">⬡</div>
                                <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-2">
                                    {indexedDocs.length === 0 ? 'No indexed documents yet' : 'No results found'}
                                </h3>
                                <p className="text-[14px] text-[var(--text-secondary)]">
                                    {indexedDocs.length === 0
                                        ? 'Upload a PDF above — it will appear here once indexed.'
                                        : `No documents match "${search}".`}
                                </p>
                            </div>
                        ) : (
                            renderGrid(filteredIndexed)
                        )}
                    </section>
                </>
            )}
        </div>
    )
}
