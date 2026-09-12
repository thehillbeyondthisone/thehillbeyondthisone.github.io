# Yellow Umbrella Observatory

A solitary observatory, a slowly changing sky, and a journal of games, tools, and experiments. The landscape is optional play; every project is one journal button away.

## The experience

The approved compact observatory artwork fills the scene. Desktop has a paper-toned journal on the right when opened; phones frame the tower and radio with the journal in a bottom sheet. The journal shows curated favorites and a searchable public catalog. Project entries have descriptions, source links, local requirements, and existing media when available.

The 20-minute day–night cycle starts near dusk. Use Time to pause, hold dawn/day/dusk/night, or choose any point in between. Time holds while inspecting a project, looking through the telescope, viewing a demo, or leaving the tab. Reduced motion starts still, with an explicit option to resume. The telescope opens an imagined star field with optional drag, keyboard, and shooting-star interactions.

The radio starts silent and awaits your recording. Notes appear only while audio is actually playing. A scene hotspot and visible dock control are provided for the journal, radio, and telescope; nothing requires discovering a hidden interaction.

Existing demos can open in a new tab or inside the page. The embedded viewer retains Observatory, Journal, and New tab controls at the side on desktop and bottom on phones. Browsing returns to the same scene phase. Native HTML dialogs handle focus containment and Escape. Static project links remain available when JavaScript or catalog loading fails.

This is a 2D illustrated scene with day/night artwork and a lightweight Canvas atmosphere layer. It is not a Blender model or a freely navigable 3D environment. It uses no WebGL library, npm dependencies, or external fonts. Both scene images together are about 350 KB. See [scene decisions and review limits](docs/SCENE.md).

## Local preview and checks

Node 22 or newer runs the maintenance commands. Serve over HTTP so browser JavaScript modules can load:

```sh
node --test tests/*.test.mjs
node scripts/check-site.mjs
node scripts/export-site.mjs
python3 -m http.server 8000 --directory _site
```

Open `http://localhost:8000`. Tests and export use the committed catalog and need no GitHub connection. `node scripts/refresh-catalog.mjs` refreshes it from the public API when wanted. An optional `GITHUB_TOKEN` raises the API allowance; it is never included in the exported site.

The tests check the cycle seam, pause/suspension, manual phase selection, portrait hotspot bounds, journal filtering, public-only catalog rules, invalid media, and inert serialization. Source checks verify HTML IDs, control references, required files, and the image budget. These checks do not establish actual browser layout, focus behavior, or touch quality.

## Favorites and automatic updates

Edit `data/curation.json`. `featured` chooses the order of favorites. `exclude` hides infrastructure repositories such as the portfolio and profile README. Overrides under `projects` control title, summary, description, category, requirements, and optional media. No scene changes are needed when adding projects.

The public GitHub API imports names, descriptions, URLs, language, fork/archive status, and update dates with pagination. Only explicitly public repositories owned by the configured account are accepted. New eligible projects enter All projects automatically. Favorites remain deliberate; changed pins do not automatically reorder them.

The committed `data/catalog.js` is the starting snapshot. Actions refreshes the deployed artifact without making daily source commits. To update the committed snapshot, run the refresh command and commit both `data/catalog.js` and `index.html`.

The workflow refreshes on main pushes, daily at 06:17 UTC, and manual runs. Retrieval errors, invalid data, and missing favorites stop deployment, preserving the last successful live site. Other repositories' changes arrive at the next refresh. Scheduled workflows are best effort and may be disabled after 60 days of repository inactivity; re-enable and manually run them in Actions when needed. [GitHub schedule reference](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Existing demos and images

- Golf, Probably: existing Pages demo and first-hole screenshot.
- Kinwild Living World: existing Pages demo, separate from the Creature Creator repository.
- artpipeline: existing README animation; reduced-motion visitors get an external animation link.

Only explicit curated HTTPS links become media controls. Set `demo`, and `embed: true` only for a trusted demo verified to support an iframe. Set `image` with descriptive `imageAlt` for existing media. The initial URLs returned HTTP 200 and the demo responses had no blocking frame headers on 2026-09-11; runtime and mobile compatibility still need direct review. Source pages always open on GitHub. No proxy bypasses embedding restrictions, and no demos or screenshots are generated for other projects.

## Add your radio recording

Place the recording at `assets/audio/observatory.mp3`, set `audio` in curation to `assets/audio/observatory.mp3`, refresh the catalog, and deploy. HTTPS audio URLs are also accepted. Until then leave `audio: null`. Playback is opt-in, loops at a gentle default volume, and can be stopped from the radio or visible button. No audio autoplays with the visual cycle.

## GitHub Pages and review

Pages Source should be **GitHub Actions**. The workflow builds PRs into downloadable artifacts and only deploys `main`. For a PR preview, download the `github-pages` artifact from its successful Actions run, extract the ZIP and its `artifact.tar`, then serve that folder with a local HTTP server. No PR deployment or third-party hosting service is configured. Merging to main triggers the live deployment. [GitHub custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Before merging the visual revision, inspect desktop and mobile layouts, portrait and landscape, text enlargement, keyboard focus, reduced motion, missing images, both demos, the return controls, and intermediate cycle phases. The earlier local browser permission block prevented that review in this workspace; it was not bypassed. This revision must be reviewed visually before it replaces the live page.

The export contains only the page, app assets, public catalog, and existing `og.png`. The share image is still the prior design pending approval of the new implementation. The first Observatory is recoverable at `37e3947d49c7d3425a65acb52c1c4d1ef0b02c4a`; the original portfolio at `7743e44b81ef4677dcee9d056b0ea998c1e5879e`. Revert the relevant change to roll back. The separate yellowumbrella.group business site is not deployed from this repository.

Maintenance lessons are kept in [docs/WORKFLOW_TRUTHS.md](docs/WORKFLOW_TRUTHS.md).
