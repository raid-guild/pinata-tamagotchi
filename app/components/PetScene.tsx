"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { CareAction, EvolutionTrack, LearnedTopic, PetEvent, PetProfile, PetSnapshot, PetStage, PetState } from "@/lib/pet-store";

const actions: Array<{ id: CareAction; label: string; className: string }> = [
  { id: "feed", label: "Feed", className: "feed" },
  { id: "play", label: "Play", className: "play" },
  { id: "clean", label: "Clean", className: "clean" },
  { id: "study", label: "Teach", className: "study" }
];

const statLabels: Array<{ key: keyof Pick<PetState, "hunger" | "joy" | "hygiene" | "curiosity">; label: string }> = [
  { key: "hunger", label: "Fullness" },
  { key: "joy", label: "Joy" },
  { key: "hygiene", label: "Shine" },
  { key: "curiosity", label: "Curiosity" }
];

const stageMeta: Array<{ stage: PetStage; xp: number; label: string }> = [
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

const trackColors: Record<EvolutionTrack, { accent: string; aura: string; label: string }> = {
  bloom: { accent: "#4f9f76", aura: "rgba(142,216,190,0.34)", label: "Bloom" },
  storm: { accent: "#5d8be8", aura: "rgba(143,185,232,0.36)", label: "Storm" },
  moon: { accent: "#8d7cc2", aura: "rgba(141,124,194,0.32)", label: "Moon" },
  forge: { accent: "#d88945", aura: "rgba(240,143,127,0.32)", label: "Forge" },
  archive: { accent: "#6f5f90", aura: "rgba(244,201,93,0.3)", label: "Archive" }
};

const debugTracks: Array<{ value: EvolutionTrack; label: string }> = [
  { value: "bloom", label: "Bloom" },
  { value: "storm", label: "Storm" },
  { value: "moon", label: "Moon" },
  { value: "forge", label: "Forge" },
  { value: "archive", label: "Archive" }
];

function stageIndex(stage: PetStage): number {
  return stageMeta.findIndex((item) => item.stage === stage);
}

function streakBonusFor(streak: number): number {
  return Math.min(60, Math.max(0, streak - 1) * 3);
}

function PetArt({ pet, profile }: { pet: PetState; profile: PetProfile }) {
  const index = stageIndex(pet.stage);
  const track = pet.evolutionTrack ? trackColors[pet.evolutionTrack] : null;
  const shellColor =
    pet.stage === "egg" ? profile.shellColor : pet.stage === "hatchling" ? "#f6d58a" : profile.shellColor;
  const accent = track?.accent ?? (pet.stage === "spark" ? "#f08f7f" : profile.accentColor);
  const showFace = pet.stage !== "egg";
  const showCrack = pet.stage === "egg" || pet.stage === "hatchling";
  const showCrest = index >= stageIndex("spark");
  const showWings = index >= stageIndex("guardian");
  const showHalo = index >= stageIndex("celestial");
  const showHorns = index >= stageIndex("mythic");
  const showCrown = index >= stageIndex("elder");
  const showCosmos = index >= stageIndex("cosmic");
  const isLarge = index >= stageIndex("elder");
  const bodyPath =
    pet.stage === "egg"
      ? "M180 54 C260 54 318 154 318 250 C318 328 260 370 180 370 C100 370 42 328 42 250 C42 154 100 54 180 54Z"
      : pet.stage === "hatchling"
        ? "M180 82 C252 82 302 166 302 252 C302 324 250 366 180 366 C110 366 58 324 58 252 C58 166 108 82 180 82Z"
        : pet.stage === "spark"
          ? "M180 82 C248 82 300 150 300 242 C300 318 250 366 180 366 C110 366 60 318 60 242 C60 150 112 82 180 82Z"
          : index >= stageIndex("elder")
            ? "M180 58 C268 58 334 138 334 232 C334 326 272 386 180 386 C88 386 26 326 26 232 C26 138 92 58 180 58Z"
            : index >= stageIndex("familiar")
              ? "M180 70 C254 70 310 142 310 236 C310 322 254 374 180 374 C106 374 50 322 50 236 C50 142 106 70 180 70Z"
              : "M180 86 C242 86 292 150 292 236 C292 314 244 362 180 362 C116 362 68 314 68 236 C68 150 118 86 180 86Z";

  return (
    <svg className={`pet pet-${pet.stage}`} viewBox="0 0 420 440" role="img" aria-label={`${pet.name}, ${pet.stage} stage`}>
      <g transform="translate(30 0)">
      <ellipse cx="180" cy="388" rx={index >= stageIndex("elder") ? 150 : 118} ry="22" fill="rgba(31,36,48,0.14)" />
      {track ? <circle cx="180" cy="230" r={index >= stageIndex("elder") ? 178 : 146} fill={track.aura} opacity="0.8" /> : null}
      {showWings ? (
        <>
          <path d={index >= stageIndex("familiar") ? "M82 190 C-12 128 -22 306 82 334 C28 292 28 230 82 190Z" : "M78 212 C8 168 2 282 78 302 C42 270 42 232 78 212Z"} fill={pet.evolutionTrack === "storm" ? "#5d8be8" : "#8fb9e8"} stroke="#1f2430" strokeWidth="6" strokeLinejoin="round" />
          <path d={index >= stageIndex("familiar") ? "M278 190 C372 128 382 306 278 334 C332 292 332 230 278 190Z" : "M282 212 C352 168 358 282 282 302 C318 270 318 232 282 212Z"} fill={pet.evolutionTrack === "storm" ? "#5d8be8" : "#8fb9e8"} stroke="#1f2430" strokeWidth="6" strokeLinejoin="round" />
          <path d="M70 248 C44 250 30 266 24 286" fill="none" stroke="#1f2430" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
          <path d="M290 248 C316 250 330 266 336 286" fill="none" stroke="#1f2430" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
        </>
      ) : null}
      {pet.evolutionTrack === "bloom" && index >= stageIndex("mythic") ? (
        <>
          <path d="M62 178 C36 124 80 94 112 142 C84 136 72 154 62 178Z" fill="#4f9f76" stroke="#1f2430" strokeWidth="5" />
          <path d="M298 178 C324 124 280 94 248 142 C276 136 288 154 298 178Z" fill="#4f9f76" stroke="#1f2430" strokeWidth="5" />
        </>
      ) : null}
      {pet.evolutionTrack === "archive" && index >= stageIndex("mythic") ? (
        <>
          <rect x="38" y="190" width="52" height="72" rx="6" fill="#fffdf7" stroke="#1f2430" strokeWidth="5" />
          <rect x="270" y="190" width="52" height="72" rx="6" fill="#fffdf7" stroke="#1f2430" strokeWidth="5" />
        </>
      ) : null}
      {showHorns ? (
        <>
          <path d={isLarge ? "M98 116 C46 54 84 16 142 88" : "M118 96 C92 48 112 30 146 86"} fill={accent} stroke="#1f2430" strokeWidth="6" strokeLinejoin="round" />
          <path d={isLarge ? "M262 116 C314 54 276 16 218 88" : "M242 96 C268 48 248 30 214 86"} fill={accent} stroke="#1f2430" strokeWidth="6" strokeLinejoin="round" />
        </>
      ) : null}
      {showCrest ? (
        <path d="M154 82 C166 28 204 30 200 86 C226 42 256 68 218 108" fill={accent} stroke="#1f2430" strokeWidth="6" strokeLinejoin="round" />
      ) : null}
      {pet.stage !== "egg" ? (
        <>
          <path d="M118 354 C104 382 132 404 158 372" fill="#f6d58a" stroke="#1f2430" strokeWidth="6" strokeLinecap="round" />
          <path d="M242 354 C256 382 228 404 202 372" fill="#f6d58a" stroke="#1f2430" strokeWidth="6" strokeLinecap="round" />
        </>
      ) : null}
      <path
        d={bodyPath}
        fill={shellColor}
        stroke="#1f2430"
        strokeWidth="6"
      />
      {showCrack ? (
        <path
          d="M74 214 L112 198 L136 232 L166 206 L194 238 L224 206 L252 232 L286 210"
          fill="none"
          stroke={accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={pet.stage === "egg" ? 8 : 10}
        />
      ) : (
        <path d="M76 252 C112 230 136 284 172 256 C206 230 236 284 286 244" fill="none" stroke={accent} strokeWidth="12" strokeLinecap="round" />
      )}
      <path d="M92 178 C122 128 158 102 207 96" fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="18" strokeLinecap="round" />
      {pet.evolutionTrack === "bloom" ? (
        <>
          <path d="M92 286 C126 260 142 304 172 278 C204 250 224 296 268 266" fill="none" stroke="#4f9f76" strokeWidth="8" strokeLinecap="round" />
          <circle cx="112" cy="286" r="10" fill="#f4c95d" stroke="#1f2430" strokeWidth="4" />
          <circle cx="248" cy="266" r="10" fill="#f4c95d" stroke="#1f2430" strokeWidth="4" />
        </>
      ) : null}
      {pet.evolutionTrack === "storm" ? (
        <>
          <path d="M170 124 L140 210 H178 L152 300 L232 186 H192 L218 124Z" fill="#f4c95d" stroke="#1f2430" strokeWidth="5" strokeLinejoin="round" opacity="0.9" />
          <path d="M96 150 L78 202 H108 L88 260" fill="none" stroke="#f4c95d" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M264 150 L282 202 H252 L272 260" fill="none" stroke="#f4c95d" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {pet.evolutionTrack === "moon" ? (
        <>
          <path d="M232 134 C196 144 194 196 230 210 C186 216 164 164 190 132 C202 118 218 116 232 134Z" fill="#fffdf7" stroke={accent} strokeWidth="5" />
          <circle cx="112" cy="302" r="5" fill="#fffdf7" />
          <circle cx="244" cy="284" r="4" fill="#fffdf7" />
        </>
      ) : null}
      {pet.evolutionTrack === "forge" ? (
        <>
          <path d="M96 300 H264 L244 338 H116 Z" fill="#d88945" stroke="#1f2430" strokeWidth="5" strokeLinejoin="round" opacity="0.86" />
          <path d="M88 170 L118 150 L142 174 L116 198 Z" fill="#f08f7f" stroke="#1f2430" strokeWidth="5" />
          <path d="M272 170 L242 150 L218 174 L244 198 Z" fill="#f08f7f" stroke="#1f2430" strokeWidth="5" />
        </>
      ) : null}
      {pet.evolutionTrack === "archive" ? (
        <>
          <path d="M102 286 H258 V332 H102 Z M120 300 H240 M120 316 H226" fill="#fffdf7" stroke="#1f2430" strokeWidth="5" strokeLinejoin="round" opacity="0.9" />
          <path d="M76 146 H122 V204 H76 Z M238 146 H284 V204 H238 Z" fill="#fffdf7" stroke="#1f2430" strokeWidth="5" strokeLinejoin="round" opacity="0.9" />
        </>
      ) : null}
      {showHalo ? <ellipse cx="180" cy="84" rx={showCosmos ? 112 : 80} ry="22" fill="none" stroke={accent} strokeWidth="8" opacity="0.78" /> : null}
      {showCrown ? <path d={isLarge ? "M106 116 L134 54 L180 104 L226 54 L254 116 Z" : "M128 88 L148 46 L180 84 L212 46 L232 88 Z"} fill="#f4c95d" stroke="#1f2430" strokeWidth="6" strokeLinejoin="round" /> : null}
      {showCosmos ? (
        <>
          <circle cx="52" cy="92" r="7" fill="#f4c95d" stroke="#1f2430" strokeWidth="3" />
          <circle cx="306" cy="88" r="5" fill="#fffdf7" stroke="#1f2430" strokeWidth="3" />
          <circle cx="330" cy="302" r="8" fill="#8fb9e8" stroke="#1f2430" strokeWidth="3" />
          <path d="M48 326 C104 282 260 280 324 326" fill="none" stroke={accent} strokeWidth="4" strokeDasharray="8 10" opacity="0.78" />
          <path d="M66 118 C116 70 244 70 294 118" fill="none" stroke={accent} strokeWidth="4" strokeDasharray="7 9" opacity="0.7" />
        </>
      ) : null}
      {showFace ? (
        <>
          <circle cx="136" cy="218" r="12" fill="#1f2430" />
          <circle cx="224" cy="218" r="12" fill="#1f2430" />
          <path
            d={pet.stage === "hatchling" ? "M154 260 C166 268 194 268 206 260" : "M154 262 C168 276 194 276 208 262"}
            fill="none"
            stroke="#1f2430"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <circle cx="112" cy="246" r="14" fill="rgba(240,143,127,0.42)" />
          <circle cx="248" cy="246" r="14" fill="rgba(240,143,127,0.42)" />
        </>
      ) : (
        <path d="M126 230 C146 214 162 214 182 230 C202 246 222 246 244 230" fill="none" stroke="#1f2430" strokeWidth="5" strokeLinecap="round" />
      )}
      <text x="180" y="426" textAnchor="middle" fill="#1f2430" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="700">
        {pet.stage.toUpperCase()}
      </text>
      </g>
    </svg>
  );
}

function StatMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="stat-head">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="meter" aria-label={`${label} ${value}`}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function XpMeter({ pet }: { pet: PetState }) {
  const currentIndex = Math.max(0, stageIndex(pet.stage));
  const nextStage = stageMeta[currentIndex + 1];
  const currentStage = stageMeta[currentIndex] ?? stageMeta[0];
  const next = nextStage
    ? { label: nextStage.label, target: nextStage.xp, previous: currentStage.xp }
    : { label: "Cosmic form", target: currentStage.xp, previous: currentStage.xp };
  const stageProgress =
    pet.xp >= next.target ? 100 : Math.round(((pet.xp - next.previous) / (next.target - next.previous)) * 100);

  return (
    <div className="xp-card">
      <div>
        <span className="label">XP</span>
        <strong>{pet.xp}</strong>
      </div>
      <div>
        <span className="label">Today</span>
        <strong>{pet.xpToday}/120</strong>
      </div>
      <div>
        <span className="label">Streak</span>
        <strong>{pet.streak}</strong>
      </div>
      <div>
        <span className="label">Care</span>
        <strong>{pet.careState}</strong>
      </div>
      <div>
        <span className="label">Next bonus</span>
        <strong>+{streakBonusFor(pet.streak + 1)}</strong>
      </div>
      <div className="xp-progress">
        <div className="stat-head">
          <span>{next.label}</span>
          <span>{nextStage ? `${Math.max(0, next.target - pet.xp)} left` : "max stage"}</span>
        </div>
        <div className="meter" aria-label={`XP progress ${stageProgress}`}>
          <span style={{ width: `${stageProgress}%` }} />
        </div>
      </div>
    </div>
  );
}

function EventLog({ events }: { events: PetEvent[] }) {
  if (events.length === 0) return <p className="empty">No care rituals logged yet.</p>;

  return (
    <div className="event-log">
      {events.map((event) => (
        <article className="event" key={event.id}>
          <strong>{event.title}</strong>
          <p>{event.body}</p>
        </article>
      ))}
    </div>
  );
}

function TopicList({ topics }: { topics: LearnedTopic[] }) {
  if (topics.length === 0) return <p className="empty">No topics taught yet.</p>;

  return (
    <div className="topic-list">
      {topics.map((topic) => (
        <article className="topic" key={topic.id}>
          <strong>{topic.topic}</strong>
          <p>{topic.note}</p>
        </article>
      ))}
    </div>
  );
}

export default function PetScene({ initialSnapshot }: { initialSnapshot: PetSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [pending, setPending] = useState<CareAction | "reset" | "profile" | "topic" | "debug" | null>(null);
  const [profileDraft, setProfileDraft] = useState(initialSnapshot.profile);
  const [debugEnabledDraft, setDebugEnabledDraft] = useState(initialSnapshot.siteConfig.debugEnabled);
  const [topicDraft, setTopicDraft] = useState({ topic: "", note: "" });
  const [debugDraft, setDebugDraft] = useState({
    stage: initialSnapshot.pet.stage,
    track: initialSnapshot.pet.evolutionTrack ?? "forge"
  });

  useEffect(() => {
    fetch("/api/pet")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PetSnapshot | null) => {
        if (data) {
          setSnapshot(data);
          setProfileDraft(data.profile);
          setDebugEnabledDraft(data.siteConfig.debugEnabled);
        }
      })
      .catch(() => undefined);
  }, []);

  const progress = useMemo(() => {
    const xp = snapshot.pet.xp;
    const currentIndex = Math.max(0, stageIndex(snapshot.pet.stage));
    const nextStage = stageMeta[currentIndex + 1];
    if (!nextStage) return "Reached cosmic form. Keep teaching it strange and useful things.";
    const trackText = snapshot.pet.evolutionTrack ? ` The ${trackColors[snapshot.pet.evolutionTrack].label} track is shaping its later forms.` : "";
    return `${nextStage.xp - xp} XP until ${nextStage.label.toLowerCase()} form.${trackText}`;
  }, [snapshot.pet.evolutionTrack, snapshot.pet.stage, snapshot.pet.xp]);

  async function care(action: CareAction) {
    setPending(action);
    try {
      const response = await fetch("/api/pet/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (response.ok) setSnapshot((await response.json()) as PetSnapshot);
    } finally {
      setPending(null);
    }
  }

  async function reset() {
    setPending("reset");
    try {
      const response = await fetch("/api/pet/reset", { method: "POST" });
      if (response.ok) {
        const data = (await response.json()) as PetSnapshot;
        setSnapshot(data);
        setProfileDraft(data.profile);
        setDebugEnabledDraft(data.siteConfig.debugEnabled);
        setDebugDraft({ stage: data.pet.stage, track: data.pet.evolutionTrack ?? "forge" });
      }
    } finally {
      setPending(null);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("profile");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...profileDraft, debugEnabled: debugEnabledDraft })
      });
      if (response.ok) {
        const data = (await response.json()) as PetSnapshot;
        setSnapshot(data);
        setProfileDraft(data.profile);
        setDebugEnabledDraft(data.siteConfig.debugEnabled);
      }
    } finally {
      setPending(null);
    }
  }

  async function teachTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("topic");
    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(topicDraft)
      });
      if (response.ok) {
        setSnapshot((await response.json()) as PetSnapshot);
        setTopicDraft({ topic: "", note: "" });
      }
    } finally {
      setPending(null);
    }
  }

  async function fastForward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("debug");
    try {
      const response = await fetch("/api/debug/advance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(debugDraft)
      });
      if (response.ok) {
        const data = (await response.json()) as PetSnapshot;
        setSnapshot(data);
        setDebugDraft({ stage: data.pet.stage, track: data.pet.evolutionTrack ?? debugDraft.track });
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="shell">
      <div className="app-frame">
        <section className="stage" aria-label="Pet visualization">
          <div className="sky-dot one" />
          <div className="sky-dot two" />
          <div className="pet-wrap">
            <PetArt pet={snapshot.pet} profile={snapshot.profile} />
          </div>
        </section>

        <aside className="hud">
          <section className="panel compact-panel">
            <div className="title-row">
              <div>
                <p className="label">Pinata Tamagotchi</p>
                <h1>{snapshot.pet.name}</h1>
              </div>
              <span className="mood">{snapshot.pet.mood}</span>
            </div>
            {snapshot.pet.evolutionTrack ? <p className="track-pill">{trackColors[snapshot.pet.evolutionTrack].label} track</p> : null}
            <p className="subtitle">
              A tiny agent companion shaped by care rituals, streaks, and interface experiments. {progress}
            </p>

            <XpMeter pet={snapshot.pet} />

            <div className="stats">
              {statLabels.map((stat) => (
                <StatMeter key={stat.key} label={stat.label} value={snapshot.pet[stat.key]} />
              ))}
            </div>
          </section>

          <section className="panel compact-panel">
            <h2>Care</h2>
            <div className="actions">
              {actions.map((action) => (
                <button
                  className={`action-button ${action.className}`}
                  disabled={pending !== null}
                  key={action.id}
                  onClick={() => care(action.id)}
                  type="button"
                >
                  {pending === action.id ? "..." : action.label}
                </button>
              ))}
            </div>
            <div className="footer-actions">
              <button className="secondary-button" disabled={pending !== null} onClick={reset} type="button">
                Reset
              </button>
              <a className="secondary-button" href="/api/pet">
                API
              </a>
            </div>
          </section>

          {snapshot.siteConfig.debugEnabled ? (
            <details className="panel collapsible">
              <summary>
                <h2>Debug</h2>
                <span>fast forward</span>
              </summary>
              <form className="profile-form" onSubmit={fastForward}>
                <label>
                  <span>Stage</span>
                  <select
                    onChange={(event) => setDebugDraft({ ...debugDraft, stage: event.target.value as PetStage })}
                    value={debugDraft.stage}
                  >
                    {stageMeta.map((stage) => (
                      <option key={stage.stage} value={stage.stage}>
                        {stage.label} - {stage.xp} XP
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Track</span>
                  <select
                    onChange={(event) => setDebugDraft({ ...debugDraft, track: event.target.value as EvolutionTrack })}
                    value={debugDraft.track}
                  >
                    {debugTracks.map((track) => (
                      <option key={track.value} value={track.value}>
                        {track.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="secondary-button full" disabled={pending !== null} type="submit">
                  {pending === "debug" ? "Jumping..." : "Fast forward"}
                </button>
              </form>
            </details>
          ) : null}

          <details className="panel collapsible">
            <summary>
              <h2>Egg profile</h2>
              <span>{snapshot.profile.eggName}</span>
            </summary>
            <form className="profile-form" onSubmit={saveProfile}>
              <label>
                <span>Name</span>
                <input
                  maxLength={32}
                  onChange={(event) => setProfileDraft({ ...profileDraft, eggName: event.target.value })}
                  value={profileDraft.eggName}
                />
              </label>
              <div className="color-row">
                <label>
                  <span>Shell</span>
                  <input
                    onChange={(event) => setProfileDraft({ ...profileDraft, shellColor: event.target.value })}
                    type="color"
                    value={profileDraft.shellColor}
                  />
                </label>
                <label>
                  <span>Accent</span>
                  <input
                    onChange={(event) => setProfileDraft({ ...profileDraft, accentColor: event.target.value })}
                    type="color"
                    value={profileDraft.accentColor}
                  />
                </label>
              </div>
              <label>
                <span>Backstory</span>
                <textarea
                  maxLength={420}
                  onChange={(event) => setProfileDraft({ ...profileDraft, backstory: event.target.value })}
                  rows={3}
                  value={profileDraft.backstory}
                />
              </label>
              <label>
                <span>Voice</span>
                <input
                  maxLength={180}
                  onChange={(event) => setProfileDraft({ ...profileDraft, voiceStyle: event.target.value })}
                  value={profileDraft.voiceStyle}
                />
              </label>
              <label className="toggle-label">
                <input
                  checked={debugEnabledDraft}
                  onChange={(event) => setDebugEnabledDraft(event.target.checked)}
                  type="checkbox"
                />
                <span>Show debug fast-forward controls</span>
              </label>
              <button className="secondary-button full" disabled={pending !== null} type="submit">
                {pending === "profile" ? "Saving..." : "Save profile"}
              </button>
            </form>
          </details>

          <details className="panel collapsible">
            <summary>
              <h2>Teach a topic</h2>
              <span>{snapshot.topics.length} learned</span>
            </summary>
            <form className="profile-form" onSubmit={teachTopic}>
              <label>
                <span>Topic</span>
                <input
                  maxLength={80}
                  onChange={(event) => setTopicDraft({ ...topicDraft, topic: event.target.value })}
                  placeholder="agent templates"
                  required
                  value={topicDraft.topic}
                />
              </label>
              <label>
                <span>Note</span>
                <textarea
                  maxLength={420}
                  onChange={(event) => setTopicDraft({ ...topicDraft, note: event.target.value })}
                  placeholder="what should the egg remember?"
                  rows={3}
                  value={topicDraft.note}
                />
              </label>
              <button className="secondary-button full" disabled={pending !== null} type="submit">
                {pending === "topic" ? "Teaching..." : "Teach topic"}
              </button>
            </form>
            <TopicList topics={snapshot.topics} />
          </details>

          <details className="panel collapsible">
            <summary>
              <h2>Recent rituals</h2>
              <span>{snapshot.events.length} events</span>
            </summary>
            <EventLog events={snapshot.events} />
          </details>
        </aside>
      </div>
    </main>
  );
}
