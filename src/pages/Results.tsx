import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RewriteRow {
  id: string;
  target_job_title: string;
  target_industry: string | null;
  rewritten_bullets: { original: string; rewritten: string; note: string }[];
  transferable_skills: string[];
  keywords_matched: string[];
  keywords_missing: string[];
  ats_score: number;
  cover_letter: string;
  created_at: string;
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const [rewrite, setRewrite] = useState<RewriteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('rewrites')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        setError('Could not load this rewrite. It may not exist or belong to another account.');
      } else {
        setRewrite(data as RewriteRow);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const copyCoverLetter = async () => {
    if (!rewrite) return;
    await navigator.clipboard.writeText(rewrite.cover_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-indigo-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading your results…</span>
        </div>
      </div>
    );
  }

  if (error || !rewrite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <p className="text-gray-700 mb-4">{error}</p>
          <Link to="/dashboard" className="text-indigo-600 font-medium hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const scoreColor =
    rewrite.ats_score >= 75 ? 'text-green-600' : rewrite.ats_score >= 50 ? 'text-amber-500' : 'text-red-500';
  const ringColor =
    rewrite.ats_score >= 75 ? '#16a34a' : rewrite.ats_score >= 50 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (rewrite.ats_score / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
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
            New rewrite
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Your resume, reframed for {rewrite.target_job_title}
          </h1>
          {rewrite.target_industry && (
            <p className="mt-1 text-gray-500">Target industry: {rewrite.target_industry}</p>
          )}
        </div>

        {/* Before/After */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Before &amp; After</h2>
          <div className="space-y-4">
            {rewrite.rewritten_bullets.map((b, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Original</p>
                  <p className="text-sm text-gray-500">{b.original}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">Rewritten</p>
                  <p className="text-sm text-gray-900 font-medium">{b.rewritten}</p>
                  {b.note && <p className="text-xs text-gray-400 mt-1 italic">{b.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Transferable skills */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Transferable Skills We Found</h2>
          <div className="flex flex-wrap gap-2">
            {rewrite.transferable_skills.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* ATS score */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">ATS Match Score</h2>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${scoreColor}`}>{rewrite.ats_score}</span>
              </div>
            </div>

            <div className="flex-1 grid sm:grid-cols-2 gap-6 w-full">
              <div>
                <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">
                  Keywords Matched
                </p>
                <ul className="space-y-1">
                  {rewrite.keywords_matched.map((k, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">
                  Consider Adding
                </p>
                <ul className="space-y-1">
                  {rewrite.keywords_missing.map((k, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Cover letter */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Cover Letter</h2>
            <button
              onClick={copyCoverLetter}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            readOnly
            value={rewrite.cover_letter}
            rows={10}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 resize-y bg-gray-50"
          />
        </section>

        <div className="flex justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            Start a new rewrite
          </Link>
        </div>
      </main>
    </div>
  );
}
