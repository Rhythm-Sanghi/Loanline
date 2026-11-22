# Credits, Attribution & Assistance Record

This document provides a factual record of human contributions, AI assistance, design references, and third-party resources used in the development of **Loanline** for the Code for Change hackathon.

---

## 1. Project Contributors

- **Lead Entrant / Developer**: Rhythm Sanghi
- **Affiliation / Institution**: SVCE Indore
- **GitHub**: [@Rhythm-Sanghi](https://github.com/Rhythm-Sanghi)

*Note for Entrants: Ensure your team membership, student status, and age eligibility match the official Code for Change rules prior to final Devpost submission.*

---

## 2. Factual Record of AI Assistance (Google Antigravity)

In accordance with academic integrity and hackathon disclosure standards:

- **Assisting Tool**: Google Antigravity (powered by Gemini models).
- **Scope of AI Assistance**:
  - Scaffolding the React 19 + TypeScript + Vite project structure.
  - Formulating the pure TypeScript bipartite matching and augmenting-path algorithms.
  - Generating comprehensive Vitest unit tests, storage degradation tests, and the seeded exponential brute-force oracle test suite.
  - Setting up Playwright browser automation and generating screenshot capture scripts.
  - Drafting initial Markdown documentation templates (`algorithm.md`, `demo.md`, `devpost.md`, `credits.md`).
- **Human Author & Review Responsibilities**:
  - Formulating the campus laptop lending desk domain model (pickup desks, separate charger/battery verification, and repair preview concept).
  - Reviewing, testing, and verifying the mathematical correctness of the transversal matroid proof and augmenting-path logic.
  - Designing the user interaction flows, keyboard navigation, and inspector layouts.
  - Executing local builds, reviewing code line-by-line, and committing the repository.

---

## 3. Design References & Inspiration

Loanline adopts visual hierarchy and interface principles from Rhythm Sanghi’s open-source projects:

- **[Threadmark](https://github.com/Rhythm-Sanghi/Threadmark)**:
  - *Reference*: [Map View Screenshot](https://github.com/Rhythm-Sanghi/Threadmark/blob/main/docs/screenshots/map-dark.png) & [Interface Guide](https://github.com/Rhythm-Sanghi/Threadmark/blob/main/docs/interface.md).
  - *Applied Principles*: Focused central work area, 340 px evidence inspector, fine panel borders, rectangular controls with 4–6 px radii, and clear selected state indicators.
- **[Benchlight](https://github.com/Rhythm-Sanghi/Benchlight)**:
  - *Reference*: [Space Screenshot](https://github.com/Rhythm-Sanghi/Benchlight/blob/main/docs/screenshots/space.png) & [Stylesheet](https://github.com/Rhythm-Sanghi/Benchlight/blob/main/apps/desktop/src/styles.css).
  - *Applied Principles*: Warm paper-grey canvas (`#F5F4EE`), straight hairline table rules, tabular numerals (`font-variant-numeric: tabular-nums`), compact status badges, and explaining proposed changes before applying them.

*Note: All CSS, React components, and HTML markup in Loanline were written from scratch specifically for this project.*

---

## 4. Prior Work & Real-World Context

- **Real-World Context**: The [Digital Inclusion Initiative Device & Data Bank](https://digitalinclusioninitiative.org/donate-devices) provided background context on the challenges of refurbishing and distributing hardware to underrepresented communities. *Loanline claims no official partnership, endorsement, or deployment with the initiative.*
- **Prior Hackathon Projects**: We reviewed prior student device distribution and matching projects, including [connectivIT](https://devpost.com/software/connectivit), [Auxilium](https://devpost.com/software/algoauxilium), and [REBOOT](https://devpost.com/software/project-second-chance). Loanline differentiates itself by focusing on inspectable batch allocation, transversal matroid queue priority, and non-mutating bench repair simulations.

---

## 5. Software Libraries & Licenses

Loanline relies on a minimal set of open-source development dependencies:

| Package | Purpose | License |
| :--- | :--- | :--- |
| **React & React-DOM** | Component rendering and reactive state | MIT |
| **Vite** | Frontend bundling and dev server | MIT |
| **TypeScript** | Static typing and interface contracts | Apache-2.0 |
| **Vitest & JSDOM** | Unit testing and DOM mocking | MIT |
| **Playwright** | Browser automation and screenshot verification | Apache-2.0 |

No external CSS frameworks, UI component libraries, analytics trackers, or remote APIs are utilized.
