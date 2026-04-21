# KAI-Netics Cost/Revenue Model
Created: April 12, 2026 | Status: STUB — build after April 15 deadlines

---

## Purpose

This document is the financial architecture for KAI-Netics' three-entity model.
It answers the question MEIA Phase 3 investors and SBIR reviewers will ask:
what does the unit economics look like, and what is the path to the Jevons Threshold?

Build this fully in Sprint 2 (May–June 2026).

---

## Section 1: Cost-Per-Flight Model

### Current State (Part 107, No Owned Infrastructure)

| Cost Component | Per Flight Estimate | Notes |
|---------------|---------------------|-------|
| Drone rental / depreciation | $8–$15 | Rented drone at $150–$300/day; 10–20 flights/day |
| Operator labor (Kevin, fully loaded) | $25–$40 | 30–45 min per flight including pre/post |
| LAANC authorization time | $2–$5 | Operator time cost |
| Insurance allocation | $3–$8 | Per-flight allocation of policy cost |
| Transport to launch site | $5–$10 | Vehicle cost per flight |
| **Current total cost-per-flight** | **~$43–$78** | Before overhead |

### At 5-Pad Deployment (CAKO Operators, Owned Infrastructure)

| Cost Component | Per Flight Estimate | Notes |
|---------------|---------------------|-------|
| Drone depreciation (owned fleet) | $3–$6 | Owned fleet at 500+ flights per drone |
| CAKO operator labor | $8–$12 | Market-rate wage, 15 min per flight with MONK automation |
| MONK authorization (automated) | $0.50–$1 | Software cost per flight |
| Insurance allocation | $1–$3 | Volume discount + safety record |
| Infrastructure allocation | $1–$2 | Pad amortization over 10,000 flights |
| **5-pad cost-per-flight** | **~$13–$24** | Target: below $20 |

### At 10-Pad Deployment (Jevons Threshold Zone)

| Cost Component | Per Flight Estimate | Notes |
|---------------|---------------------|-------|
| Drone depreciation | $2–$4 | Fleet optimization |
| CAKO operator labor | $5–$8 | Scheduled routes, MONK-automated dispatch |
| MONK authorization | $0.25–$0.50 | Fixed cost spread over high volume |
| Insurance allocation | $0.50–$1.50 | Volume + safety record maturity |
| Infrastructure allocation | $0.50–$1 | 10-pad amortization |
| **10-pad cost-per-flight** | **~$8–$15** | Jevons Threshold zone |

**The Jevons Threshold:** Below $10–$15/flight, the following categories become
economically viable for the first time (currently uneconomical above $40):
- Routine pharmacy courier runs
- Campus internal supply runs
- Non-critical specimen pickup
- Municipal small supply
- Food desert last-mile

---

## Section 2: Revenue Model by Stream

### FP (Foundry Prime) Revenue

| Stream | Year 1 | Year 2 | Year 3 | Notes |
|--------|--------|--------|--------|-------|
| Per-delivery fee ($15–$75/delivery) | $40K | $120K | $300K | Medical, pharmacy, emergency |
| Managed service SLA ($8K–$15K/mo) | $80K | $240K | $480K | 1 contract Mo3; 3 by Yr1 end |
| Government contract (MBE) | $25K | $80K | $160K | Baltimore City + state agencies |
| DFR program package ($25K–$75K) | $25K | $75K | $150K | Public safety vertical |
| C-UAS consulting | $0 | $50K | $150K | FP consulting arm |
| **FP Total** | **~$170K** | **~$565K** | **~$1.24M** | Conservative |

### EAF Revenue (Grant-Funded)

| Stream | Year 1 | Year 2 | Year 3 | Notes |
|--------|--------|--------|--------|-------|
| EARN Maryland | $125K | $125K | $125K | Annual workforce grant |
| CDBG (Baltimore City) | $50K | $75K | $75K | Annual cycle |
| FEMA C-UAS SLTT | $0 | $150K | $300K | FY2027 eligibility |
| NSF SBIR Phase I | $275K | $0 | $275K | Every other year |
| MEA Resilient MD | $100K | $100K | $100K | Rolling |
| **EAF Total** | **~$550K** | **~$450K** | **~$875K** | Non-dilutive |

### MONK Revenue (Year 2+)

| Stream | Year 2 | Year 3 | Notes |
|--------|--------|--------|-------|
| MONK licensing (per operator) | $25K | $100K | 1 operator Yr2; 4 Yr3 |
| SBIR Phase II | $1M | $0 | If Phase I approved |
| Data/telemetry licensing | $0 | $50K | Flight data as asset |
| DHS C-UAS approved tech list | $0 | $250K | If approved — federal contracts |
| **MONK Total** | **~$1.025M** | **~$400K** | Lumpy but high-margin |

---

## Section 3: Three-Year Pro Forma (To Build)

### Items needed to complete this model:
- [ ] Kevin's actual Part 107 operating cost data (first flights)
- [ ] Drone rental market rate verification (current vendor quotes)
- [ ] MEIA Phase 2 vendor cost actuals (prototype build)
- [ ] CAKO operator wage benchmarks (Maryland drone operator market rate)
- [ ] DFR pad installation cost estimates (hardware + installation + connectivity)
- [ ] Insurance quote for commercial Part 107 operations at volume
- [ ] Aloft USS API pricing for production LAANC access

### Target outputs:
1. Month-by-month cash flow Year 1
2. Break-even analysis (when does FP become cash-flow positive?)
3. Three-year EBITDA by entity
4. MONK licensing sensitivity analysis (1 licensee vs. 5 vs. 10)
5. Jevons Threshold visualization (cost-per-flight vs. demand unlocked)

---

## Section 4: MRR Target Model

### MRR by Customer Segment

| Customer Segment | Target MRR | Contract Type | Timeline |
|-----------------|-----------|---------------|----------|
| UMMS managed service SLA | $10K–$15K | Annual SLA, monthly billing | Month 3 |
| MedStar Franklin Square | $8K–$12K | Annual SLA | Month 5 |
| Baltimore City (MBE contract) | $5K–$8K | Government contract | Month 4 |
| Community Resiliency Hubs | $3K–$5K | Grant-funded SLA | Month 4 |
| UMGC campus delivery | $4K–$6K | University contract | Month 7 |
| **Year 1 MRR target (Month 12)** | **$30K–$46K/mo** | | ~$360K–$550K ARR |

---

## Resume Command
> "Aidan — open the cost revenue model at C:\Kinetic_Core\Projects\Cost_Revenue_Model.md"
