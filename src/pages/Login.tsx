import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Mail, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    if (!sent) {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      setLoading(false);
      if (otpError) setError(otpError.message);
      else setSent(true);
      return;
    }
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setLoading(false);
    if (verifyError) setError(verifyError.message);
    else navigate(from, { replace: true });
  };

  return <OtpPage title="Welcome back" subtitle={sent ? `Enter the code sent to ${email}` : 'We’ll email you a one-time code'} email={email} setEmail={setEmail} code={code} setCode={setCode} sent={sent} error={error} loading={loading} submit={submit} button={sent ? 'Verify code' : 'Send sign-in code'} footer={<>Don&apos;t have an account? <Link to="/signup" className="font-medium text-indigo-600">Sign up</Link></>} />;
}

function OtpPage({ title, subtitle, email, setEmail, code, setCode, sent, error, loading, submit, button, footer }: any) {
  return <div className="min-h-screen bg-white flex flex-col"><header className="px-6 h-16 flex items-center"><Link to="/" className="flex items-center gap-2"><span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Sparkles className="h-5 w-5 text-white" /></span><span className="font-semibold text-gray-900 text-lg">CareerPivot AI</span></Link></header><main className="flex-1 flex items-center justify-center px-6 py-12"><div className="w-full max-w-md"><div className="text-center mb-8"><h1 className="text-3xl font-bold text-gray-900">{title}</h1><p className="mt-2 text-gray-600">{subtitle}</p></div><form onSubmit={submit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="email" required disabled={sent} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none disabled:bg-gray-50" /></div></div>{sent && <div><label className="block text-sm font-medium text-gray-700 mb-1.5">One-time code</label><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoFocus required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none tracking-[0.4em] text-center" /></div>}{error && <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100"><AlertCircle className="h-4 w-4 text-red-500 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}<button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{button}</button>{sent && <button type="button" onClick={() => window.location.reload()} className="w-full text-sm text-indigo-600">Use a different email</button>}</form><p className="mt-6 text-center text-sm text-gray-600">{footer}</p></div></main></div>;
}
