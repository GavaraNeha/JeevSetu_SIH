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
  const { t, signIn, signUp, signInWithGoogle, lang, setLang } = useAuth();

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      setError(error);
    }
  };
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

          {/* Divider "or" */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e3ebe0]" />
            </div>
            <span className="relative bg-white px-3 text-xs text-[#7d9679] font-medium uppercase tracking-wider">
              {t('or')}
            </span>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-4 bg-white border border-[#dbe5d7] hover:border-[#547348] hover:bg-[#f6f9f4] text-[#2c4725] font-medium text-sm sm:text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t('continueWithGoogle')}</span>
          </button>

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
