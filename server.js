require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// JWT Auth Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token.' });
    req.userId = decoded.id;
    next();
  });
};
// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
    res.json({ message: 'User registered successfully!', userId: result.id });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    res.status(500).json({ error: 'Database error.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(401).json({ error: 'User not found.' });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid password.' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Database error.' });
  }
});

// GET /api/history
app.get('/api/history', verifyToken, async (req, res) => {
  try {
    const history = await db.query('SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Database error.' });
  }
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/analyze
app.post('/api/analyze', async (req, res) => {
  const { code, language } = req.body;

  if (!code || code.trim() === '') {
    return res.status(400).json({ error: 'No code provided.' });
  }

  const systemPrompt = `You are an expert code debugger and refactoring assistant. 
When given a code snippet, you will:
1. Identify any bugs, logical errors, or issues
2. Provide a refactored, improved version of the code (provide one version with helpful internal comments and one without)
3. Explain each change made and why it improves the code

Always respond in valid JSON with exactly this structure:
{
  "bugs": [
    { "line": "<line number or 'N/A'>", "description": "<bug description>" }
  ],
  "refactoredCode": "<the full refactored code WITH helpful internal comments explaining the changes>",
  "refactoredCodeNoComments": "<the exact same refactored code but WITHOUT any internal comments>",
  "explanation": [
    "<explanation point 1>",
    "<explanation point 2>"
  ]
}

If no bugs are found, set bugs to an empty array and note improvements only.
Be thorough, educational, and beginner-friendly in your explanations.`;

  const userPrompt = `Language: ${language || 'Auto-detect'}

Code to analyze:
\`\`\`
${code}
\`\`\``;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();
    const parsedResult = JSON.parse(responseText);

    // Optional: Save to history if logged in
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await db.run(
          'INSERT INTO history (user_id, language, original_code, refactored_code, refactored_code_no_comments, bugs, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            decoded.id,
            language || 'Auto-detect',
            code,
            parsedResult.refactoredCode,
            parsedResult.refactoredCodeNoComments,
            JSON.stringify(parsedResult.bugs),
            JSON.stringify(parsedResult.explanation)
          ]
        );
      } catch (err) {
        console.error('Failed to save history:', err.message);
      }
    }

    res.json(parsedResult);
  } catch (err) {
    console.error('Gemini API error:', err.message);

    if (err.message && err.message.includes('API key not valid')) {
      return res.status(401).json({ error: 'Invalid Gemini API key. Please check your .env file.' });
    }
    if (err.message && err.message.includes('429')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
    }

    res.status(500).json({ error: 'An error occurred while analyzing your code. Please try again.' });
  }
});

// Catch-all: serve index.html for any unmatched route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 AI Code Debugger running at http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop the server\n`);
});
