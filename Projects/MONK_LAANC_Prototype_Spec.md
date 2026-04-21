# MONK LAANC Integration — Prototype Specification
Created: April 12, 2026 | Status: SPRINT 2 BUILD TARGET

---

## What This Is

A working prototype of MONK's mission authorization engine with integrated LAANC
(Low Altitude Authorization and Notification Capability) compliance. This is the
minimum viable version of the MONK hardware trust layer — demonstrating that every
KAI-Netics flight is cryptographically authorized, FAA-compliant, and produces a
verifiable tamper-evident record before the drone leaves the pad.

This prototype is the centerpiece of the MEIA Phase 2 prototyping engagement
and the technical foundation for the SBIR Phase I application.

---

## Background: How LAANC Works Today

LAANC is the FAA's automated airspace authorization system for drone operators.
It works through FAA-approved UAS Service Suppliers (USS) — apps and platforms
including Aloft (formerly Kittyhawk), AirMap, and Skyward.

Current manual process:
1. Pilot opens a USS app (e.g., Aloft)
2. Draws a flight area and selects altitude
3. App queries the FAA UAS Data Exchange (FIMS) via API
4. Authorization returns in seconds if within pre-approved altitude table for that airspace
5. Pilot receives a LAANC authorization token — valid for a specific time window and geography

**The gap:** Authorization tokens are issued to the pilot's app and logged manually.
There is no automated, cryptographically signed, machine-readable compliance record
that travels with the mission from pre-flight through delivery confirmation.
That is what MONK provides.

---

## MONK LAANC Prototype — Four Component Architecture

### Component 1: Mission Intake Interface
**What it does:** Accepts a flight request — from an operator, from AKMS, or from an
external system (hospital dispatch, resiliency hub emergency call).

**Inputs:**
- Origin pad ID (CURN node or DFR pad location)
- Destination node (delivery endpoint)
- Payload type and weight
- Requested departure time window
- Operator credentials (Part 107 certificate number)

**Output:** Structured mission request object passed to Component 2.

**Tech stack:** Web form or API endpoint running on Core Engine (n8n).
For prototype: simple web form on localhost, POST to MONK authorization webhook.

---

### Component 2: Pre-Flight Authorization Engine
**What it does:** Simultaneously runs three checks before any flight is approved.

**Check 1 — LAANC Authorization:**
- Calls a USS API (Aloft or AirMap developer API)
- Passes flight area geometry, altitude, and time window
- Receives authorization token or denial with reason code
- For prototype: Use Aloft's developer sandbox / test environment

**Check 2 — CURN Corridor Status:**
- Queries UROC/CURN corridor availability API (to be built with UROC internship access)
- Confirms the Baltimore endpoint corridor is active and not NOTAMed out
- For prototype: Simulate with a static JSON corridor status file

**Check 3 — Operator Credential Validation:**
- Validates Part 107 certificate number against FAA Drone Zone lookup
- Confirms certificate is active and not expired
- For prototype: Local credential store with Kevin's cert #5250157 as test record

**Output:** Authorization bundle — LAANC token + corridor status + credential confirmation.
Passes to Component 3 if all three checks pass. Returns denial with reason if any fail.

---

### Component 3: Signed Mission Package
**What it does:** Cryptographically signs the approved mission, producing a
tamper-evident record that travels with every flight.

**Contents of the signed package:**
- Mission ID (UUID)
- Timestamp (authorization time)
- Origin and destination
- Payload manifest
- LAANC authorization token
- CURN corridor confirmation
- Operator Part 107 cert number
- Mission parameters (altitude, route, time window)
- MONK signing key fingerprint

**Signing mechanism:**
- For prototype: HMAC-SHA256 signing with a locally held MONK private key
- For production: Hardware Security Module (HSM) — the physical MONK device
- Output: Signed JSON mission package, stored locally and written to MONK ledger

**Why this matters for MEIA/SBIR:**
This signed package is the compliance artifact. UMMS, JHHS, or any regulated customer
can audit any delivery by pulling the mission package. The FAA, insurance carriers,
and federal procurement all benefit from machine-readable compliance records.
This is the differentiator no competitor is building.

---

### Component 4: Post-Flight Telemetry Write-Back
**What it does:** After flight completion, appends actual flight data to the signed
mission record, completing the compliance lifecycle.

**Inputs (from drone/flight controller):**
- Actual flight path (GPS track)
- Departure and arrival timestamps
- Any deviations from planned route
- Delivery confirmation (payload transfer record)
- Battery usage / energy consumption

**Output:** Complete mission record — pre-flight authorization + post-flight actuals.
Stored in MONK ledger. Available for UMMS sustainability reporting, FAA audit,
insurance claims, and MONK licensing demonstrations.

**For prototype:** Manually enter post-flight data via simple form.
Future: Direct telemetry integration via DJI SDK or ArduPilot MAVLink.

---

## Prototype Build Plan

### Phase 1 (MEIA Phase 2 Months 1-2): Core Authorization Loop
- [ ] Set up Aloft developer account and sandbox API access
- [ ] Build mission intake form (n8n web form or simple HTML)
- [ ] Build LAANC API call in n8n (https.request to Aloft USS API)
- [ ] Build HMAC-SHA256 signing in n8n code node
- [ ] Output: signed JSON mission package to local file + Supabase log
- [ ] Demo: Submit test mission → receive LAANC token → see signed package output

### Phase 2 (MEIA Phase 2 Months 2-3): Integration and Hardening
- [ ] Add FAA DroneZone credential lookup (web scrape or manual API)
- [ ] Add CURN corridor status simulation layer
- [ ] Build post-flight write-back interface
- [ ] Build simple audit dashboard (show mission list, click to see full signed record)
- [ ] Demo: End-to-end mission lifecycle — intake → authorize → sign → fly → write-back

### Phase 3 (SBIR / Year 2): Hardware Layer
- [ ] Design MONK hardware enclosure spec (Raspberry Pi CM4 + HSM chip)
- [ ] Move signing from software HMAC to hardware HSM
- [ ] Explore DHS C-UAS approved technology list submission pathway
- [ ] Begin patent filing process with James L. Scott, Esq.

---

## MEIA Phase 2 Prototype Eligibility

MEIA Phase 2 provides up to $30,000 in vendor-funded prototyping support.
MONK prototype cost breakdown:

| Component | Estimated Cost | Notes |
|-----------|---------------|-------|
| Aloft USS API developer access | $0–$500 | Sandbox likely free; production tier TBD |
| n8n development time | Sweat equity | Core Engine already running |
| Supabase ledger storage | $0–$25/mo | Free tier likely sufficient for prototype |
| Hardware prototype (Phase 3) | $2,000–$5,000 | RPi CM4 + HSM + enclosure |
| Engineering design support (MEIA vendor) | Up to $25,000 | Hardware enclosure + DFM |
| Total MEIA-eligible spend | ~$25,000–$30,000 | Fits Phase 2 budget exactly |

---

## Key Contacts for Prototype Build

| Contact | Role | Relevance |
|---------|------|-----------|
| Dr. Alexander Kott | Technical Advisor | MONK architecture validation; SBIR framing |
| James L. Scott, Esq. | Board Member / Legal | Provisional patent for signing architecture |
| Aloft (formerly Kittyhawk) | USS API provider | LAANC integration partner |
| UROC / John Slaughter | CURN corridor API | Phase 2 integration (via internship) |

---

## Resume Command
> "Aidan — open the MONK prototype spec at C:\Kinetic_Core\Projects\MONK_LAANC_Prototype_Spec.md"
