# Audit Note — AIMemoryBookCreator

Source audit: `_AUDIT/reports/batch_05.md` § 20

## Original audit recommendations

### Missing AI endpoints
- `/generate-timeline`
- `/relationship-mapper`
- `/memory-search` (semantic search)
- `/comparison-highlight`

### Missing non-AI features
- Collaborative memory books (family contributions)
- Video memory capture
- Audio interviews / voice memos
- Share & permission controls
- Print-on-demand book service
- Email/SMS sharing

### Custom feature suggestions
- Agentic life story narrator
- Vision-based memory enhancement
- Streaming memory animation
- Family legacy documentation
- Generational memory linking
- Memory book marketplace

## Implemented in this pass
1. **POST `/api/ai/generate-timeline`** — pulls memories from Postgres, builds chronological timeline + era grouping + narrative arc.
2. **POST `/api/ai/relationship-mapper`** — extracts people and relationships across a memory collection, returns family-tree hint.

Both follow existing `routes/ai.js` patterns (`callOpenRouter`, `parseAIJson`, `saveGeneration` to `ai_generations` table, `auth` + `aiRateLimiter`). Defensive `try/catch` around DB query handles schema variance. Syntax checked.

## Backlog (priority order)

### Mechanical
- `/comparison-highlight` (text-only diff between two memories — straightforward)

### Needs creds / external SDK
- `/memory-search` (semantic) — needs an embeddings model + pgvector or similar
- Print-on-demand (Lulu, Blurb APIs)
- Email/SMS sharing (SendGrid, Twilio)
- Audio voice memo capture (storage + ASR)

### Needs product decision
- Collaborative books (multi-user permission model)
- Video memory storage tier (cost, retention)
- Family legacy / generational linking (data ownership across users)
- Memory book marketplace (monetization model)

## Apply pass 3 (frontend)

LEFT-AS-IS. Frontend already wires all backend AI endpoints (including the apply-pass-2 additions) with JWT Bearer auth from `localStorage`. No FE changes needed; idempotence rule applied. See `_AUDIT/apply3_logs/ab3_99.md`.
