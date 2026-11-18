# kutukutu 🧩

Drag Twitter profiles onto a color chart, tier list or scatter plot, write a few lines on each
card, and save the result as a PNG. 100% client-side — no login, no backend.

## Stack

- Vite + React + TypeScript
- Bun for installs, dev server and builds
- Deployed to GitHub Pages via GitHub Actions

## Development

```sh
bun install
bun run dev        # http://localhost:5173/kutukutu/
```

Other scripts:

```sh
bun run build      # typecheck + production build into dist/
bun run preview    # serve the production build
bun run typecheck
```

## Deployment

Push to `main`. `.github/workflows/deploy.yml` builds and publishes `dist/` to Pages.

Before the first deploy, open **Settings → Pages** in the GitHub repo and set
**Source → GitHub Actions**.

`vite.config.ts` derives the base path from `GITHUB_REPOSITORY`, so the site works at
`https://<user>.github.io/<repo>/` without changes.

## How profile data is fetched

1. [`api.fxtwitter.com/<handle>`](https://github.com/FxEmbed/FxEmbed) — public, CORS-enabled,
   returns display name, handle and avatar without an API key.
2. `unavatar.io/x/<handle>` as an avatar-only fallback.

Both are unofficial public services; they can rate-limit or change.

Avatars are displayed through `images.weserv.nl` (with `unavatar.io` as a fallback and
initials as a last resort), so they keep working on networks where `pbs.twimg.com` is
blocked. PNG export reuses the image the board is currently showing.

## Mobile

On phones the app becomes a full-screen canvas: brand + Save PNG and template/title on top,
with a floating **People** button that opens a bottom sheet containing the search field and
roster. Tap a person, then tap a cell to place them. Tap a placed card to edit its name and
text, flip the photo side, or remove it. Card names and notes stay visible in the small phone
preview: each card measures its own text and shrinks the font until the whole label fits, so
handles are never cut off with an ellipsis. **Save PNG** opens the native share sheet on touch
devices, where *Save Image* writes the picture straight to Photos.

## Colors and cards

The color chart is a collage that holds one person per cell: a square photo pinned to the card's
top-left corner, a large editable card name, and a free-text block underneath. The **Grid** switch
in the toolbar toggles between 4×4, 6×6 and 8×8; placements are rescaled when you switch, and cards
that would collide when the grid shrinks move to the nearest free cell.
Backgrounds follow the reference palette — pink/red top-left, blue top-right, green bottom-left,
yellow bottom-right, fading to muted tones along the middle. The 6×6 and 8×8 grids also draw a
heavier cross through their center. Card names and text are stored with the placement and rendered
exactly as typed (line breaks included). The card name defaults to the profile's display name and
can be overridden per card.

## PNG export

The board is snapshotted straight from the DOM with [`html-to-image`](https://github.com/bubkoo/html-to-image),
so the PNG matches what is on screen. Avatars are temporarily routed through
`images.weserv.nl` during capture so the images are CORS-safe and never taint the canvas.
On desktop the PNG downloads as a file; on touch devices it is passed to the Web Share API
(falling back to a download when sharing is unavailable).
