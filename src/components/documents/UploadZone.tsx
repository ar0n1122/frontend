import clsx from 'clsx'
import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import type {UploadingFile} from '@/hooks/useDocuments'

interface UploadZoneProps {
    onDrop: (files: File[]) => void
    uploads: UploadingFile[]
    onClear: () => void
    onCheckStatus?: (documentId: string) => void
}

export default function UploadZone({onDrop, uploads, onClear, onCheckStatus}: UploadZoneProps) {
    const handleDrop = useCallback(
        (accepted: File[]) => {
            if (accepted.length) onDrop(accepted)
        },
        [onDrop],
    )

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop: handleDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip'],
        },
        multiple: true,
    })

    return (
        <div className="flex flex-col gap-4">
            {/* Drop zone */}
            <div
                {...getRootProps()}
                className={clsx(
                    'upload-zone rounded-xl text-center p-10 cursor-pointer border-2 border-dashed',
                    isDragActive
                        ? 'active border-[var(--accent)] bg-[var(--accent-light)] scale-[1.01]'
                        : 'border-[var(--bg-upload-border)] bg-[var(--bg-upload)] hover:border-[var(--accent)]',
                )}
            >
                <input {...getInputProps()} />
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-2xl shadow-lg shadow-[var(--accent)]/20">
                    {isDragActive ? '⬇' : '↑'}
                </div>
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-1">
                    {isDragActive ? 'Drop your files here' : 'Drop PDF or ZIP files here'}
                </h3>
                <p className="text-[13px] text-[var(--text-tertiary)] mb-4">
                    or click to browse · max 10 files, 50 MB total · supports PDF and ZIP
                </p>
                <Button variant="primary" size="md" className="shadow-md" onClick={(e) => e.stopPropagation()}>
                    Choose Files
                </Button>
            </div>

            {/* Upload items */}
            {uploads.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
                            Uploads ({uploads.length})
                        </span>
                        <button
                            onClick={onClear}
                            className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Clear done
                        </button>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {uploads.map((u) => (
                            <UploadItem key={`${u.file.name}-${u.file.size}`} item={u} onCheckStatus={onCheckStatus} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function UploadItem({item, onCheckStatus}: {item: UploadingFile; onCheckStatus?: (documentId: string) => void}) {
    const fileSizeMB = (item.file.size / 1024 / 1024).toFixed(1)
    const isZip = item.file.name.toLowerCase().endsWith('.zip')
    const statusColors = {
        uploading: 'var(--accent)',
        processing: 'var(--warning)',
        done: 'var(--success)',
        error: 'var(--danger)',
    }

    return (
        <div className="flex items-center gap-3.5 px-4 py-3.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--border-secondary)] transition-all duration-200">
            <div className={clsx(
                'icon-container w-10 h-10',
                isZip ? 'accent' : item.status === 'done' ? 'success' : item.status === 'error' ? 'danger' : 'accent',
            )}>
                {isZip ? '⬒' : '⬡'}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                    {item.file.name}
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)] mb-1.5">
                    {fileSizeMB} MB ·{' '}
                    {item.status === 'uploading'
                        ? `Uploading ${item.progress}%`
                        : item.status === 'processing'
                            ? `Processing — ${item.progress}%`
                            : item.status === 'done'
                                ? 'Indexed successfully'
                                : item.error}
                </div>
                {item.status === 'uploading' && (
                    <ProgressBar value={item.progress} color={statusColors[item.status]} height={5} />
                )}
                {item.status === 'processing' && (
                    <ProgressBar value={item.progress} color={statusColors.processing} height={5} />
                )}
            </div>
            <span
                className="text-[12px] font-bold min-w-[36px] text-right flex items-center gap-1"
                style={{color: statusColors[item.status]}}
            >
                {item.status === 'uploading'
                    ? `${item.progress}%`
                    : item.status === 'processing'
                        ? (
                            <>
                                <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{borderColor: 'var(--warning)', borderTopColor: 'transparent'}} />
                                {item.documentId && onCheckStatus && (
                                    <button
                                        onClick={() => onCheckStatus(item.documentId!)}
                                        title="Check status"
                                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors text-[13px]"
                                    >
                                        ↻
                                    </button>
                                )}
                            </>
                        )
                        : item.status === 'done'
                            ? '✓'
                            : '✗'}
            </span>
        </div>
    )
}
