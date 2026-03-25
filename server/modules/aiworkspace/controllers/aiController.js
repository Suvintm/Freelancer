import AIWorkspaceSession from "../models/aiModel.js";
import { asyncHandler } from "../../../middleware/errorHandler.js";
import { findMatchingEditors } from "../../../utils/aiworkspace/aiUtil.js";
import Groq from "groq-sdk";
import { AI_CONFIG } from "../../../config/aiworkspace/aiConfig.js";
import logger from "../../../utils/logger.js";

// Single Groq client — fast + free tiers
const groqApiKey = process.env.GROQ_API_KEY;
let groq = null;

if (groqApiKey && groqApiKey !== "gsk_xxxxxxxxxxxxxx") {
  groq = new Groq({
    apiKey: groqApiKey,
  });
} else {
  logger.warn("[AI] GROQ_API_KEY is missing or placeholder! AI Workspace will use limited fallback.");
}

const GROQ_MODEL = "llama-3.1-8b-instant"; // fast, reliable, free

// Safe JSON parser — handles Llama 3's tendency to wrap JSON in markdown blocks
const safeParseJSON = (text) => {
  try {
    const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const match = clean.match(/(\{[\s\S]*\})/);
    return JSON.parse(match ? match[1] : clean);
  } catch {
    return null;
  }
};

/**
 * @desc    Create AI Workspace Session
 */
export const createAiSession = asyncHandler(async (req, res) => {
  const { sessionType } = req.body;
  const userId = req.user._id;

  const session = await AIWorkspaceSession.create({
    userId,
    sessionType: sessionType || "chat",
  });

  res.status(201).json({
    success: true,
    sessionId: session._id,
  });
});

import { extractKeywords } from "../../../utils/aiworkspace/keywordExtractor.js";
 
/**
 * @desc    Process natural chat message
 */
export const processAiChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const { id: sessionId } = req.params;

  const session = await AIWorkspaceSession.findOne({
    _id: sessionId,
    userId: req.user._id,
  });
  if (!session) { res.status(404); throw new Error("Session not found"); }
  if (session.messages.length >= 100) {
    res.status(429); throw new Error("Conversation limit reached. Tap 'NEW CHAT' above to start a fresh session!");
  }

  // 1. Record user message
  session.messages.push({ role: "user", content: message });

  // 2. Extract keywords (Free, no AI)
  const requirements = extractKeywords(message);

  // 3. Pre-filter from MongoDB (Free, no AI)
  // Returns top 15 editors scored by relevance — each ~80 tokens
  const candidates = await findMatchingEditors(requirements);

  let conversationalResponse = "I'm finding the best editors for you...";
  let rankedMatches = candidates;

  const hasRequirements = requirements.softwares.length > 0 || requirements.projectTypes.length > 0 || requirements.vibes.length > 0 || requirements.cities.length > 0;

  // 4. Call AI ONLY IF we have candidates (Saves tokens + faster)
  if (groq && candidates.length > 0) {
    // Build lean context for AI ranking
    const editorContext = candidates.map(e => ({
      id:         e._id.toString(),
      skills:     e.skills,
      softwares:  e.softwares,
      about:      e.about,
      experience: e.experience,
      location:   e.location,
      rating:     e.rating,
      score:      e.suvixScore,
      available:  e.available,
      reelMatch:  e.reelMatch,
    }));

    const recentMessages = session.messages
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        max_tokens: 500,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are SuviX Match Assistant. Help clients find video editors.
User requirement: ${JSON.stringify(requirements)}

Filtered Candidates:
${JSON.stringify(editorContext)}

Rules:
- reelMatch=true means this editor has reels matching the topic — weight this HIGHEST.
- cityMatch=true means this editor is actually in the requested city.
- If the user asked for a city (requirements.cities is not empty) BUT no editors have cityMatch:true, you MUST start your message with a polite apology (e.g., "I don't have editors in [City] yet, but here are the top experts who can work remotely...").
- Rank by: reel relevance > cityMatch > software match > suvixScore.
- Keep reasons short (1 sentence), mention specific match points.
- Respond ONLY with JSON: {"message":"your conversational response","editors":[{"id":"...","rank":1,"matchScore":95,"reason":"..."}]}`
          },
          ...recentMessages,
        ],
      });

      const parsed = safeParseJSON(response.choices[0].message.content);
      if (parsed?.editors) {
        conversationalResponse = parsed.message || conversationalResponse;
        
        // Merge AI ranking and truncate to top 5
        rankedMatches = parsed.editors
          .map(aiResult => {
            const cand = candidates.find(c => c._id.toString() === aiResult.id);
            if (!cand) return null;
            return {
              ...cand,
              matchScore: aiResult.matchScore || 70,
              reason:     aiResult.reason || "High-quality match",
              rank:       aiResult.rank,
            };
          })
          .filter(Boolean)
          .sort((a,b) => a.rank - b.rank)
          .slice(0, 5);

        session.totalInputTokens  = (session.totalInputTokens  || 0) + (response.usage?.prompt_tokens || 0);
        session.totalOutputTokens = (session.totalOutputTokens || 0) + (response.usage?.completion_tokens || 0);
      }
    } catch (err) {
      logger.error("[AI Chat] Groq Error:", err.message);
      rankedMatches = candidates.slice(0, 5); // Fallback
    }
  } else if (!hasRequirements && candidates.length === 0) {
    conversationalResponse = "Hi! I'm here to help you find editors. Tell me about your project (e.g., 'I need a wedding editor in Mumbai').";
  } else if (candidates.length === 0) {
    conversationalResponse = "I couldn't find any editors matching those exact requirements. Try adjusting your software or style preferences.";
  }

  // 5. Record assistant response
  const assistantResponse = {
    role: "assistant", 
    content: conversationalResponse,
    results: rankedMatches.map((m) => ({
      editorId: m._id,
      matchScore: m.matchScore,
      reason: m.reason,
    })),
    searchPerformed: hasRequirements
  };

  session.messages.push(assistantResponse);
  session.lastResults = assistantResponse.results;
  await session.save();

  res.status(200).json({
    success: true,
    message: {
      ...assistantResponse,
      editors: rankedMatches,
    },
  });
});

/**
 * @desc    Process guided questionnaire
 */
export const processGuidedMatch = asyncHandler(async (req, res) => {
  const { projectType, softwares, vibe, budget, deadline } = req.body;
  const { id: sessionId } = req.params;

  const session = await AIWorkspaceSession.findOne({
    _id: sessionId,
    userId: req.user._id,
  });
  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  session.guidedAnswers = { projectType, softwares, vibe, budget, deadline };
  let aiRankings = null;

  if (groq) {
    try {
      const candidates = await findMatchingEditors({ projectType, softwares, vibe, budget });

      if (candidates.length > 0) {
        const editorContext = candidates.slice(0, 15).map((e) => ({
          id: e._id.toString(),
          skills: e.skills?.slice(0, 6) || [],
          softwares: e.softwares?.slice(0, 4) || [],
          experience: e.experience || "Not specified",
          rating: e.ratingStats?.averageRating?.toFixed(1) || "New",
          suvixScore: e.user?.suvixScore?.total || 0,
        }));

        const response = await groq.chat.completions.create({
          model: GROQ_MODEL,
          max_tokens: 800,
          temperature: 0,
          messages: [
            {
              role: "system",
              content: "You are a matching engine for SuviX. Pick top 5 editors and explain why."
            },
            {
              role: "user",
              content: `Project: ${projectType}, Software: ${softwares}, vibe: ${vibe}, budget: ${budget}
              
              Editors: ${JSON.stringify(editorContext)}
              
              Return JSON array ONLY: [{"editorId":"id","rank":1,"matchScore":95,"reason":"why"}]`
            }
          ],
        });

        const parsed = safeParseJSON(response.choices[0].message.content);
        if (Array.isArray(parsed)) {
          aiRankings = parsed;
          session.totalInputTokens  = (session.totalInputTokens  || 0) + (response.usage?.prompt_tokens || 0);
          session.totalOutputTokens = (session.totalOutputTokens || 0) + (response.usage?.completion_tokens || 0);
        }
      }
    } catch (err) {
      logger.error("[Guided Match] Groq error:", err);
    }
  }

  const finalMatches = await findMatchingEditors({ projectType, softwares, vibe, budget, deadline });
  const enrichedMatches = finalMatches.map((editor) => {
    const aiData = aiRankings?.find((r) => r.editorId === editor._id.toString());
    return {
      ...editor,
      matchScore: aiData?.matchScore ?? editor.matchScore,
      reason:     aiData?.reason     ?? editor.reason,
      rank:       aiData?.rank       ?? 99,
    };
  }).sort((a, b) => a.rank - b.rank);

  session.lastResults = enrichedMatches.slice(0, 5).map((m) => ({
    editorId: m.editorId,
    matchScore: m.matchScore,
    reason: m.reason,
  }));
  session.status = "completed";
  await session.save();

  res.status(200).json({
    success: true,
    editors: enrichedMatches.slice(0, 5),
  });
});
