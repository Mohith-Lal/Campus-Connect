import { Menu, Moon, Search, Sun } from 'lucide-react'

/**
 * Sticky app header: mobile nav trigger, breadcrumb, contextual search,
 * and dark-mode toggle.
 */
export function TopBar({
  activePage,
  onOpenSidebar,
  searchTerm,
  onSearchChange,
  onOpenCommand,
  darkMode,
  onToggleDark,
  session,
}) {
  const isGuest = session?.role === 'guest'

  return (
    <header className="glass sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-[var(--border-subtle)] px-4 sm:px-7 lg:px-10">
      <button
        aria-label="Open navigation menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 lg:hidden"
        onClick={onOpenSidebar}
        type="button"
      >
        <Menu size={18} />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="hidden items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex">
          <span>Campus Connect</span>
          <span aria-hidden="true">/</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {isGuest ? 'Campus Map & Navigation' : activePage}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          {!isGuest && (
            <>
              {activePage === 'Dashboard' ? (
                <label className="relative block w-48 sm:w-72">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    aria-label="Filter dashboard content"
                    className="h-9 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-muted)] pl-9 pr-14 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:text-slate-100"
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Filter events, notices..."
                    type="search"
                    value={searchTerm}
                  />
                  <button
                    className="kbd absolute right-2 top-1/2 hidden -translate-y-1/2 sm:block"
                    onClick={onOpenCommand}
                    type="button"
                  >
                    ⌘K
                  </button>
                </label>
              ) : (
                <button className="btn btn-ghost h-9 px-3" onClick={onOpenCommand} type="button">
                  <Search size={14} />
                  <span className="hidden sm:inline">Quick Jump</span>
                  <kbd className="kbd">⌘K</kbd>
                </button>
              )}
            </>
          )}

          <button
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:text-sun-300"
            onClick={onToggleDark}
            type="button"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
