# Devpost Submission Draft · Loanline

**Tagline**: Transparent batch laptop allocation and repair-preview planning for campus lending desks.

- **Event**: Code for Change (Student Social-Impact Hackathon)
- **Submission Deadline**: December 1, 2026 at 5:00 p.m. PST (December 2, 2026 at 6:30 a.m. IST)
- **Schedule Conflict Notice**: *The hackathon schedule page lists December 5, 2026 for winners announcement, whereas the rules prose references November 21. Entrants should submit well before December 1, 2026 at 5:00 p.m. PST to remain safe.*
- **Repository**: [Entrant GitHub URL — placeholder]
- **Live Demo**: [Entrant Deployed Demo URL — placeholder]
- **Video Walkthrough**: [Entrant Video Link — placeholder]
- **Team Members**: Rhythm Sanghi (SVCE Indore · GitHub: [@Rhythm-Sanghi](https://github.com/Rhythm-Sanghi))

---

## Inspiration

Across university campuses and community digital inclusion programs (such as the Digital Inclusion Initiative's Device & Data Bank), lending desks distribute refurbished laptops to students facing technology barriers.

However, volunteer coordinators face a subtle matching puzzle: laptops arrive with heterogeneous specifications (varying RAM, battery health, and desk locations), while student coursework demands specific technical baselines (e.g. computer science students needing 16 GB RAM for virtualization, commuter students needing verified portable batteries, and desk access limited to North or South campuses).

When coordinators assign laptops in simple arrival order, flexible students often consume scarce high-spec devices, stranding later students whose requirements can *only* be met by those machines. Furthermore, when requests wait, coordinators have had no way to simulate whether completing a pending bench repair would actually unblock someone or if other constraints would still leave them waiting.

We built **Loanline** to give campus lending coordinators a legible, inspectable planning tool: see who can borrow, why anyone is left waiting, and which stock change would help.

---

## What It Does

1. **Dual Policy Batch Allocation**:
   - Compares the traditional arrival-order baseline (*"Queue order · first compatible laptop"*) against an optimized bipartite matching (*"Serve most requests"*).
   - In our standard campus benchmark, Loanline yields **one more compatible proposal on the same fictional stock** (increasing proposed assignments from 2 of 4 to 3 of 4).
2. **Transparent Rationale Inspector**:
   - Coordinators can click any request to see its recorded constraints, evaluated inventory candidates, and a plain-language explanation of why it was assigned or why it waits.
   - For reassigned borrowers, Loanline explicitly explains: *"In baseline, this request received LT-01. Reassigned to LT-02 to free a scarce configuration for another request, yielding one more compatible proposal on the same fictional stock."*
3. **"What if?" Stock Repair Simulation**:
   - Coordinators can preview the system-wide effect of completing a repair on a held laptop in a single click.
   - Simulating the repair of `LT-04` instantly demonstrates an increase from **3 of 4 to 4 of 4 proposed assignments**, highlighting the newly served borrower.
   - Previews are strictly non-mutating and excluded from official saved plans.
4. **Privacy-Preserving Local Storage**:
   - Personal information (names, emails, phone numbers, disability or financial data) is excluded from the data model entirely.
   - All state is versioned and stored locally in the browser profile (`localStorage`), requiring zero backend servers, user accounts, or external tracking.
5. **Printable Official Proposal**:
   - Formats a clean, paper-ready allocation proposal via `@media print` for physical desk handoff, clearly labeled *"PROPOSED ASSIGNMENT FOR REVIEW · NON-FINAL"*.

---

## How We Built It

- **Language & Framework**: Pure TypeScript (strict mode) with React 19, bundled with Vite 6.
- **Matching Core**: Deterministic augmenting-path bipartite matching based on **transversal matroid theory** (Edmonds & Fulkerson). When requests are sorted by queue priority, the greedy addition of augmenting paths guarantees both maximum matching cardinality and the lexicographically earliest subset of served requests.
- **Design System**: Tailored to Rhythm Sanghi’s quiet utility design language (inspired by *Threadmark* and *Benchlight*):
  - Warm canvas (`#F5F4EE`), near-black text (`#1C211C`), and olive accents (`#455D45`).
  - Strict 4/8-pixel grid, 4–6 px border radii, visible keyboard focus indicators, and tabular numerals.
  - No synthetic card grids, gradients, or animated numbers.
- **Verification Engine**:
  - **Vitest**: 48 unit tests verifying compatibility rules, golden fixtures, tie-breakers, stability under array shuffling, storage degradation, and a seeded exponential brute-force oracle across randomized graphs.
  - **Playwright**: End-to-end browser automation validating the judge route and responsive layouts at 1440 × 900 (desktop) and 390 px (mobile).

---

## Mapping to Judging Criteria

| Judging Criterion | How Loanline Delivers | Exact Demo / Verification Moment |
| :--- | :--- | :--- |
| **Impact** | Demonstrates how inspectable matching and repair previews can unlock more compatible proposals without purchasing new hardware. | 12–35 sec in demo: shows one more compatible proposal on the same fictional stock (2 of 4 to 3 of 4). |
| **Originality** | Combines inspectable transversal matroid matching with non-mutating bench repair simulations, addressing the specific operational workflow of campus lending desks. | Distinct from single-device allocators (Auxilium, connectivIT); focused on batch proposal transparency. |
| **Technical Execution** | Zero-dependency TypeScript allocator, shared compatibility predicate, deterministic tie-breaking, and a seeded exponential brute-force test oracle. | `src/test/oracle.test.ts` (15 randomized trials matching the oracle) and 100% clean typecheck. |
| **Usability** | Single-screen central work area with 340 px evidence inspector, keyboard row navigation (`ArrowUp`/`ArrowDown`), and inline error preservation on forms. | 1440 × 900 desktop and 390 px mobile view tested in Playwright without overflow. |
| **Clarity of Presentation** | Structured reason codes translate graph theory into plain English explanations; clean `@media print` proposal ready for desk volunteers. | Step 5 in demo script: printable proposal marked *"Proposed assignment for review"*. |

---

## Challenges

1. **Deterministic Bipartite Matching**: Standard maximum bipartite matching algorithms (like Hopcroft-Karp or generic Ford-Fulkerson) find *any* maximum matching, which can produce arbitrary or unstable reassignments when device lists are shuffled. We formulated the matching as a transversal matroid and enforced deterministic ASCII asset traversal, guaranteeing identical assignments regardless of input ordering.
2. **Accessible Explainability**: Showing *why* an assignment changed without overwhelming the coordinator required deriving structured reason codes (`MATCHED_REASSIGNED`, `WAITING_NO_COMPATIBLE`, `WAITING_COMPETITION`) directly from the graph snapshot rather than generic text templates.
3. **Non-Mutating Previews**: Preventing what-if repair simulations from accidentally mutating local storage or leaking into printed distribution plans required strict state immutability in the React tree.

---

## Accomplishments

- Demonstrated that an augmenting-path allocator produces one more compatible proposal on the same fictional stock.
- Engineered a 100% client-side tool with zero tracking, zero API keys, and complete data privacy.
- Passed 48 unit tests and 4 Playwright browser tests across desktop and mobile viewports with zero console errors.

---

## What We Learned

- **Matroid greedy properties in real life**: Proving that transversal matroids guarantee queue-order lexicographical preference provided a solid mathematical foundation for why greedy augmenting-path additions never drop an admitted borrower.
- **Operational reality vs. algorithmic purity**: In a real campus program, algorithms only produce *proposals*. A laptop marked "Ready" might still have an unrecorded sticky key or missing power cord; therefore, verification must be recorded separately from status, and human review is mandatory.

---

## What's Next & Coordinator Questions

Before any future field evaluation with campus lending desks, coordinators would need to address three open operational policy questions:
1. *What defines "Ready"?* Is battery capacity tested under load, or is visual charging sufficient?
2. *How is pickup desk access determined?* Can students travel between campuses, or must devices strictly stay at their home desk?
3. *Is arrival timestamp the appropriate tie-breaker?* Or should academic/financial necessity override queue order?

For future versions, we plan to support CSV batch export for student management systems and multi-period scheduling.
