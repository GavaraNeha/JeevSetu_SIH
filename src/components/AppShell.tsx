import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Heart,
  ClipboardPlus,
  AlertCircle,
  Map,
  Stethoscope,
  LogOut,
  Sprout,
  Menu,
  X,
  Languages,
  ShieldCheck,
  WifiOff,
  CloudUpload,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOfflineQueue } from '@/lib/offlineQueue';
import { LANGUAGES } from '@/lib/i18n';
import type { Language } from '@/types/db';

export type PageId =
  | 'dashboard'
  | 'animals'
  | 'report'
  | 'advisories'
  | 'cases'
  | 'map'
  | 'surveillance'
  | 'broadcast'
  | 'profile';

interface NavItem {
  id: PageId;
  label: string;
  icon: ReactNode;
}

export function AppShell({
  current,
  onNavigate,
  children,
}: {
  current: PageId;
  onNavigate: (id: PageId) => void;
  children: ReactNode;
}) {
  const { profile, t, signOut, lang, setLang } = useAuth();
  const { online, pendingCount, syncing } = useOfflineQueue();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const role = profile?.role;
  const isVet = role === 'vet_official';
  const isDistrict = role === 'district_official';

  const navItems: NavItem[] = isDistrict
    ? [
        { id: 'dashboard', label: t('surveillance'), icon: <LayoutDashboard size={20} /> },
        { id: 'map', label: t('riskMap'), icon: <Map size={20} /> },
        { id: 'broadcast', label: t('broadcastAdvisory'), icon: <AlertCircle size={20} /> },
        { id: 'advisories', label: t('advisories'), icon: <ShieldCheck size={20} /> },
      ]
    : isVet
    ? [
        { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard size={20} /> },
        { id: 'cases', label: t('cases'), icon: <Stethoscope size={20} /> },
        { id: 'map', label: t('riskMap'), icon: <Map size={20} /> },
        { id: 'advisories', label: t('advisories'), icon: <AlertCircle size={20} /> },
      ]
    : [
        { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard size={20} /> },
        { id: 'animals', label: t('myAnimals'), icon: <Heart size={20} /> },
        { id: 'report', label: t('reportSymptom'), icon: <ClipboardPlus size={20} /> },
        { id: 'advisories', label: t('advisories'), icon: <AlertCircle size={20} /> },
        { id: 'map', label: t('riskMap'), icon: <Map size={20} /> },
      ];

  const handleNav = (id: PageId) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-clay-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-ink-100 fixed h-screen">
        <div className="p-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Sprout className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-ink-900">{t('appName')}</h1>
              <p className="text-ink-400 text-xs">{t('tagline')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={current === item.id}
              onClick={() => handleNav(item.id)}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-ink-100">
          {/* Language selector */}
          <div className="relative mb-2">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-ink-600 hover:bg-ink-50 transition-colors"
            >
              <Languages size={18} />
              {LANGUAGES.find((l) => l.code === lang)?.native}
            </button>
            {langOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-card border border-ink-100 overflow-hidden animate-slide-down">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code as Language);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-ink-50 ${lang === l.code ? 'text-brand-600 font-semibold' : 'text-ink-700'}`}
                  >
                    {l.native}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-3 py-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${isDistrict ? 'bg-brand-700' : isVet ? 'bg-clay-500' : 'bg-brand-500'}`}>
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-800 truncate">{profile?.full_name}</p>
              <p className="text-xs text-ink-400 truncate">
                {isDistrict ? t('districtOfficial') : isVet ? t('vetOfficial') : t('farmer')}
              </p>
            </div>
            <button onClick={signOut} className="btn-ghost p-1.5">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-ink-100">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Sprout className="text-white" size={18} />
            </div>
            <span className="font-display font-bold text-ink-900">{t('appName')}</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl animate-slide-in-right flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-ink-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <Sprout className="text-white" size={18} />
                </div>
                <span className="font-display font-bold text-ink-900">{t('appName')}</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="btn-ghost p-1.5">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={current === item.id}
                  onClick={() => handleNav(item.id)}
                />
              ))}
            </nav>
            <div className="p-3 border-t border-ink-100 space-y-2">
              <div className="flex gap-1.5">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code as Language)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${lang === l.code ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}
                  >
                    {l.native}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${isDistrict ? 'bg-brand-700' : isVet ? 'bg-clay-500' : 'bg-brand-500'}`}>
                  {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-800 truncate">{profile?.full_name}</p>
                  <p className="text-xs text-ink-400">{isDistrict ? t('districtOfficial') : isVet ? t('vetOfficial') : t('farmer')}</p>
                </div>
                <button onClick={signOut} className="btn-ghost p-1.5">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        {/* Offline indicator bar */}
        {(!online || pendingCount > 0) && (
          <div className={`px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-slide-down ${
            !online ? 'bg-clay-100 text-clay-700' : syncing ? 'bg-blue-50 text-blue-700' : 'bg-brand-50 text-brand-700'
          }`}>
            {!online ? (
              <><WifiOff size={16} /> {pendingCount > 0 ? `${pendingCount} ${t('queuedReports')} · ${t('willSyncOnline')}` : t('offlineMode')}</>
            ) : syncing ? (
              <><CloudUpload size={16} className="animate-pulse" /> {t('syncing')} {pendingCount} {t('queuedReports')}</>
            ) : (
              <><CloudUpload size={16} /> {t('syncComplete')} · {pendingCount} {t('pendingSync')}</>
            )}
          </div>
        )}
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in" key={current}>
          {children}
        </div>
      </main>
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
      }`}
    >
      <span className={active ? 'text-brand-600' : 'text-ink-400'}>{item.icon}</span>
      {item.label}
    </button>
  );
}
