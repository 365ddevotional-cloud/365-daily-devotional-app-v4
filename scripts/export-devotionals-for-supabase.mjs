import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getAllSeedDevotionals } from "../server/seed-devotionals.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "supabase");

function escapeSql(value) {
  return String(value).replace(/'/g, "''");
}

function jsonSql(value) {
  return `'${escapeSql(JSON.stringify(value))}'::jsonb`;
}

const devotionals = await getAllSeedDevotionals();
await fs.mkdir(outputDir, { recursive: true });

const exportedDevotionals = devotionals.map((item, index) => ({
  id: index + 1,
  date: item.date,
  title: item.title,
  scripture: {
    reference: item.scriptureReference,
    text: item.scriptureText,
  },
  message: item.content,
  prayer_points: item.prayerPoints,
  declarations: item.faithDeclarations,
  author: item.author,
}));

await fs.writeFile(
  path.join(outputDir, "devotionals.json"),
  `${JSON.stringify(exportedDevotionals, null, 2)}\n`,
  "utf8",
);

const values = exportedDevotionals
  .map(
    (item) => `(${item.id}, '${escapeSql(item.date)}', '${escapeSql(item.title)}', ${jsonSql(item.scripture)}, '${escapeSql(item.message)}', ${jsonSql(item.prayer_points)}, ${jsonSql(item.declarations)}, '${escapeSql(item.author)}')`,
  )
  .join(",\n");

const sql = `-- Generated from the app's canonical devotional seed data\ncreate table if not exists public.devotionals (\n  id bigint primary key,\n  date date not null unique,\n  title text not null,\n  scripture jsonb not null,\n  message text not null,\n  prayer_points jsonb not null default '[]'::jsonb,\n  declarations jsonb not null default '[]'::jsonb,\n  author text not null default 'Moses Afolabi',\n  created_at timestamptz not null default now()\n);\n\ncreate index if not exists idx_devotionals_date on public.devotionals (date desc);\n\ninsert into public.devotionals (id, date, title, scripture, message, prayer_points, declarations, author)\nvalues\n${values}\non conflict (date) do update set\n  title = excluded.title,\n  scripture = excluded.scripture,\n  message = excluded.message,\n  prayer_points = excluded.prayer_points,\n  declarations = excluded.declarations,\n  author = excluded.author;\n`;

await fs.writeFile(path.join(outputDir, "seed_devotionals.sql"), sql, "utf8");
console.log(`Exported ${exportedDevotionals.length} devotionals to ${outputDir}`);
