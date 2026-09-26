# BUILD STATUS

## Current milestone

**Screenplay-driven character intelligence proposals and provenance**

### Completed in this milestone

- AI character synchronization now persists proposals separately from character records.
- AI proposals carry screenplay-version and source-evidence provenance.
- Screenplay synchronization no longer overwrites existing character profiles with AI output.
- Existing user-approved character data remains the persisted source of truth.
- Added generic regression fixtures covering different names, character counts, screenplay structures and sparse action.
- Added a production-source guard test that rejects THE MESSAGE fixture names from non-test production logic.
- Added database RLS for character AI proposals.

### Verification

This milestone was authored through the repository Git API. Local shell execution is not available in this session, so `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` have **not** been claimed as executed here. CI is configured to run those commands on pushes and pull requests.

## Next dependency

Finish the user-facing review/apply lifecycle for persisted character proposals, then carry the same canonical-analysis/provenance model into Story Bible synchronization before advancing to Locations and Scenes.

## Invariants

- THE MESSAGE is a regression fixture only.
- No screenplay-specific character names belong in production logic.
- AI output is proposal data until the user reviews and saves it.
- Unsupported screenplay facts remain unresolved rather than fabricated.
