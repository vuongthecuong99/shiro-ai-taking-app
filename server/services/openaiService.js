const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeParseJSON(raw) {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// Converts stored image paths (e.g. /uploads/abc.jpg) into base64 data URLs
function imagesToContent(imagePaths = []) {
  return imagePaths.map((imgPath) => {
    const filePath = path.join(__dirname, '../', imgPath);
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const ext = path.extname(filePath).slice(1) || 'jpeg';
    return {
      type: 'image_url',
      image_url: { url: `data:image/${ext};base64,${base64}` }
    };
  });
}

// Builds the user message content, combining text and any images
function buildUserContent(text, images = []) {
  const content = [{ type: 'text', text }];
  if (images.length > 0) {
    content.push(...imagesToContent(images));
  }
  return content;
}

async function summarize(text, images = []) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Summarize this note in 2-3 short sentences. If images are provided, incorporate what they show into the summary.' },
      { role: 'user', content: buildUserContent(text, images) }
    ]
  });
  return res.choices[0].message.content;
}

async function generateTags(text, images = []) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Return 3-5 short topical tags for this note as a JSON array of strings, nothing else. Consider any images provided.' },
      { role: 'user', content: buildUserContent(text, images) }
    ]
  });
  const raw = res.choices[0].message.content;
  const parsed = safeParseJSON(raw);
  return parsed || [];
}

async function generateQuiz(text, images = [], numQuestions = 30) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 4000,
    messages: [
      {
        role: 'system',
        content: `You are a helpful teacher. Based on the notes and any images provided, create exactly ${numQuestions} multiple-choice questions with 4 options each, covering as much of the material as possible without repeating the same question twice. Return ONLY valid JSON in this exact format, nothing else, no markdown formatting:
[{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0}]`
      },
      { role: 'user', content: buildUserContent(text, images) }
    ]
  });
  const raw = res.choices[0].message.content;
  const parsed = safeParseJSON(raw);
  return parsed || [];
}

async function generateFlashcards(text, images = [], numCards = 5) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Based on the notes and any images provided, create ${numCards} flashcards. Return ONLY valid JSON in this exact format, nothing else:
[{"front": "question or term", "back": "answer or definition"}]`
      },
      { role: 'user', content: buildUserContent(text, images) }
    ]
  });
  const raw = res.choices[0].message.content;
  const parsed = safeParseJSON(raw);
  return parsed || [];
}

async function generateKeyTerms(text, images = []) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Identify 3-6 important keywords or terms from these notes and any images provided. For each, give a short 1-2 sentence explanation. Return ONLY valid JSON in this exact format, nothing else, no markdown formatting:
[{"term": "...", "explanation": "..."}]`
      },
      { role: 'user', content: buildUserContent(text, images) }
    ]
  });
  const raw = res.choices[0].message.content;
  const parsed = safeParseJSON(raw);
  return parsed || [];
}

module.exports = { summarize, generateTags, generateQuiz, generateFlashcards, generateKeyTerms };