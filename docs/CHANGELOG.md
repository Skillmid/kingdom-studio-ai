# Kingdom Studio AI Changelog

---

## Version 0.7.1

### Added

- Production Assets workspace hook and UI for plan, approve, edit, delete and queue-generation
- Generation-job `createMany` plus compact mapper writes on asset and job persistence
- Dispatch result persistence that copies provider output URLs only when a provider returns one

### Fixed

- Generation provider constructors are compatible with the Node strip-types test runner

---

## Version 0.7.0

### Added

- Production Assets workspace with plan, approve, edit, delete and queue-generation flows
- Asset planning from persisted characters, locations, shots, panels and director notes
- Approved-asset protection so later planning cannot recreate filmmaker-owned titles
- Generation job queue that persists dispatch results and never invents a media URL
- Partial-update mappers for assets and generation jobs that omit undefined columns
- Unit tests for grounded asset planning, job lifecycle and mapper compacting

---

## Version 0.6.0

### Added

- Generic Render / Export module that assembles a sequence from shots, leftover storyboard panels and image/video assets
- Media URLs copied only from existing asset `fileUrl` or panel `imageUrl` values
- Export records for delivery manifest, EDL and preview package formats that never invent a package file URL
- `render_sequences`, `render_clips` and `export_packages` tables with production-owner RLS
- Production Render and Export workspaces with assemble, approve, remove and export flows
- Restored Assets and AI Director repositories/views required by production pages
- Unit tests for grounded sequence planning, approved-clip protection and export serialization

---

## Version 0.5.0

### Added

- Generic Assets module with production-derived character, location, shot and panel references
- Generation job state machine with queued, running, completed, failed, cancelled and retry transitions
- Recoverable unconfigured-provider failures that never invent a file URL
- `assets` and `generation_jobs` tables, RLS policies, and production-owned persistence
- Deterministic asset completion scoring
- Production Assets workspace with plan, queue, edit and delete flows
- Restored AI Director persistence and workspace files required by the production page
- Unit tests for grounded asset planning, approved-asset protection, and job lifecycle

---

## Version 0.4.0

### Added

- Generic AI Director module with production-derived direction notes
- Note enrichment from persisted scene, shot, storyboard, character and location records
- `director_notes` table, RLS policies, and production-owned persistence
- Deterministic director-note completion scoring
- Unit tests for grounded direction planning, uncertainty preservation, and approved-note protection
