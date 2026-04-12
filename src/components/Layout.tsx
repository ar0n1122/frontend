import clsx from 'clsx'
import {useState, useEffect} from 'react'
import {NavLink, Outlet, useLocation} from 'react-router-dom'
import ThemeSwitcher from '@/components/ui/ThemeSwitcher'
import HealthBadge from '@/components/ui/HealthBadge'
import {useHealth} from '@/hooks/useHealth'
import {useDocuments} from '@/hooks/useDocuments'
import {useAuth} from '@/context/AuthContext'

interface NavItemDef {
    to: string
    icon: string
    label: string
    badge?: (docCount: number) => string | undefined
}

const NAV_MAIN: NavItemDef[] = [
    {to: '/chat', icon: '💬', label: 'Chat'},
    {
        to: '/documents',
        icon: '📄',
        label: 'Documents',
        badge: (n) => (n > 0 ? String(n) : undefined),
    },
]

const NAV_ANALYTICS: NavItemDef[] = [
    {to: '/evaluation', icon: '📊', label: 'Evaluation'},
    {to: '/usage', icon: '💰', label: 'Usage & Costs'},
    {to: '/health', icon: '🏥', label: 'Health'},
]

const NAV_SETTINGS: NavItemDef[] = [
    {to: '/settings', icon: '⚙️', label: 'Settings'},
]

const PAGE_META: Record<string, {title: string; subtitle: string}> = {
    '/chat': {title: 'Chat', subtitle: 'Ask questions about your documents'},
    '/documents': {title: 'Documents', subtitle: 'Upload and manage your PDF documents'},
    '/evaluation': {title: 'Evaluation', subtitle: 'Benchmark metrics and quality analysis'},
    '/health': {title: 'System Health', subtitle: 'Service status and pipeline monitoring'},
    '/usage': {title: 'Usage & Costs', subtitle: 'Token consumption, cost breakdown and analytics'},
    '/settings': {title: 'Settings', subtitle: 'Configuration and preferences'},
}

export default function Layout() {
    const location = useLocation()
    const pageMeta = PAGE_META[location.pathname] ?? {title: 'RAG Platform', subtitle: ''}
    const {user, signOut} = useAuth()
    const {data: health} = useHealth()
    const {data: docs} = useDocuments()
    const docCount = docs?.length ?? 0
    const overallStatus = health?.overall ?? 'unknown'
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
        localStorage.getItem('sidebar_collapsed') === 'true',
    )

    useEffect(() => {
        try {
            localStorage.setItem('sidebar_collapsed', sidebarCollapsed ? 'true' : 'false')
        } catch {}
    }, [sidebarCollapsed])

    return (
        <div className="flex h-screen overflow-hidden">
            {/* ===== SIDEBAR ===== */}
            <aside
                className={clsx(
                    'flex flex-col z-50 transition-all duration-300',
                    sidebarCollapsed ? 'w-0 min-w-0 overflow-hidden' : 'w-[260px] min-w-[260px]',
                )}
                style={{background: 'var(--bg-sidebar)'}}
            >
                {/* Logo */}
                <div
                    className="px-5 pt-5 pb-4"
                    style={{borderBottom: '1px solid var(--border-secondary)'}}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg" style={{background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'}}>
                            ⚡
                        </div>
                        <div>
                            <div className="text-[#f8fafc] text-[16px] font-bold tracking-tight">RAG Platform</div>
                            <div className="text-[11px] font-medium uppercase tracking-widest" style={{background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                                Enterprise AI
                            </div>
                        </div>
                    </div>
                </div>

                {/* when collapsed, show floating expand pill */}
                {/* floating pill removed; controlled by header hamburger */}

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-2.5 py-3">
                    <NavSection label="Main">
                        {NAV_MAIN.map((item) => (
                            <SidebarItem
                                key={item.to}
                                item={item}
                                badge={item.badge?.(docCount)}
                            />
                        ))}
                    </NavSection>

                    <NavSection label="Analytics">
                        {NAV_ANALYTICS.map((item) => (
                            <SidebarItem key={item.to} item={item} />
                        ))}
                    </NavSection>

                    <NavSection label="Settings">
                        {NAV_SETTINGS.map((item) => (
                            <SidebarItem key={item.to} item={item} />
                        ))}
                    </NavSection>
                </nav>

                {/* Footer */}
                <div
                    className="px-4 py-3.5"
                    style={{borderTop: '1px solid var(--border-secondary)'}}
                >
                    {user && (
                        <div className="flex items-center gap-3 px-3.5 py-2.5 mb-1">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt=""
                                    className="h-7 w-7 rounded-full ring-2 ring-white/10"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'}}>
                                    {user.display_name?.[0] ?? user.email[0]}
                                </span>
                            )}
                            <span className="flex-1 truncate text-[13px] text-[var(--text-sidebar)]">
                                {user.display_name || user.email}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[var(--text-sidebar)] text-[14px] font-medium transition-all duration-150 hover:bg-[var(--bg-sidebar-hover)] hover:text-slate-200 w-full"
                    >
                        <span className="text-lg w-[22px] text-center">↗</span>
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>

            {/* ===== MAIN ===== */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-secondary)]">
                {/* Header */}
                <header
                    className="h-[60px] min-h-[60px] flex items-center justify-between px-6 z-40"
                    style={{
                        background: 'var(--bg-primary)',
                        borderBottom: '1px solid var(--border-primary)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div className="flex items-center gap-4">
                        <button
                            title="Toggle sidebar"
                            onClick={() => setSidebarCollapsed((s) => !s)}
                            className="ml-0 w-10 h-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center text-[18px] shadow-sm hover:shadow-md hover:border-[var(--accent)]/30 transition-all duration-200"
                        >
                            ☰
                        </button>
                        <div>
                            <h1 className="text-[18px] font-bold text-[var(--text-primary)] tracking-tight">{pageMeta.title}</h1>
                            <p className="text-[12px] text-[var(--text-tertiary)]">{pageMeta.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <HealthBadge status={overallStatus} />
                        <ThemeSwitcher />
                    </div>
                </header>

                {/* Page outlet */}
                <div className="flex-1 overflow-hidden">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

/* ---- Sub-components ---- */
function NavSection({label, children}: {label: string; children: React.ReactNode}) {
    return (
        <div className="mb-1">
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-tertiary)] px-3 py-4 pb-1.5">
                {label}
            </div>
            {children}
        </div>
    )
}

function SidebarItem({item, badge}: {item: NavItemDef; badge?: string}) {
    return (
        <NavLink
            to={item.to}
            className={({isActive}) =>
                clsx(
                    'nav-active-indicator flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 mb-0.5 w-full',
                    isActive
                        ? 'active bg-[var(--bg-sidebar-active)] text-white font-semibold shadow-sm'
                        : 'text-[var(--text-sidebar)] hover:bg-[var(--bg-sidebar-hover)] hover:text-slate-200',
                )
            }
        >
            <span className="text-[18px] w-[22px] text-center flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {badge && (
                <span className="ml-auto text-inherit text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{background: 'var(--bg-sidebar-active)'}}>
                    {badge}
                </span>
            )}
        </NavLink>
    )
}
