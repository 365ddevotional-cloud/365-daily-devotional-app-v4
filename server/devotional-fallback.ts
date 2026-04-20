import { readFile } from "fs/promises";
import path from "path";
import type { Devotional } from "@shared/schema";

interface SeedDevotionalRecord {
  id: number;
  date: string;
  title: string;
  scripture: {
    reference?: string;
    text?: string;
  };
  message: string;
  prayer_points?: string[];
  declarations?: string[];
  author?: string;
}

const fallbackJsonPath = path.resolve(process.cwd(), "supabase", "devotionals.json");

let cachedDevotionals: Devotional[] | null = null;
let lastLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function mapSeedRecordToDevotional(record: SeedDevotionalRecord): Devotional {
  return {
    id: Number(record.id),
    date: record.date,
    title: record.title,
    scriptureReference: record.scripture?.reference || "",
    scriptureText: record.scripture?.text || "",
    content: record.message || "",
    prayerPoints: Array.isArray(record.prayer_points) ? record.prayer_points : [],
    faithDeclarations: Array.isArray(record.declarations) ? record.declarations : [],
    author: record.author || "Moses Afolabi",
    createdAt: new Date(0),
    isDeleted: false,
    deletedAt: null,
    redLetterEnabled: true,
    seasonalOverride: false,
    christianQuotes: null,
    propheticDeclaration: null,
  };
}

export async function getFallbackDevotionals(): Promise<Devotional[]> {
  const now = Date.now();
  if (cachedDevotionals && now - lastLoadedAt < CACHE_TTL_MS) {
    return cachedDevotionals;
  }

  const raw = await readFile(fallbackJsonPath, "utf8");
  const parsed = JSON.parse(raw) as SeedDevotionalRecord[];
  cachedDevotionals = parsed
    .map(mapSeedRecordToDevotional)
    .filter((record) => !record.isDeleted)
    .sort((a, b) => b.date.localeCompare(a.date));
  lastLoadedAt = now;

  return cachedDevotionals;
}

export async function getFallbackDevotionalByDate(date: string): Promise<Devotional | undefined> {
  const devotionals = await getFallbackDevotionals();
  return devotionals.find((devotional) => devotional.date === date);
}

export async function getFallbackLatestDevotional(): Promise<Devotional | undefined> {
  const devotionals = await getFallbackDevotionals();
  return devotionals[0];
}
