export default function TypingIndicator() {
    return (
        <div className="flex gap-3 max-w-[780px] animate-fade-in">
            <div className="w-[34px] h-[34px] min-w-[34px] rounded-xl flex items-center justify-center text-[15px] text-[var(--accent)]" style={{background: 'linear-gradient(135deg, var(--accent-light), transparent)', border: '1px solid rgba(59,130,246,0.15)'}}>
                ⚡
            </div>
            <div className="bg-[var(--bg-bot-msg)] border border-[var(--border-primary)] rounded-2xl rounded-bl-[4px] px-4 py-3 shadow-sm">
                <div className="flex gap-1 py-1">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]"
                            style={{
                                animation: 'typing 1.4s infinite',
                                animationDelay: `${i * 0.2}s`,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
