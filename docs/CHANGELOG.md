# Kingdom Studio AI Changelog

---

## Version 0.7.0

### Added

- Production Assets workspace with plan, approve, edit, delete and queue-generation flows
- Asset planning from persisted characters, locations, shots, panels and director notes
- Approved-asset protection so later planning cannot recreate filmmaker-owned titles
- Generation job queue that persists dispatch results and never invents a media URL
- Partial-update mappers for assets and generation jobs that omit undefined columns
- Unit tests for grounded asset planning, job lifecycle and mapper compacting
