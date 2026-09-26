# Kingdom Studio AI — Build Status

Last updated: 2026-09-26

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Shot List v1 is implemented as a generic production module. It consumes Scene Planner records, proposes grounded camera coverage, persists shots with RLS, and preserves filmmaker-approved shots on later planning runs.

## Pipeline

| Stage | Status | Notes |
| --- | --- | --- |
| Authentication / productions | Present | Existing studio app and Supabase ownership model |
| Screenplay import / versioning | Present | Script workspace and screenplay tables |
| Canonical / scene extraction | Present | Import-engine extractors and Scene Planner sync |
| Story Bible | Present | Screenplay-driven proposals exist in feature module |
| Characters | Present | Dynamic extraction and editor |
| Locations | Present | Location Bible + screenplay sync |
| Scenes | Present | Production scene records with source text |
| Shot List | Implemented this session | Domain, planner, persistence, UI, unit tests |
| Storyboard | Stub page only | Next pipeline dependency |
| AI Director | UI shell only | Not production intelligence yet |
| Assets / generation jobs | Stub pages | Not implemented |
| Render / export | Stub pages | Not implemented |

## Shot List v1 invariants

- Shots belong to a production and may link to a scene, location, and characters.
- Scene-derived proposals use scene heading, action, dialogue cues, and source text only.
- Unsupported camera or story facts are not invented from a named test screenplay.
- User-created or user-approved shots are not overwritten by `Plan from Scenes`.
- Completion percentage is calculated from persisted shot fields.
- RLS restricts shot access to the production owner.

## Verification

Planner unit tests passed with Node's test runner. `npm install`, lint, tsc, and production build could not be run in this session because the npm registry proxy returned 502.

## Next executable dependency

Storyboard: persist panels that consume shot, scene, character, and location intelligence so visual continuity can be planned before generation.
