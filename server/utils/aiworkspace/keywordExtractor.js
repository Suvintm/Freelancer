// All Indian cities we recognise (expand this list as needed)
const INDIAN_CITIES = [
  "bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "chennai",
  "pune", "kolkata", "ahmedabad", "jaipur", "surat", "lucknow", "kochi",
  "chandigarh", "indore", "bhopal", "nagpur", "vizag", "coimbatore",
  "mysore", "mysuru", "gurgaon", "gurugram", "noida", "faridabad",
];

// Editing software names and their aliases
const SOFTWARE_MAP = {
  "premiere":       "Premiere Pro",
  "premiere pro":   "Premiere Pro",
  "pp":             "Premiere Pro",
  "davinci":        "DaVinci Resolve",
  "davinci resolve":"DaVinci Resolve",
  "resolve":        "DaVinci Resolve",
  "after effects":  "After Effects",
  "ae":             "After Effects",
  "final cut":      "Final Cut Pro",
  "fcp":            "Final Cut Pro",
  "capcut":         "CapCut",
  "cap cut":        "CapCut",
  "vegas":          "Vegas Pro",
};

// Project type keywords → category
const PROJECT_TYPE_MAP = {
  wedding:     ["wedding", "marriage", "shaadi", "mehendi", "engagement", "reception"],
  youtube:     ["youtube", "yt", "channel", "long form", "long-form", "vlog"],
  reels:       ["reel", "reels", "short", "shorts", "instagram", "insta"],
  podcast:     ["podcast", "interview", "talk show", "conversation"],
  vfx:         ["vfx", "visual effects", "motion", "animation", "3d"],
  cinematic:   ["cinematic", "film", "movie", "narrative", "documentary"],
  fitness:     ["fitness", "gym", "workout", "transformation", "health"],
  ads:         ["ad", "advertisement", "commercial", "brand", "promo"],
  music_video: ["music video", "mv", "album", "song"],
  corporate:   ["corporate", "company", "business", "explainer"],
};

// Style / vibe keywords
const VIBE_MAP = {
  cinematic:   ["cinematic", "epic", "dramatic", "filmic"],
  fast_paced:  ["fast", "dynamic", "energetic", "pumping", "hype"],
  emotional:   ["emotional", "heartfelt", "romantic", "soft", "warm"],
  minimal:     ["minimal", "clean", "simple", "minimal"],
  documentary: ["documentary", "raw", "authentic", "real"],
  colourful:   ["colourful", "vibrant", "bright", "pop"],
};

/**
 * Extract structured requirements from a raw user message.
 * Returns: { cities, softwares, projectTypes, vibes, rawKeywords, budget, deadline }
 * ZERO AI cost — pure JavaScript regex.
 */
export const extractKeywords = (message) => {
  const lower = message.toLowerCase();

  // 1. City detection
  const cities = INDIAN_CITIES.filter(city => lower.includes(city));

  // 2. Software detection
  const softwares = [];
  for (const [alias, canonical] of Object.entries(SOFTWARE_MAP)) {
    if (lower.includes(alias) && !softwares.includes(canonical)) {
      softwares.push(canonical);
    }
  }

  // 3. Project type detection
  const projectTypes = [];
  for (const [type, keywords] of Object.entries(PROJECT_TYPE_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      projectTypes.push(type);
    }
  }

  // 4. Vibe detection
  const vibes = [];
  for (const [vibe, keywords] of Object.entries(VIBE_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      vibes.push(vibe);
    }
  }

  // 5. Budget detection (rough INR amounts)
  const budgetMatch = lower.match(/₹?\s*(\d[\d,]*)\s*(k|thousand|lakh)?/);
  let budget = null;
  if (budgetMatch) {
    let amountStr = budgetMatch[1].replace(/,/g, "");
    let amount = parseInt(amountStr);
    if (budgetMatch[2] === "k") amount *= 1000;
    if (budgetMatch[2] === "thousand") amount *= 1000;
    if (budgetMatch[2] === "lakh") amount *= 100000;
    budget = amount;
  }

  // 6. Deadline urgency
  let deadline = null;
  if (/urgent|asap|today|tomorrow|24 hour/.test(lower)) deadline = "urgent";
  else if (/this week|2 day|3 day/.test(lower)) deadline = "week";
  else if (/next week|fortnight/.test(lower)) deadline = "fortnight";

  // 7. Raw searchable keywords — words > 3 chars, no stopwords
  const stopwords = new Set([
    "need", "want", "looking", "find", "editor", "editing", "video",
    "good", "best", "great", "please", "help", "with", "that", "this",
    "have", "from", "they", "what", "some", "make", "work", "able",
  ]);
  const rawKeywords = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w))
    .slice(0, 8); // cap at 8 keywords

  return { cities, softwares, projectTypes, vibes, budget, deadline, rawKeywords };
};
