import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, FileText, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Landing() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-lg tracking-tight">CareerPivot AI</span>
          </Link>
          <div className="flex items-center gap-4">
            {session ? (
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
          <Zap className="h-3.5 w-3.5 text-indigo-600" />
          <span className="text-xs font-medium text-indigo-700">AI-powered resume rewrites</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight max-w-3xl mx-auto">
          Reframe your experience for the{' '}
          <span className="text-indigo-600">career you want</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          CareerPivot AI rewrites your resume to highlight transferable skills and align with the
          roles you're targeting — so you can switch careers with confidence, not guesswork.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to={session ? '/dashboard' : '/signup'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-white text-gray-700 font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: FileText,
              title: 'Paste your resume',
              desc: "Drop in your current resume and tell us the role you're targeting. No formatting headaches.",
            },
            {
              icon: Sparkles,
              title: 'AI reframes it',
              desc: 'We rewrite bullet points to emphasize transferable skills and the language your target industry uses.',
            },
            {
              icon: TrendingUp,
              title: 'Apply with confidence',
              desc: 'Get a tailored resume that passes ATS filters and tells a coherent career-change story.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 py-14 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Ready to make the pivot?
          </h2>
          <p className="mt-3 text-indigo-100 max-w-xl mx-auto">
            Join thousands of career switchers who've landed roles they love.
          </p>
          <Link
            to={session ? '/dashboard' : '/signup'}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-600 font-medium hover:bg-indigo-50 transition-all shadow-lg"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">CareerPivot AI</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 CareerPivot AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
