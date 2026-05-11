const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

async function readJsonBody(req) {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function getGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .filter(Boolean)
    .join('\n')
    .trim();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Use POST to generate a document.' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendJson(res, 500, { error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: 'Invalid JSON request body.' });
    return;
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (prompt.length < 20) {
    sendJson(res, 400, { error: 'Prompt is missing or too short.' });
    return;
  }

  if (prompt.length > 120000) {
    sendJson(res, 413, { error: 'Prompt is too large for this hosted function.' });
    return;
  }

  try {
    const geminiRes = await fetch(`${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.82,
          topP: 0.95,
          maxOutputTokens: 12000
        }
      })
    });

    const data = await geminiRes.json().catch(() => ({}));

    if (!geminiRes.ok) {
      sendJson(res, geminiRes.status, {
        error: data?.error?.message || 'Gemini API request failed.'
      });
      return;
    }

    const content = getGeminiText(data);
    if (!content) {
      sendJson(res, 502, {
        error: data?.promptFeedback?.blockReason
          ? `Gemini blocked the request: ${data.promptFeedback.blockReason}`
          : 'Gemini returned an empty response.'
      });
      return;
    }

    sendJson(res, 200, {
      content,
      model: GEMINI_MODEL,
      documentType: body.documentType || 'Document'
    });
  } catch (error) {
    sendJson(res, 502, { error: 'Could not reach Gemini. Try again shortly.' });
  }
};
