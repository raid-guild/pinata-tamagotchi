import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type PetStage = "egg" | "hatchling" | "spark" | "guardian" | "familiar" | "mythic" | "celestial" | "elder" | "cosmic";
export type EvolutionTrack = "bloom" | "storm" | "moon" | "forge" | "archive";
export type CareState = "awake" | "sleepy" | "neglected";
export type CareAction = "feed" | "play" | "clean" | "study";

export type PetState = {
  id: number;
  name: string;
  stage: PetStage;
  evolutionTrack: EvolutionTrack | null;
  careState: CareState;
  mood: string;
  hunger: number;
  joy: number;
  hygiene: number;
  curiosity: number;
  xp: number;
  xpToday: number;
  xpDay: string;
  streak: number;
  lastInteractionAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PetEvent = {
  id: number;
  action: string;
  title: string;
  body: string;
  createdAt: string;
};

export type PetProfile = {
  eggName: string;
  shellColor: string;
  accentColor: string;
  backstory: string;
  voiceStyle: string;
};

export type LearnedTopic = {
  id: number;
  topic: string;
  note: string;
  createdAt: string;
};

export type SiteConfig = {
  debugEnabled: boolean;
};

export type PetSnapshot = {
  pet: PetState;
  profile: PetProfile;
  siteConfig: SiteConfig;
  topics: LearnedTopic[];
  events: PetEvent[];
};

export type ProfileInput = Partial<PetProfile & SiteConfig>;
export type DebugAdvanceInput = {
  xp?: unknown;
  stage?: unknown;
  track?: unknown;
  resetDailyXp?: unknown;
};

const dataDir = path.join(process.cwd(), "workspace", "data");
const dbPath = path.join(dataDir, "tamagotchi.db");

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS pet (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    hunger INTEGER NOT NULL,
    joy INTEGER NOT NULL,
    hygiene INTEGER NOT NULL,
    curiosity INTEGER NOT NULL,
    xp INTEGER NOT NULL,
    streak INTEGER NOT NULL,
    last_interaction_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pet_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pet_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    shell_color TEXT NOT NULL,
    accent_color TEXT NOT NULL,
    backstory TEXT NOT NULL,
    voice_style TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS learned_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    debug_enabled INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function ensurePetColumn(name: string, definition: string) {
  const columns = db.prepare("PRAGMA table_info(pet)").all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === name)) {
    db.prepare(`ALTER TABLE pet ADD COLUMN ${name} ${definition}`).run();
  }
}

ensurePetColumn("xp_today", "INTEGER NOT NULL DEFAULT 0");
ensurePetColumn("xp_day", "TEXT NOT NULL DEFAULT ''");
ensurePetColumn("evolution_track", "TEXT");
ensurePetColumn("care_state", "TEXT NOT NULL DEFAULT 'awake'");

type PetRow = {
  id: number;
  name: string;
  evolution_track: string | null;
  care_state: string;
  hunger: number;
  joy: number;
  hygiene: number;
  curiosity: number;
  xp: number;
  xp_today: number;
  xp_day: string;
  streak: number;
  last_interaction_at: string;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: number;
  action: string;
  title: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  shell_color: string;
  accent_color: string;
  backstory: string;
  voice_style: string;
};

type TopicRow = {
  id: number;
  topic: string;
  note: string;
  created_at: string;
};

type SiteConfigRow = {
  debug_enabled: number;
};

const actionCopy: Record<CareAction, { title: string; body: string }> = {
  feed: {
    title: "Snack accepted",
    body: "The egg warmed up after a tiny fruit bite."
  },
  play: {
    title: "Wiggle session",
    body: "A quick game added a little bounce to the shell."
  },
  clean: {
    title: "Fresh nest",
    body: "The nest is tidy and the shell is shining again."
  },
  study: {
    title: "Curiosity spark",
    body: "You shared a new pattern and the creature listened closely."
  }
};

export const evolutionStages: Array<{ stage: PetStage; xp: number; label: string }> = [
  { stage: "egg", xp: 0, label: "Egg" },
  { stage: "hatchling", xp: 90, label: "Hatchling" },
  { stage: "spark", xp: 220, label: "Spark" },
  { stage: "guardian", xp: 420, label: "Guardian" },
  { stage: "familiar", xp: 900, label: "Familiar" },
  { stage: "mythic", xp: 1900, label: "Mythic" },
  { stage: "celestial", xp: 4100, label: "Celestial" },
  { stage: "elder", xp: 8800, label: "Elder" },
  { stage: "cosmic", xp: 19000, label: "Cosmic" }
];

const tracks: EvolutionTrack[] = ["bloom", "storm", "moon", "forge", "archive"];
const dailyXpLimit = 120;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function todayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function yesterdayKey(date: Date): string {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() - 1);
  return todayKey(copy);
}

function streakBonusFor(streak: number): number {
  return Math.min(60, Math.max(0, streak - 1) * 3);
}

function daysBetween(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.max(0, Math.round((endUtc - startUtc) / 86_400_000));
}

function stageFor(xp: number): PetStage {
  return [...evolutionStages].reverse().find((stage) => xp >= stage.xp)?.stage ?? "egg";
}

function moodFor(pet: Omit<PetState, "stage" | "mood">): string {
  if (pet.careState === "neglected") return "neglected";
  if (pet.careState === "sleepy") return "sleepy";
  const avg = (pet.hunger + pet.joy + pet.hygiene + pet.curiosity) / 4;
  if (avg >= 82) return "glowing";
  if (pet.hunger < 35) return "snacky";
  if (pet.joy < 35) return "bored";
  if (pet.hygiene < 35) return "dusty";
  if (pet.curiosity < 35) return "dreamy";
  return "cozy";
}

function mapPet(row: PetRow): PetState {
  const base = {
    id: row.id,
    name: row.name,
    evolutionTrack: normalizeTrack(row.evolution_track),
    careState: normalizeCareState(row.care_state),
    hunger: row.hunger,
    joy: row.joy,
    hygiene: row.hygiene,
    curiosity: row.curiosity,
    xp: row.xp,
    xpToday: row.xp_day === todayKey(new Date()) ? row.xp_today : 0,
    xpDay: row.xp_day,
    streak: row.streak,
    lastInteractionAt: row.last_interaction_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  return {
    ...base,
    stage: stageFor(base.xp),
    mood: moodFor(base)
  };
}

function normalizeTrack(value: unknown): EvolutionTrack | null {
  return tracks.includes(value as EvolutionTrack) ? (value as EvolutionTrack) : null;
}

function normalizeCareState(value: unknown): CareState {
  return value === "sleepy" || value === "neglected" ? value : "awake";
}

function chooseEvolutionTrack(pet: Pick<PetState, "hunger" | "joy" | "hygiene" | "curiosity">): EvolutionTrack {
  const topicText = db
    .prepare("SELECT topic || ' ' || note as text FROM learned_topics ORDER BY id DESC LIMIT 10")
    .all() as Array<{ text: string }>;
  const combinedTopics = topicText.map((row) => row.text.toLowerCase()).join(" ");

  if (combinedTopics.match(/garden|nature|plant|grow|care|community|food|recipe/)) return "bloom";
  if (combinedTopics.match(/game|social|energy|farcaster|discord|telegram|loop|play/)) return "storm";
  if (combinedTopics.match(/dream|story|moon|ritual|memory|identity|voice/)) return "moon";
  if (combinedTopics.match(/build|deploy|template|code|pm2|sqlite|api|tool/)) return "forge";
  if (combinedTopics.match(/knowledge|graph|research|docs|archive|learn|topic/)) return "archive";

  const statEntries: Array<[EvolutionTrack, number]> = [
    ["bloom", pet.hunger],
    ["storm", pet.joy],
    ["moon", pet.hygiene],
    ["archive", pet.curiosity],
    ["forge", Math.round((pet.hunger + pet.joy + pet.hygiene + pet.curiosity) / 4)]
  ];

  return statEntries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "bloom";
}

function ensureEvolutionTrack(row: PetRow): PetRow {
  if (row.xp < 420 || normalizeTrack(row.evolution_track)) return row;

  const track = chooseEvolutionTrack(row);
  db.prepare("UPDATE pet SET evolution_track = @track, updated_at = @now WHERE id = 1").run({
    track,
    now: new Date().toISOString()
  });
  db.prepare("INSERT INTO pet_events (action, title, body) VALUES (?, ?, ?)").run(
    "evolution",
    `Track chosen: ${track}`,
    `${row.name} crossed into guardian form and started growing along the ${track} track.`
  );

  return { ...row, evolution_track: track };
}

function mapEvent(row: EventRow): PetEvent {
  return {
    id: row.id,
    action: row.action,
    title: row.title,
    body: row.body,
    createdAt: row.created_at
  };
}

function mapProfile(row: ProfileRow, pet: PetState): PetProfile {
  return {
    eggName: pet.name,
    shellColor: row.shell_color,
    accentColor: row.accent_color,
    backstory: row.backstory,
    voiceStyle: row.voice_style
  };
}

function mapTopic(row: TopicRow): LearnedTopic {
  return {
    id: row.id,
    topic: row.topic,
    note: row.note,
    createdAt: row.created_at
  };
}

function seedProfile() {
  db.prepare(
    `INSERT OR IGNORE INTO pet_profile (
      id, shell_color, accent_color, backstory, voice_style
    ) VALUES (
      1, '#fff8df', '#8fb9e8', 'A soft little egg from the Raid Guild cohort, learning what makes people come back tomorrow.', 'curious, baby-bright, and concise'
    )`
  ).run();
}

function seedSiteConfig() {
  db.prepare("INSERT OR IGNORE INTO site_config (id, debug_enabled) VALUES (1, 0)").run();
}

function seedPet(): PetState {
  const now = new Date().toISOString();
  const today = todayKey(new Date());
  const neverInteracted = "1970-01-01T00:00:00.000Z";
  db.prepare(
    `INSERT OR IGNORE INTO pet (
      id, name, hunger, joy, hygiene, curiosity, xp, xp_today, xp_day, evolution_track, care_state, streak, last_interaction_at, created_at, updated_at
    ) VALUES (
      1, 'Pip', 62, 58, 68, 54, 0, 0, @today, NULL, 'awake', 0, @neverInteracted, @now, @now
    )`
  ).run({ now, today, neverInteracted });

  const eventCount = db.prepare("SELECT COUNT(*) as count FROM pet_events").get() as { count: number };
  if (eventCount.count === 0) {
    db.prepare("INSERT INTO pet_events (action, title, body) VALUES (?, ?, ?)").run(
      "birth",
      "A soft egg appears",
      "Pip is waiting for a first care ritual."
    );
  }

  seedProfile();
  seedSiteConfig();

  return getPet();
}

export function getPet(): PetState {
  const row = db.prepare("SELECT * FROM pet WHERE id = 1").get() as PetRow | undefined;
  return row ? mapPet(ensureEvolutionTrack(row)) : seedPet();
}

export function listEvents(limit = 12): PetEvent[] {
  const rows = db
    .prepare("SELECT * FROM pet_events ORDER BY created_at DESC, id DESC LIMIT ?")
    .all(limit) as EventRow[];
  return rows.map(mapEvent);
}

export function getProfile(): PetProfile {
  const pet = getPet();
  seedProfile();
  const row = db.prepare("SELECT * FROM pet_profile WHERE id = 1").get() as ProfileRow;
  return mapProfile(row, pet);
}

export function getSiteConfig(): SiteConfig {
  seedSiteConfig();
  const row = db.prepare("SELECT * FROM site_config WHERE id = 1").get() as SiteConfigRow;
  return {
    debugEnabled: row.debug_enabled === 1
  };
}

export function listTopics(limit = 8): LearnedTopic[] {
  const rows = db
    .prepare("SELECT * FROM learned_topics ORDER BY created_at DESC, id DESC LIMIT ?")
    .all(limit) as TopicRow[];
  return rows.map(mapTopic);
}

export function getSnapshot(): PetSnapshot {
  return {
    pet: getPet(),
    profile: getProfile(),
    siteConfig: getSiteConfig(),
    topics: listTopics(),
    events: listEvents()
  };
}

export function applyCareAction(action: CareAction): PetSnapshot {
  const current = getPet();
  const now = new Date();
  const day = todayKey(now);
  const last = new Date(current.lastInteractionAt);
  const interactedToday = todayKey(now) === todayKey(last);
  const keptStreak = yesterdayKey(now) === todayKey(last);
  const missedDays = current.streak > 0 && !interactedToday && !keptStreak ? Math.max(0, daysBetween(last, now) - 1) : 0;
  const wasNeglected = missedDays >= 4;
  const wasSleepy = missedDays > 0 && missedDays < 4;
  const streak = interactedToday ? Math.max(current.streak, 1) : keptStreak ? current.streak + 1 : 1;
  const earnedToday = current.xpDay === day ? current.xpToday : 0;
  const streakBonus = interactedToday ? 0 : streakBonusFor(streak);
  const requestedXp = interactedToday ? 14 : 26 + streakBonus;
  const xpBonus = Math.max(0, Math.min(requestedXp, dailyXpLimit - earnedToday));

  const next = {
    hunger: clamp(current.hunger - missedDays * 8 + (action === "feed" ? 26 : -4)),
    joy: clamp(current.joy - missedDays * 7 + (action === "play" ? 24 : action === "study" ? 5 : -3)),
    hygiene: clamp(current.hygiene - missedDays * 9 + (action === "clean" ? 28 : -5)),
    curiosity: clamp(current.curiosity - missedDays * 5 + (action === "study" ? 26 : action === "play" ? 6 : -2)),
    xp: current.xp + xpBonus,
    xpToday: earnedToday + xpBonus,
    xpDay: day,
    careState: "awake",
    streak
  };

  db.prepare(
    `UPDATE pet
     SET hunger = @hunger,
         joy = @joy,
         hygiene = @hygiene,
         curiosity = @curiosity,
         xp = @xp,
         xp_today = @xpToday,
         xp_day = @xpDay,
         care_state = @careState,
         streak = @streak,
         last_interaction_at = @now,
         updated_at = @now
     WHERE id = 1`
  ).run({ ...next, now: now.toISOString() });

  const copy = actionCopy[action];
  db.prepare("INSERT INTO pet_events (action, title, body) VALUES (@action, @title, @body)").run({
    action,
    title: copy.title,
    body:
      xpBonus > 0
        ? `${copy.body}${wasNeglected ? " It woke up from neglect." : wasSleepy ? " It woke up sleepy but glad." : ""} +${xpBonus} XP${streakBonus > 0 ? `, including +${streakBonus} streak bonus` : ""}.`
        : `${copy.body} Daily XP is capped, but care still counts.`
  });

  return getSnapshot();
}

export function resetPet(): PetSnapshot {
  db.prepare("DELETE FROM pet_events").run();
  db.prepare("DELETE FROM learned_topics").run();
  db.prepare("DELETE FROM pet").run();
  db.prepare("DELETE FROM pet_profile").run();
  return {
    pet: seedPet(),
    profile: getProfile(),
    siteConfig: getSiteConfig(),
    topics: listTopics(),
    events: listEvents()
  };
}

export function isCareAction(value: unknown): value is CareAction {
  return value === "feed" || value === "play" || value === "clean" || value === "study";
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function colorOrFallback(value: unknown, fallback: string): string {
  const color = cleanText(value, 16);
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

export function updateProfile(input: ProfileInput): PetSnapshot {
  const current = getProfile();
  const currentConfig = getSiteConfig();
  const eggName = cleanText(input.eggName, 32) || current.eggName;
  const shellColor = colorOrFallback(input.shellColor, current.shellColor);
  const accentColor = colorOrFallback(input.accentColor, current.accentColor);
  const backstory = cleanText(input.backstory, 420) || current.backstory;
  const voiceStyle = cleanText(input.voiceStyle, 180) || current.voiceStyle;
  const debugEnabled = typeof input.debugEnabled === "boolean" ? input.debugEnabled : currentConfig.debugEnabled;
  const now = new Date().toISOString();

  db.prepare("UPDATE pet SET name = @eggName, updated_at = @now WHERE id = 1").run({ eggName, now });
  db.prepare(
    `INSERT INTO pet_profile (id, shell_color, accent_color, backstory, voice_style, updated_at)
     VALUES (1, @shellColor, @accentColor, @backstory, @voiceStyle, @now)
     ON CONFLICT(id) DO UPDATE SET
       shell_color = excluded.shell_color,
       accent_color = excluded.accent_color,
       backstory = excluded.backstory,
       voice_style = excluded.voice_style,
       updated_at = excluded.updated_at`
  ).run({ shellColor, accentColor, backstory, voiceStyle, now });
  db.prepare(
    `INSERT INTO site_config (id, debug_enabled, updated_at)
     VALUES (1, @debugEnabled, @now)
     ON CONFLICT(id) DO UPDATE SET
       debug_enabled = excluded.debug_enabled,
       updated_at = excluded.updated_at`
  ).run({ debugEnabled: debugEnabled ? 1 : 0, now });

  db.prepare("INSERT INTO pet_events (action, title, body) VALUES (?, ?, ?)").run(
    "profile",
    "Identity tuned",
    `${eggName}'s colors, backstory, or voice changed.`
  );

  return getSnapshot();
}

export function teachTopic(topicInput: unknown, noteInput?: unknown): PetSnapshot {
  const topic = cleanText(topicInput, 80);
  if (!topic) throw new Error("Topic is required.");

  const note = cleanText(noteInput, 420) || "A new topic to wonder about.";
  const current = getPet();
  const nowDate = new Date();
  const day = todayKey(nowDate);
  const last = new Date(current.lastInteractionAt);
  const interactedToday = todayKey(nowDate) === todayKey(last);
  const keptStreak = yesterdayKey(nowDate) === todayKey(last);
  const missedDays = current.streak > 0 && !interactedToday && !keptStreak ? Math.max(0, daysBetween(last, nowDate) - 1) : 0;
  const wasNeglected = missedDays >= 4;
  const wasSleepy = missedDays > 0 && missedDays < 4;
  const streak = interactedToday ? Math.max(current.streak, 1) : keptStreak ? current.streak + 1 : 1;
  const earnedToday = current.xpDay === day ? current.xpToday : 0;
  const streakBonus = interactedToday ? 0 : streakBonusFor(streak);
  const requestedXp = interactedToday ? 18 : 30 + streakBonus;
  const xpBonus = Math.max(0, Math.min(requestedXp, dailyXpLimit - earnedToday));
  const now = nowDate.toISOString();

  db.prepare("INSERT INTO learned_topics (topic, note) VALUES (@topic, @note)").run({ topic, note });
  db.prepare(
    `UPDATE pet
     SET curiosity = @curiosity,
         joy = @joy,
         xp = @xp,
         xp_today = @xpToday,
         xp_day = @xpDay,
         care_state = @careState,
         streak = @streak,
         last_interaction_at = @now,
         updated_at = @now
     WHERE id = 1`
  ).run({
    curiosity: clamp(current.curiosity - missedDays * 5 + 20),
    joy: clamp(current.joy - missedDays * 7 + 4),
    xp: current.xp + xpBonus,
    xpToday: earnedToday + xpBonus,
    xpDay: day,
    careState: "awake",
    streak,
    now
  });
  db.prepare("INSERT INTO pet_events (action, title, body) VALUES (?, ?, ?)").run(
    "teach",
    `Learned ${topic}`,
    xpBonus > 0
      ? `${current.name} tucked this into memory.${wasNeglected ? " It woke up from neglect." : wasSleepy ? " It woke up sleepy but curious." : ""} ${note} +${xpBonus} XP${streakBonus > 0 ? `, including +${streakBonus} streak bonus` : ""}.`
      : `${current.name} tucked this into memory. ${note} Daily XP is capped, but the memory stays.`
  );

  return getSnapshot();
}

export function debugAdvance(input: DebugAdvanceInput): PetSnapshot {
  const xpFromStage = typeof input.stage === "string" ? evolutionStages.find((item) => item.stage === input.stage)?.xp : undefined;
  const parsedXp = numberOrNull(input.xp);
  const xp = Math.max(0, Math.round(parsedXp ?? xpFromStage ?? 0));
  const track = normalizeTrack(input.track);
  const current = getPet();
  const nextTrack = xp >= 420 ? track ?? current.evolutionTrack ?? chooseEvolutionTrack(current) : null;
  const resetDailyXp = input.resetDailyXp !== false;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE pet
     SET xp = @xp,
         xp_today = @xpToday,
         xp_day = @xpDay,
         evolution_track = @track,
         updated_at = @now
     WHERE id = 1`
  ).run({
    xp,
    xpToday: resetDailyXp ? 0 : current.xpToday,
    xpDay: todayKey(new Date()),
    track: nextTrack,
    now
  });

  db.prepare("INSERT INTO pet_events (action, title, body) VALUES (?, ?, ?)").run(
    "debug",
    "Fast forward",
    `${current.name} was moved to ${stageFor(xp)} at ${xp} XP${nextTrack ? ` on the ${nextTrack} track` : ""}.`
  );

  return getSnapshot();
}

export function replyAsPet(messageInput: unknown): { reply: string; snapshot: PetSnapshot; mode: string } {
  const raw = cleanText(messageInput, 800);
  const lower = raw.toLowerCase();

  if (!raw) {
    return {
      reply: "Tap-tap. I am listening from inside the shell.",
      snapshot: getSnapshot(),
      mode: "empty"
    };
  }

  if (lower.startsWith("ooc:")) {
    const snapshot = getSnapshot();
    return {
      reply: `OOC: ${snapshot.pet.name} is ${snapshot.pet.stage}, care ${snapshot.pet.careState}, mood ${snapshot.pet.mood}, with ${snapshot.pet.xp} XP. Daily XP: ${snapshot.pet.xpToday}/120. Use care:, teach:, or status: from chat.`,
      snapshot,
      mode: "ooc"
    };
  }

  if (lower.startsWith("status:") || lower === "status") {
    const snapshot = getSnapshot();
    const topicList = snapshot.topics.map((topic) => topic.topic).join(", ") || "nothing yet";
    return {
      reply: `I am ${snapshot.pet.name}, a ${snapshot.pet.mood} ${snapshot.pet.stage}${snapshot.pet.evolutionTrack ? ` on the ${snapshot.pet.evolutionTrack} track` : ""}. Care: ${snapshot.pet.careState}. XP: ${snapshot.pet.xp}. Daily XP: ${snapshot.pet.xpToday}/120. I know about ${topicList}. Streak: ${snapshot.pet.streak}.`,
      snapshot,
      mode: "status"
    };
  }

  if (lower.startsWith("care:")) {
    const requested = lower.replace("care:", "").trim().split(/\s+/)[0];
    const action = isCareAction(requested) ? requested : "play";
    const snapshot = applyCareAction(action);
    return {
      reply: `Peep. ${action} helped. I feel ${snapshot.pet.mood} and I have ${snapshot.pet.xp} XP now.`,
      snapshot,
      mode: "care"
    };
  }

  if (lower.startsWith("teach:")) {
    const lesson = raw.replace(/^teach:/i, "").trim();
    const [topicPart, ...noteParts] = lesson.split("-");
    const topic = topicPart.trim();
    const note = noteParts.join("-").trim();
    const snapshot = teachTopic(topic, note);
    return {
      reply: `I learned ${topic}. My shell feels a little bigger inside.`,
      snapshot,
      mode: "teach"
    };
  }

  const snapshot = getSnapshot();
  const latestTopic = snapshot.topics[0]?.topic;
  const topicLine = latestTopic ? ` I keep thinking about ${latestTopic}.` : "";
  return {
    reply: `${snapshot.pet.name} wiggles from the ${snapshot.pet.stage}${snapshot.pet.evolutionTrack ? `, shaped by the ${snapshot.pet.evolutionTrack} track` : ""}. ${snapshot.profile.voiceStyle}.${topicLine} Try "teach: something" if you want me to grow around a new idea.`,
    snapshot,
    mode: "pet"
  };
}
