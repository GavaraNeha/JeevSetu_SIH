import { useState } from 'react';
import {
  Sprout, Stethoscope, ArrowRight, Globe, Loader2, ShieldCheck,
  Mail, Lock, Eye, EyeOff, Camera, MapPin, Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LANGUAGES } from '@/lib/i18n';
import type { Role, Language } from '@/types/db';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const { t, signIn, signUp, lang, setLang } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [role, setRole] = useState<Role>('farmer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [block, setBlock] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password, {
        full_name: fullName,
        phone,
        role,
        language: lang,
        village,
        block,
        district,
        state,
      });
      if (error) setError(error);
    }
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-white font-sans antialiased overflow-x-hidden">
      
      {/* ─── LEFT HERO SECTION (50% width on Desktop, Full height) ─── */}
      <div className="lg:w-1/2 relative overflow-hidden flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-[480px] lg:min-h-screen">
        {/* Farm Cattle Background Image (Covers entire section) */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage:
              'url(https://images.pexels.com/photos/30147594/pexels-photo-30147594.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1600)',
          }}
        />
        {/* Soft Golden Green Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#20361b]/92 via-[#31522a]/55 to-[#2a4524]/35 backdrop-brightness-[0.98]" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#547348] text-white flex items-center justify-center shadow-lg border border-white/20">
            <Sprout size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
              {t('appName')}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm font-medium tracking-wide mt-1">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Center Copy & Feature Bullets */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-xl">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[3rem] font-bold text-white leading-[1.15] tracking-tight drop-shadow-sm">
            Early detection <br className="hidden sm:inline" />
            saves herds.
          </h2>

          <p className="text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed font-normal max-w-lg">
            Report livestock symptoms from the field, get instant severity triage, and connect with veterinary officials before outbreaks spread.
          </p>

          {/* Feature Highlights */}
          <div className="space-y-3.5 pt-2">
            {[
              { icon: <Camera size={18} />, text: 'Photo-first animal profiles' },
              { icon: <Activity size={18} />, text: 'AI-assisted symptom triage' },
              { icon: <MapPin size={18} />, text: 'District-wide outbreak heatmap' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3.5 text-white/95 text-sm sm:text-base font-medium">
                <div className="w-9 h-9 rounded-full bg-[#a3be98]/40 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-sm flex-shrink-0">
                  {item.icon}
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Language Selector Pill */}
        <div className="relative z-10 pt-4">
          <div className="inline-flex items-center gap-1 bg-black/25 backdrop-blur-md rounded-full p-1.5 border border-white/20 shadow-inner">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/90 ml-1">
              <Globe size={16} />
            </div>
            {LANGUAGES.map((l) => {
              const isActive = lang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code as Language)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#20361b] shadow-md scale-100'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {l.native}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── RIGHT LOGIN SECTION (50% width on Desktop, Full height) ─── */}
      <div className="lg:w-1/2 relative bg-white p-6 sm:p-12 lg:p-16 flex items-center justify-center min-h-[550px] lg:min-h-screen">
        {/* Subtle Decorative Dot Pattern (Right Side Edge) */}
        <div
          className="absolute right-0 top-0 bottom-0 w-36 opacity-[0.14] pointer-events-none hidden sm:block"
          style={{
            backgroundImage: 'radial-gradient(#547348 1.5px, transparent 1.5px)',
            backgroundSize: '18px 18px',
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Top Shield/Lock Icon Badge */}
          <div className="w-16 h-16 rounded-full bg-[#f2f6f0] border border-[#dbe5d7] text-[#547348] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck size={32} className="stroke-[2]" />
          </div>

          {/* Header Text */}
          <div className="text-center mb-6">
            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#20361b] tracking-tight">
              {mode === 'signin' ? 'Welcome back' : t('signUp')}
            </h3>
            <p className="text-[#647c60] text-sm sm:text-base mt-1.5">
              {mode === 'signin' ? t('signInSubtitle') : t('signUpSubtitle')}
            </p>
          </div>

          {/* Role selector — only for signup */}
          {mode === 'signup' && (
            <div className="mb-6 animate-fade-in-up">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#34522d] mb-2">
                {t('selectRole')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <RoleCard
                  active={role === 'farmer'}
                  icon={<Sprout size={18} />}
                  title={t('farmer')}
                  onClick={() => setRole('farmer')}
                />
                <RoleCard
                  active={role === 'vet_official'}
                  icon={<Stethoscope size={18} />}
                  title={t('vetOfficial')}
                  onClick={() => setRole('vet_official')}
                />
                <RoleCard
                  active={role === 'district_official'}
                  icon={<ShieldCheck size={18} />}
                  title={t('districtOfficial')}
                  onClick={() => setRole('district_official')}
                />
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#2e4a27] mb-1.5">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 bg-[#f6f9f4] border border-[#dbe5d7] rounded-xl text-sm text-[#20361b] placeholder:text-[#8aa086] focus:outline-none focus:ring-2 focus:ring-[#547348]/40 focus:border-[#547348] transition-all"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-[#2e4a27] mb-1.5">
                {t('email')}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#789274]">
                  <Mail size={19} />
                </div>
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#f6f9f4] border border-[#dbe5d7] rounded-xl text-sm text-[#20361b] placeholder:text-[#8aa086] focus:outline-none focus:ring-2 focus:ring-[#547348]/40 focus:border-[#547348] transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="24B11AI120@adityauniversity.in"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-[#2e4a27] mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#789274]">
                  <Lock size={19} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-12 py-3.5 bg-[#f6f9f4] border border-[#dbe5d7] rounded-xl text-sm text-[#20361b] placeholder:text-[#8aa086] focus:outline-none focus:ring-2 focus:ring-[#547348]/40 focus:border-[#547348] transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#789274] hover:text-[#20361b] transition-colors"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Forgot Password link */}
            {mode === 'signin' && (
              <div className="text-right pt-0.5">
                <button
                  type="button"
                  onClick={() => setError('Password reset instructions sent to your email.')}
                  className="text-xs font-semibold text-[#547348] hover:text-[#20361b] hover:underline"
                >
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            {/* Additional Signup Fields */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#2e4a27] mb-1.5">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3.5 bg-[#f6f9f4] border border-[#dbe5d7] rounded-xl text-sm text-[#20361b] placeholder:text-[#8aa086] focus:outline-none focus:ring-2 focus:ring-[#547348]/40 focus:border-[#547348] transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#2e4a27] mb-1.5">
                      {t('village')}
                    </label>
                    <input
                      className="w-full px-4 py-3.5 bg-[#f6f9f4] border border-[#dbe5d7] rounded-xl text-sm text-[#20361b] placeholder:text-[#8aa086] focus:outline-none focus:ring-2 focus:ring-[#547348]/40 focus:border-[#547348] transition-all"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder={t('enterVillage')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2e4a27] mb-1.5">
                      {t('district')}
                    </label>
                    <input
                      className="w-full px-4 py-3.5 bg-[#f6f9f4] border border-[#dbe5d7] rounded-xl text-sm text-[#20361b] placeholder:text-[#8aa086] focus:outline-none focus:ring-2 focus:ring-[#547348]/40 focus:border-[#547348] transition-all"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder={t('enterDistrict')}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl p-3.5 text-center animate-slide-down">
                {error}
              </div>
            )}

            {/* Primary CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-[#547348] hover:bg-[#435d39] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group active:scale-[0.99] disabled:opacity-75 text-base"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? t('signIn') : t('signUp')}</span>
                  <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer Signin / Signup Switch */}
          <div className="mt-6 text-center text-xs sm:text-sm text-[#647c60]">
            <span>{mode === 'signin' ? t('noAccount') : t('haveAccount')}</span>{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="font-bold text-[#547348] hover:text-[#20361b] underline underline-offset-2 transition-colors ml-1"
            >
              {mode === 'signin' ? t('signUp') : t('signIn')}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function RoleCard({
  active,
  icon,
  title,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-center p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
        active
          ? 'border-[#547348] bg-[#f2f6f0] text-[#20361b] shadow-sm font-semibold'
          : 'border-[#dbe5d7] bg-white text-[#647c60] hover:border-[#547348]/50'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-[#547348] text-white' : 'bg-[#eaf0e8] text-[#547348]'}`}>
        {icon}
      </div>
      <span className="text-xs leading-tight font-medium">{title}</span>
    </button>
  );
}
