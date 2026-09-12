# The quiet observatory

The approved compact brick/plaster tower, copper dome, timber annex, simple terrace, bench, bicycle, and radio are the visual reference. The observatory stands alone. Lighting brings warmth; material colors remain subdued. The full-screen artwork is the primary view, with a project journal available from a clearly labeled button. Desktop uses a paper-toned side journal; phones use a bottom sheet.

## Artwork and rendering

`assets/scene/night.webp` is the approved scene, encoded for delivery. `day.webp` is a lighting edit of that same composition. Both were prepared using the built-in image-generation tool and encoded to WebP without cropping. The final generation prompt asked for the exact composition, camera, geometry, props and pixel alignment, changing only lighting to quiet diffuse daylight, removing stars/moon, and turning off practical lights. No screenshots or demos were made for showcased repositories.

This is a 2D illustrated environment with a composited lighting cycle, not an exported Blender model or freely navigable 3D scene. No WebGL or external rendering library is required. A small transparent Canvas layer adds restrained valley haze and local light scattering. The latter is an atmospheric approximation, not a real volumetric simulation.

Day and night are derived from one reference and use one shared image plane. Very slow opacity interpolation changes the illumination, while a faint twilight wash softens the transition. The artwork endpoints were inspected, but small generative differences can remain; inspect intermediate phases in a browser before publishing. Do not claim the two source images are pixel-identical geometry or physically simulated sunlight.

## Time and interaction

- One cycle lasts 20 minutes of active scene time and begins near dusk. Duration and initial phase live in `assets/cycle.mjs`.
- Time controls allow dawn, day, dusk, night, and continuous phase selection. Choosing a phase pauses time. Let time wander resumes it.
- Reduced motion starts still and skips animated phase transitions. The cycle can be explicitly resumed. The sky toy remains still under reduced motion.
- Time and ambience suspend while the journal, telescope, or project viewer is open, or the document is hidden. Resuming never skips ahead to catch up.
- Native HTML dialogs provide focus containment and Escape-to-close. Journal list/detail navigation retains filters and scroll position. The iframe viewer has persistent Observatory, Journal, and New tab actions, at the bottom on phones.
- The telescope opens a small imagined star field. Drag or use arrow keys to look around; tap or press Enter for a shooting star. No scores or astronomy claims.
- Radio playback begins only after a gesture and a supplied recording. Notes appear only on successful playback, and stop on pause, buffering, or error. Until audio is configured it remains silent.

## Portrait framing

`sceneFrame` favors the tower and radio for portrait viewports, using a softly blurred continuation of the same artwork behind the main image. This retains the composition without requiring horizontal scrolling. Hotspots are positioned in image coordinates; pure tests check their 52px tap bounds at common portrait sizes. Every hotspot action also has a visible dock control. These coordinate tests do not replace visual testing with browser chrome, text enlargement, and actual touch devices.

## Review gate

Keep this revision off main until its actual desktop/mobile rendering has been reviewed. Local browser preview was blocked by an earlier permission decision; that restriction was not bypassed. Passing source tests and inspecting the artwork endpoints do not establish layout or touch quality. Review at 320/390/768/1440px, landscape phone, 200% text, keyboard, reduced motion, missing images, two embedded demos, and the cycle midpoint. The PR artifact contains the runnable static site. Serve it over HTTP, not file://.

The existing `og.png` remains the prior social-preview image. A new share card can follow once the visual implementation is accepted.
