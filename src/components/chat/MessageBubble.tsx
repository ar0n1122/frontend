import {useCallback, useState} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import clsx from 'clsx'
import type {ChatMessage} from '@/types'
import SourceCard from './SourceCard'
import Button from '@/components/ui/Button'

interface MessageBubbleProps {
    message: ChatMessage
    showRetry?: boolean
    onRetry?: (messageId: string) => void
}

export default function MessageBubble({message, showRetry, onRetry}: MessageBubbleProps) {
    const isUser = message.role === 'user'
    const [copied, setCopied] = useState(false)

    const handleCopy = useCallback(() => {
        void navigator.clipboard.writeText(message.content).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }, [message.content])

    const timeStr = message.timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div
            className={clsx(
                'group relative flex gap-3 max-w-[820px] animate-fade-in',
                isUser ? 'flex-row-reverse self-end' : ''
            )}
        >
            {/* Avatar */}
            <div
                className={clsx(
                    'w-[36px] h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[15px] font-semibold flex-shrink-0 shadow-sm',
                    isUser ? 'text-white' : 'text-[var(--accent)]',
                )}
                style={isUser ? {background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'} : {background: 'linear-gradient(135deg, var(--accent-light), transparent)', border: '1px solid rgba(59,130,246,0.15)'}}
            >
                {isUser ? 'U' : '⚡'}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1.5 min-w-0 relative">
                <div
                    className={clsx(
                        'px-4 py-3 rounded-2xl text-[14px] leading-[1.6] transition shadow-sm',
                        isUser
                            ? 'text-white rounded-br-[8px] shadow-md'
                            : message.isError
                                ? 'bg-red-50/70 text-[var(--text-primary)] border border-red-200'
                                : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-primary)]',
                    )}
                    style={isUser ? {background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'} : undefined}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    ) : (
                        <div className="prose-rag max-w-full">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Sources */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] px-1 flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                            Sources ({message.sources.length})
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {message.sources.map((src, idx) => (
                                <SourceCard key={idx} source={src} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions: copy / retry */}
                <div className="flex items-center justify-end gap-2 mt-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        title={copied ? 'Copied' : 'Copy message'}
                        aria-label={copied ? 'Copied' : 'Copy message'}
                        className={clsx('text-[var(--text-tertiary)] hover:text-[var(--accent)] text-[13px]', copied ? 'text-[var(--success)]' : '')}
                    >
                        {copied ? (
                            // simple checkmark icon
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            // simple copy icon (two rectangles)
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        )}
                    </Button>

                    {isUser && showRetry && onRetry && (
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => onRetry(message.id)}
                            title="Retry this message"
                            className="text-[var(--accent)]"
                        >
                            🔄
                        </Button>
                    )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)] px-1 flex-wrap">
                    <span className="text-[11px]">{timeStr}</span>

                    {message.latency && (
                        <>
                            <span className="text-[11px]">🕐 {message.latency.total_ms.toLocaleString()}ms</span>
                            <span className="hidden md:inline text-[11px]">
                                Dense: {message.latency.dense_ms}ms · Sparse: {message.latency.sparse_ms}ms ·
                                Rerank: {message.latency.rerank_ms}ms
                            </span>
                        </>
                    )}
                    {message.ragas && (
                        <span className="text-[11px]">📊 Faithfulness: {message.ragas.faithfulness.toFixed(2)}</span>
                    )}
                    {message.cost && (
                        <span className="text-[11px]" title={`${message.cost.total_tokens.toLocaleString()} tokens (${message.cost.event_count} LLM calls)`}>
                            💰 {message.cost.total_cost < 0.001 && message.cost.total_cost > 0
                                ? `$${message.cost.total_cost.toFixed(6)}`
                                : `$${message.cost.total_cost.toFixed(4)}`}
                            {' '}· {message.cost.total_tokens.toLocaleString()} tok
                        </span>
                    )}
                    {message.model && (
                        <span className="text-[11px] italic">{message.model}</span>
                    )}
                </div>

                {/* (Removed hover actions - actions row above is always visible) */}
            </div>
        </div>
    )
}
