# Loanline Demonstration Script & Judge Walkthrough

A timed 75–90 second demonstration script with exact click-by-click instructions, visual checkpoints, and spoken talking points for presentation or video recording.

---

## Script & Timeline Overview

| Time | On Screen | Action | Spoken Narration |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:12** | Populated Workspace (`Plan & Allocation`) | Open app. Point to header badge `Sample workspace` and two pickup desks. | *"A campus laptop lending desk operates on limited, heterogeneous refurbished stock. A laptop that works for one student may be the only device that fits another."* |
| **0:12 – 0:35** | Policy Cards & Q-02 Inspector | Toggle between `Queue order` (2 of 4) and `Serve most requests` (3 of 4). Highlight Q-02's row in table and inspector panel. | *"Under arrival order, Q-01 greedily takes our only 16 GB laptop, stranding Q-02 with no device. Loanline finds an augmenting path: Q-01 can use an 8 GB laptop, freeing the 16 GB unit for Q-02. One more student served on the exact same stock."* |
| **0:35 – 0:58** | Q-04 Inspector & Repair Preview | Click row Q-04. Show `No compatible laptop` (needs battery at South). Click `What if? Preview LT-04`. | *"Q-04 still waits because South desk's LT-03 lacks battery verification and LT-04 is in repair. By previewing LT-04 as ready, the coordinator immediately sees that completing this single repair unlocks a fourth loan."* |
| **0:58 – 1:15** | Preview Dismissal & Print Review | Click `✕ Close preview`. Click `Print plan` (or show print preview). | *"The preview is completely non-mutating: closing it restores our 3 of 4 baseline. When ready, the coordinator prints an official proposal for physical review before distributing devices."* |
| **1:15 – 1:30** | Test Suite & Conclusion | Show terminal running `npm test` (all 48 tests passing) and GitHub Actions badge. | *"Every edge condition is mathematically verified against an exponential brute-force oracle. All data shown is fictional, and Loanline keeps personal information completely out of the system."* |

---

## Click-by-Click Operator Instructions

### Step 1: Initial State Inspection (0:00 – 0:12)
1. Navigate to `http://localhost:5188` (or your deployed static URL).
2. Confirm the page title reads **LOANLINE** with badge `Sample workspace`.
3. Note that the two policy comparison cards are immediately visible at the top:
   - Left: **Queue order · first compatible laptop** showing `2 of 4`.
   - Right: **Serve most requests** showing `3 of 4` with `+1 more on same stock` in green.

### Step 2: Demonstrating the Allocator Reveal (0:12 – 0:35)
1. Verify that `Q-02` is highlighted in the allocation table.
2. In the table, observe:
   - `Q-01` has badge `Reassigned (LT-01)` and is assigned to `LT-02`.
   - `Q-02` has badge `Newly served` and is assigned to `LT-01`.
   - `Q-03` is assigned to `LT-03`.
   - `Q-04` has status `Waiting`.
3. Direct attention to the **Evidence Inspector** on the right side:
   - Headline: `Assigned under recommended policy`.
   - Rationale: *"Previously waiting under queue baseline. In the recommended policy, this request is assigned to LT-01."*
   - Policy Comparison box: Shows baseline was `None (waiting)` and recommended is `LT-01`.

### Step 3: Inspecting Waiting Constraints (0:35 – 0:45)
1. Click the row for `Q-04` (or press `ArrowDown` twice).
2. The Evidence Inspector updates:
   - Headline: `No compatible laptop`.
   - Status: `Waiting in Queue`.
   - Recorded Constraints: Shows `Pickup Desk: South`, `Min RAM: 8 GB`, `Portable Battery: Required (verified yes only)`.
   - Candidate Inventory Evaluation:
     - `LT-01`: Ineligible (Desk mismatch: North $\ne$ South).
     - `LT-02`: Ineligible (Desk mismatch: North $\ne$ South).
     - `LT-03`: Ineligible (Portable battery unverified).
     - `LT-04`: Ineligible (Device in Repair).

### Step 4: Activating "What if? Repair Preview" (0:45 – 0:58)
1. Click the amber button in the header: **What if? Preview LT-04** (or click the preview button next to LT-04 in the Inventory tab).
2. The top preview banner appears in warm amber:
   - Badge: `PREVIEW ONLY`.
   - Title: `Simulating LT-04 (Repair → Ready)`.
   - Impact summary: `3 served → 4 served (+1 loans)`.
   - Newly served: `Q-04`.
   - Updated pairings: `Q-04 (wait → LT-04)`.
3. Point out that the coordinator can test inventory actions without risk or destructive edits.

### Step 5: Restoring Baseline & Printing Proposal (0:58 – 1:15)
1. Click **✕ Close preview** on the right side of the banner.
2. The banner closes immediately, returning the view to the verified 3 of 4 proposal.
3. Click the **Print plan** button in the header.
4. The system print preview opens:
   - Notice that interactive tabs, buttons, forms, and the inspector are completely hidden.
   - Clean printable report displays: *"Campus Laptop Lending Program · Allocation Proposal"*, marked as *"PROPOSED ASSIGNMENT FOR REVIEW · NON-FINAL"*, listing all assigned assets, specs, and waitlist exceptions.
5. Cancel out of the print dialog.

### Step 6: Code Inspection & Terminal Proof (1:15 – 1:30)
1. Switch to the terminal window and run:
   ```bash
   npm test
   ```
2. Point to the Vitest report:
   - 48 unit tests passing across 5 test suites.
   - 15 seeded randomized oracle trials proving maximum cardinality and transversal matroid queue optimality.
   - 4 Playwright end-to-end browser tests verifying the complete judge route on desktop (1440 × 900) and mobile (390 px).

---

## Talking Points for the Entrant

### 1. Explaining the Compatibility Predicate
> *"Loanline’s compatibility predicate is strict: an edge exists only if the laptop is in 'Ready' status, has an explicitly verified charger, matches an allowed pickup desk, meets minimum RAM, and possesses a verified portable battery if requested. Notice that a laptop marked 'Ready' with an unverified charger is still ineligible—preventing students from receiving unusable equipment."*

### 2. Describing Your Contribution
> *"My core focus was building an inspectable, deterministic augmenting-path allocator in pure TypeScript. Rather than treating allocation as a black box, I formulated the problem as a transversal matroid and wrote a seeded brute-force oracle test suite to prove that our greedy queue traversal always matches the maximum reachable subset of students."*

### 3. Pilot Metrics & Real-World Outreach
If speaking to campus lending coordinators, frame a future pilot around these three measurable metrics:
1. **Compatible loans completed per batch**: Percentage of distributed laptops that remain in active use without emergency returns.
2. **Unmet request reasons**: Structured breakdown of why requests wait (e.g. 60% desk mismatch vs. 40% battery deficit), informing refurbishment priorities.
3. **Coordinator review time per batch**: Reduction in manual spreadsheet cross-referencing prior to loan distribution.
