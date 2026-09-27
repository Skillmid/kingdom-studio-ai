# Kingdom Studio AI Changelog

---

## Version 0.5.0

### Added

- Generic Assets module with production-derived character, location, shot and panel references
- Generation job state machine with queued, running, completed, failed, cancelled and retry transitions
- Recoverable unconfigured-provider failures that never invent a file URL
- `assets` and `generation_jobs` tables, RLS policies, and production-owned persistence
- Deterministic asset completion scoring
- Unit tests for grounded asset planning, approved-asset protection, and job lifecycle

---

## Version 0.4.0

### Added

- Generic AI Director module with production-derived direction notes
- Note enrichment from persisted scene, shot, storyboard, character and location records
- `director_notes` table, RLS policies, and production-owned persistence
- Deterministic director-note completion scoring
- Unit tests for grounded direction planning, uncertainty preservation, and approved-note protection
