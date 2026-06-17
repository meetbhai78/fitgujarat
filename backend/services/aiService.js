const ActivityLog = require('../models/ActivityLog');
const UserStreak = require('../models/UserStreak');
const User = require('../models/User');
const { calculateScore } = require('./scoringService');
const { checkForFraud } = require('./fraudService');
const { getRecommendations } = require('./recommendationService');
const { getUserRank } = require('./leaderboardService');

/**
 * AI Service Integration (Gemini API with offline fallback)
 */

// Native fetch helper for Gemini API
async function callGemini(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      systemInstruction: systemInstruction ? {
        parts: [{ text: systemInstruction }]
      } : undefined,
      generationConfig: {
        responseMimeType: prompt.includes('JSON') ? 'application/json' : 'text/plain'
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }
  return text;
}

/**
 * Generate AI recommendation using Gemini API, fallback to local heuristics if unavailable
 */
async function generateAIRecommendations(userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  // Get local base recommendations
  let localRecs = [];
  try {
    localRecs = await getRecommendations(userId, user.district);
  } catch (err) {
    console.error('Local recommendations error:', err);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return local recommendations with an AI-labeled tag
    return localRecs.map(r => ({ ...r, provider: 'local-ai' }));
  }

  try {
    const streak = await UserStreak.findOne({ user_id: userId });
    const distRank = await getUserRank(userId, user.district, 'overall') || 'Unranked';
    const stateRank = await getUserRank(userId, 'STATE', 'overall') || 'Unranked';

    const recentLogs = await ActivityLog.find({ user_id: userId, is_flagged: false })
      .sort({ date: -1 })
      .limit(7);
    const avgSteps = recentLogs.length > 0 
      ? Math.round(recentLogs.reduce((sum, l) => sum + l.raw_value, 0) / recentLogs.length)
      : 0;

    const prompt = `
      User Details:
      - Name: ${user.name}
      - District: ${user.district}
      - District Rank: ${distRank}
      - State Rank: ${stateRank}
      - Current Streak: ${streak?.current_streak || 0} days
      - Longest Streak: ${streak?.longest_streak || 0} days
      - Average Steps (last 7 days): ${avgSteps} steps
      
      Generate a single highly-personalized AI recommendation containing a daily goal suggestion and action tip tailored for this user to climb the leaderboard.
      
      Format the response strictly as a JSON object:
      {
        "en": "...",
        "gu": "..."
      }
      Do not include markdown wrappers (e.g. \`\`\`json) in your raw output. Keep descriptions brief and encouraging (under 35 words each).
    `;

    const systemInstruction = "You are a professional health advisor for the 'Gujarat Step Counter' app. Keep outputs highly encouraging and localized.";
    
    const geminiResultText = await callGemini(prompt, systemInstruction);
    const geminiJson = JSON.parse(geminiResultText.trim());

    if (geminiJson.en && geminiJson.gu) {
      const geminiRec = {
        type: 'gemini_personalized',
        en: geminiJson.en,
        gu: geminiJson.gu,
        icon: '🤖',
        priority: 0,
        provider: 'gemini-ai'
      };
      return [geminiRec, ...localRecs];
    }
  } catch (error) {
    console.error('Gemini recommendations failed, falling back to local:', error.message);
  }

  return localRecs.map(r => ({ ...r, provider: 'local-ai' }));
}

/**
 * Handle AI Health Coach interactive chat
 */
async function generateAIChatResponse(userId, message, history = []) {
  const user = await User.findById(userId);
  if (!user) {
    return {
      en: "User not found. Please log in again.",
      gu: "વપરાશકર્તા મળ્યા નથી. કૃપા કરીને ફરી લૉગિન કરો."
    };
  }

  const streak = await UserStreak.findOne({ user_id: userId });
  const distRank = await getUserRank(userId, user.district, 'overall') || 'Unranked';
  const todayLog = await ActivityLog.findOne({ user_id: userId, date: new Date().toISOString().split('T')[0] });
  const todaySteps = todayLog ? todayLog.raw_value : 0;

  const userContext = {
    name: user.name,
    district: user.district,
    todaySteps,
    streak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    districtRank: distRank
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      // Build prompt with conversation history
      let conversationHistory = '';
      history.slice(-6).forEach(msg => {
        const sender = msg.sender === 'user' ? 'User' : 'Coach';
        conversationHistory += `${sender}: ${msg.text}\n`;
      });

      const prompt = `
        User context details:
        - Name: ${userContext.name}
        - District: ${userContext.district}
        - Today's Steps: ${userContext.todaySteps}
        - Current Streak: ${userContext.streak} days (Longest: ${userContext.longestStreak} days)
        - District Rank: ${userContext.districtRank}
        
        Conversation History:
        ${conversationHistory}
        User says: ${message}
        
        Respond as a friendly health coach for the 'Gujarat Step Counter' app. Keep it brief (under 80 words). Be encouraging.
        Respond in two languages, formatting the response exactly as a JSON object:
        {
          "en": "your response in English",
          "gu": "તમારો પ્રત્યુત્તર ગુજરાતીમાં"
        }
      `;

      const responseText = await callGemini(prompt, "You are a friendly health and walking coach from Gujarat.");
      const jsonResponse = JSON.parse(responseText.trim());
      if (jsonResponse.en && jsonResponse.gu) {
        return jsonResponse;
      }
    } catch (err) {
      console.error('Gemini chat response failed, using offline engine:', err.message);
    }
  }

  // Fallback / Offline Rule-Based AI Engine
  return generateOfflineChatResponse(message, userContext);
}

/**
 * Smart Offline Keyword-Based Chatbot supporting English and Gujarati templates
 */
function generateOfflineChatResponse(message, context) {
  const msgLower = message.toLowerCase();
  
  // Greeting
  if (msgLower.match(/\b(hi|hello|hey|good morning|kem cho|કેમ છો|નમસ્તે)\b/i)) {
    return {
      en: `Hello ${context.name}! I am your offline AI Health Coach. You have walked ${context.todaySteps.toLocaleString()} steps today. How can I help you?`,
      gu: `નમસ્તે ${context.name}! હું તમારો ઓફલાઇન AI હેલ્થ કોચ છું. તમે આજે ${context.todaySteps.toLocaleString()} પગલાં ચાલ્યા છો. હું તમારી શું મદદ કરી શકું?`
    };
  }

  // Rank / Leaderboard
  if (msgLower.includes('rank') || msgLower.includes('leaderboard') || msgLower.includes('position') || msgLower.includes('ક્રમ') || msgLower.includes('લીડરબોર્ડ')) {
    return {
      en: `You are currently ranked #${context.districtRank} in ${context.district} district. To climb up, sync your daily steps and maintain a streak for multipliers!`,
      gu: `તમે હાલમાં ${context.district} જિલ્લામાં #${context.districtRank} ક્રમે છો. ઉપર ચઢવા માટે દરરોજ પગલાં સિંક કરો અને સ્કોર વધારવા સ્ટ્રીક જાળવો!`
    };
  }

  // Streak / Badges
  if (msgLower.includes('streak') || msgLower.includes('badge') || msgLower.includes('flame') || msgLower.includes('સ્ટ્રીક') || msgLower.includes('બેજ')) {
    return {
      en: `Your current streak is ${context.streak} days (longest: ${context.longestStreak} days). Keep walking daily to unlock the Bronze, Silver, Gold, and Diamond flame badges!`,
      gu: `તમારી વર્તમાન સ્ટ્રીક ${context.streak} દિવસ છે (સૌથી લાંબી: ${context.longestStreak} દિવસ). ફ્લેમ બેજ અનલૉક કરવા માટે દરરોજ ચાલવાનું ચાલુ રાખો!`
    };
  }

  // General walking tips / advice
  if (msgLower.includes('walk') || msgLower.includes('weight') || msgLower.includes('health') || msgLower.includes('exercise') || msgLower.includes('ચાલવું') || msgLower.includes('વજન') || msgLower.includes('તંદુરસ્તી')) {
    const dailyGoal = 10000;
    const remaining = Math.max(0, dailyGoal - context.todaySteps);
    return {
      en: `Walking 10,000 steps daily boosts heart health and aids in weight management. You need ${remaining.toLocaleString()} more steps to reach today's standard goal. Take a quick evening walk!`,
      gu: `દરરોજ ૧૦,૦૦૦ પગલાં ચાલવાથી હૃદય મજબૂત થાય છે અને વજન નિયંત્રણમાં મદદ મળે છે. આજનો લક્ષ્યાંક પૂર્ણ કરવા માટે તમારે ${remaining.toLocaleString()} વધુ પગલાંની જરૂર છે.`
    };
  }

  // Default response
  return {
    en: `Thanks for asking, ${context.name}! To maintain high activity, try setting a reminder for a morning walk. Let's reach 10,000 steps today!`,
    gu: `પૂછવા બદલ આભાર, ${context.name}! સવારે ચાલવા જવા માટે રિમાઇન્ડર સેટ કરો. ચાલો આજે ૧૦,૦૦૦ પગલાંનો લક્ષ્યાંક પ્રાપ્ત કરીએ!`
  };
}

module.exports = {
  generateAIRecommendations,
  generateAIChatResponse,
  aiCalculateScore: async (userId, steps, date) => calculateScore(userId, steps, date),
  aiFraudCheck: async (userId, activity) => checkForFraud(userId, activity)
};
