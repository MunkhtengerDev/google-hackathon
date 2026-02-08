
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Wallet,
  Camera,
  Zap,
  RefreshCcw,
  Copy,
  Download,
  ChevronRight,
  Cloud,
  CloudSun,
  FolderPlus,
  MapPin,
  Clock,
  Sparkles,
  Shield,
  Utensils,
  Luggage,
  Loader2,
  UploadCloud,
  Link as LinkIcon,
} from "lucide-react";
import { Card, SectionHeader } from "../../ui/primitives";
import RightNowLiveAssistant from "./RightNowLiveAssistant";

function formatTimestamp(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

/**
 * Minimal markdown parser for your AI output:
 * - Splits by H2 (##) into sections
 * - Keeps content as plain text blocks
 * - Also extracts a quick "Budget Allocation" list if present
 */
function parseMarkdownSections(md = '') {
  const text = String(md || '').trim();
  if (!text) return [];

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n');

  // Split by "## "
  const parts = normalized.split(/\n(?=##\s+)/g);

  // If the response doesn't contain "##", treat as one section
  if (parts.length === 1 && !/^##\s+/.test(parts[0])) {
    return [{ title: 'AI Response', content: normalized }];
  }

  const sections = parts
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n');
      const first = lines[0] || '';
      const title = first.replace(/^##\s+/, '').trim() || 'Untitled';
      const content = lines.slice(1).join('\n').trim();
      return { title, content };
    });

  return sections;
}

/** Extract budget lines like "* Flights: $1500" from a "Budget Allocation" section */
function extractBudgetItems(sections) {
  const target = sections.find((s) => /budget allocation/i.test(s.title || ''));
  if (!target?.content) return [];

  const lines = target.content.split('\n').map((l) => l.trim());
  const items = [];
  for (const line of lines) {
    // match "- **Flights ...:** $1500" or "* Flights ...: $1500"
    const cleaned = line
      .replace(/^[*-]\s+/, '')
      .replace(/\*\*/g, '')
      .trim();

    const m = cleaned.match(/^(.+?):\s*(.+)$/);
    if (m) {
      items.push({ label: m[1].trim(), value: m[2].trim() });
    }
  }
  return items;
}

/** Day-by-day extractor that keeps each day as a fuller narrative block. */
function extractDays(sections) {
  const target = sections.find((s) =>
    /(day-by-day|itinerary)/i.test(s.title || ''),
  );
  if (!target?.content) return [];
  const lines = target.content.split('\n');
  const days = [];

  let currentDay = null;

  const pushCurrentDay = () => {
    if (!currentDay) return;
    const merged = [currentDay.title, ...currentDay.details]
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
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
    const line = String(rawLine || '')
      .replace(/^\s*#+\s*/, '')
      .trim();
    if (!line) continue;

    const dayMatch = line.match(
      /^(?:[*-]\s*)?\*{0,2}\s*Day\s+(\d+)\s*\*{0,2}\s*:?\s*(.*)$/i,
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
      .replace(/^(?:[*-]\s*)/, '')
      .replace(/\*\*/g, '')
      .trim();
    if (cleaned) currentDay.details.push(cleaned);
  }

  pushCurrentDay();
  return days;
}

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
const WIKIPEDIA_SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const placePhotoCache = new Map();
const placeWeatherCache = new Map();
const OPEN_METEO_GEOCODE_API = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FORECAST_API = "https://api.open-meteo.com/v1/forecast";
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9008"
).replace(/\/$/, "");
const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_ROOT_FOLDER_NAME = "Trip Memories";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

function loadGoogleIdentityScript() {
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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read selected file"));
    reader.readAsDataURL(file);
  });
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

function buildTimelineHeadline(text = "", place = "", index = 0) {
  const cleaned = sanitizeTimelineText(text)
    .replace(/^\(?[A-Za-z]{3,9}\s+\d{1,2}\)?\s*:\s*/i, "")
    .trim();
  const firstSentence = cleaned.split(/[.!?]/).find((item) => item.trim());
  if (firstSentence?.trim()) return firstSentence.trim();
  if (place) return `Travel focus in ${place}`;
  return `Trip highlight ${index + 1}`;
}

function buildDetailedTimelineText(text = "", place = "", dayLabel = "") {
  const cleaned = sanitizeTimelineText(text);

  if (cleaned.length >= 210) return cleaned;

  const prefix = ensureSentence(cleaned || `Explore ${place || "the destination"}`);
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

function formatFileSize(bytes) {
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

function buildMemoryUploadName(fileName = "", dayLabel = "", index = 0) {
  const raw = String(fileName || "");
  const extMatch = raw.match(/\.[a-zA-Z0-9]+$/);
  const extension = extMatch ? extMatch[0].toLowerCase() : ".jpg";
  const bare = raw.replace(/\.[a-zA-Z0-9]+$/, "");
  const safeBare = sanitizeFileToken(bare).slice(0, 40) || `memory-${index + 1}`;
  const safeDay = sanitizeFileToken(dayLabel).slice(0, 24) || "trip";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${safeDay}-${stamp}-${safeBare}${extension}`;
}

function buildMemoryDetail(caption = "", dayLabel = "", fileName = "") {
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

function normalizeMemoryRecord(record = {}) {
  const imageCandidates = buildDriveImageCandidates(record);
  const imageUrl = imageCandidates[0] || "";
  return {
    id: String(record._id || record.id || `${record.driveFileId || "memory"}_${record.createdAt || ""}`),
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

function MemoryImage({ memory, resolvedBlobUrl = "" }) {
  const candidates = useMemo(
    () =>
      uniqueTextList(
        [
          resolvedBlobUrl,
          ...(Array.isArray(memory?.imageCandidates) ? memory.imageCandidates : []),
        ].filter(Boolean),
        12
      ),
    [resolvedBlobUrl, memory?.imageCandidates]
  );

  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [memory?.id, resolvedBlobUrl]);

  const src = candidates[candidateIndex] || "";
  if (!src) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center bg-white text-[12px] text-[#6a7b84]">
        No preview available
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={memory?.title || "Memory image"}
      loading="lazy"
      className="aspect-[4/3] w-full object-cover"
      onError={() => {
        setCandidateIndex((prev) =>
          prev + 1 <= candidates.length ? prev + 1 : prev
        );
      }}
    />
  );
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

async function findOrCreateDriveFolder(token, folderName, parentId = "") {
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

async function uploadImageToDrive(token, file, { folderId = "", name = "" } = {}) {
  const boundary = `trip-memory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    throw new Error(payload?.error?.message || "Image upload to Google Drive failed");
  }
  return payload;
}

async function makeDriveFilePublic(token, fileId = "") {
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

async function fetchDriveImageBlobUrl(accessToken = "", fileId = "") {
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

function uniqueTextList(values = [], max = 12) {
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

  return genericCount === tokens.length || (tokens.length === 1 && genericCount);
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

function extractDestinationHints(sourcePlanText = "") {
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

  const titleCaseRegex =
    /\b([A-Z][A-Za-z'.-]*(?:\s+[A-Z][A-Za-z'.-]*){1,3})\b/g;
  while ((match = titleCaseRegex.exec(normalized)) !== null) {
    const place = normalizePlaceCandidate(match[1]);
    if (!isGenericPlaceName(place)) candidates.push(place);
  }

  return uniqueTextList(candidates, 8);
}

function inferPlaceName(dayText = "", fallbackPlaces = []) {
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

function extractPlacesFromTimelineText(dayText = "", fallbackPlaces = []) {
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
    if (/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(candidate)) {
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
  const place = String(placeName || "").trim().toLowerCase();
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

function buildPlaceVisitDetails({
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
      tip: `Keep this stop close to nearby activities to reduce transfer time and maintain flow.`,
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

function inferApproxWeatherFromText(text = "") {
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

async function resolveApproxWeather({
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

function buildGoogleMapsLink(
  placeName = "",
  destinationHint = "",
  timelineText = ""
) {
  const cleanedPlace = normalizePlaceLabel(placeName);
  const fallbackPlace = inferPlaceName(timelineText, [destinationHint]);
  const primary = cleanedPlace || fallbackPlace || destinationHint || "Trip destination";
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

function buildPlaceImageLink(placeName = "", destinationHint = "") {
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

function buildPlaceFallbackImageLink(seed = "") {
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "trip")}/1200/800`;
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

async function resolveWikipediaPhoto({
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
        `&utf8=1&format=json&origin=*`;

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

function toGuideList(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

function toGuideObjectList(value, fields = []) {
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

function NavItem({ active, icon, label, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full rounded-2xl px-3.5 py-3 text-left transition',
        active
          ? 'bg-[#0b5b57] text-white shadow-[0_14px_30px_rgba(11,91,87,0.20)]'
          : 'bg-transparent text-[#2f4954] hover:bg-[#fff3df]',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            'grid h-9 w-9 place-items-center rounded-xl border transition',
            active
              ? 'border-white/20 bg-white/10'
              : 'border-[#e8dcc8] bg-[#fffaf1] group-hover:bg-white',
          ].join(' ')}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-[13px] font-semibold">{label}</div>
            {badge ? (
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  active
                    ? 'bg-white/15 text-white'
                    : 'bg-[#ffe6bf] text-[#6a4a12]',
                ].join(' ')}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <div
            className={[
              'mt-0.5 flex items-center gap-1 text-[11px]',
              active ? 'text-white/75' : 'text-[#74878f]',
            ].join(' ')}
          >
            <ChevronRight className="h-3 w-3" />
            View details
          </div>
        </div>
      </div>
    </button>
  );
}

function Pill({ icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#e5d7c3] bg-[#fffaf1] px-3 py-1.5 text-[12px] font-semibold text-[#2f4954]">
      {icon}
      {text}
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="flex min-h-[340px] items-center justify-center rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-6 text-center">
      <div className="max-w-md">
        <div className="text-[14px] font-bold text-[#2f4954]">{title}</div>
        <div className="mt-1 text-[12px] leading-relaxed text-[#6a7b84]">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/**
 * Main dashboard component
 * - Pass your AI response string (tripPlanText or resultText)
 */
export default function ResponsePlan({

  title = "Trip Dashboard",
  subtitle = "Switch views from the sidebar to explore your plan.",
  responseText = "",
  planResponseText = "",
  isLoading = false,
  loadError = '',
  lastPlanAt = '',
  guideCompanion = null,
  guideLoading = false,
  guideError = "",
  token = "",
  user = null,
  onRefresh,
  rightNowContext,
}) {

  const memoryFileInputRef = useRef(null);
  const [active, setActive] = useState("timeline");
  const [activeTimelineDayId, setActiveTimelineDayId] = useState("");
  const [photoResolutionByStop, setPhotoResolutionByStop] = useState({});
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoriesError, setMemoriesError] = useState("");
  const [selectedMemoryFiles, setSelectedMemoryFiles] = useState([]);
  const [memoryCaption, setMemoryCaption] = useState("");
  const [memoryDayLabel, setMemoryDayLabel] = useState("");
  const [isSavingMemories, setIsSavingMemories] = useState(false);
  const [driveStatus, setDriveStatus] = useState("Google Drive not connected");
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveImageBlobUrlByFileId, setDriveImageBlobUrlByFileId] = useState({});
  const [weatherByPlaceId, setWeatherByPlaceId] = useState({});
  const sourcePlanText = String(planResponseText || responseText || "");

  const sections = useMemo(
    () => parseMarkdownSections(sourcePlanText),
    [sourcePlanText],
  );

  const days = useMemo(() => extractDays(sections), [sections]);
  const budgetItems = useMemo(() => extractBudgetItems(sections), [sections]);
  const destinationHints = useMemo(
    () => extractDestinationHints(sourcePlanText),
    [sourcePlanText]
  );

  const timelineStops = useMemo(() => {
    const base = days.length
      ? days.map((item, index) => ({
          day: Number(item.day) || index + 1,
          text: item.text,
        }))
      : sections
          .flatMap((section) => String(section.content || "").split("\n"))
          .map((line) => line.trim())
          .filter((line) => line.length > 12)
          .slice(0, 12);

    if (!base.length) {
      const defaultPlace = destinationHints[0] || "Trip destination";
      const fallbackMapUrl = buildGoogleMapsLink(
        defaultPlace,
        defaultPlace,
        "Trip destination"
      );
      return [
        {
          id: "stop_0",
          dayNumber: 1,
          label: "Day 01",
          headline: "Plan summary",
          photoKey: "stop_0",
          text: "No itinerary lines found yet. Generate a detailed day-by-day plan to see the full timeline.",
          detail: buildDetailedTimelineText(
            "No itinerary lines found yet. Generate a detailed day-by-day plan to see the full timeline.",
            defaultPlace,
            "Day 01"
          ),
          place: defaultPlace,
          destinationHint: defaultPlace,
          mapUrl: fallbackMapUrl,
          streetViewUrl: `${fallbackMapUrl}&layer=c`,
          placesToVisit: [
            {
              id: "stop_0_place_0",
              name: defaultPlace,
              mapUrl: fallbackMapUrl,
            },
          ],
          placeVisitDetails: [
            {
              id: "place_detail_0_trip_destination",
              name: defaultPlace,
              category: "Attraction",
              bestTime: "Anytime",
              duration: "1-2 hours",
              summary:
                "Add concrete day-by-day itinerary lines to unlock detailed places and practical visit guidance.",
              tip: "Refresh the trip plan with specific stops to improve this section.",
              mapUrl: fallbackMapUrl,
              streetViewUrl: `${fallbackMapUrl}&layer=c`,
              order: 1,
            },
          ],
          imageUrl: buildPlaceImageLink(
            defaultPlace,
            defaultPlace
          ),
          fallbackImageUrl: buildPlaceFallbackImageLink("trip_destination"),
        },
      ];
    }

    return base.map((item, index) => {
      const text = typeof item === "string" ? item : item.text;
      const dayNumber =
        typeof item === "string" ? index + 1 : Number(item.day) || index + 1;
      const dayLabel = `Day ${String(dayNumber).padStart(2, "0")}`;
      const place = inferPlaceName(text, destinationHints);
      const destinationHint = destinationHints[0] || place;
      const placesToVisit = extractPlacesFromTimelineText(text, [
        place,
        destinationHint,
      ]).slice(0, 4);
      const placeVisitDetails = buildPlaceVisitDetails({
        dayText: text,
        places: placesToVisit,
        dayLabel,
        destinationHint,
      });
      const primaryPlace = placesToVisit[0] || place;
      const mapUrl = buildGoogleMapsLink(primaryPlace, destinationHint, text);
      return {
        id: `stop_${index}`,
        dayNumber,
        label: dayLabel,
        headline: buildTimelineHeadline(text, place, index),
        photoKey: `${index}_${place}_${text}`.toLowerCase(),
        text,
        detail: buildDetailedTimelineText(text, place, dayLabel),
        place,
        destinationHint,
        mapUrl,
        streetViewUrl: `${mapUrl}&layer=c`,
        placesToVisit: placesToVisit.map((placeName, placeIndex) => ({
          id: `stop_${index}_place_${placeIndex}`,
          name: placeName,
          mapUrl: buildGoogleMapsLink(placeName, destinationHint, text),
        })),
        placeVisitDetails,
        imageUrl: buildPlaceImageLink(place, destinationHint),
        fallbackImageUrl: buildPlaceFallbackImageLink(`${place}_${index}`),
      };
    });
  }, [days, sections, destinationHints]);

  const timelineDayTabs = useMemo(() => {
    return timelineStops.map((stop) => ({
      id: stop.id,
      label: stop.label,
    }));
  }, [timelineStops]);

  useEffect(() => {
    if (!timelineDayTabs.length) {
      setActiveTimelineDayId("");
      return;
    }

    const hasActiveDay = timelineDayTabs.some(
      (item) => item.id === activeTimelineDayId
    );
    if (!hasActiveDay) {
      setActiveTimelineDayId(timelineDayTabs[0].id);
    }
  }, [timelineDayTabs, activeTimelineDayId]);

  const featuredTimelineStop = useMemo(() => {
    return (
      timelineStops.find((stop) => stop.id === activeTimelineDayId) ||
      timelineStops[0] ||
      null
    );
  }, [timelineStops, activeTimelineDayId]);

  const featuredPlaceDetails = useMemo(() => {
    if (!featuredTimelineStop) return [];
    if (Array.isArray(featuredTimelineStop.placeVisitDetails)) {
      return featuredTimelineStop.placeVisitDetails.slice(0, 6);
    }
    const fallbackPlaces = Array.isArray(featuredTimelineStop.placesToVisit)
      ? featuredTimelineStop.placesToVisit.map((spot) => spot.name)
      : [];
    return buildPlaceVisitDetails({
      dayText: featuredTimelineStop.text,
      places: fallbackPlaces,
      dayLabel: featuredTimelineStop.label,
      destinationHint: featuredTimelineStop.destinationHint,
    }).slice(0, 6);
  }, [featuredTimelineStop]);

  const featuredDayWeatherFallback = useMemo(
    () => inferApproxWeatherFromText(featuredTimelineStop?.text || ""),
    [featuredTimelineStop?.text]
  );

  useEffect(() => {
    let cancelled = false;
    const unresolvedPlaces = featuredPlaceDetails.filter(
      (spot) => !weatherByPlaceId[spot.id]
    );

    if (!unresolvedPlaces.length) {
      return () => {
        cancelled = true;
      };
    }

    Promise.all(
      unresolvedPlaces.map(async (spot) => {
        const weather = await resolveApproxWeather({
          placeName: spot.name,
          destinationHint:
            featuredTimelineStop?.destinationHint || featuredTimelineStop?.place || "",
          dayText: featuredTimelineStop?.text || "",
        });
        return {
          placeId: spot.id,
          weather,
        };
      })
    ).then((results) => {
      if (cancelled) return;
      setWeatherByPlaceId((prev) => {
        const next = { ...prev };
        for (const result of results) {
          next[result.placeId] = result.weather || featuredDayWeatherFallback;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    featuredPlaceDetails,
    featuredTimelineStop?.destinationHint,
    featuredTimelineStop?.place,
    featuredTimelineStop?.text,
    weatherByPlaceId,
    featuredDayWeatherFallback,
  ]);

  useEffect(() => {
    if (memoryDayLabel.trim()) return;
    setMemoryDayLabel(featuredTimelineStop?.label || "Day 01");
  }, [featuredTimelineStop, memoryDayLabel]);

  const unresolvedPhotoCount = useMemo(
    () =>
      timelineStops.filter((stop) => !photoResolutionByStop[stop.photoKey])
        .length,
    [timelineStops, photoResolutionByStop]
  );
  const isResolvingPhotos = unresolvedPhotoCount > 0;

  useEffect(() => {
    let isCancelled = false;
    const unresolvedStops = timelineStops.filter(
      (stop) => !photoResolutionByStop[stop.photoKey]
    );

    if (!unresolvedStops.length) {
      return () => {
        isCancelled = true;
      };
    }

    Promise.all(
      unresolvedStops.map(async (stop) => {
        const wikiImage = await resolveWikipediaPhoto({
          placeName: stop.place,
          destinationHint: stop.destinationHint,
          timelineText: stop.text,
        });
        return {
          photoKey: stop.photoKey,
          imageUrl: wikiImage,
        };
      })
    )
      .then((resolved) => {
        if (isCancelled) return;
        setPhotoResolutionByStop((prev) => {
          const next = { ...prev };
          for (const result of resolved) {
            next[result.photoKey] = {
              status: result.imageUrl ? "resolved" : "fallback",
              imageUrl: result.imageUrl || "",
            };
          }
          return next;
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [timelineStops, photoResolutionByStop]);

  const selectedMemoryBytes = useMemo(
    () =>
      selectedMemoryFiles.reduce(
        (total, item) => total + Number(item?.file?.size || 0),
        0
      ),
    [selectedMemoryFiles]
  );

  const loadMemories = useCallback(async () => {
    if (!token) return;

    setMemoriesLoading(true);
    setMemoriesError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/history/memories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load saved memories");
      }

      const nextMemories = Array.isArray(payload?.data)
        ? payload.data.map((item) => normalizeMemoryRecord(item)).filter(Boolean)
        : [];
      setMemories(nextMemories);
    } catch (error) {
      setMemoriesError(error.message || "Unable to load memories");
    } finally {
      setMemoriesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (active !== "memories") return;
    loadMemories();
  }, [active, loadMemories]);

  useEffect(() => {
    return () => {
      Object.values(driveImageBlobUrlByFileId).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [driveImageBlobUrlByFileId]);

  const requestDriveAccessToken = useCallback(
    async ({ forcePrompt = false } = {}) => {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error("Missing VITE_GOOGLE_CLIENT_ID in frontend env");
      }

      const google = await loadGoogleIdentityScript();
      if (!google?.accounts?.oauth2?.initTokenClient) {
        throw new Error("Google OAuth client is unavailable");
      }

      return new Promise((resolve, reject) => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_DRIVE_SCOPE,
          callback: (tokenResponse) => {
            if (tokenResponse?.error) {
              reject(
                new Error(
                  tokenResponse.error_description ||
                    tokenResponse.error ||
                    "Google Drive authorization failed"
                )
              );
              return;
            }

            if (!tokenResponse?.access_token) {
              reject(new Error("Google Drive token was not returned"));
              return;
            }

            setDriveConnected(true);
            setDriveStatus("Google Drive connected.");
            resolve(tokenResponse.access_token);
          },
        });

        tokenClient.requestAccessToken({
          prompt: forcePrompt ? "consent" : "",
        });
      });
    },
    []
  );

  const connectDrive = useCallback(async () => {
    setMemoriesError("");
    setDriveStatus("Requesting Google Drive access...");
    try {
      await requestDriveAccessToken({ forcePrompt: true });
      setDriveConnected(true);
      setDriveStatus("Google Drive connected.");
    } catch (error) {
      setDriveConnected(false);
      setDriveStatus("Google Drive not connected");
      setMemoriesError(error.message || "Unable to connect Google Drive");
    }
  }, [requestDriveAccessToken]);

  useEffect(() => {
    let cancelled = false;

    const resolveDriveImages = async () => {
      if (active !== "memories" || !memories.length) return;

      const missingFileIds = memories
        .map((memory) => String(memory.driveFileId || "").trim())
        .filter(Boolean)
        .filter((fileId) => !driveImageBlobUrlByFileId[fileId]);

      if (!missingFileIds.length) return;
      if (!driveConnected) return;

      try {
        const accessToken = await requestDriveAccessToken({ forcePrompt: false });
        const resolvedEntries = [];

        for (const fileId of missingFileIds) {
          try {
            const objectUrl = await fetchDriveImageBlobUrl(accessToken, fileId);
            resolvedEntries.push({ fileId, objectUrl });
          } catch {
            // Some files may already be publicly accessible through URL candidates.
          }
        }

        if (cancelled || !resolvedEntries.length) return;

        setDriveImageBlobUrlByFileId((prev) => {
          const next = { ...prev };
          for (const entry of resolvedEntries) {
            if (next[entry.fileId]) {
              URL.revokeObjectURL(entry.objectUrl);
              continue;
            }
            next[entry.fileId] = entry.objectUrl;
          }
          return next;
        });
      } catch {
        // Silent fallback: gallery still attempts public URL candidates.
      }
    };

    resolveDriveImages();

    return () => {
      cancelled = true;
    };
  }, [
    active,
    memories,
    driveConnected,
    driveImageBlobUrlByFileId,
    requestDriveAccessToken,
  ]);

  const handleMemoryFileSelection = useCallback(async (event) => {
    const files = Array.from(event.target.files || [])
      .filter((file) => String(file.type || "").startsWith("image/"))
      .slice(0, 10);

    if (!files.length) {
      if (event.target) event.target.value = "";
      return;
    }

    setMemoriesError("");
    try {
      const prepared = await Promise.all(
        files.map(async (file, index) => ({
          id: `${file.name}_${file.lastModified}_${Date.now()}_${index}`,
          file,
          previewUrl: await fileToDataUrl(file),
        }))
      );
      setSelectedMemoryFiles((prev) => [...prev, ...prepared].slice(0, 14));
      setDriveStatus(`${prepared.length} image(s) ready for Google Drive upload.`);
    } catch (error) {
      setMemoriesError(error.message || "Failed to read selected images");
    } finally {
      if (event.target) event.target.value = "";
    }
  }, []);

  const removePendingMemory = useCallback((memoryId) => {
    setSelectedMemoryFiles((prev) =>
      prev.filter((item) => item.id !== memoryId)
    );
  }, []);

  const saveMemoriesToGoogleDrive = useCallback(async () => {
    if (!selectedMemoryFiles.length) {
      setMemoriesError("Select at least one image first.");
      return;
    }
    if (!token) {
      setMemoriesError("Sign in is required to save memories.");
      return;
    }

    setIsSavingMemories(true);
    setMemoriesError("");
    setDriveStatus("Preparing Google Drive upload...");

    try {
      const accessToken = await requestDriveAccessToken();
      const rootFolderId = await findOrCreateDriveFolder(
        accessToken,
        DRIVE_ROOT_FOLDER_NAME
      );

      const folderName = memoryDayLabel.trim() || featuredTimelineStop?.label || "General";
      const dayFolderId = await findOrCreateDriveFolder(
        accessToken,
        folderName,
        rootFolderId
      );

      for (let index = 0; index < selectedMemoryFiles.length; index += 1) {
        const pending = selectedMemoryFiles[index];
        const file = pending.file;
        setDriveStatus(
          `Uploading ${index + 1}/${selectedMemoryFiles.length} to Google Drive...`
        );

        const uploadResult = await uploadImageToDrive(accessToken, file, {
          folderId: dayFolderId,
          name: buildMemoryUploadName(file.name, folderName, index),
        });

        try {
          await makeDriveFilePublic(accessToken, uploadResult.id);
        } catch {
          // Keep memory save flow alive even if sharing permission fails.
        }

        const publicImageUrl = uploadResult?.id
          ? `https://lh3.googleusercontent.com/d/${encodeURIComponent(
              uploadResult.id
            )}=w1600`
          : "";

        const response = await fetch(`${API_BASE_URL}/api/v1/history/memories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: `Memory ${String(index + 1).padStart(2, "0")} · ${folderName}`,
            detail: buildMemoryDetail(memoryCaption, folderName, file.name),
            image: publicImageUrl,
            dayLabel: folderName,
            tags: uniqueTextList([folderName, featuredTimelineStop?.place, "trip memory"]),
            driveFileId: uploadResult?.id || "",
            driveWebViewLink: uploadResult?.webViewLink || "",
            driveDownloadLink: uploadResult?.webContentLink || "",
            driveThumbnailLink: uploadResult?.thumbnailLink || publicImageUrl,
            drivePublicImageUrl: publicImageUrl,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to save memory metadata");
        }
      }

      setSelectedMemoryFiles([]);
      setMemoryCaption("");
      setDriveStatus(
        `Saved ${selectedMemoryFiles.length} image(s) to Google Drive.`
      );
      await loadMemories();
    } catch (error) {
      setMemoriesError(error.message || "Unable to save memories");
      setDriveStatus("Google Drive upload failed");
    } finally {
      setIsSavingMemories(false);
    }
  }, [
    selectedMemoryFiles,
    token,
    requestDriveAccessToken,
    memoryDayLabel,
    featuredTimelineStop,
    memoryCaption,
    loadMemories,
  ]);

  const canSaveMemories =
    Boolean(selectedMemoryFiles.length) && Boolean(token) && !isSavingMemories;

  const guideSafety = useMemo(
    () => toGuideList(guideCompanion?.safetyChecklist),
    [guideCompanion]
  );
  const guideEtiquette = useMemo(
    () => toGuideList(guideCompanion?.localEtiquette),
    [guideCompanion]
  );
  const guidePacking = useMemo(
    () => toGuideList(guideCompanion?.packingChecklist),
    [guideCompanion]
  );
  const guideMoney = useMemo(
    () => toGuideList(guideCompanion?.moneyTips),
    [guideCompanion]
  );
  const guideFoodMissions = useMemo(
    () => toGuideObjectList(guideCompanion?.foodMissions, ["dish", "whereToTry"]),
    [guideCompanion]
  );
  const guideBookingStrategy = useMemo(
    () =>
      toGuideObjectList(guideCompanion?.bookingStrategy, [
        "item",
        "why",
        "bestTime",
      ]),
    [guideCompanion]
  );
  const guideHiddenGems = useMemo(
    () => toGuideObjectList(guideCompanion?.hiddenGems, ["name", "whyVisit", "mapUrl"]),
    [guideCompanion]
  );

  const canShow = Boolean(sourcePlanText.trim());

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Sidebar */}
      <aside className="lg:col-span-3">
        <Card className="sticky top-6">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5" />}
            title={title}
            subtitle={subtitle}
            right={
              onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              ) : null
            }
          />

          <div className="space-y-2">
            <NavItem
              active={active === 'timeline'}
              onClick={() => setActive('timeline')}
              label="🗺️ Timeline Guide"
              badge={`${timelineStops.length}`}
              icon={<Brain className="h-4 w-4" />}
            />
            <NavItem
              active={active === 'wallet'}
              onClick={() => setActive('wallet')}
              label="💰 Wallet"
              icon={<Wallet className="h-4 w-4" />}
            />
            <NavItem
              active={active === 'guide'}
              onClick={() => setActive('guide')}
              label="🧭 Guide Companion"
              icon={<Shield className="h-4 w-4" />}
            />
            <NavItem
              active={active === 'memories'}
              onClick={() => setActive('memories')}
              label="📸 Memories"
              icon={<Camera className="h-4 w-4" />}
            />
            <NavItem
              active={active === 'rightnow'}
              onClick={() => setActive('rightnow')}
              label="⚡ Right Now"
              icon={<Zap className="h-4 w-4" />}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Pill
              icon={<MapPin className="h-3.5 w-3.5" />}
              text="Location-aware"
            />
            <Pill icon={<Clock className="h-3.5 w-3.5" />} text="Time logic" />
          </div>
          <div className="mt-3 rounded-2xl border border-[#eadfcf] bg-[#fffaf1] px-3 py-2 text-[11px] text-[#5d727c]">
            <div>Plan updated: {formatTimestamp(lastPlanAt)}</div>
          </div>
        </Card>
      </aside>

      {/* Main content */}
      <section className="lg:col-span-9">
        {isLoading ? (
          <EmptyState
            title="Loading trip dashboard..."
            subtitle="Fetching your latest saved trip plan."
          />
        ) : !canShow ? (
          <EmptyState
            title="No AI response yet"
            subtitle="Generate a plan and the dashboard will turn it into an interactive view."
          />
        ) : (
          <div className="space-y-6">
            {loadError ? (
              <div className="rounded-2xl border border-[#e7c2b7] bg-[#fff2ef] px-4 py-3 text-xs font-semibold text-[#8b3f2d]">
                {loadError}
              </div>
            ) : null}
            {/* Header row actions */}
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[#2f4954]">
                    Interactive Response View
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#6a7b84]">
                    Parsed from your AI text (sections, itinerary, and budget).
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      sourcePlanText.trim()
                        ? navigator.clipboard?.writeText(sourcePlanText)
                        : null
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Text
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([sourcePlanText], {
                        type: 'text/plain;charset=utf-8',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'trip-plan.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#fff8eb] px-3.5 py-2 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#ffeecd]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                </div>
              </div>
            </Card>

            {active === 'timeline' ? (
              <Card>
                <SectionHeader
                  icon={<Brain className="h-5 w-5" />}
                  title="Itinerary Timeline"
                  subtitle="Day-by-day navigation with places to visit and direct map links."
                  right={
                    <div className="flex flex-wrap items-center gap-2">
                      {isResolvingPhotos ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfcf] bg-[#fffaf1] px-3 py-1.5 text-xs font-semibold text-[#2f4954]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Finding relevant photos...
                        </div>
                      ) : null}
                      <div className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954]">
                        Stops: {timelineStops.length}
                      </div>
                    </div>
                  }
                />

                {featuredTimelineStop ? (
                  <div className="rounded-[28px] border border-[#dce2ee] bg-[#f5f7fb] p-5 sm:p-8">
                    <div className="text-center">
                      <h3 className="font-display text-[36px] leading-none text-[#16213f] sm:text-[52px]">
                        <span className="text-[#2554d9]">YOUR</span> TRIP TIMELINE
                      </h3>
                      <p className="mt-2 text-[12px] text-[#637487]">
                        Select a day to review the schedule, key stops, and accurate map links.
                      </p>
                    </div>

                    <div className="mt-7 overflow-x-auto pb-1">
                      <div className="flex min-w-max items-center gap-7 border-b border-[#d7deec] px-1">
                        {timelineDayTabs.map((dayTab) => (
                          <button
                            key={`timeline_day_${dayTab.id}`}
                            type="button"
                            onClick={() => setActiveTimelineDayId(dayTab.id)}
                            className={[
                              "relative pb-3 text-[17px] font-semibold transition",
                              activeTimelineDayId === dayTab.id
                                ? "text-[#2554d9]"
                                : "text-[#5f6c7a] hover:text-[#2f4954]",
                            ].join(" ")}
                          >
                            {dayTab.label}
                            {activeTimelineDayId === dayTab.id ? (
                              <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#2554d9]" />
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-center">
                      <div className="space-y-4 lg:col-span-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#d8deeb] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5f6c7a]">
                          {featuredTimelineStop.label}
                          <span>•</span>
                          <span>{featuredTimelineStop.place}</span>
                        </div>
                        <h4 className="text-[33px] font-bold leading-tight text-[#2554d9]">
                          {featuredTimelineStop.headline}
                        </h4>
                        <p className="text-[15px] leading-relaxed text-[#203344]">
                          {featuredTimelineStop.detail}
                        </p>

                        <div className="rounded-2xl border border-[#d5dbeb] bg-white px-3.5 py-3">
                          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#607389]">
                            Places To Visit On {featuredTimelineStop.label}
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {featuredTimelineStop.placesToVisit?.slice(0, 4).map((spot) => (
                              <a
                                key={spot.id}
                                href={spot.mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-[#f8fbff] px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                              >
                                <MapPin className="h-3.5 w-3.5" />
                                {spot.name}
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={featuredTimelineStop.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            Open in Google Maps
                          </a>
                          <a
                            href={featuredTimelineStop.streetViewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            Street View
                          </a>
                        </div>
                      </div>

                      <div className="lg:col-span-7">
                        <div className="overflow-hidden rounded-[22px] border border-[#dce2ee] bg-white shadow-[0_20px_36px_rgba(30,43,74,0.10)]">
                          <img
                            src={
                              photoResolutionByStop[featuredTimelineStop.photoKey]
                                ?.imageUrl || featuredTimelineStop.imageUrl
                            }
                            alt={featuredTimelineStop.place}
                            loading="lazy"
                            className="h-[20rem] w-full object-cover sm:h-[28rem]"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src =
                                featuredTimelineStop.fallbackImageUrl;
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {featuredPlaceDetails.length ? (
                      <div className="mt-8 rounded-[22px] border border-[#dbe2f0] bg-white p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#637487]">
                            Detailed Places For {featuredTimelineStop.label}
                          </div>
                          <div className="rounded-full border border-[#d9e1ef] bg-[#f8fbff] px-2.5 py-1 text-[10px] font-bold text-[#445e79]">
                            {featuredPlaceDetails.length} stops
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                          {featuredPlaceDetails.map((spot) => (
                            <div
                              key={spot.id}
                              className="rounded-[18px] border border-[#dce3f0] bg-[#f9fbff] px-3.5 py-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-[11px] font-bold uppercase tracking-[0.11em] text-[#60748a]">
                                    Stop {String(spot.order).padStart(2, "0")}
                                  </div>
                                  <div className="mt-1 text-[16px] font-bold leading-snug text-[#2a3f62]">
                                    {spot.name}
                                  </div>
                                </div>
                                <div className="rounded-full border border-[#d5deec] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#4b6481]">
                                  {spot.category}
                                </div>
                              </div>

                              <div className="mt-2 text-[12px] leading-relaxed text-[#495f79]">
                                {spot.summary}
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-[#d8e1ef] bg-white px-2.5 py-2">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#63788f]">
                                    Best Time
                                  </div>
                                  <div className="mt-0.5 text-[12px] font-semibold text-[#2c415f]">
                                    {spot.bestTime}
                                  </div>
                                </div>
                                <div className="rounded-xl border border-[#d8e1ef] bg-white px-2.5 py-2">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#63788f]">
                                    Suggested Stay
                                  </div>
                                  <div className="mt-0.5 text-[12px] font-semibold text-[#2c415f]">
                                    {spot.duration}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 rounded-xl border border-[#d8e1ef] bg-white px-2.5 py-2">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-[#63788f]">
                                  <CloudSun className="h-3.5 w-3.5" />
                                  Approx Weather
                                </div>
                                <div className="mt-0.5 text-[12px] font-semibold text-[#2c415f]">
                                  {weatherByPlaceId[spot.id] || featuredDayWeatherFallback}
                                </div>
                              </div>

                              <div className="mt-3 rounded-xl border border-[#d8e1ef] bg-white px-2.5 py-2 text-[11px] leading-relaxed text-[#4a6079]">
                                <span className="font-semibold text-[#354e6a]">Planning tip:</span>{" "}
                                {spot.tip}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <a
                                  href={spot.mapUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                                >
                                  <MapPin className="h-3.5 w-3.5" />
                                  Open map
                                </a>
                                <a
                                  href={spot.streetViewUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                                >
                                  <Camera className="h-3.5 w-3.5" />
                                  Street View
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <EmptyState
                    title="Timeline is empty"
                    subtitle="Generate a plan to populate day-by-day timeline details."
                  />
                )}
              </Card>
            ) : null}

            {active === 'guide' ? (
              <Card>
                <SectionHeader
                  icon={<Shield className="h-5 w-5" />}
                  title="Guide Companion"
                  subtitle="Expert-level travel intelligence from your latest itinerary and profile."
                  right={
                    guideLoading ? (
                      <div className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954]">
                        Refreshing...
                      </div>
                    ) : null
                  }
                />

                {guideError ? (
                  <div className="rounded-2xl border border-[#e7c2b7] bg-[#fff2ef] px-4 py-3 text-xs font-semibold text-[#8b3f2d]">
                    {guideError}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="space-y-4 lg:col-span-7">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a8a92]">
                        Concierge Headline
                      </div>
                      <div className="mt-1 text-[15px] font-bold text-[#2f4954]">
                        {guideCompanion?.headline || "Guide companion is preparing your next-level travel brief."}
                      </div>
                      <div className="mt-2 text-[12px] leading-relaxed text-[#5f7078]">
                        {guideCompanion?.destinationSummary || "Generate or refresh your trip plan to unlock personalized local context, etiquette, and safety suggestions."}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#2f4954]">
                        <Luggage className="h-4 w-4" />
                        Packing Checklist
                      </div>
                      <div className="mt-3 space-y-2">
                        {(guidePacking.length ? guidePacking : ["No packing checklist yet."]).map((item, idx) => (
                          <div
                            key={`packing_${idx}_${item}`}
                            className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2 text-[12px] text-[#2f4954]"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#2f4954]">
                        <Utensils className="h-4 w-4" />
                        Food Missions
                      </div>
                      <div className="mt-3 space-y-2">
                        {(guideFoodMissions.length
                          ? guideFoodMissions
                          : [{ dish: "No food missions yet.", whereToTry: "" }]
                        ).map((item, idx) => (
                          <div
                            key={`food_${idx}_${item.dish}`}
                            className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                          >
                            <div className="text-[12px] font-semibold text-[#2f4954]">
                              {item.dish}
                            </div>
                            {item.whereToTry ? (
                              <div className="mt-0.5 text-[12px] text-[#5f7078]">
                                {item.whereToTry}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 lg:col-span-5">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Safety & Etiquette
                      </div>
                      <div className="mt-3 space-y-2">
                        {(guideSafety.length ? guideSafety : ["No safety checklist yet."]).map((item, idx) => (
                          <div
                            key={`safety_${idx}_${item}`}
                            className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2 text-[12px] text-[#2f4954]"
                          >
                            {item}
                          </div>
                        ))}
                        {(guideEtiquette.length ? guideEtiquette : ["No local etiquette notes yet."]).map((item, idx) => (
                          <div
                            key={`etiquette_${idx}_${item}`}
                            className="rounded-2xl border border-[#ece2d4] bg-white px-3 py-2 text-[12px] text-[#2f4954]"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Booking Strategy
                      </div>
                      <div className="mt-3 space-y-2">
                        {(guideBookingStrategy.length
                          ? guideBookingStrategy
                          : [{ item: "No booking strategy yet.", why: "", bestTime: "" }]
                        ).map((item, idx) => (
                          <div
                            key={`booking_${idx}_${item.item}`}
                            className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                          >
                            <div className="text-[12px] font-semibold text-[#2f4954]">
                              {item.item}
                            </div>
                            {item.why ? (
                              <div className="mt-0.5 text-[12px] text-[#5f7078]">
                                {item.why}
                              </div>
                            ) : null}
                            {item.bestTime ? (
                              <div className="mt-0.5 text-[11px] font-semibold text-[#0b5b57]">
                                Best time: {item.bestTime}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Hidden Gems
                      </div>
                      <div className="mt-3 space-y-2">
                        {(guideHiddenGems.length
                          ? guideHiddenGems
                          : [{ name: "No hidden gem suggestions yet.", whyVisit: "", mapUrl: "" }]
                        ).map((item, idx) => (
                          <div
                            key={`gem_${idx}_${item.name}`}
                            className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                          >
                            <div className="text-[12px] font-semibold text-[#2f4954]">
                              {item.name}
                            </div>
                            {item.whyVisit ? (
                              <div className="mt-0.5 text-[12px] text-[#5f7078]">
                                {item.whyVisit}
                              </div>
                            ) : null}
                            {item.mapUrl ? (
                              <a
                                href={item.mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#e5d7c3] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2f4954] hover:border-[#d9c5aa]"
                              >
                                <MapPin className="h-3 w-3" />
                                Open map
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#2f4954]">
                        <Wallet className="h-4 w-4" />
                        Money Intelligence
                      </div>
                      <div className="mt-3 space-y-2">
                        {(guideMoney.length ? guideMoney : ["No money guidance yet."]).map((item, idx) => (
                          <div
                            key={`money_${idx}_${item}`}
                            className="rounded-2xl border border-[#ece2d4] bg-white px-3 py-2 text-[12px] text-[#2f4954]"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {active === 'wallet' ? (
              <Card>
                <SectionHeader
                  icon={<Wallet className="h-5 w-5" />}
                  title="Wallet"
                  subtitle="Budget breakdown + currency (connect to your currency conversion logic)."
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <div className="overflow-hidden rounded-[22px] border border-[#e8dcc8] bg-white">
                      <div className="border-b border-[#eee3d2] bg-[#fffaf1] px-4 py-3">
                        <div className="text-[12px] font-bold text-[#2f4954]">
                          Budget Allocation
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6a7b84]">
                          Parsed from “Budget Allocation” section.
                        </div>
                      </div>

                      <div className="p-4">
                        {budgetItems.length ? (
                          <div className="space-y-2">
                            {budgetItems.map((b, idx) => (
                              <div
                                key={`${b.label}_${idx}`}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                              >
                                <div className="text-[12px] font-semibold text-[#2f4954]">
                                  {b.label}
                                </div>
                                <div className="text-[12px] font-bold text-[#0b5b57]">
                                  {b.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[12px] text-[#6a7b84]">
                            Couldn’t parse “Budget Allocation” yet. Keep the raw
                            section available in “All Sections”.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Wallet Tools
                      </div>
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Add currency conversion, spend tracking, and alerts.
                      </div>

                      <div className="mt-4 space-y-2">
                        {[
                          'Convert home currency → destination currency',
                          'Daily spending limit suggestions',
                          'Track hotels / tickets / activities',
                          'Overspend risk alerts',
                        ].map((t) => (
                          <div
                            key={t}
                            className="rounded-2xl border border-[#eadfcf] bg-white px-3 py-2 text-[12px] text-[#2f4954]"
                          >
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {active === 'memories' ? (
              <Card>
                <SectionHeader
                  icon={<Camera className="h-5 w-5" />}
                  title="Memories"
                  subtitle="Save selected images into Google Drive day folders and keep an indexed memory timeline."
                  right={
                    <button
                      type="button"
                      onClick={loadMemories}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      Refresh Memories
                    </button>
                  }
                />

                {memoriesError ? (
                  <div className="rounded-2xl border border-[#e7c2b7] bg-[#fff2ef] px-4 py-3 text-xs font-semibold text-[#8b3f2d]">
                    {memoriesError}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="space-y-4 lg:col-span-5">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[12px] font-bold text-[#2f4954]">
                          Save To Google Drive
                        </div>
                        <div
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
                            driveConnected
                              ? "bg-[#e5f5ef] text-[#1f6f5a]"
                              : "bg-[#fff2ef] text-[#8b3f2d]",
                          ].join(" ")}
                        >
                          {driveConnected ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {driveConnected ? "Connected" : "Not connected"}
                        </div>
                      </div>

                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Folder path format: <span className="font-semibold">Trip Memories / {memoryDayLabel || "Day-01"}</span>
                      </div>

                      <input
                        ref={memoryFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleMemoryFileSelection}
                      />

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => memoryFileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#fff8eb] px-3 py-1.5 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#ffeecd]"
                        >
                          <UploadCloud className="h-3.5 w-3.5" />
                          Choose Images
                        </button>
                        <button
                          type="button"
                          onClick={connectDrive}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                          Connect Drive
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <label className="block">
                          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.11em] text-[#6a7b84]">
                            Day Label
                          </div>
                          <input
                            value={memoryDayLabel}
                            onChange={(event) => setMemoryDayLabel(event.target.value)}
                            placeholder="Day 01"
                            className="w-full rounded-xl border border-[#dfd1ba] bg-white px-3 py-2 text-[13px] text-[#2f4954] outline-none focus:border-[var(--line-strong)]"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.11em] text-[#6a7b84]">
                            Memory Details
                          </div>
                          <textarea
                            value={memoryCaption}
                            onChange={(event) => setMemoryCaption(event.target.value)}
                            rows={3}
                            placeholder="Add context so each memory keeps useful planning intelligence."
                            className="w-full resize-y rounded-xl border border-[#dfd1ba] bg-white px-3 py-2 text-[13px] text-[#2f4954] outline-none focus:border-[var(--line-strong)]"
                          />
                        </label>
                      </div>

                      <div className="mt-3 text-[11px] text-[#5f7078]">
                        {selectedMemoryFiles.length} file(s) selected · {formatFileSize(selectedMemoryBytes)}
                      </div>

                      <button
                        type="button"
                        onClick={saveMemoriesToGoogleDrive}
                        disabled={!canSaveMemories}
                        className={[
                          "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                          canSaveMemories
                            ? "bg-gradient-to-r from-[#0d6a66] to-[#084744] text-white shadow-[0_10px_24px_rgba(12,95,92,0.28)] hover:brightness-105"
                            : "cursor-not-allowed bg-[#d9ccb8] text-[#7e7160]",
                        ].join(" ")}
                      >
                        {isSavingMemories ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Cloud className="h-3.5 w-3.5" />
                            Save To Google Drive
                          </>
                        )}
                      </button>

                      <div className="mt-3 rounded-2xl border border-[#eadfcf] bg-white px-3 py-2 text-[11px] text-[#5d727c]">
                        {driveStatus}
                      </div>
                    </div>

                    {selectedMemoryFiles.length ? (
                      <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                        <div className="text-[12px] font-bold text-[#2f4954]">
                          Pending Uploads
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {selectedMemoryFiles.map((item) => (
                            <div
                              key={item.id}
                              className="overflow-hidden rounded-[16px] border border-[#eadfcf] bg-[#fffaf1]"
                            >
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="aspect-square w-full object-cover"
                              />
                              <div className="space-y-1 p-2">
                                <div className="truncate text-[11px] font-semibold text-[#2f4954]">
                                  {item.file.name}
                                </div>
                                <div className="text-[10px] text-[#6a7b84]">
                                  {formatFileSize(item.file.size)}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePendingMemory(item.id)}
                                  className="rounded-full border border-[#eadfcf] bg-white px-2.5 py-1 text-[10px] font-bold text-[#2f4954] hover:bg-[#fff8eb]"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="lg:col-span-7">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Memory Gallery
                      </div>
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Saved images from Google Drive with longer notes and day tags.
                      </div>

                      {memoriesLoading ? (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#eadfcf] bg-[#fffaf1] px-3 py-1.5 text-xs font-semibold text-[#2f4954]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading memories...
                        </div>
                      ) : null}

                      {!memoriesLoading && memories.length ? (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {memories.map((memory) => (
                            <div
                              key={memory.id}
                              className="overflow-hidden rounded-[18px] border border-[#ece2d4] bg-[#fffaf1]"
                            >
                              <MemoryImage
                                memory={memory}
                                resolvedBlobUrl={
                                  driveImageBlobUrlByFileId[memory.driveFileId] || ""
                                }
                              />
                              <div className="space-y-2 p-3">
                                <div className="text-[12px] font-bold text-[#2f4954]">
                                  {memory.title}
                                </div>
                                <div className="text-[12px] leading-relaxed text-[#556973]">
                                  {memory.detail || "No additional details saved."}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {memory.dayLabel ? (
                                    <span className="rounded-full border border-[#e5d7c3] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#2f4954]">
                                      {memory.dayLabel}
                                    </span>
                                  ) : null}
                                  <span className="rounded-full border border-[#e5d7c3] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#2f4954]">
                                    {formatTimestamp(memory.createdAt)}
                                  </span>
                                </div>
                                {memory.driveWebViewLink ? (
                                  <a
                                    href={memory.driveWebViewLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e5d7c3] bg-white px-2.5 py-1 text-[10px] font-bold text-[#2f4954] hover:border-[#d9c5aa]"
                                  >
                                    <LinkIcon className="h-3 w-3" />
                                    Open in Drive
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {!memoriesLoading && !memories.length ? (
                        <div className="mt-4 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2 text-[12px] text-[#6a7b84]">
                          No saved memories yet. Upload images and click “Save To Google Drive”.
                        </div>
                      ) : null}

                      {driveConnected ? (
                        <div className="mt-4 space-y-2">
                          <div
                            className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                          >
                            <div className="text-[12px] font-semibold text-[#2f4954]">
                              Primary folder
                            </div>
                            <div className="text-[11px] text-[#5f7078]">
                              {DRIVE_ROOT_FOLDER_NAME}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {active === 'rightnow' ? (
              <Card>
                <SectionHeader
                  icon={<Zap className="h-5 w-5" />}
                  title="Right Now"
                  subtitle="Send your live context to AI: location, prompt, image, and camera capture."
                />
                <RightNowLiveAssistant
                  token={token}
                  user={user}
                  rightNowContext={rightNowContext}
                />
              </Card>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
