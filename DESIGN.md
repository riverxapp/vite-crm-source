# DESIGN.md

Design contract for this CRM template. Every page — landing, auth, and the
`/app` dashboard — follows it. If you add a visual rule, add it here.

## The idea

**Sharp, flat, ruled.** Hairlines do the structural work, one indigo accent
carries attention, and two type voices keep people-text and machine-text apart.

- **Sharp** — square panels, 4px controls, no pills.
- **Flat** — solid backgrounds, no gradients, no glass, no decorative shadows.
- **Quiet, then loud once** — the accent appears two or three times per screen.
- **Show the product** — the landing hero shows the app's own UI, not an illustration.

## Where it lives

| What | File |
|---|---|
| Palette + shadcn token mapping (light and dark) | `src/styles/globals.css` |
| Radius, shadow, font, color remap for Tailwind | `tailwind.config.js` |
| Helper classes (`rx-meta`, `rx-mark`, `rx-bracket`) | `src/styles/globals.css` |
| Restyled primitives | `src/components/ui/{button,card,tabs,table,input,textarea,select,checkbox,dialog,…}.tsx` |
| Shared CRM pieces | `src/components/crm/` |

Tokens keep their shadcn names (`primary`, `muted`, `accent`, …) but are
remapped onto this palette, so primitives pick the system up by cascade. Read
tokens; never hard-code a hex in a component.

## Tokens

### Palette

| Role | Light | Dark | Tailwind |
|---|---|---|---|
| Ground | `#ffffff` | `#0c0c0e` | `bg-background` |
| Surface (panels, cards) | `#ffffff` | `#141416` | `bg-card` |
| Ink | `#111827` | `#ececef` | `text-foreground` |
| Ink muted | `#5f6b7e` | `#9b9ba4` | `text-muted-foreground` |
| Rule / strong / hard | black α .14 / .30 / .45 | white α .12 / .26 / .42 | `border`, `border-rule-strong`, `border-rule-hard` |
| Brand (text, links, active rules, focus) | `#181894` | `#9a9aff` | `text-brand`, `border-brand` |
| Brand fill (anything painted) | `#181894` | `#3535c8` | `bg-primary` + `text-primary-foreground` |
| Brand soft (active nav row) | brand α .10 | `#9a9aff` α .12 | `bg-brand-soft` |
| Tint (table heads, rails, insets) | `#f2f2fa` | indigo-dark | `bg-muted` |
| Tint strong | `#e9e9f7` | indigo-dark | `bg-secondary` |
| Press (every hover) | `#f0f5fe` | indigo-dark | `bg-accent` |
| Success / Danger | `#1f7a41` / `#b42342` | lighter | `text-success`, `text-destructive` |
| Warm signal (live state only) | `#ff875f` | same | `bg-warm` |

Rules:

- **Every fill is from the indigo family.** No grey plates. Fills are solid, not alpha.
- **Hover is always `bg-accent`.** On an already-tinted surface, hover to `bg-secondary`.
- **Primary buttons are `bg-primary` + `text-primary-foreground`**, never
  `text-brand` on white or `bg-brand` with white text; dark mode splits the two.
- **Warm is a signal, not a colour.** It means "live / happening now" and
  always sits next to a word.
- Page headlines on public pages use `text-headline` (brand in light, ink in dark).

### Geometry and depth

| Token | Value | Used for |
|---|---|---|
| `rounded-lg` / `xl` / `2xl` | `0` | panels, cards, tables, tabs, dialogs, popovers |
| `rounded-md` / `sm` | `4px` | buttons, inputs, badges, checkboxes |
| `shadow-sm` / `shadow` | none | cards stay flat |
| `shadow-md` / `lg` / `modal` | one modal shadow | dialogs, popovers, menus, toasts only |

- **Hairlines before fills. Fills before shadows. Shadows almost never.**
- `border-rule-hard` marks the single primary object in a view (the landing
  product preview). One per screen.
- Prefer flush grids that share a 1px seam (`gap-px border bg-[var(--rule)]`
  with `bg-card` cells) over spaced floating cards. The dashboard stat row and
  the deal board use this.
- Backgrounds are solid palette values — white in light mode. No gradients,
  grids, patterns or images behind content. With ground and panels both white,
  hairlines alone carry separation.

### Type

Two voices, never mixed.

- **Human — Manrope** (`font-sans`): headlines, prose, buttons, names.
  700 for headings, 400 for body.
- **Machine — JetBrains Mono** (`font-mono`): anything the system computed or
  identifies — money, counts, percentages, dates, timestamps, emails, phones,
  domains, IDs, status labels, nav items, tab labels, table headers, eyebrows.

`rx-meta` is the meta label: mono, uppercase, `0.08em` tracking,
`0.72rem`, muted. `rx-mark` prefixes a label with the 6px brand square.
Never set a headline in mono.

| Level | Size |
|---|---|
| Landing headline | `clamp(2.6rem, 5.2vw, 4.4rem)`, tracking `-0.03em` |
| Page header | `1.6rem`, 700, tracking `-0.02em` |
| Card / panel head | `rx-meta` voice in ink (via `CardTitle`) |
| Body | `0.94rem` |
| Meta | `0.66rem`–`0.8rem` |

## Components

**Buttons** (`ui/button.tsx`)
- `default` — primary: flat brand fill; hover darkens, active insets one step.
- `outline` / `secondary` — surface fill, rule border; hover moves the border to `rule-strong`.
- `ghost` — icon buttons; hover fills `accent`.
- `bracket` — tertiary utility links, rendered `[ VIEW ALL ]` in mono.
- Hover changes border and fill, never position. No lifts.

**Inputs** — surface fill, rule border, 4px. Hover `rule-strong`, focus border
to brand plus the ring. Machine text (email, URL) inputs use `font-mono`.

**Forms and dialogs** — a stack of ruled bands: header, fields, footer, each
split by one 1px rule with the same horizontal padding (`FormDialog`).
Errors and results are stated in words (mono, next to the action), then coloured.

**Cards** (`ui/card.tsx`) — square, 1px rule, no shadow. `CardHeader` is a
ruled band holding a mono `CardTitle`; `CardContent` pads `p-4`.

**Tabs** (`ui/tabs.tsx`) — a mono uppercase rail on one rule. Active tab gets a
2px brand bottom rule and bold ink. Used for record tabs, task views, the
deal board/list switch, and the activity type picker. No segmented pills.

**Tables** (`ui/table.tsx`) — rules, not stripes. Tinted header row with mono
uppercase labels. Numeric, date and identifier columns in mono.

**Badges** (`crm/ToneBadge.tsx`) — 4px, 1px border, flat tint, mono uppercase.
The label carries the meaning; tone only reinforces it.

**Checkbox** — drawn 16px square, `rule-strong` hairline, brand fill when checked.

**Navigation**
- Public header: surface bar, one bottom rule, logo left, mono uppercase links,
  active link underlined 2px brand, one primary CTA.
- App sidebar: fixed, 1px right rule, sections split by rules. Active row:
  `bg-brand-soft` with a 2px brand left rule.

**Icons** (`components/icons.ts`) — Lucide outlines, 24px grid, 2px stroke,
`currentColor`. Size with `h-4 w-4` (controls) or `h-3.5 w-3.5` (meta rows).
Decorative icons are `aria-hidden`; icon-only buttons carry an `aria-label`.

**Toasts** (`ui/toaster.tsx`, `lib/toast.ts`) — bottom-right, square, 1px
`rule-strong`, modal shadow. A success or error glyph plus a sentence; details
in mono. Errors use `role="alert"`, successes `role="status"`.

**Charts** (`features/dashboard/PipelineChart.tsx`) — built from divs, no chart
library. One hue (`bg-chart-1`, brand), thin bars with a 4px rounded top on the
baseline, recessive hairline grid, mono axis labels, no legend for a single
series. Every column shows a tooltip on hover and keyboard focus, and a
visually hidden table carries the same data. Follow this pattern for any new
chart instead of adding a library.

**Empty, error and loading states** (`crm/States.tsx`) — ruled panels on the
surface; skeleton rows share 1px seams.

## Pages

- **Landing** (`/`): header, one hero — eyebrow, headline, one line of
  support, one primary action plus a bracket "Log in" link, and the product
  preview (`site/ProductPreview.tsx`) — then footer. Solid `bg-background`.
- **Auth** (`/login`, `/signup`): a single square card with ruled header /
  fields / footer bands, centred on the solid ground.
- **App** (`/app/*`): same system at higher density. Every page opens with
  `PageHeader` (eyebrow → title → mono description → actions). Detail pages use
  a breadcrumb eyebrow (`Companies / #12`).

## Motion

Motion confirms; it never decorates.

- Hover: border/fill transition, `120ms` ease-out. No lift, no shadow growth.
- Dialogs and menus: the primitives' short fade/zoom.
- Everything must read the same under `prefers-reduced-motion`.

## Dark mode

Same system, inverted — not a second design. Toggled with `next-themes`
(`class="dark"` on `<html>`), defaulting to the OS. The dark palette is one
block in `globals.css`; components only read tokens, so they flip by cascade.
Before shipping a new surface, grep it for literal hex, `#fff`, `bg-white`,
`text-black`, and view it in both themes.

## Accessibility

- Body text 4.5:1; meaningful rules and focus 3:1 against both neighbours.
- Visible focus on every control (the ring token survives both themes).
- 40–44px touch targets for key mobile actions.
- Never colour alone: status pairs colour with a label, live state with a dot + word.
- Semantic nav, tabs, dialogs and form labels; drag-and-drop always has a menu alternative.
