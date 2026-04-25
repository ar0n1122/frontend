import clsx from 'clsx'

interface CardProps {
    children: React.ReactNode
    className?: string
    hover?: boolean
}

interface CardHeaderProps {
    title: React.ReactNode
    action?: React.ReactNode
    className?: string
}

interface CardBodyProps {
    children: React.ReactNode
    className?: string
    noPadding?: boolean
}

export function Card({children, className, hover = false}: CardProps) {
    return (
        <div
            className={clsx(
                'rounded-none transition-all duration-200',
                'bg-[var(--bg-card)] border-2 border-[var(--border-primary)]',
                hover && 'card-lift hover:border-[var(--border-strong)]',
                className,
            )}
        >
            {children}
        </div>
    )
}

export function CardHeader({title, action, className}: CardHeaderProps) {
    return (
        <div
            className={clsx(
                'flex items-center justify-between px-5 py-[18px] border-b border-[var(--border-primary)]',
                className,
            )}
        >
            <span className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight">{title}</span>
            {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
    )
}

export function CardBody({children, className, noPadding = false}: CardBodyProps) {
    return (
        <div className={clsx(!noPadding && 'p-5', className)}>{children}</div>
    )
}
