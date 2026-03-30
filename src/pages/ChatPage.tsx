import {useCallback, useRef, useState} from 'react'
import MessageBubble from '@/components/chat/MessageBubble'
import TypingIndicator from '@/components/chat/TypingIndicator'
import {useChat} from '@/hooks/useChat'
import {useDocuments} from '@/hooks/useDocuments'
import type {ChatSessionSummary} from '@/types'

const SUGGESTIONS = [
    'What was TCS total revenue in FY2024?',
    'Compare Infosys and TCS profit margins',
    'Show key revenue growth highlights',
    'What are the main risk factors?',
]

export default function ChatPage() {
    const {
        messages,
        sessions,
        sessionsLoading,
        activeSessionId,
        sendMessage,
        clearMessages,
        selectSession,
        newSession,
        deleteSession,
        retryMessage,
        isLoading,
        documentIds,
        setDocumentIds,
    } = useChat({
        top_k: 5,
        modalities: ['text', 'image', 'table'],
        include_ragas: false,
        llm_provider: 'ollama',
    })
    const {data: docs, isLoading: docsLoading} = useDocuments()
    const hasIndexedDocs = !!(docs && docs.some((d) => d.status === 'indexed'))
    const [inputValue, setInputValue] = useState('')
    const [attachedIds, setAttachedIds] = useState<string[] | undefined>(undefined)
    const [isDragActive, setIsDragActive] = useState(false)
    const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
    const [isDocsCollapsed, setIsDocsCollapsed] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = useCallback(async () => {
        const q = inputValue.trim()
        if (!q || isLoading) return
        setInputValue('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
        // Build metadata from the currently visible indexed docs for the selected / attached IDs
        const effectiveIds = attachedIds ?? documentIds
        const metadata = effectiveIds?.length
            ? indexedDocs
                .filter((d: any) => effectiveIds.includes(d.id))
                .map((d: any) => ({id: d.id, title: d.title || d.name || d.filename || d.id, filename: d.filename, status: d.status}))
            : undefined
        await sendMessage(q, {document_ids: effectiveIds, document_metadata: metadata})
        setAttachedIds(undefined)
        endRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [inputValue, isLoading, sendMessage, attachedIds, documentIds])

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void handleSend()
        }
    }

    const handleTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value)
        // clear attachments and sidebar selection when user starts typing
        if ((attachedIds && attachedIds.length > 0) || (documentIds && documentIds.length > 0)) {
            setAttachedIds(undefined)
            setDocumentIds?.([])
        }
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
    }

    const onDocDragStart = (e: React.DragEvent, docId: string) => {
        // If multiple docs are selected, drag those; otherwise drag this one
        const payload = (documentIds && documentIds.length > 0 && documentIds.includes(docId)) ? documentIds : [docId]
        e.dataTransfer.setData('application/json', JSON.stringify({ids: payload}))
        e.dataTransfer.effectAllowed = 'copy'
    }

    const onDropToInput = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(false)
        try {
            const raw = e.dataTransfer.getData('application/json')
            if (!raw) return
            const parsed = JSON.parse(raw)
            const ids: string[] = parsed?.ids || []
            if (ids.length > 0) {
                setAttachedIds((prev) => {
                    const set = new Set(prev || [])
                    ids.forEach((id) => set.add(id))
                    return Array.from(set)
                })
            }
        } catch {
            // ignore
        }
    }

    const onDragOverInput = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
    }

    const onDragEnterInput = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(true)
    }

    const onDragLeaveInput = (e: React.DragEvent) => {
        // when the pointer leaves the area, turn highlight off
        setIsDragActive(false)
    }

    const indexedDocs = (docs || []).filter((d: any) => d.status === 'indexed')

    const toggleDoc = (id: string) => {
        const set = new Set(documentIds || [])
        if (set.has(id)) set.delete(id)
        else set.add(id)
        const arr = Array.from(set)
        setDocumentIds?.(arr)
        setAttachedIds(arr.length > 0 ? arr : undefined)
    }

    const allSelected = indexedDocs.length > 0 && (documentIds || []).length === indexedDocs.length
    const toggleSelectAll = () => {
        if (allSelected) {
            setDocumentIds?.([])
            setAttachedIds(undefined)
        } else {
            const ids = indexedDocs.map((d: any) => d.id)
            setDocumentIds?.(ids)
            setAttachedIds(ids)
        }
    }

    return (
        <div className="flex h-full overflow-hidden" style={{background: 'linear-gradient(180deg, rgba(250,251,253,0.02), rgba(245,246,248,0.02))'}}>
            {/* ===== Chat History Sidebar ===== */}
            {isHistoryCollapsed ? (
                /* collapsed — zero width, only floating balloon arrow visible */
                <aside className="relative w-0 flex-shrink-0 overflow-visible z-20">
                    <button
                        onClick={() => setIsHistoryCollapsed(false)}
                        style={{left: 0, top: '50%', transform: 'translateY(-50%)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderLeft: 'none'}}
                        className="absolute flex items-center justify-center w-8 h-16 rounded-r-2xl text-[32px] leading-none text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-all shadow-md"
                        title="Expand history"
                    >
                        ›
                    </button>
                </aside>
            ) : (
                <aside className="w-[240px] min-w-[240px] flex flex-col border-r transition-all duration-200 relative overflow-visible bg-[var(--bg-secondary)] border-[var(--border-primary)] shadow-sm">
                    {/* floating collapse balloon on right edge */}
                    <button
                        onClick={() => setIsHistoryCollapsed(true)}
                        style={{right: 0, top: '50%', transform: 'translate(100%, -50%)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderLeft: 'none'}}
                        className="absolute z-20 flex items-center justify-center w-8 h-16 rounded-r-2xl text-[32px] leading-none text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-all shadow-md"
                        title="Collapse history"
                    >
                        ‹
                    </button>
                    <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                        <span className="text-[12px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                            Chat History
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => void newSession()}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[16px] transition-all duration-200 hover:shadow-sm" style={{background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))', color: 'white'}}
                                title="New chat"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Disclaimer banner below settings/header */}
                    <div className="px-3 pb-2">
                        <div className="text-[11px] rounded-xl p-2.5 border shadow-sm flex items-start gap-2" style={{color: 'var(--text-warning)', background: 'var(--warning-bg)', borderColor: 'rgba(245,158,11,0.2)'}}>
                            <span className="icon-container w-5 h-5 rounded-md text-[10px] flex-shrink-0 warning" style={{minWidth: '20px'}}>!</span>
                            <span>We are disregarding the image processing for simplicity, cost reduction</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-1">
                        {sessionsLoading ? (
                            <div className="text-[12px] text-[var(--text-tertiary)] px-2 py-4 text-center">Loading…</div>
                        ) : sessions.length === 0 ? (
                            <div className="text-[12px] text-[var(--text-tertiary)] px-2 py-4 text-center">
                                No chats yet. Start a conversation!
                            </div>
                        ) : (
                            sessions.map((s) => (
                                <ChatHistoryItem
                                    key={s.id}
                                    session={s}
                                    isActive={s.id === activeSessionId}
                                    onSelect={() => void selectSession(s.id)}
                                    onDelete={() => void deleteSession(s.id)}
                                />
                            ))
                        )}
                    </div>

                    <div className="px-3 py-2 text-[10px] text-[var(--text-tertiary)] text-center tracking-wide" style={{borderTop: '1px solid var(--border-primary)'}}>
                        Max 5 sessions saved
                    </div>
                </aside>
            )}

            {/* ===== Chat Main ===== */}
            <div className={`flex-1 flex flex-col min-w-0 ${isHistoryCollapsed ? 'pl-3' : ''}`}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
                    <div className="mx-auto w-full max-w-[1100px] rounded-2xl p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-md">
                        {/* If there are no indexed documents for the user, prompt to upload */}
                        {!docsLoading && !hasIndexedDocs ? (
                            <div className="text-center py-15 flex flex-col items-center gap-5 my-auto">
                                <div className="w-[70px] h-[70px] rounded-[var(--radius-xl)] bg-[var(--accent-light)] flex items-center justify-center text-[32px]">
                                    📁
                                </div>
                                <div>
                                    <h2 className="text-[22px] font-extrabold text-[var(--text-primary)] mb-2">
                                        Upload a document to chat
                                    </h2>
                                    <p className="text-[14px] text-[var(--text-secondary)] max-w-[450px]">
                                        Upload and index a document first — once processed you'll be able to ask questions about it here.
                                    </p>
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-15 flex flex-col items-center gap-5 my-auto">
                                <div className="w-[70px] h-[70px] rounded-[var(--radius-xl)] bg-[var(--accent-light)] flex items-center justify-center text-[32px]">
                                    🔍
                                </div>
                                <div>
                                    <h2 className="text-[22px] font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                                        Ask anything about your documents
                                    </h2>
                                    <p className="text-[14px] text-[var(--text-secondary)] max-w-[450px]">
                                        Hybrid search(dense + sparse) retrieval, cross-encoder reranking.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center mt-2">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {setInputValue(s); textareaRef.current?.focus()}}
                                            className="px-4 py-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] text-[13px] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] hover:-translate-y-px hover:shadow-sm"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, idx) => {
                                    // Show retry on user messages whose next message is an error (or absent)
                                    const next = messages[idx + 1]
                                    const needsRetry =
                                        msg.role === 'user' &&
                                        (!next || next.isError)
                                    return (
                                        <MessageBubble
                                            key={msg.id}
                                            message={msg}
                                            showRetry={needsRetry && !isLoading}
                                            onRetry={retryMessage}
                                        />
                                    )
                                })}
                                {isLoading && <TypingIndicator />}
                            </>
                        )}
                        <div ref={endRef} />
                    </div>
                </div>

                {/* Input area */}
                <div
                    className="px-6 pt-4 pb-5"
                    style={{background: 'var(--bg-primary)', borderTop: '1px solid var(--border-primary)'}}
                >
                    {messages.length > 0 && (
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={clearMessages}
                                className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors flex items-center gap-1.5"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                                Clear chat
                            </button>
                        </div>
                    )}
                    <div
                        className={`flex items-start gap-2.5 rounded-2xl px-4 py-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-[var(--accent-light)] focus-within:border-[var(--border-focus)] ${isDragActive ? 'ring-2 ring-[var(--accent)] bg-[var(--accent-light)] scale-[1.01]' : ''}`}
                        style={{background: 'var(--bg-input)', border: '1.5px solid var(--border-primary)'}}
                        onDragOver={onDragOverInput}
                        onDragEnter={onDragEnterInput}
                        onDragLeave={onDragLeaveInput}
                        onDrop={onDropToInput}
                    >
                        <div className="flex flex-col gap-2 flex-1">
                            {attachedIds && attachedIds.length > 0 && (
                                <div className="flex gap-2 items-center flex-wrap max-h-20 overflow-auto py-1">
                                    {attachedIds.map((id) => {
                                        const doc = (docs || []).find((d: any) => d.id === id)
                                        return (
                                            <div key={id} className="px-2 py-1 bg-[var(--bg-secondary)] rounded-full text-[13px] flex items-center gap-2">
                                                <span className="max-w-[160px] truncate">{doc?.title || doc?.id || id}</span>
                                                <button className="text-[12px] text-[var(--danger)]" onClick={() => setAttachedIds(prev => prev ? prev.filter(a => a !== id) : prev)}>×</button>
                                            </div>
                                        )
                                    })}
                                    <button className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)]" onClick={() => setAttachedIds(undefined)}>Clear</button>
                                </div>
                            )}
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={inputValue}
                                onChange={handleTextarea}
                                onKeyDown={handleKey}
                                placeholder={docsLoading ? 'Checking documents...' : !hasIndexedDocs ? 'Upload a document to chat' : 'Ask a question about your documents...'}
                                disabled={!hasIndexedDocs && !docsLoading}
                                className="flex-1 bg-transparent border-none text-[var(--text-primary)] text-[14px] py-2 resize-none max-h-[120px] leading-6 placeholder:text-[var(--text-tertiary)] focus:outline-none"
                                style={{minHeight: 40}}
                            />
                        </div>
                        <button
                            onClick={() => void handleSend()}
                            disabled={!hasIndexedDocs || !inputValue.trim() || isLoading}
                            className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-[18px] flex-shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'}}
                        >
                            {isLoading ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                '➤'
                            )}
                        </button>
                    </div>
                    <p className="text-[11px] text-[var(--text-tertiary)] text-center mt-2">
                        {docsLoading ? 'Checking documents...' : !hasIndexedDocs ? 'Upload a document to chat' : 'Enter to send · Shift+Enter for new line'}
                    </p>
                </div>
            </div>

            {/* ===== Recently Indexed Documents (Right Sidebar) ===== */}
            {isDocsCollapsed ? (
                /* collapsed — zero width, only floating balloon arrow visible */
                <aside className="relative w-0 flex-shrink-0 overflow-visible z-20">
                    <button
                        onClick={() => setIsDocsCollapsed(false)}
                        style={{left: 0, top: '50%', transform: 'translate(-100%, -50%)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRight: 'none'}}
                        className="absolute flex items-center justify-center w-8 h-16 rounded-l-2xl text-[32px] leading-none text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-all shadow-md"
                        title="Expand documents"
                    >
                        ‹
                    </button>
                </aside>
            ) : (
                <aside className="w-[260px] min-w-[220px] flex flex-col px-3 py-3 transition-all duration-200 relative overflow-visible bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] shadow-sm">
                    {/* floating collapse balloon on left edge */}
                    <button
                        onClick={() => setIsDocsCollapsed(true)}
                        style={{left: 0, top: '50%', transform: 'translate(-100%, -50%)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRight: 'none'}}
                        className="absolute z-20 flex items-center justify-center w-8 h-16 rounded-l-2xl text-[32px] leading-none text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-all shadow-md"
                        title="Collapse documents"
                    >
                        ›
                    </button>
                    <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="text-[12px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Documents</div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleSelectAll}
                                className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                            >
                                {allSelected ? 'Deselect all' : 'Select all'}
                            </button>
                            <button
                                onClick={() => {
                                    setDocumentIds?.([])
                                    setAttachedIds(undefined)
                                }}
                                className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Disclaimer banner under Documents header */}
                    <div className="px-1 pb-3">
                        <div className="text-[11px] rounded-xl p-2.5 border shadow-sm flex items-start gap-2" style={{color: 'var(--text-warning)', background: 'var(--warning-bg)', borderColor: 'rgba(245,158,11,0.2)'}}>
                            <span className="icon-container w-5 h-5 rounded-md text-[10px] flex-shrink-0 warning" style={{minWidth: '20px'}}>!</span>
                            <span>We are disregarding the image processing for simplicity, cost reduction</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                        {docsLoading ? (
                            <div className="text-[12px] text-[var(--text-tertiary)] px-2 py-4 text-center">Loading…</div>
                        ) : indexedDocs.length === 0 ? (
                            <div className="text-[12px] text-[var(--text-tertiary)] px-2 py-4 text-center">No indexed documents</div>
                        ) : (
                            indexedDocs.map((d: any) => {
                                const selected = (documentIds || []).includes(d.id)
                                return (
                                    <div
                                        key={d.id}
                                        draggable
                                        onDragStart={(e) => onDocDragStart(e, d.id)}
                                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-200 ${selected ? 'bg-[var(--accent-light)] border border-[var(--accent)] shadow-sm' : 'hover:bg-[var(--bg-secondary)] border border-transparent'}`}
                                        onClick={() => toggleDoc(d.id)}
                                    >
                                        <div className="w-5 text-center text-[14px] font-medium text-[var(--accent)]">
                                            {selected ? '✓' : ''}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{d.title || d.name || d.filename || d.id}</div>
                                            <div className="text-[11px] text-[var(--text-tertiary)]">{d.source || d.processing_stage || ''}</div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </aside>
            )}
        </div>
    )
}

/* ---- Chat History Item ---- */
function ChatHistoryItem({
    session,
    isActive,
    onSelect,
    onDelete,
}: {
    session: ChatSessionSummary
    isActive: boolean
    onSelect: () => void
    onDelete: () => void
}) {
    return (
        <div
            onClick={onSelect}
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${isActive
                ? 'bg-[var(--accent-light)] border border-[var(--accent)] shadow-sm'
                : 'hover:bg-[var(--bg-secondary)] border border-transparent hover:-translate-y-px'
                }`}
        >
            <div className={`icon-container w-7 h-7 rounded-lg text-[12px] ${isActive ? 'accent' : ''}`} style={isActive ? {} : {background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)'}}>
                💬
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                    {session.title || 'Untitled'}
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)]">
                    {session.message_count} message{session.message_count !== 1 ? 's' : ''}
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                }}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-[14px] text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[#fef2f2] transition-all flex-shrink-0"
                title="Delete chat"
            >
                ×
            </button>
        </div>
    )
}
