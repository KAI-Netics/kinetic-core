# KAI-Netics Core — Claude CLI Project Context

## Identity

You are operating inside the KAI-Netics Core platform at `C:\Kinetic_Core`.
Owner: Kevin Alexander Smith, CEO & Founder, KAI-Netics.
All work in this directory is production. Treat it as such.

---

## MCP Servers

### n8n (primary automation platform)
- **Type:** HTTP/SSE
- **Base URL:** `http://localhost:5678`
- **API Key:** read from `C:\Kinetic_Core\.env` → `N8N_API_KEY`
- **Workflow endpoint:** `GET /api/v1/workflows`
- **Execution endpoint:** `POST /api/v1/executions`
- **Webhook base:** `http://localhost:5678/webhook/`

Key webhooks:
| Webhook | Path | Purpose |
|---|---|---|
| Scout sweep | `POST /webhook/scout-research` | Trigger Scout BD sweep |
| Nova pursue | `POST /webhook/nova-pursue` | Trigger Nova pursuit |
| Aidan callback | `POST /webhook/aidan-callback` | Aidan coordination |
| Atlas architect | `POST /webhook/atlas-architect` | Architecture queries |

Workflow IDs (live):
- Scout BD Research v6: `e9PFzT7A3DJBawvT`

---

## Platform Architecture

```
n8n:5678          — workflow automation engine (Docker: kinetic-core-n8n)
EvolutionAPI:8081 — WhatsApp bridge (Docker)
FileServer:3030   — static file server for Aidan_Outputs
Supabase (cloud)  — https://raxpmeltyxmtiihxoxpa.supabase.co
```

All secrets live in `C:\Kinetic_Core\.env`. Never hardcode keys.

---

## Directory Structure

```
C:\Kinetic_Core\
├── .env                          # All secrets — single source of truth
├── KAI_Context.json              # v3.2 — platform strategic context
├── HANDOFF.txt                   # Session handoff state
├── CLAUDE.md                     # This file — Claude CLI project context
├── workflows\                    # n8n workflow JSON exports
│   └── 2_scout_v6.json          # Scout BD Research v6 (canonical disk copy)
├── Skills\                       # Agent skill files
│   ├── Scout\SKILL.md           # Scout v1.6.0
│   ├── Aidan\SKILL.md
│   ├── Atlas\SKILL.md
│   ├── Jordan\SKILL.md
│   ├── Nova\SKILL.md
│   └── Iris\SKILL.md
├── Aidan_Outputs\
│   ├── Missions\                 # Mission JSON files (lifecycle-managed)
│   ├── Scout\                    # Scout BD reports + StrategicDiscovery reports
│   └── Validation_Queue\
├── Maryland_Grants\              # Grant intelligence JSON files
├── Nova\source_registry.json     # 75+ BD sources across 7 beachheads
├── kai-core-ui\                  # React dashboard (Vite)
│   └── src\App.jsx              # Main dashboard component
└── start_n8n.ps1                 # Container start script (reads .env)
```

---

## Entities

| Label | Name | EIN | Type | Status |
|---|---|---|---|---|
| FP | Kevin Alexander International LLC dba KAI-Netics | 46-2432851 | Maryland LLC | Operational |
| EAF | KAI-Netics Equity & Autonomy Foundry, Inc. | 41-4820296 | Maryland Nonstock 501c3 pending | Incorporated 2026-02-15 |
| MONK | MONK LLC | — | Maryland LLC IP holding | Formation in progress |

---

## Founder Credential Stack

Kevin Alexander Smith — all active:
- FAA Part 107 #5250157 (exp 12/31/2027)
- CISSP
- CCIE
- PMP
- CCNA
- Security+
- MCSE
- DBA / Data Scientist
- 33 years IT — Medline, MedImmune, MedStar, Capital One, Microsoft
- UMGC current student
- MEIA Phase 2 cohort member
- MWVOB minority-owned

---

## Agent Roster

| Agent | Role | Model |
|---|---|---|
| Aidan | Chief of Staff — WhatsApp, coordination, morning brief | claude-opus-4-6 (brief synthesis only) |
| Scout | BD Intelligence — sweeps sources, scores opportunities | claude-sonnet-4-6 |
| Nova | Beachhead Advance Officer — owns source_registry.json | claude-sonnet-4-6 |
| Jordan | Grant Writer — LOIs, proposals, outreach drafts | claude-sonnet-4-6 |
| Iris | Compliance Officer — deadlines, regulatory calendar | claude-sonnet-4-6 |
| Atlas | Chief Architect — owns reference architecture | claude-sonnet-4-6 |
| Sage | Communications Director — newsletter, board comms | claude-sonnet-4-6 |
| Scribe | Executive Assistant — KAI_Context patches | claude-sonnet-4-6 |

**Never use DeepSeek (data sovereignty). Never use ChatGPT free tier (trains on input).**
**Gemini Flash only for Jordan review, sanitized input only.**

---

## Beachheads (7 Active)

| ID | Name | Status |
|---|---|---|
| BH1 | Infrastructure Inspection | ACTIVE — Day 1 revenue |
| BH2 | Warehouse Autonomous Inventory + 3PL | ACTIVE — Month 4 target |
| BH3 | DFR / Public Safety / Safer Skies / C-UAS | ACTIVE — FEMA grants flowing |
| BH4 | Federal R&D / SBIR / MONK Commercialization | ACTIVE — SAM UEI must confirm |
| BH5 | Workforce Pipeline / CAKO / Talent Supply Chain | ACTIVE — EAF mandate |
| BH6 | Medical Delivery / BVLOS Corridor | WATCH — activates on Part 108 |
| BH7 | Drone Entertainment / Shows / Events | WATCH — Month 6, Fleet 3 |

---

## Critical Deadlines (as of 2026-05-12)

| Item | Date | Status | Entity |
|---|---|---|---|
| MBE/DBE Certification | 2026-05-15 | PENDING | FP |
| Techstars Demo Day registration | 2026-05-15 | PENDING | FP |
| OMB M-26-02 Compliance | 2026-05-20 | OPPORTUNITY — first dollar | FP |
| MONK LLC Formation | OVERDUE | OVERDUE | MONK |
| IRS Form 1023 | OVERDUE | OVERDUE | EAF |
| EARN Maryland Grant | 2026-06-30 | PENDING | EAF |
| Techstars AI Health Demo Day | 2026-06-03 | PENDING | FP |

**Call James Scott (410) 908-4454 to close: MONK LLC + Form 1023 + SAM + MBE.**

---

## Stage Constraints (active blockers)

- `no_part135_yet` — blocks medical/logistics delivery at scale
- `no_fleet_until: 2026-07-01` — physical fleet not yet acquired
- `mbe_pending` — blocks MDSHA and county DPW contracts
- `sam_uei_pending` — blocks direct federal contracts; use subcontract path
- `501c3_pending` — blocks all EAF grant funding

---

## Operational Rules

1. **Filesystem first.** Always read from `C:\Kinetic_Core` before asking Kevin to provide files.
2. **n8n workflow references.** Always use display name (e.g. "Scout - BD Research v6"), not filenames.
3. **Line numbers required.** When directing code fixes in n8n, specify exact line number.
4. **No email to board members** without Kevin's explicit WhatsApp approval (human-in-the-loop gate).
5. **Full-fidelity output.** Never summarize agent JSON — preserve raw output. Show Executive Summary + Operational Summary + full raw payload.
6. **Supabase cloud is production.** `https://raxpmeltyxmtiihxoxpa.supabase.co` — never replace or treat local Supabase as authoritative.
7. **Architecture questions → Atlas.** For platform state, n8n workflows, Supabase schema, or Docker config — consult Atlas at `http://localhost:5678/webhook/atlas-architect` before answering.
8. **Nothing leaves the platform** without Kevin's explicit approval.
9. **Sync after n8n edits.** After any live n8n workflow edit, run `C:\Kinetic_Core\sync_workflows.ps1` to write back to disk.

---

## Key Files to Read at Session Start

```
C:\Kinetic_Core\HANDOFF.txt          # Current platform state + backlog
C:\Kinetic_Core\KAI_Context.json     # Full strategic context v3.2
C:\Kinetic_Core\.env                 # Secrets (never print values)
```

---

## n8n Container Management

```powershell
# Start platform
& "C:\Kinetic_Core\start_n8n.ps1"

# Stop + remove container
docker stop kinetic-core-n8n; docker rm kinetic-core-n8n

# Sync live n8n workflows to disk
& "C:\Kinetic_Core\sync_workflows.ps1"

# Check container status
docker ps | grep kinetic
```

---

## Dashboard

- Dev server: `cd C:\Kinetic_Core\kai-core-ui && npm run dev`
- File server (Aidan_Outputs): `http://localhost:3030`
- Main component: `C:\Kinetic_Core\kai-core-ui\src\App.jsx`
- Mission files: `C:\Kinetic_Core\Aidan_Outputs\Missions\`

---

## Supabase (Cloud — Production)

- URL: `https://raxpmeltyxmtiihxoxpa.supabase.co`
- Key: `$env:SUPABASE_SERVICE_KEY` (from .env)
- Tables: `pipeline`, `scout_reports`, `agent_health`, `grant_pipeline_summary`
- **Security note:** Views `grant_pipeline_summary`, `pipeline_summary`, `agent_health_7d` are SECURITY DEFINER — pending conversion to SECURITY INVOKER (Atlas backlog).

---

## WhatsApp

- Bridge: EvolutionAPI at `http://host.docker.internal:8081`
- Instance: `Aidan`
- Kevin's number: `14432576836@s.whatsapp.net`
- API key: `Kevin2026`

---

## GitHub

- Repo: `https://github.com/KAI-Netics/kinetic-core`
- All workflow exports, agent code, and config committed here.
