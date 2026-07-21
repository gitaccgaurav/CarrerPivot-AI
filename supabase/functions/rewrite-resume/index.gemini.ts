// Supabase Edge Function: rewrite-resume (Gemini version — for free testing)
// Deploy with: supabase functions deploy rewrite-resume
// Requires secret: supabase secrets set GEMINI_API_KEY=AIza...

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are an expert resume writer specializing in career transitions.
Given a resume and a target job, you:
1. Identify transferable skills from the candidate's background relevant to the target role.
2. Rewrite each bullet point to emphasize transferable impact using strong action verbs and quantifiable results where possible, without fabricating facts.
3. Flag which original bullets had no relevant transferable angle and suggest whether to cut or reframe them.
4. Extract key ATS keywords from the job description (if provided) and note which ones are present vs missing in the resume.
5. Write a tailored 250-word cover letter connecting the candidate's background to the new role.

Return ONLY valid JSON in this exact shape, no markdown, no preamble, no code fences:
{
  "rewrittenBullets": [{"original": "", "rewritten": "", "note": ""}],
  "transferableSkills": ["..."],
  "keywordsMatched": ["..."],
  "keywordsMissing": ["..."],
  "atsScore": 0,
  "coverLetter": ""
}`;

function buildUserMessage(input: {
  resumeText: string;
  targetJobTitle: string;
  targetIndustry?: string;
  jobDescription?: string;
}) {
  return `RESUME TEXT:
${input.resumeText}

TARGET JOB TITLE: ${input.targetJobTitle}
TARGET INDUSTRY: ${input.targetIndustry || 'Not specified'}
JOB DESCRIPTION: ${input.jobDescription || 'Not provided'}`;
}

async function callGemini(userMessage: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('Server misconfiguration: missing GEMINI_API_KEY');

  const model = 'gemini-2.5-flash'; // free-tier model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json', // Gemini can be told to return pure JSON
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text response from Gemini');
  return text as string;
}

function tryParseJson(raw: string) {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { resumeText, targetJobTitle, targetIndustry, jobDescription } = body;

    if (!resumeText || !targetJobTitle) {
      return new Response(
        JSON.stringify({ error: 'resumeText and targetJobTitle are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rewrites_used, rewrites_limit')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Could not load profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.rewrites_used >= profile.rewrites_limit) {
      return new Response(JSON.stringify({ error: 'Free rewrite limit reached' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userMessage = buildUserMessage({ resumeText, targetJobTitle, targetIndustry, jobDescription });
    let parsed;
    try {
      const raw = await callGemini(userMessage);
      parsed = tryParseJson(raw);
    } catch (_e) {
      // Retry once with a stricter nudge
      const raw = await callGemini(userMessage + '\n\nReturn valid JSON only, no markdown.');
      parsed = tryParseJson(raw);
    }

    const { data: savedRow, error: insertError } = await supabase
      .from('rewrites')
      .insert({
        user_id: user.id,
        target_job_title: targetJobTitle,
        target_industry: targetIndustry || null,
        job_description: jobDescription || null,
        rewritten_bullets: parsed.rewrittenBullets ?? [],
        transferable_skills: parsed.transferableSkills ?? [],
        keywords_matched: parsed.keywordsMatched ?? [],
        keywords_missing: parsed.keywordsMissing ?? [],
        ats_score: parsed.atsScore ?? 0,
        cover_letter: parsed.coverLetter ?? '',
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: `Failed to save rewrite: ${insertError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase
      .from('profiles')
      .update({ rewrites_used: profile.rewrites_used + 1, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return new Response(JSON.stringify({ rewrite: savedRow }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('rewrite-resume error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
