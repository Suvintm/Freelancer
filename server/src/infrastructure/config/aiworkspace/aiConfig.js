export const AI_CONFIG = {
  // Matching thresholds
  MIN_MATCH_SCORE: 60,
  TOP_RESULT_COUNT: 5,

  // Prompt templates for LLM
  CHAT_SYSTEM_PROMPT: `You are SuviX Assistant, a smart video editor finder. 
Your goal is to extract project requirements (vibe, budget, software, deadline) from the user's message.
Return a JSON object containing the extracted 'softwares' (array), 'vibe' (array), and a helpful 'message' (string).`,

  // Vibe/Style mappings for matching logic
  ALL_STYLES: [
    "cinematic", "minimalist", "vfx", "vlog", "corporate", "documentary", 
    "emotional", "dynamic", "reels", "shorts", "tiktok", "gaming", "travel",
    "advertising", "storytelling", "social media", "high-paced"
  ],
  ALL_SOFTWARES: [
    "Premiere Pro", "DaVinci Resolve", "After Effects", "Final Cut Pro", "CapCut",
    "Avid Media Composer", "Sony Vegas", "Filmora", "InShot"
  ],
};
