import { Link } from 'react-router-dom';
import { Sparkles, Check, ArrowLeft } from 'lucide-react';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-lg tracking-tight">CareerPivot AI</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Upgrade your plan</h1>
          <p className="mt-2 text-gray-600">You've used all your free rewrites. Keep going.</p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
            <p className="text-sm font-medium text-indigo-100">Pro</p>
            <p className="mt-2 text-4xl font-bold">$19<span className="text-lg font-normal text-indigo-200">/mo</span></p>
            <p className="mt-2 text-sm text-indigo-100">Unlimited resume rewrites</p>
          </div>
          <div className="p-8">
            <ul className="space-y-3">
              {[
                'Unlimited AI resume rewrites',
                'Unlimited target roles & industries',
                'Job description tailoring',
                'ATS keyword optimization',
                'Export to PDF & DOCX',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-indigo-600" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <button className="mt-8 w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm">
              Upgrade to Pro
            </button>
            <p className="mt-4 text-center text-xs text-gray-400">Billing details coming soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
