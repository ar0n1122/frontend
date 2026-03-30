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
        'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white hover:shadow-lg hover:shadow-[var(--accent)]/20 hover:-translate-y-px active:translate-y-0 active:shadow-md',
    secondary:
        'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-secondary)] hover:-translate-y-px',
    danger: 'bg-gradient-to-r from-[var(--danger)] to-[var(--danger-hover)] text-white hover:shadow-lg hover:shadow-[var(--danger)]/20',
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
                'inline-flex items-center rounded-[var(--radius-md)] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
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
