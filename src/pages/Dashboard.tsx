import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  LogOut,
  Upload,
  FileText,
  X,
  Loader2,
  Wand2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { extractTextFromFile } from '@/lib/extractText';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ['.pdf', '.docx'];
const BUCKET = 'resumes';

interface Profile {
  rewrites_used: number;
  rewrites_limit: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [resumeText, setResumeText] = useState<string | null>(null);

  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const rewritesLeft = profile ? profile.rewrites_limit - profile.rewrites_used : 0;
  const hasRewritesLeft = rewritesLeft > 0;
  const canSubmit =
    !!file &&
    resumeText !== null &&
    jobTitle.trim().length > 0 &&
    !extracting &&
    !submitting;

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('rewrites_used, rewrites_limit')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      setProfile(null);
    } else if (data) {
      setProfile(data as Profile);
    } else {
      // No profile row yet — create one as a fallback (trigger should have made it).
      const { data: inserted } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email })
        .select('rewrites_used, rewrites_limit')
        .maybeSingle();
      if (inserted) setProfile(inserted as Profile);
    }
    setProfileLoading(false);
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const validateFile = (f: File): string | null => {
    const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase();
    if (!ACCEPTED.includes(ext)) return 'Only PDF and DOCX files are allowed.';
    if (f.size > MAX_BYTES) return 'File is larger than 5 MB.';
    return null;
  };

  const handleFileSelect = async (selected: File | null) => {
    setFileError(null);
    if (!selected) return;
    const err = validateFile(selected);
    if (err) {
      setFileError(err);
      return;
    }
    setFile(selected);
    setResumeText(null);
    setExtracting(true);
    try {
      const text = await extractTextFromFile(selected);
      if (!text) {
        setFileError('Could not read any text from this file. Try another resume.');
        setFile(null);
        return;
      }
      setResumeText(text);
    } catch (e) {
      setFileError(
        e instanceof Error ? e.message : 'Could not read this file. Try another resume.'
      );
      setFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
    setResumeText(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRewrite = async () => {
    if (!canSubmit || !user || !file) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      // 0. Ensure we have extracted text
      if (!resumeText) throw new Error('Resume text is not ready yet. Please re-upload the file.');

      // 1. Upload to resumes/<uid>/<filename> (kept for record-keeping)
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (upErr) throw new Error(upErr.message);

      // 2. Call the rewrite-resume Edge Function (this checks the limit,
      //    calls Claude, saves the row, and increments rewrites_used).
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Your session expired. Please log in again.');

      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewrite-resume`;
      const res = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          resumeText,
          targetJobTitle: jobTitle,
          targetIndustry: industry || undefined,
          jobDescription: jobDescription || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Rewrite failed. Please try again.');

      // 3. Refresh profile + reset form, then go to the results page
      await loadProfile();
      setFile(null);
      setResumeText(null);
      setJobTitle('');
      setIndustry('');
      setJobDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      navigate(`/results/${result.rewrite.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-lg tracking-tight">CareerPivot AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rewrite your resume</h1>
          <p className="mt-2 text-gray-600">
            Upload your current resume, tell us where you're headed, and we'll reframe it for the
            role you want.
          </p>
        </div>

        {/* Free rewrites counter */}
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
          {profileLoading ? (
            <span className="text-sm text-indigo-700">Loading your plan…</span>
          ) : profile ? (
            <span className="text-sm text-indigo-700 font-medium">
              {rewritesLeft} of {profile.rewrites_limit} free rewrites left
            </span>
          ) : (
            <span className="text-sm text-indigo-700">Could not load your plan.</span>
          )}
        </div>

        {/* Upload */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">1. Upload your resume</h2>

          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => !extracting && fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${extracting ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
            >
              <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <Upload className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                Drop your resume here, or <span className="text-indigo-600">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF or DOCX, up to 5 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                disabled={extracting}
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {extracting
                    ? 'Reading your resume…'
                    : resumeText
                      ? `${(file.size / 1024).toFixed(0)} KB · ${resumeText.length.toLocaleString()} characters extracted`
                      : `${(file.size / 1024).toFixed(0)} KB`}
                </p>
              </div>
              {extracting ? (
                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />
              ) : (
                <button
                  onClick={removeFile}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {fileError && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{fileError}</p>
            </div>
          )}
        </section>

        {/* Target inputs */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">2. Tell us your target</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target job title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Product Manager"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target industry <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="SaaS / Tech"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Paste the job description{' '}
                <span className="text-gray-400 text-xs">(optional, improves accuracy)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                placeholder="Paste the job posting you're targeting — responsibilities, requirements, keywords…"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-y"
              />
            </div>
          </div>
        </section>

        {/* Submit */}
        {submitError && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        <div className="flex flex-col items-stretch gap-3">
          {hasRewritesLeft ? (
            <button
              onClick={handleRewrite}
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Rewriting…
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Rewrite My Resume
                </>
              )}
            </button>
          ) : (
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all shadow-lg"
            >
              <Lock className="h-5 w-5" />
              Upgrade to continue
            </Link>
          )}

          {file && extracting && (
            <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading your resume…
            </div>
          )}

          {!file && !submitting && (
            <p className="text-xs text-gray-400 text-center">
              Upload a resume and enter a target job title to continue.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
