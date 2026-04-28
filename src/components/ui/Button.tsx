import clsx from 'clsx'
import type {ButtonHTMLAttributes} from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    loading?: boolean
}

const variantStyles: Record<Variant, string> = {
    primary:
        'bg-[var(--text-primary)] text-[var(--text-on-primary)] border-2 border-[var(--text-primary)] hover:bg-[var(--accent)] hover:border-[var(--accent)]',
    secondary:
        'bg-transparent text-[var(--text-primary)] border-2 border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-on-primary)]',
    danger: 'bg-[var(--danger)] text-[var(--text-on-primary)] border-2 border-[var(--danger)] hover:bg-[var(--danger-hover)] hover:border-[var(--danger-hover)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
}

const sizeStyles: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-[13px] gap-2',
    lg: 'px-6 py-3 text-[15px] gap-2',
    icon: 'w-9 h-9 p-0 flex items-center justify-center text-[18px]',
}

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    className,
    children,
    disabled,
    ...rest
}: ButtonProps) {
    return (
        <button
            className={clsx(
                'inline-flex items-center rounded-none font-semibold uppercase tracking-[0.06em] transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed',
                variantStyles[variant],
                sizeStyles[size],
                className,
            )}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? (
                <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {children}
                </>
            ) : (
                children
            )}
        </button>
    )
}
