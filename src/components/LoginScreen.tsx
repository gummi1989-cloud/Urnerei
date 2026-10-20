import React, { useState } from 'react';
import { useAuth, DEFAULT_PLATFORM_PASSWORD } from '../context/AuthContext';
import { Lock, KeyRound, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, isDefaultPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password.trim()) {
      setErrorMessage('Bitte geben Sie das Passwort ein.');
      return;
    }

    setIsSubmitting(true);
    const success = login(password);
    if (!success) {
      setIsSubmitting(false);
      setErrorMessage('Das eingegebene Passwort ist nicht korrekt.');
    }
  };

  const handleUseDefault = () => {
    setPassword(DEFAULT_PLATFORM_PASSWORD);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50/70 via-slate-50 to-pink-50/60 font-sans text-stone-900 selection:bg-pink-100 selection:text-pink-900 relative overflow-hidden">
      {/* Decorative ambient blurred blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-100/80 overflow-hidden relative z-10 transition-all">
        {/* Top Header Strip with friendly blue-to-pink gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 text-white p-7 pb-6 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto mb-3.5 shadow-sm text-white">
            <KeyRound className="w-7 h-7" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 border border-white/30 text-white/95 backdrop-blur-xs mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-200" />
            <span>Geschützter Zugriff</span>
          </span>

          <h1 className="text-xl font-extrabold tracking-tight text-white">
            Urnerei Brühlgut
          </h1>
          <p className="text-xs text-blue-100 mt-1 font-medium">
            Digitale Produktionsplanung &amp; Jahresübersicht
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password-input"
                  className="text-xs font-bold text-stone-800 tracking-wide"
                >
                  Passwort
                </label>
                {isDefaultPassword && (
                  <button
                    type="button"
                    onClick={handleUseDefault}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer transition-colors"
                  >
                    Standard ausfüllen ({DEFAULT_PLATFORM_PASSWORD})
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoFocus
                  placeholder="Passwort eingeben..."
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-stone-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
                  tabIndex={-1}
                  title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-stone-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-stone-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Angemeldet bleiben</span>
              </label>

              {isDefaultPassword && (
                <span className="text-[11px] text-stone-400 font-mono">
                  Initial: bruehlgut
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 hover:from-blue-700 hover:via-indigo-700 hover:to-pink-600 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Anmelden &amp; Planer öffnen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Manufaktur Winterthur</span>
            </span>
            <span>CH-8400</span>
          </div>
        </div>
      </div>
    </div>
  );
};
