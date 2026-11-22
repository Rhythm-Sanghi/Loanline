# Loanline Allocation Algorithm & Mathematical Specification

Loanline solves the batch allocation problem for campus laptop lending programs with heterogeneous devices, localized pickup desks, and strict readiness verification.

This document walks through the bipartite matching formulation, the augmenting-path mechanism, the transversal matroid property, guarantees, limitations, and the exact files a judge can inspect.

---

## 1. Problem Formulation

Let $R = \{r_1, r_2, \dots, r_n\}$ denote a batch of loan requests submitted for an upcoming loan period, sorted in priority queue order (canonical UTC timestamp ascending, broken deterministically by ASCII request ID).

Let $L = \{l_1, l_2, \dots, l_m\}$ denote the available refurbished laptop stock, sorted in ASCII asset ID order.

We define an undirected bipartite graph $G = (R, L, E)$ where an edge $(r, l) \in E$ exists if and only if device $l$ satisfies all operational and technical constraints required by request $r$:

$$\text{Edge } (r, l) \in E \iff \begin{cases}
1. & l.\text{status} = \text{'Ready'} \\
2. & l.\text{chargerVerified} = \text{'yes'} \\
3. & l.\text{pickupDesk} \in r.\text{allowedDesks} \\
4. & l.\text{ramGb} \ge r.\text{minRamGb} \\
5. & (\neg r.\text{batteryRequired} \lor l.\text{batteryVerified} = \text{'yes'})
\end{cases}$$

Notice that if a laptop has an unverified charger (`chargerVerified = 'no'`) or is currently held for servicing (`status \in \{'Repair', 'Held'\}`), no edge exists, regardless of RAM or desk proximity.

---

## 2. Policy Comparison

### Policy A: Baseline Heuristic (`Queue order · first compatible laptop`)
A greedy first-fit reference heuristic:
1. Iterate through requests $r \in R$ in ascending queue order.
2. For request $r$, inspect unassigned laptops $l \in L$ in ASCII order.
3. Assign $r$ to the first free compatible laptop encountered. If no free compatible laptop exists, $r$ is left waiting.
4. **Limitation**: Greedy first-fit never reassigns an already-matched request, even when a flexible earlier borrower could happily use a different device to unblock a borrower with stricter requirements.

### Policy B: Recommended Matching (`Serve most requests`)
A maximum-cardinality bipartite matching that prioritizes the queue order lexicographically:
1. Maintain a current matching $M \subseteq E$.
2. For each request $r \in R$ in ascending queue order:
   - Search for an **augmenting path** starting at $r$ and terminating at an unassigned compatible laptop $l^* \in L$.
   - Candidate assets are explored in deterministic ASCII order.
   - If a compatible asset $l$ is currently occupied by request $r'$, we recursively search for an alternative compatible laptop for $r'$.
   - If an augmenting path $P = (r, l_1, r_1, l_2, \dots, r_k, l^*)$ is found, invert the matching along $P$:
     $$M \leftarrow M \oplus P = (M \setminus \{(r_1, l_1), \dots, (r_k, l_k)\}) \cup \{(r, l_1), (r_1, l_2), \dots, (r_k, l^*)\}$$
   - Because $l^*$ was previously unassigned and each intermediate request $r_i$ is reallocated to a new compatible device $l_{i+1}$, **every previously matched request remains matched**, and $r$ becomes matched. The cardinality $|M|$ increases by exactly 1.
   - If no augmenting path exists, $M$ is left completely unchanged, and $r$ remains unassigned.

---

## 3. Worked Walkthrough: The Golden Sample

Consider the official competition fixture:

| Request | Queue | Allowed Desk | Min RAM | Portable Battery Req |
| :--- | :--- | :--- | :--- | :--- |
| **Q-01** | 1 (09:00 UTC) | North | 8 GB | No |
| **Q-02** | 2 (09:15 UTC) | North | 16 GB | No |
| **Q-03** | 3 (09:30 UTC) | South | 8 GB | No |
| **Q-04** | 4 (09:45 UTC) | South | 8 GB | Yes |

| Laptop | Pickup Desk | RAM | Charger Verified | Battery Verified | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LT-01** | North | 16 GB | Yes | Yes | Ready |
| **LT-02** | North | 8 GB | Yes | No | Ready |
| **LT-03** | South | 8 GB | Yes | No | Ready |
| **LT-04** | South | 8 GB | Yes | Yes | **Repair** |

### What happens under Baseline:
1. `Q-01` inspects stock: `LT-01` (16 GB, North) is the first ASCII match. `Q-01` takes `LT-01`.
2. `Q-02` arrives needing 16 GB at North. `LT-01` is already taken. `LT-02` only has 8 GB (incompatible). `Q-02` is left **waiting**.
3. `Q-03` arrives needing South desk, 8 GB. `LT-03` is free and compatible. `Q-03` takes `LT-03`.
4. `Q-04` arrives needing South desk, 8 GB, and verified portable battery. `LT-03` has `batteryVerified: 'no'`, and `LT-04` is in `Repair`. `Q-04` is left **waiting**.
- **Outcome**: **2 of 4** served (`Q-01` $\to$ `LT-01`, `Q-03` $\to$ `LT-03`).

### What happens under Loanline's Recommended Allocator:
1. `Q-01` is processed: matches with `LT-01`. Current matching: $\{(\text{Q-01}, \text{LT-01})\}$.
2. `Q-02` is processed:
   - `Q-02` requires 16 GB. The only compatible device is `LT-01`.
   - `LT-01` is currently occupied by `Q-01`.
   - Allocator initiates augmenting search: Can occupant `Q-01` take another compatible laptop?
   - `Q-01` needs 8 GB at North desk. `LT-02` (8 GB, North) is compatible and currently free!
   - Augmenting path found: $\text{Q-02} \to \text{LT-01} \to \text{Q-01} \to \text{LT-02}$.
   - The path is applied: `Q-01` shifts to `LT-02`, and `Q-02` receives `LT-01`.
   - Current matching: $\{(\text{Q-01}, \text{LT-02}), (\text{Q-02}, \text{LT-01})\}$.
3. `Q-03` is processed: matches with free `LT-03`.
   - Current matching: $\{(\text{Q-01}, \text{LT-02}), (\text{Q-02}, \text{LT-01}), (\text{Q-03}, \text{LT-03})\}$.
4. `Q-04` is processed:
   - `Q-04` requires South desk with verified portable battery.
   - `LT-03` lacks verified battery (`batteryVerified = 'no'`).
   - `LT-04` is in `Repair` (`status \ne 'Ready'`).
   - No path exists. Existing matching is preserved.
- **Outcome**: **3 of 4** served on the exact same stock!

### What If? Stock Preview:
When the coordinator simulates completing the repair on `LT-04` (`Repair` $\to$ `Ready`):
- `LT-04` becomes eligible for `Q-04` (South, 8 GB, verified battery, verified charger).
- Augmenting path $\text{Q-04} \to \text{LT-04}$ immediately succeeds.
- Total served increases from **3 of 4** to **4 of 4** (+1 compatible proposal on the same fictional stock).

---

## 4. Theoretical Foundations: Transversal Matroid

Why does this greedy search over requests in queue order guarantee a maximum-cardinality matching that is also lexicographically optimal?

### Transversal Matroid Theorem
Let $G = (R, L, E)$ be a bipartite graph. A subset $S \subseteq R$ is called **matchable** if there exists a matching in $G$ that covers every vertex in $S$.

By Edmonds and Fulkerson (1965), the collection of matchable subsets $\mathcal{I} = \{S \subseteq R \mid S \text{ is matchable in } G\}$ forms the independent sets of a **matroid** $(R, \mathcal{I})$, known as the **transversal matroid**.

### Matroid Greedy Property
In any matroid:
1. Every maximal independent set has the same size (the rank of the matroid, here corresponding to maximum matching size).
2. The greedy algorithm—which considers elements of $R$ in order of decreasing weight and admits an element $r$ if and only if $S \cup \{r\} \in \mathcal{I}$—finds an independent set of maximum total weight.

Assigning weights $w(r_i) = 2^{n - i}$ (or strictly decreasing priority by queue order) implies:
- Admitting request $r_i$ via an augmenting path whenever possible guarantees that the resulting set of served requests $S^*$ maximizes $\sum_{r \in S^*} w(r)$.
- Consequently, $S^*$ is both a **maximum-cardinality matching** and the **lexicographically earliest served set** in queue priority order.
- If an augmenting path from $r_i$ fails, then $S \cup \{r_i\} \notin \mathcal{I}$. By matroid rank axioms, $r_i$ cannot be added to any matching without dropping at least one higher-priority request already admitted.

---

## 5. Operational Guarantees & Real-World Limitations

| Guarantee | Mechanism | Verification File |
| :--- | :--- | :--- |
| **Strict 1-to-1 Device Pairing** | Each request receives $\le 1$ laptop; each asset is assigned $\le 1$ borrower. | `src/test/allocator.test.ts` |
| **Deterministic Output** | Tied queue timestamps broken by stable ASCII ID. Shuffling input arrays produces identical pairings. | `src/test/allocator.test.ts` |
| **Multi-Hop Chains** | Reassignments propagate across chains of occupied devices until a free asset is reached. | `src/test/allocator.test.ts` |
| **Integrity on Failure** | If an augmenting path fails, previous pairings are left completely intact. | `src/test/allocator.test.ts` |
| **Global Optimality** | Verified against a seeded exponential brute-force oracle across randomized graphs. | `src/test/oracle.test.ts` |
| **Non-Mutating Previews** | What-if repair simulation runs on an in-memory clone; never mutates saved state or printed proposals. | `src/test/inspector.test.ts` |

### Scope & Policy Limitations
1. **Proposal Status**: Allocations generated by Loanline are **proposals for coordinator review**, not automated administrative actions. Physical pickup and visual asset verification remain required.
2. **Snapshot Validity**: Matching quality depends entirely on accurate recorded inventory. An unrecorded dead battery or broken screen will invalidate an assignment until updated.
3. **Queue Policy Choice**: In a real campus program, the coordinator decides whether pure timestamp arrival or financial/academic need criteria should define the queue order. Loanline provides the inspectable engine once priority order is established.
4. **Data Isolation**: All workspace data is isolated to the single browser profile in `localStorage`. No cloud sync or personal identifiers are stored.

---

## 6. Codebase Inspection Index

A judge or reviewer can directly inspect these files in the workspace:

- `src/domain/compatibility.ts`: Pure TypeScript compatibility predicate and structured reason codes.
- `src/domain/allocator.ts`: Baseline heuristic and deterministic augmenting-path implementation.
- `src/domain/inspector.ts`: Structured explanation engine and non-mutating repair preview simulator.
- `src/test/allocator.test.ts`: Test cases covering the golden sample, multi-hop chains, reordering stability, and tie-breaking.
- `src/test/oracle.test.ts`: Seeded brute-force oracle proving maximum cardinality and queue preference.
- `src/test/inspector.test.ts`: Verification of explanation narratives and non-mutating preview behavior.

