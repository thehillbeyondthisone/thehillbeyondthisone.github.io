# Yellow Umbrella Observatory

A quiet, optional-play portfolio for games, tools, and little worlds. The project collection is accessible without interacting with the 3D scene. No scores, unlocks, or required navigation through a game.

## How it works

- A fixed-camera terrace has a telescope, radio, warm lights, umbrella, and reusable project board.
- Favorites are visible alongside the scene on desktop and below it on phones. All projects opens the public catalog.
- A project opens a readable inspector with description, source, and existing media when available.
- Two existing demos offer **Explore here** with a persistent return bar, or **Open project in new tab**. The return bar moves to the bottom on mobile.
- HTML project links remain available without JavaScript. WebGL failure keeps the collection usable. Reduced motion and Pause motion stop the ambient animation.

The site is plain HTML, CSS, and JavaScript. Three.js r128 is loaded from cdnjs, matching the existing Yellow Umbrella site; fonts come from Google Fonts. There is no app server, package installation, or browser-side GitHub token. Source files live in `assets/`; the scene is independent of project data.

## Local use

Node 22 or newer is needed only for maintenance/build commands. Serve the project over HTTP; JavaScript modules do not work reliably by opening the HTML as a file.

```sh
node --test tests/catalog.test.mjs
node scripts/refresh-catalog.mjs
node scripts/export-site.mjs
python3 -m http.server 8000 --directory _site
```

Open `http://localhost:8000`. Refresh requires network access; export and tests use the committed snapshot. An optional `GITHUB_TOKEN` can raise the refresh API allowance, and is never included in the exported site.

## Curation and automatic updates

Edit `data/curation.json`. `featured` sets the order of favorites. `exclude` hides repositories such as this portfolio and the profile README repository. Entries under `projects` can override title, summary, description, category, and local-use requirements. Adding a project does not require scene changes.

The public GitHub API supplies names, descriptions, URLs, language, fork/archive status, and update dates. Pagination is supported; only explicitly public repositories owned by the configured account are accepted. New eligible repositories enter All projects automatically. Favorites stay deliberate: pin changes do not silently rearrange the front room. Review the GitHub pins and edit `featured` when desired.

`data/catalog.js` is a committed starting snapshot. Actions refreshes it during deployment, without committing daily date changes to the source branch. To update the committed snapshot, run the refresh command and commit both `data/catalog.js` and `index.html`.

The workflow refreshes on main pushes, daily at 06:17 UTC, and manual runs. API errors, invalid data, or a missing favorite stop deployment and leave the previous live site in place. Changes to other repositories are picked up at the next refresh. GitHub schedules are best effort and can be disabled after 60 days of repository inactivity; re-enable the workflow in Actions and run it manually when necessary. [GitHub schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Existing media and demos

Only explicit curated HTTPS links become demo or image controls. Discovery does not crawl demos, capture screenshots, or change showcased repositories.

- Golf, Probably: existing Pages demo and first-hole screenshot.
- Kinwild Living World: existing Pages demo, distinct from the Kinwild Creature Creator repository.
- artpipeline: existing README animation. Reduced-motion visitors receive a link instead of an automatically animated GIF.

To add existing media later, set `image` and `imageAlt`, or `demo`. Set `embed: true` only for a trusted demo checked to work in an iframe. The two initial demos responded with HTTP 200 and no blocking frame headers on 2026-09-11; this is not a runtime or mobile compatibility guarantee. New-tab opening always remains available. GitHub repository pages open externally. Never proxy around a demo's embedding restrictions.

## Add the radio recording later

Place your audio at `assets/audio/observatory.mp3`, then set:

```json
"audio": "assets/audio/observatory.mp3"
```

Refresh the catalog and deploy. HTTPS audio URLs are also accepted. The radio starts silent, begins only after a tap, and shows notes after playback succeeds. Tapping the radio, notes, or visible Radio button pauses it. With `audio: null`, the control says it is waiting for a record; no substitute audio is generated.

## GitHub Pages deployment

Set **Settings → Pages → Build and deployment → Source → GitHub Actions**. Merge the reviewed change into `main`; the Observatory Pages workflow will build and deploy `_site`. PRs build an artifact but never deploy. A manual workflow run from `main` refreshes and republishes. [GitHub custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The workflow exports only the page, app assets, public catalog, and existing `og.png`. Existing social art is preserved. The previous portfolio is recoverable at commit `7743e44b81ef4677dcee9d056b0ea998c1e5879e`; revert the observatory change to restore it, then restore the previous Pages publishing source if rolling back the workflow as well.

The separate business site at yellowumbrella.group has its own deployment path. This repository must not be replaced with the business site's HTML.

## Before release

Check 320/390/768/1440 px layouts, a real iOS/Android phone, portrait/landscape scrolling, keyboard and dialog focus, text enlargement, reduced motion, WebGL/CDN failure, both embedded demos, and the return bar. The supplied recording can be checked when it exists. Source tests cover catalog filtering, failed refresh conditions, optional media, and inert metadata serialization; they do not establish visual quality or touch performance.

Project decisions and maintenance lessons are in [docs/WORKFLOW_TRUTHS.md](docs/WORKFLOW_TRUTHS.md).
