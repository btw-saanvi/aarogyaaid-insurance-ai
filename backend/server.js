const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Node 18+ has native fetch. For older nodes, we use node-fetch.
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { getRelevantPolicies } = require('./utils/rag');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const XAI_API_KEY = process.env.XAI_API_KEY;

if (!XAI_API_KEY || XAI_API_KEY === 'your_xai_api_key_here') {
  console.warn("WARNING: XAI_API_KEY is missing or not set in .env file.");
}

const SYSTEM_PROMPT = `
You are AarogyaAid AI, a professional health insurance advisor.
Your goal is to recommend the best insurance policies based ONLY on the provided policy data.

RULES:
1. Use ONLY provided policy data.
2. If data for a specific query is not found, clearly state "Not found in provided policies".
3. Always output:
   - A comparison table of the top 3 recommended policies.
   - Coverage details for the best match.
   - A personalized explanation (150-200 words) justifying the choice based on the user's Age, Lifestyle, Pre-existing conditions, Income, and City.
4. Use a professional, empathetic, and clear tone.
5. Avoid hallucination. Do not invent policy features.
6. The response should be in Markdown format.
`;

app.post('/recommend', async (req, res) => {
  if (!XAI_API_KEY || XAI_API_KEY === 'your_xai_api_key_here') {
    return res.status(401).json({ error: "XAI_API_KEY is not configured in .env file." });
  }
  try {
    const userProfile = req.body;
    const relevantPolicies = getRelevantPolicies(userProfile);
    
    const prompt = `
User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Lifestyle: ${userProfile.lifestyle}
- Pre-existing conditions: ${userProfile.preExistingConditions}
- Annual income: ${userProfile.annualIncome}
- City tier: ${userProfile.cityTier}

Relevant Policy Data:
${JSON.stringify(relevantPolicies, null, 2)}

Instructions:
Based on the profile above, recommend the best policy. 
Generate a comparison table, coverage details, and a 150-200 word explanation.
`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("XAI API Error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    res.json({ recommendation: data.choices[0].message.content });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/chat', async (req, res) => {
  if (!XAI_API_KEY || XAI_API_KEY === 'your_xai_api_key_here') {
    return res.status(401).json({ error: "XAI_API_KEY is not configured in .env file." });
  }
  try {
    const { question, userProfile } = req.body;
    const relevantPolicies = getRelevantPolicies(userProfile);

    const prompt = `
User Profile: ${JSON.stringify(userProfile)}
Context Policies: ${JSON.stringify(relevantPolicies)}
User Question: ${question}

Instructions: Answer the question using the context above. Be concise and accurate.
`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0
      })
    });

    const data = await response.json();
    res.json({ answer: data.choices[0].message.content });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
