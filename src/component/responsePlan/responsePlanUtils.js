const GENERIC_PLACE_TERMS = new Set([
  "day",
  "stop",
  "departure",
  "arrival",
  "check",
  "checkin",
  "checkout",
  "morning",
  "afternoon",
  "evening",
  "night",
  "breakfast",
  "lunch",
  "dinner",
  "hotel",
  "accommodation",
  "activity",
  "sightseeing",
  "transfer",
  "travel",
  "trip",
  "destination",
  "summary",
  "itinerary",
  "plan",
  "strategy",
  "allocation",
  "checklist",
  "logistics",
  "booking",
  "risk",
  "risks",
  "alternative",
  "alternatives",
  "outline",
  "guide",
  "companion",
  "wallet",
  "dashboard",
  "response",
  "food",
  "mobility",
  "mission",
  "missions",
  "headline",
  "insight",
  "insights",
  "rest",
  "free",
  "time",
  "route",
  "transport",
  "local",
  "city",
  "town",
  "area",
  "region",
  "camp",
  "museum",
  "park",
  "beach",
]);

const WIKIPEDIA_SEARCH_API = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_SUMMARY_API =
  "https://en.wikipedia.org/api/rest_v1/page/summary/";
const OPEN_METEO_GEOCODE_API = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FORECAST_API = "https://api.open-meteo.com/v1/forecast";
const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

const placePhotoCache = new Map();
const placeWeatherCache = new Map();

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9008"
).replace(/\/$/, "");

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const DRIVE_ROOT_FOLDER_NAME = "Trip Memories";

export function formatTimestamp(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function parseMarkdownSections(md = "") {
  const text = String(md || "").trim();
  if (!text) return [];

  const normalized = text.replace(/\r\n/g, "\n");
  const parts = normalized.split(/\n(?=##\s+)/g);

  if (parts.length === 1 && !/^##\s+/.test(parts[0])) {
    return [{ title: "AI Response", content: normalized }];
  }

  return parts
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const first = lines[0] || "";
      const title = first.replace(/^##\s+/, "").trim() || "Untitled";
      const content = lines.slice(1).join("\n").trim();
      return { title, content };
    });
}

export function extractBudgetItems(sections) {
  const target = sections.find((s) => /budget allocation/i.test(s.title || ""));
  if (!target?.content) return [];

  const lines = target.content.split("\n").map((l) => l.trim());
  const items = [];
  for (const line of lines) {
    const cleaned = line
      .replace(/^[*-]\s+/, "")
      .replace(/\*\*/g, "")
      .trim();

    const match = cleaned.match(/^(.+?):\s*(.+)$/);
    if (match) {
      items.push({ label: match[1].trim(), value: match[2].trim() });
    }
  }
  return items;
}

export function extractDays(sections) {
  const target = sections.find((s) => /(day-by-day|itinerary)/i.test(s.title || ""));
  if (!target?.content) return [];
  const lines = target.content.split("\n");
  const days = [];

  let currentDay = null;

  const pushCurrentDay = () => {
    if (!currentDay) return;
    const merged = [currentDay.title, ...currentDay.details]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (merged) {
      days.push({
        day: currentDay.day,
        text: merged,
      });
    }
    currentDay = null;
  };

  for (const rawLine of lines) {
    const line = String(rawLine || "")
      .replace(/^\s*#+\s*/, "")
      .trim();
    if (!line) continue;

    const dayMatch = line.match(
      /^(?:[*-]\s*)?\*{0,2}\s*Day\s+(\d+)\s*\*{0,2}\s*:?\s*(.*)$/i
    );

    if (dayMatch) {
      pushCurrentDay();
      currentDay = {
        day: Number(dayMatch[1]),
        title: dayMatch[2].trim(),
        details: [],
      };
      continue;
    }

    if (!currentDay) continue;
    const cleaned = line
      .replace(/^(?:[*-]\s*)/, "")
      .replace(/\*\*/g, "")
      .trim();
    if (cleaned) currentDay.details.push(cleaned);
  }

  pushCurrentDay();
  return days;
}

function ensureSentence(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function sanitizeTimelineText(value = "") {
  return String(value || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/[*_`>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildTimelineHeadline(text = "", place = "", index = 0) {
  const cleaned = sanitizeTimelineText(text)
    .replace(/^\(?[A-Za-z]{3,9}\s+\d{1,2}\)?\s*:\s*/i, "")
    .trim();
  const firstSentence = cleaned.split(/[.!?]/).find((item) => item.trim());
  if (firstSentence?.trim()) return firstSentence.trim();
  if (place) return `Travel focus in ${place}`;
  return `Trip highlight ${index + 1}`;
}

export function buildDetailedTimelineText(text = "", place = "", dayLabel = "") {
  const cleaned = sanitizeTimelineText(text);

  if (cleaned.length >= 210) return cleaned;

  const prefix = ensureSentence(
    cleaned || `Explore ${place || "the destination"}`
  );
  const operations = ensureSentence(
    `Build the day around an efficient flow between key stops, local food moments, and practical transfer windows in ${
      place || "this area"
    }`
  );
  const outcome = ensureSentence(
    `Capture notes, timing learnings, and standout experiences from ${
      dayLabel || "this stop"
    } so future planning gets faster and more accurate`
  );

  return [prefix, operations, outcome].filter(Boolean).join(" ");
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sanitizeFileToken(value = "") {
  return String(value || "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

export function buildMemoryUploadName(fileName = "", dayLabel = "", index = 0) {
  const raw = String(fileName || "");
  const extMatch = raw.match(/\.[a-zA-Z0-9]+$/);
  const extension = extMatch ? extMatch[0].toLowerCase() : ".jpg";
  const bare = raw.replace(/\.[a-zA-Z0-9]+$/, "");
  const safeBare =
    sanitizeFileToken(bare).slice(0, 40) || `memory-${index + 1}`;
  const safeDay = sanitizeFileToken(dayLabel).slice(0, 24) || "trip";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${safeDay}-${stamp}-${safeBare}${extension}`;
}

export function buildMemoryDetail(caption = "", dayLabel = "", fileName = "") {
  const intro = ensureSentence(
    caption || `${fileName || "Photo"} captured for ${dayLabel || "this trip"}`
  );
  const body = ensureSentence(
    `This memory keeps visual context from ${
      dayLabel || "the itinerary"
    } so the team can revisit what worked, refine logistics, and reuse the same route intelligence later`
  );
  return [intro, body].filter(Boolean).join(" ");
}

function buildDriveImageCandidates(record = {}) {
  const fileId = String(record.driveFileId || "").trim();
  const manual = [
    record.drivePublicImageUrl,
    record.driveThumbnailLink,
    record.image,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (!fileId) return uniqueTextList(manual, 8);

  const generated = [
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1600`,
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      fileId
    )}&sz=w1600`,
    `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`,
  ];

  return uniqueTextList([...manual, ...generated], 10);
}

export function normalizeMemoryRecord(record = {}) {
  const imageCandidates = buildDriveImageCandidates(record);
  const imageUrl = imageCandidates[0] || "";
  return {
    id: String(
      record._id ||
        record.id ||
        `${record.driveFileId || "memory"}_${record.createdAt || ""}`
    ),
    title: String(record.title || "Trip Memory"),
    detail: String(record.detail || ""),
    dayLabel: String(record.dayLabel || ""),
    tags: Array.isArray(record.tags)
      ? record.tags.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    imageUrl,
    imageCandidates,
    driveFileId: String(record.driveFileId || ""),
    driveWebViewLink: String(record.driveWebViewLink || ""),
    createdAt: String(record.createdAt || ""),
  };
}

async function driveJsonRequest(url, { method = "GET", token, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Google Drive request failed");
  }
  return payload;
}

export async function findOrCreateDriveFolder(token, folderName, parentId = "") {
  const safeName = String(folderName || "").replace(/'/g, "\\'");
  const parentFilter = parentId ? `'${parentId}' in parents and ` : "";
  const query = `${parentFilter}mimeType='application/vnd.google-apps.folder' and name='${safeName}' and trashed=false`;
  const searchUrl =
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}` +
    "&fields=files(id,name)&pageSize=1&spaces=drive";

  const found = await driveJsonRequest(searchUrl, { token });
  const firstFolder = found?.files?.[0];
  if (firstFolder?.id) return firstFolder.id;

  const created = await driveJsonRequest(`${DRIVE_API_BASE}/files`, {
    method: "POST",
    token,
    body: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    },
  });

  if (!created?.id) {
    throw new Error("Unable to create Drive folder");
  }

  return created.id;
}

export async function uploadImageToDrive(
  token,
  file,
  { folderId = "", name = "" } = {}
) {
  const boundary = `trip-memory-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
  const metadata = {
    name: name || file.name || `memory-${Date.now()}.jpg`,
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const body = new Blob(
    [
      `--${boundary}\r\n`,
      "Content-Type: application/json; charset=UTF-8\r\n\r\n",
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
      file,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const response = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "Image upload to Google Drive failed"
    );
  }
  return payload;
}

export async function makeDriveFilePublic(token, fileId = "") {
  if (!fileId) return;
  await driveJsonRequest(
    `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}/permissions`,
    {
      method: "POST",
      token,
      body: {
        role: "reader",
        type: "anyone",
      },
    }
  );
}

export async function fetchDriveImageBlobUrl(accessToken = "", fileId = "") {
  if (!accessToken || !fileId) return "";

  const response = await fetch(
    `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Drive image bytes");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export function uniqueTextList(values = [], max = 12) {
  const seen = new Set();
  const items = [];
  for (const value of values) {
    const cleaned = String(value || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(cleaned);
    if (items.length >= max) break;
  }
  return items;
}

function normalizeGenericToken(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isGenericPlaceName(value = "") {
  const cleaned = String(value || "")
    .replace(/[,:;.!?]+$/g, "")
    .trim();
  if (!cleaned) return true;
  if (/^day\s+\d+/i.test(cleaned)) return true;

  const tokens = cleaned
    .split(/\s+/)
    .map(normalizeGenericToken)
    .filter(Boolean);
  if (!tokens.length) return true;

  const genericCount = tokens.filter((token) =>
    GENERIC_PLACE_TERMS.has(token)
  ).length;

  return (
    genericCount === tokens.length || (tokens.length === 1 && genericCount)
  );
}

function normalizePlaceCandidate(candidate = "") {
  const stopWords = new Set([
    "for",
    "with",
    "and",
    "then",
    "before",
    "after",
    "plus",
    "including",
    "via",
    "around",
    "near",
  ]);

  const words = String(candidate || "")
    .replace(/[,:;.!?]+$/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const result = [];
  for (const word of words) {
    const normalizedWord = word.trim();
    if (!normalizedWord) continue;
    if (result.length && stopWords.has(normalizedWord.toLowerCase())) break;
    result.push(normalizedWord);
  }

  const place = result.join(" ").trim();
  return place || "Trip destination";
}

export function extractDestinationHints(sourcePlanText = "") {
  const normalized = String(sourcePlanText || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return [];

  const candidates = [];
  const contextualRegex =
    /\b(?:in|at|to|around|near|from|visit|explore|discover|stay in|base in)\s+([A-Z][A-Za-z'.-]*(?:\s+[A-Z][A-Za-z'.-]*){0,4})/g;

  let match;
  while ((match = contextualRegex.exec(normalized)) !== null) {
    const place = normalizePlaceCandidate(match[1]);
    if (!isGenericPlaceName(place)) candidates.push(place);
  }

  const titleCaseRegex = /\b([A-Z][A-Za-z'.-]*(?:\s+[A-Z][A-Za-z'.-]*){1,3})\b/g;
  while ((match = titleCaseRegex.exec(normalized)) !== null) {
    const place = normalizePlaceCandidate(match[1]);
    if (!isGenericPlaceName(place)) candidates.push(place);
  }

  return uniqueTextList(candidates, 8);
}

export function inferPlaceName(dayText = "", fallbackPlaces = []) {
  const normalized = sanitizeTimelineText(dayText);

  const fallback = fallbackPlaces.find((item) => !isGenericPlaceName(item));
  if (!normalized) return fallback || "Trip destination";

  const contextualRegex =
    /\b(?:in|at|to|around|near|from)\s+([A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){0,4})/gi;
  let match;
  while ((match = contextualRegex.exec(normalized)) !== null) {
    const candidate = normalizePlaceCandidate(match[1]);
    if (!isGenericPlaceName(candidate)) return candidate;
  }

  const titleCaseRegex = /([A-Z][A-Za-z'.-]*(?:\s+[A-Z][A-Za-z'.-]*){0,4})/g;
  while ((match = titleCaseRegex.exec(normalized)) !== null) {
    const candidate = normalizePlaceCandidate(match[1]);
    if (!isGenericPlaceName(candidate)) return candidate;
  }

  const firstWords = normalizePlaceCandidate(
    normalized.split(/\s+/).slice(0, 4).join(" ")
  );
  if (!isGenericPlaceName(firstWords)) return firstWords;
  return fallback || "Trip destination";
}

function normalizePlaceLabel(value = "") {
  return String(value || "")
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9)\]]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPlacesFromTimelineText(dayText = "", fallbackPlaces = []) {
  const normalized = sanitizeTimelineText(dayText);
  const candidates = [];

  const contextualRegex =
    /\b(?:arrive at|visit|explore|transfer to|check in at|stay in|dinner at|lunch at|breakfast at|near|around|at|in|to)\s+([A-Z][A-Za-z0-9'.-]*(?:\s+[A-Z][A-Za-z0-9'.-]*){0,5}(?:\s+\([A-Z0-9]{2,5}\))?)/gi;
  let match;
  while ((match = contextualRegex.exec(normalized)) !== null) {
    candidates.push(normalizePlaceLabel(match[1]));
  }

  const alternativesRegex =
    /\b([A-Z][A-Za-z0-9'.-]*(?:\s+[A-Z][A-Za-z0-9'.-]*){0,3})\s+or\s+([A-Z][A-Za-z0-9'.-]*(?:\s+[A-Z][A-Za-z0-9'.-]*){0,3})/g;
  while ((match = alternativesRegex.exec(normalized)) !== null) {
    candidates.push(normalizePlaceLabel(match[1]));
    candidates.push(normalizePlaceLabel(match[2]));
  }

  const titleCaseRegex =
    /\b([A-Z][A-Za-z0-9'.-]*(?:\s+[A-Z][A-Za-z0-9'.-]*){1,4}(?:\s+\([A-Z0-9]{2,5}\))?)/g;
  while ((match = titleCaseRegex.exec(normalized)) !== null) {
    candidates.push(normalizePlaceLabel(match[1]));
  }

  const filtered = uniqueTextList(candidates, 10).filter((candidate) => {
    if (!candidate || candidate.length < 3) return false;
    if (
      /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(
        candidate
      )
    ) {
      return false;
    }
    return !isGenericPlaceName(candidate);
  });

  if (filtered.length) return filtered.slice(0, 4);
  const fallback = fallbackPlaces.find((item) => !isGenericPlaceName(item));
  return fallback ? [fallback] : ["Trip destination"];
}

function splitTimelineSentences(dayText = "") {
  const normalized = sanitizeTimelineText(dayText);
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 12);
}

function inferPlaceCategory(placeName = "", sentence = "") {
  const source = `${placeName} ${sentence}`.toLowerCase();
  if (/airport|terminal/.test(source)) return "Arrival Hub";
  if (/hotel|hostel|stay|check in/.test(source)) return "Stay";
  if (/restaurant|cafe|bistro|dinner|lunch|breakfast|food/.test(source))
    return "Food Spot";
  if (/museum|gallery|palace|temple|cathedral|historic/.test(source))
    return "Cultural Site";
  if (/park|garden|beach|river|mountain/.test(source)) return "Nature";
  if (/market|street|district|neighborhood|neighbourhood/.test(source))
    return "Local Area";
  return "Attraction";
}

function inferBestVisitWindow(sentence = "", index = 0) {
  const source = sentence.toLowerCase();
  if (/morning|sunrise|breakfast/.test(source)) return "Morning";
  if (/afternoon|lunch/.test(source)) return "Afternoon";
  if (/evening|night|sunset|dinner/.test(source)) return "Evening";
  const defaults = ["Morning", "Afternoon", "Evening", "Anytime"];
  return defaults[index % defaults.length];
}

function inferRecommendedDuration(category = "", sentence = "") {
  const source = sentence.toLowerCase();
  if (category === "Arrival Hub") return "1-2 hours";
  if (category === "Stay") return "45-90 min";
  if (category === "Food Spot") return "60-90 min";
  if (category === "Cultural Site") return "1.5-3 hours";
  if (category === "Nature") return "1-2.5 hours";
  if (/quick|short/.test(source)) return "30-60 min";
  return "1-2 hours";
}

function findBestSentenceForPlace(sentences = [], placeName = "") {
  const place = String(placeName || "")
    .trim()
    .toLowerCase();
  if (!place) return sentences[0] || "";
  const tokens = place.split(/\s+/).filter((item) => item.length > 2);

  const strongMatch = sentences.find((sentence) =>
    tokens.every((token) => sentence.toLowerCase().includes(token))
  );
  if (strongMatch) return strongMatch;

  const partialMatch = sentences.find((sentence) =>
    tokens.some((token) => sentence.toLowerCase().includes(token))
  );
  if (partialMatch) return partialMatch;

  return sentences[0] || "";
}

export function buildPlaceVisitDetails({
  dayText = "",
  places = [],
  dayLabel = "",
  destinationHint = "",
}) {
  const sentences = splitTimelineSentences(dayText);
  const normalizedPlaces = uniqueTextList(places, 6).slice(0, 6);

  return normalizedPlaces.map((placeName, index) => {
    const sentence = findBestSentenceForPlace(sentences, placeName);
    const category = inferPlaceCategory(placeName, sentence);
    const bestTime = inferBestVisitWindow(sentence, index);
    const duration = inferRecommendedDuration(category, sentence);
    const summary =
      sentence ||
      `${placeName} is a useful stop during ${dayLabel || "this day"} in ${
        destinationHint || "your destination"
      }.`;

    return {
      id: `place_detail_${index}_${placeName}`.toLowerCase(),
      name: placeName,
      category,
      bestTime,
      duration,
      summary,
      tip: "Keep this stop close to nearby activities to reduce transfer time and maintain flow.",
      mapUrl: buildGoogleMapsLink(placeName, destinationHint, dayText),
      streetViewUrl: `${buildGoogleMapsLink(
        placeName,
        destinationHint,
        dayText
      )}&layer=c`,
      order: index + 1,
    };
  });
}

export function inferApproxWeatherFromText(text = "") {
  const normalized = sanitizeTimelineText(text).toLowerCase();
  const monthMatch = normalized.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/
  );

  const monthMap = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  const monthToken = String(monthMatch?.[1] || "").toLowerCase();
  const monthIndex = monthToken in monthMap ? monthMap[monthToken] : -1;

  if (monthIndex === -1) {
    return "Approx weather varies • Check live forecast before departure";
  }

  if ([11, 0, 1].includes(monthIndex)) {
    return "Cool to cold • Around 0-10°C";
  }
  if ([2, 3, 4].includes(monthIndex)) {
    return "Mild spring-like • Around 10-20°C";
  }
  if ([5, 6, 7].includes(monthIndex)) {
    return "Warm to hot • Around 22-32°C";
  }
  return "Pleasant to cool • Around 12-24°C";
}

function weatherCodeToLabel(code) {
  const labels = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent rain showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm with hail",
  };
  return labels[Number(code)] || "Variable conditions";
}

export async function resolveApproxWeather({
  placeName = "",
  destinationHint = "",
  dayText = "",
}) {
  const cacheKey = `${placeName}__${destinationHint}`.toLowerCase();
  if (placeWeatherCache.has(cacheKey)) {
    return placeWeatherCache.get(cacheKey);
  }

  const fallback = inferApproxWeatherFromText(dayText);

  try {
    const query = uniqueTextList([placeName, destinationHint], 2).join(", ");
    const geocodeUrl =
      `${OPEN_METEO_GEOCODE_API}?name=${encodeURIComponent(query)}` +
      "&count=1&language=en&format=json";
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) throw new Error("Geocode request failed");

    const geocodePayload = await geocodeResponse.json();
    const result = geocodePayload?.results?.[0];
    if (!result?.latitude || !result?.longitude) {
      placeWeatherCache.set(cacheKey, fallback);
      return fallback;
    }

    const forecastUrl =
      `${OPEN_METEO_FORECAST_API}?latitude=${encodeURIComponent(
        result.latitude
      )}` +
      `&longitude=${encodeURIComponent(result.longitude)}` +
      "&current=temperature_2m,weather_code,wind_speed_10m" +
      "&daily=temperature_2m_max,temperature_2m_min&timezone=auto";

    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error("Forecast request failed");

    const forecastPayload = await forecastResponse.json();
    const currentTemp = Number(forecastPayload?.current?.temperature_2m);
    const weatherCode = Number(forecastPayload?.current?.weather_code);
    const minTemp = Number(forecastPayload?.daily?.temperature_2m_min?.[0]);
    const maxTemp = Number(forecastPayload?.daily?.temperature_2m_max?.[0]);

    const tempPart =
      Number.isFinite(minTemp) && Number.isFinite(maxTemp)
        ? `${Math.round(minTemp)}-${Math.round(maxTemp)}°C`
        : Number.isFinite(currentTemp)
        ? `${Math.round(currentTemp)}°C`
        : "";

    const weatherLabel = weatherCodeToLabel(weatherCode);
    const resolved = uniqueTextList([tempPart, weatherLabel], 2).join(" • ");
    const finalValue = resolved || fallback;

    placeWeatherCache.set(cacheKey, finalValue);
    return finalValue;
  } catch {
    placeWeatherCache.set(cacheKey, fallback);
    return fallback;
  }
}

export function buildGoogleMapsLink(
  placeName = "",
  destinationHint = "",
  timelineText = ""
) {
  const cleanedPlace = normalizePlaceLabel(placeName);
  const fallbackPlace = inferPlaceName(timelineText, [destinationHint]);
  const primary =
    cleanedPlace || fallbackPlace || destinationHint || "Trip destination";
  const primaryTokenCount = primary.split(/\s+/).filter(Boolean).length;
  const shouldAppendHint =
    Boolean(destinationHint) &&
    primaryTokenCount <= 1 &&
    !/\([A-Z0-9]{2,5}\)/.test(primary);
  const query = shouldAppendHint
    ? uniqueTextList([primary, destinationHint], 2).join(" ")
    : primary;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query || "Trip destination"
  )}`;
}

export function buildPlaceImageLink(placeName = "", destinationHint = "") {
  const query = encodeURIComponent(
    uniqueTextList([
      placeName || "travel destination",
      destinationHint,
      "landmark",
      "travel",
    ]).join(" ")
  );
  return `https://source.unsplash.com/1200x800/?${query}`;
}

export function buildPlaceFallbackImageLink(seed = "") {
  return `https://picsum.photos/seed/${encodeURIComponent(
    seed || "trip"
  )}/1200/800`;
}

function buildWikipediaPhotoQueries({
  placeName = "",
  destinationHint = "",
  timelineText = "",
}) {
  const shortTimelineText = String(timelineText || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8)
    .join(" ");

  const candidates = [
    placeName,
    `${placeName} ${destinationHint}`.trim(),
    `${placeName} landmark`,
    `${placeName} tourism`,
    `${destinationHint} landmark`.trim(),
    shortTimelineText,
  ];

  return uniqueTextList(candidates, 5);
}

export async function resolveWikipediaPhoto({
  placeName = "",
  destinationHint = "",
  timelineText = "",
}) {
  const cacheKey = `${placeName}__${destinationHint}`.toLowerCase();
  if (placePhotoCache.has(cacheKey)) {
    return placePhotoCache.get(cacheKey) || "";
  }

  const queries = buildWikipediaPhotoQueries({
    placeName,
    destinationHint,
    timelineText,
  });

  for (const query of queries) {
    try {
      const searchUrl =
        `${WIKIPEDIA_SEARCH_API}?action=query&list=search` +
        `&srsearch=${encodeURIComponent(query)}` +
        "&utf8=1&format=json&origin=*";

      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) continue;

      const searchPayload = await searchResponse.json();
      const firstResult = (searchPayload?.query?.search || []).find((item) => {
        const title = String(item?.title || "").trim();
        return title && !isGenericPlaceName(title);
      });

      const pageTitle = String(firstResult?.title || "").trim();
      if (!pageTitle) continue;

      const summaryResponse = await fetch(
        `${WIKIPEDIA_SUMMARY_API}${encodeURIComponent(pageTitle)}`
      );
      if (!summaryResponse.ok) continue;

      const summaryPayload = await summaryResponse.json();
      const imageUrl =
        summaryPayload?.originalimage?.source ||
        summaryPayload?.thumbnail?.source ||
        "";

      if (imageUrl) {
        placePhotoCache.set(cacheKey, imageUrl);
        return imageUrl;
      }
    } catch {
      // Ignore network/format errors and continue with fallback sources.
    }
  }

  placePhotoCache.set(cacheKey, "");
  return "";
}

export function toGuideList(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

export function toGuideObjectList(value, fields = []) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const next = {};
      for (const field of fields) {
        next[field] = String(item[field] || "").trim();
      }
      const hasAny = Object.values(next).some(Boolean);
      return hasAny ? next : null;
    })
    .filter(Boolean)
    .slice(0, 8);
}

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity script")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity script"));
    document.head.appendChild(script);
  });
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read selected file"));
    reader.readAsDataURL(file);
  });
}
