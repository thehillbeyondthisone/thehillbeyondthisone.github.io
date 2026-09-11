# Observatory decisions and maintenance lessons

- Optional play is the atmosphere; readable project browsing is the primary task.
- Keep the scene independent of project identity. Curated copy belongs in data, not Three.js meshes.
- Favorites are deliberate; the rest of the catalog can follow the public API. Pins can be newer than cached profile/search results.
- New demo or screenshot creation requires its own scope. Missing media needs no placeholder.
- README demo links can exist even when GitHub homepage metadata is blank. Never infer a working demo from the repository language or a guessed URL.
- Kinwild Creature Creator and Kinwild Living World are separate projects. Local logs, game clients, servers, and models can be real project requirements.
- Import only explicitly public, owned repositories. Keep build credentials out of browser assets.
- A failed refresh must not publish an empty or partial catalog. Favorite disappearance is a reviewable error.
- Normal mobile scrolling and generous HTML controls matter more than scene gestures. Every essential action needs a direct control outside the canvas.
- Pause rendering when hidden, offscreen, or viewing a demo. Reduced motion needs static rendering on interaction, not merely slower animation.
- Successful syntax tests and HTTP responses do not establish visual, embedding, audio, or mobile usability. Verify those separately before release.
- The github.io portfolio and yellowumbrella.group business site are separate deployment targets. Keep their source and rollback paths distinct.
