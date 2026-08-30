# NLHSE — project defence & interview preparation

Interview preparation for **Fahad Bin Zahid**'s M.S. project,
*Traveling Wave Solutions of the (2+1)-Dimensional Nonlinear Hyperbolic Schrödinger Equation*
(University of Chittagong, January 2025, supervisor Md. Farhad Uddin).

Static HTML/CSS/JS. No build step, no dependencies, no backend. Open `index.html`
directly, or serve the folder with anything.

```
python -m http.server 8080     # then http://localhost:8080
```

## Layout

```
project-site/
  index.html          00  start here
  report.html         01  the report chapter by chapter
  theory.html         02  what the equation is
  beta.html           03  the beta fractional derivative
  method.html         04  the Unified Technique
  derivation.html     05  the derivation line by line
  results.html        06  the eleven figures
  qa-project.html     07  Q&A — the project
  qa-math.html        08  Q&A — general mathematics
  qa-weakspots.html   09  hard questions & honest gaps
  cheatsheet.html     10  cheat sheet
  lab.html            11  Python lab (Pyodide)
  qa-python.html      12  Q&A — programming & numerics
  assets/style.css        design system, light + dark
  assets/app.js           nav, theme, quiz mode, Pyodide runner
  figures/fig-01..11.png  the report's own Maple figures
```

The navigation is defined once, in the `NAV` array at the top of `assets/app.js`,
and rendered into every page's empty `<aside class="sidebar">`. Add a page there
and previous/next links update everywhere.

## The sidebar

It collapses two ways, and both persist in `localStorage` across pages and sessions:

- **One group** — click a group heading ("The mathematics", "The interview", …) to
  fold it. The group containing the current page never folds. Stored under
  `nlhse.folded`.
- **The whole rail** — "⇤ Hide menu" at the foot of the sidebar, or press <kbd>[</kbd>.
  A floating "☰ Menu" button appears bottom-left to bring it back; <kbd>[</kbd>
  toggles either way. Stored under `nlhse.nav`.

The rail collapse is desktop-only (`@media (min-width: 1024px)`). Below that the
sidebar is already a drawer behind the ☰ in the topbar, and the collapse rules are
scoped out so they cannot hide it. <kbd>[</kbd> is ignored while focus is in a code
cell or the search box.

Each page carries a tiny inline script in `<head>` that applies the saved theme and
collapsed state before the first paint, so the layout never flashes or jumps.

## The Python lab

`lab.html` runs real CPython in the browser via **Pyodide 0.26.4**, loaded from
jsDelivr on the first Run (~15 s, needs internet the first time only). All cells on
the page share one interpreter, so **Cell 1 must be run first** — it defines the
functions the others use. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> runs the focused cell.

Everything is complex arithmetic on purpose. At θ = 60° the radicand of B₁ is
negative (B₁ ≈ 0.633i), and `(x + 1/√β)^β` is a fractional power of a possibly
negative number. Plain `np.sqrt` returns `nan` and silently destroys the result,
so the code uses `np.emath.sqrt` throughout and plots `np.abs(U)`.

## Findings recorded here

Working through the report to build this site turned up three discrepancies. All
are documented on `qa-weakspots.html` with a suggested spoken answer.

1. **The printed ω does not satisfy the report's own system (18).**
   With `A0 = A1 = 0` the trial solution is `u = B1·δ`, and collecting powers of δ
   in the real part gives `B1² = ω² − l²`. The printed B₁ is correct; the printed ω
   is too large by a factor of √χ. The report prints `ω = ½√(χ(…)/χ)`, in which the
   χ cancels; it should be `ω = ½√((…)/χ)`.

   With the correction the residual of Eq. (14) drops from order one to ~1e-6 —
   the truncation error of the central difference used to measure it. δ satisfies
   its own ODE to ~1e-8 either way, so Eqs. (10) and (11) are fine.

   This says the printed ω is inconsistent with the report's own system. It does
   **not** say which value the original Maple worksheet used: the figures depend on
   ω, on `y` (never stated) and on the Γ(β)/√β choice together, so they cannot
   discriminate.

   Reproduce it in `lab.html` Cell 2.

2. **Eq. (3) defines the beta derivative with 1/Γ(β); Eq. (12) uses 1/√β.**
   The Γ(β) form is standard and is the one that makes the exponents cancel so
   that `D^β ξ = l`. Small numerical effect (0.894 vs 1.118 at β = 0.8).

3. **Eq. (16) prints `c = (l²−m)/ω`, but Eq. (15) gives `cω² = l²−m`,** i.e. `/ω²`.
   No effect on any figure — c enters only the phase, which Eqs. (19)–(20) drop.

4. **The χ < 0 branch is *not* a singular soliton**, contrary to the obvious reading.
   Its denominator `P + S·sinh(a)` vanishes at `sinh(a) = −P/S`, but the numerator
   contains `cosh(a)` and vanishes at `cosh(a) = √(P²+S²)/S` — and those coincide for
   *every* P and S, because `cosh²−sinh² = (P²+S²)/S² − P²/S² = 1` identically. The
   singularity is removable; on the real line `|δ| ≤ √−χ`, so `|U| ≤ |B₁|√−χ`, which
   is exactly the plateau in Figs. 5 and 10.

   Genuine poles exist only at complex argument (`Im(a) = π`, where the numerator does
   not vanish), reachable only where `x < −1/√β` and `(x + 1/√β)^β` is a fractional
   power of a negative number. **The spikes in Fig. 1 come from the branch cut of the
   transformation, not from the solution.** `lab.html` Cell 7.

## Verification against the published figures

Implementing Eqs. (19)–(20) directly and evaluating over the reported windows:

| Quantity | Computed | Report |
|---|---|---|
| Fig. 5 / 10 plateau `\|B₁\|√5` at θ = 10°, 30°, 50°, 60° | 2.267, 1.948, 1.500, 1.415 | 2.28, 1.96, 1.51, ≈1.44 |
| Fig. 6 peak \|U\| at θ = 10°, 20°, 30° | 1.861, 1.175, 0.649 | ≈1.85, 1.17, 0.65 |
| Fig. 11 \|U\| range, θ = 60°, β = 0.8 | 0.0987 – 0.4937 | axis 0.10 – 0.49 |
| Removable singularity of Eq. (19) | ξ = −3.267157 | (not discussed) |

Every entry above is independent of ω, so together they confirm **B₁ and the structure
of the solutions**. Feature *positions* along x are not reproducible, because they
depend on ω, on `y` and on the Γ(β)/√β convention, none of which the report pins down.

## Source

The report itself is `NLHSE-18203063.pdf`. The eleven figures in `figures/` were
extracted from it directly (PyMuPDF, embedded images in reading order), so they are
the originals rather than re-plots.
