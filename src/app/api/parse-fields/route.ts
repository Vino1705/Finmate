import { NextResponse } from 'next/server';

type ParseRequest = {
  text: string;
  targetForm?: string; // e.g., 'onboarding' or 'expense'
};

export async function POST(request: Request) {
  try {
  const body = await request.json() as ParseRequest;
  const { text, targetForm = 'onboarding' } = body || {};

  console.info('[parse-fields] incoming request', { textLength: text?.length ?? 0, targetForm });

  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    // Accept either GOOGLE_API_KEY or GEMINI_API_KEY (fallback)
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    const project = process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (!apiKey || !project) {
      return NextResponse.json({ error: 'Missing API key or project id: set GOOGLE_API_KEY or GEMINI_API_KEY and GOOGLE_PROJECT_ID in server env' }, { status: 500 });
    }

    // Build a system prompt that asks Gemini to output JSON that maps to our forms
    const allowedCategories = [
      'Food & Dining',
      'Groceries',
      'Transport',
      'Shopping',
      'Entertainment',
      'Utilities',
      'Rent/EMI',
      'Healthcare',
      'Education',
      'Other',
    ];

    const instructions = {
      onboarding: `Produce a JSON object with keys: role (Student|Professional|Housewife), income (number), fixedExpenses (array of {name,category,amount,timelineMonths,startDate?}). Parse dates as ISO strings. Only output JSON, no explanation. If a field is missing, omit it.`,
    // For expense receipts: require a short description and the total amount (number).
    // Rules: description MUST be short (2-6 words). amount MUST be the total spent on the receipt.
    // If the receipt contains item lines, sum item prices or prefer any explicit "Total" line found. Return amount as a number (no currency symbol).
    // category must be exactly one of the allowed values. Only output JSON, no explanation.
    expense: `Produce a JSON object with keys: description (short string, 2-6 words), amount (number = total amount on the receipt), category (one of ${allowedCategories.join(', ')}), date (ISO date if available). Only output JSON, no explanation. The category value MUST be exactly one of the allowed values: ${allowedCategories.join(' | ')}. If you cannot determine a category, return "Other". If you see line-item prices, prefer the explicit "Total" line; otherwise sum item prices to compute the total. Always return amount as a plain number.`,
    } as const;

    const prompt = `${instructions[targetForm as keyof typeof instructions] || instructions.onboarding}\n\nInput: "${text.replace(/"/g, '\\"')}"`;

    // Use Google Generative API (models: gemini-2.5-flash or similar). We'll call the text-bison or generative models endpoint.
  const primaryModel = process.env.PARSE_FIELDS_MODEL || 'gemini-2.5-flash';
  const urlForModel = (modelId: string) => `https://generativelanguage.googleapis.com/v1beta2/models/${modelId}:generateText?key=${encodeURIComponent(apiKey)}`;
  const url = urlForModel(primaryModel);
    

    // SERVER-SIDE FALLBACK helpers: extract numbers and totals from text
  const extractNumber = (s: string | undefined) => {
      if (!s) return null;
      // look for explicit Total lines first
      const totalMatch = s.match(/total[^\d]*(\d{1,3}(?:[\d,]*)(?:\.\d+)?)/i);
  if (totalMatch) return Number(totalMatch[1].replace(/,/g, ''));
      // look for lines like "Total Qty: 6 Total 840.00" or a standalone last number
      const nums = Array.from(s.matchAll(/(\d{1,3}(?:[\d,]*)(?:\.\d+)?)/g)).map(m => Number(m[0].replace(/,/g, '')));
      if (nums.length === 0) return null;
      // heuristic: if there's a number labeled Qty or small integers, try to prefer the largest number as total
      const sensible = nums.filter(n => !Number.isNaN(n) && isFinite(n) && n > 0);
      if (sensible.length === 0) return null;
      // prefer the largest number which often represents the total on receipts
  return sensible.reduce((a, b) => Math.max(a, b), 0);
    };

    // If parsed exists but amount missing or invalid, attempt fallback extraction using raw output then original text
    const ensureAmountFromText = (rawText: string) => {
      const maybe = extractNumber(rawText);
      const val = typeof maybe === 'number' && !Number.isNaN(maybe) ? maybe : null;
      if (val != null) console.info('[parse-fields] ensureAmountFromText extracted', { value: val });
      return val;
    };

    // call generative API and handle failures with a structured fallback
    let resp: Response | null = null;
    let json: any = null;
    let output = '';
    // wrapper to call a model and return its response + parsed output
    const callModel = async (modelId: string) => {
      const tryUrl = urlForModel(modelId);
      try {
        const r = await fetch(tryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: { text: prompt },
            temperature: 0.0,
            maxOutputTokens: 800,
          }),
        });
        const j = await r.json().catch(() => null);
        return { resp: r, json: j } as const;
      } catch (e) {
        return { resp: null, json: String(e) } as const;
      }
    };

    try {
      const primary = await callModel(primaryModel);
      resp = primary.resp;
  json = primary.json;
  // log the primary attempt and full JSON response (if any)
  console.info('[parse-fields] model attempt', { model: primaryModel, status: resp?.status ?? 'fetch-error' });
  try { console.info('[parse-fields] model response body', JSON.stringify(json)); } catch (e) { console.info('[parse-fields] model response body (non-serializable)'); }

      if (!resp || !resp.ok) {
        // If primary failed with NOT_FOUND/404, optionally try fallbacks listed in env
        if (resp?.status === 404) {
          console.warn('[parse-fields] primary model returned 404 (not found).');
          let fallbackList = (process.env.PARSE_FIELDS_MODEL_FALLBACKS || '').split(',').map(s => s.trim()).filter(Boolean);
          // If no fallbacks configured, try a short, safe default list of alternate model ids commonly available
          if (fallbackList.length === 0) {
            fallbackList = ['text-bison-001', 'text-bison'];
            console.info('[parse-fields] no PARSE_FIELDS_MODEL_FALLBACKS configured — trying default fallbacks', fallbackList);
          }
          for (const alt of fallbackList) {
            console.info('[parse-fields] trying fallback model', alt);
            const attempt = await callModel(alt);
            console.info('[parse-fields] fallback attempt result', { model: alt, status: attempt.resp?.status ?? 'fetch-error' });
            try { console.info('[parse-fields] fallback response body', JSON.stringify(attempt.json)); } catch (e) { console.info('[parse-fields] fallback response body (non-serializable)'); }
            if (attempt.resp && attempt.resp.ok) {
              resp = attempt.resp;
              json = attempt.json;
              console.info('[parse-fields] fallback model succeeded', alt);
              break;
            }
          }
        }
      }

      if (!resp || !resp.ok) {
  console.error('[parse-fields] generative API returned', resp?.status ?? 'no-response');
  try { console.error('[parse-fields] generative API details', JSON.stringify(json)); } catch (e) { console.error('[parse-fields] generative API details (non-serializable)'); }
        const fallbackParsed: any = {};
        const fallbackAmount = ensureAmountFromText(text);
        if (fallbackAmount != null) fallbackParsed.amount = fallbackAmount;
        const cleaned = text.replace(/[\n\r]/g, ' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        fallbackParsed.description = cleaned.split(' ').slice(0, 6).join(' ') || 'Expense';
        fallbackParsed.category = 'Other';
        fallbackParsed._amountSource = fallbackParsed.amount != null ? 'fallback' : 'none';
        return NextResponse.json({ error: 'Generative API error', status: resp?.status ?? 0, details: json, parsed: fallbackParsed, raw: '', modelResponse: json }, { status: 200 });
      }

      output = json?.candidates?.[0]?.content ?? json?.output?.[0]?.content ?? '';
  } catch (fetchErr) {
  console.error('[parse-fields] generative API fetch error', String(fetchErr));
      const fallbackParsed: any = {};
      const fallbackAmount = ensureAmountFromText(text);
      if (fallbackAmount != null) fallbackParsed.amount = fallbackAmount;
      const cleaned = text.replace(/[\n\r]/g, ' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      fallbackParsed.description = cleaned.split(' ').slice(0, 6).join(' ') || 'Expense';
      fallbackParsed.category = 'Other';
      fallbackParsed._amountSource = fallbackParsed.amount != null ? 'fallback' : 'none';
      return NextResponse.json({ error: 'Generative API fetch error', details: String(fetchErr), parsed: fallbackParsed, raw: '', modelResponse: null }, { status: 200 });
    }

    

    // Try to parse JSON from model output
    let parsed: any = null;
    try {
      // Find first JSON object in the output
      const match = output.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch (e) {
      // fallback: return raw text
    }

    if (!parsed) parsed = {};
    // normalize description to be short
    if (parsed.description && typeof parsed.description === 'string') {
      const words = parsed.description.replace(/\s+/g, ' ').trim().split(' ');
      if (words.length > 6) parsed.description = words.slice(0, 6).join(' ');
    }

    // Ensure amount is a number; if not present, try to extract from the model output or input text
    const parsedAmount = parsed && (parsed.amount ?? parsed.total ?? parsed.Total);
    let _amountSource: 'model' | 'fallback' | 'none' = 'model';
    if (parsedAmount == null || Number.isNaN(Number(parsedAmount))) {
      // try model raw output first
      const fallback1 = ensureAmountFromText(output);
      // then try the original input text (the user's OCR text)
      const fallback2 = ensureAmountFromText(text);
      const finalAmount = fallback1 ?? fallback2 ?? null;
      if (finalAmount != null) {
        parsed.amount = finalAmount;
        _amountSource = 'fallback';
      } else {
        _amountSource = 'none';
      }
    } else {
      parsed.amount = Number(parsedAmount);
      _amountSource = 'model';
    }
    // annotate the provenance so frontend can detect whether model supplied the amount
    parsed._amountSource = _amountSource;

    // If description still missing, create a short description from the top of the OCR text
    if ((!parsed.description || parsed.description.trim() === '') && text) {
      const cleaned = text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const w = cleaned.split(' ').slice(0, 6).join(' ');
      parsed.description = w || 'Expense';
    }

    // Normalize category if present: ensure it matches one of the allowedCategories
    const normalizeCategory = (rawCat: string | undefined) => {
      if (!rawCat) return 'Other';
      const r = rawCat.trim();
      // direct match
      if (allowedCategories.includes(r)) return r;
      const lower = r.toLowerCase();
      // keyword matching
      if (/food|restaurant|dine|cafe|lunch|dinner|meal/.test(lower)) return 'Food & Dining';
      if (/grocery|supermarket|vegetable|fruit|mart|shopping for groceries/.test(lower)) return 'Groceries';
      if (/taxi|uber|ola|bus|metro|train|transport|ride/.test(lower)) return 'Transport';
      if (/shopping|mall|clothes|apparel|purchase|buy/.test(lower)) return 'Shopping';
      if (/movie|netflix|spotify|entertainment|show|concert/.test(lower)) return 'Entertainment';
      if (/electric|water|bill|utility|internet|wifi|gas|electricity/.test(lower)) return 'Utilities';
      if (/rent|emi|loan|mortgage/.test(lower)) return 'Rent/EMI';
      if (/doctor|hospital|medicine|clinic|health|pharmacy/.test(lower)) return 'Healthcare';
      if (/tuition|course|study|education|school|college/.test(lower)) return 'Education';
      return 'Other';
    };

    if (parsed && parsed.category) {
      try {
        parsed.categoryNormalized = normalizeCategory(String(parsed.category));
        // Ensure category field is canonical
        parsed.category = parsed.categoryNormalized;
      } catch (e) {
        parsed.categoryNormalized = 'Other';
        parsed.category = 'Other';
      }
    }

    return NextResponse.json({ parsed, raw: output, modelResponse: json });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
