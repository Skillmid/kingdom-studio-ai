# Kingdom Studio AI

# Database Design

**Version:** 1.0

**Status:** Active

**Owner:** Skillmid Creatives

---

# Purpose

This document defines the database architecture for Kingdom Studio AI.

The database is designed around one central principle:

> Every creative asset belongs to a Project.

Projects become the central container for every production.

---

# Database Philosophy

The platform is designed using relational data.

Relationships should be clear, scalable and secure.

Every authenticated user owns their own projects.

All generated content belongs to one project.

---

# Core Entity Relationship

```text
User
 │
 ├── Projects
 │      │
 │      ├── Creative Brief
 │      ├── Story
 │      ├── Characters
 │      ├── Locations
 │      ├── Scenes
 │      ├── Storyboards
 │      ├── AI Jobs
 │      ├── Videos
 │      ├── Audio
 │      ├── Assets
 │      └── Exports
```

---

# Authentication

Authentication is managed by Supabase Auth.

The application's user profile extends the authenticated user.

## users

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| email      | TEXT      |
| full_name  | TEXT      |
| avatar_url | TEXT      |
| company    | TEXT      |
| country    | TEXT      |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# Projects

The project is the primary container.

## projects

| Field        | Type      |
| ------------ | --------- |
| id           | UUID      |
| user_id      | UUID      |
| title        | TEXT      |
| project_type | TEXT      |
| status       | TEXT      |
| description  | TEXT      |
| created_at   | TIMESTAMP |
| updated_at   | TIMESTAMP |

---

# Creative Brief

Every project has one Creative Brief.

## creative_briefs

| Field        | Type |
| ------------ | ---- |
| id           | UUID |
| project_id   | UUID |
| purpose      | TEXT |
| audience     | TEXT |
| genre        | TEXT |
| tone         | TEXT |
| language     | TEXT |
| duration     | TEXT |
| platform     | TEXT |
| visual_style | TEXT |
| aspect_ratio | TEXT |

---

# Stories

## stories

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| project_id | UUID      |
| title      | TEXT      |
| content    | TEXT      |
| outline    | TEXT      |
| version    | INTEGER   |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# Characters

## characters

| Field       | Type |
| ----------- | ---- |
| id          | UUID |
| project_id  | UUID |
| name        | TEXT |
| age         | TEXT |
| description | TEXT |
| appearance  | TEXT |
| clothing    | TEXT |
| personality | TEXT |
| voice       | TEXT |
| image_url   | TEXT |

---

# Locations

## locations

| Field           | Type |
| --------------- | ---- |
| id              | UUID |
| project_id      | UUID |
| name            | TEXT |
| description     | TEXT |
| lighting        | TEXT |
| weather         | TEXT |
| architecture    | TEXT |
| reference_image | TEXT |

---

# Scenes

## scenes

| Field        | Type    |
| ------------ | ------- |
| id           | UUID    |
| project_id   | UUID    |
| scene_number | INTEGER |
| title        | TEXT    |
| description  | TEXT    |
| dialogue     | TEXT    |
| camera_notes | TEXT    |
| mood         | TEXT    |
| prompt       | TEXT    |
| status       | TEXT    |

---

# Storyboards

## storyboards

| Field      | Type |
| ---------- | ---- |
| id         | UUID |
| project_id | UUID |
| scene_id   | UUID |
| image_url  | TEXT |
| notes      | TEXT |

---

# AI Jobs

Every AI request should be recorded.

## ai_jobs

| Field           | Type      |
| --------------- | --------- |
| id              | UUID      |
| project_id      | UUID      |
| provider        | TEXT      |
| job_type        | TEXT      |
| prompt          | TEXT      |
| status          | TEXT      |
| external_job_id | TEXT      |
| started_at      | TIMESTAMP |
| completed_at    | TIMESTAMP |

---

# Videos

## videos

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| project_id | UUID      |
| scene_id   | UUID      |
| provider   | TEXT      |
| video_url  | TEXT      |
| duration   | INTEGER   |
| resolution | TEXT      |
| created_at | TIMESTAMP |

---

# Audio

## audio

| Field      | Type    |
| ---------- | ------- |
| id         | UUID    |
| project_id | UUID    |
| type       | TEXT    |
| audio_url  | TEXT    |
| duration   | INTEGER |

---

# Assets

## assets

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| project_id | UUID      |
| asset_type | TEXT      |
| file_name  | TEXT      |
| file_url   | TEXT      |
| created_at | TIMESTAMP |

---

# Exports

## exports

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| project_id  | UUID      |
| export_type | TEXT      |
| export_url  | TEXT      |
| created_at  | TIMESTAMP |

---

# Relationships

```text
User
 └── Projects

Project
 ├── Creative Brief
 ├── Story
 ├── Characters
 ├── Locations
 ├── Scenes
 ├── Storyboards
 ├── AI Jobs
 ├── Videos
 ├── Audio
 ├── Assets
 └── Exports
```

---

# Security

Every table must use Row Level Security (RLS).

Policies should ensure:

* Users only access their own projects.
* Users cannot read another creator's data.
* AI jobs are linked to project ownership.
* Storage follows the same ownership model.

---

# Storage Structure

```text
storage/

avatars/

projects/

storyboards/

characters/

videos/

audio/

exports/
```

---

# Future Tables

The following tables are planned for future releases:

* teams
* invitations
* comments
* reviews
* notifications
* subscriptions
* billing
* ai_providers
* usage_logs
* audit_logs

---

# Database Principles

Every table must:

* Have a UUID primary key.
* Include timestamps where appropriate.
* Respect project ownership.
* Support future scalability.
* Be documented before implementation.

---

# Final Principle

The database exists to preserve creativity.

Creators should never lose their stories, assets or production history.

Every project should remain organized from the first idea to the final exported film.

---

**Skillmid Creatives**

**Designing the Foundation for AI-Powered Filmmaking**
