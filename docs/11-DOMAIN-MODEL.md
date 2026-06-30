# Kingdom Studio AI Domain Model

## Purpose

This document defines the core business entities of Kingdom Studio AI and the relationships between them. It serves as the authoritative reference for database design, services, APIs, and business rules.

---

# Core Principle

Everything belongs to a **Production**.

A Production is the root aggregate of the platform.

Nothing creative exists outside a Production.

---

# Domain Hierarchy

Creator

↓

Production

↓

Story

↓

Character

↓

Scene

↓

Shot

↓

Asset

↓

Render Job

↓

Export

---

# Creator

Represents an authenticated user.

Owns one or more Productions.

Can collaborate on Productions owned by others.

---

# Production

Represents a complete filmmaking project.

Owns:

* Story
* Characters
* Scenes
* Assets
* AI Context
* Render Jobs
* Team Members

Lifecycle:

Concept

↓

Writing

↓

Pre-Production

↓

Production

↓

Post-Production

↓

Released

↓

Archived

---

# Story

Represents the screenplay and narrative.

Contains:

* Logline
* Synopsis
* Acts
* Story Beats

---

# Character

Represents a person or entity within the story.

Contains:

* Biography
* Appearance
* Personality
* Relationships

---

# Scene

Represents one dramatic unit of the story.

Contains:

* Location
* Time
* Description
* Dialogue
* Camera Notes

---

# Shot

Represents an individual cinematic shot.

Contains:

* Camera Angle
* Lens
* Movement
* Duration
* AI Prompt

---

# Asset

Represents generated or uploaded media.

Examples:

* Images
* Videos
* Audio
* Music
* Voiceovers

---

# AI Director

The AI Director operates with Production context.

It understands:

* Story
* Characters
* Scenes
* Style
* Goals
* Previous conversations

The AI Director never operates on isolated prompts.

---

# Guiding Principles

1. Production is the root aggregate.

2. Every feature belongs to a Production.

3. Business rules belong to the domain before the UI.

4. Validation occurs before persistence.

5. Services interact with infrastructure.

6. Components never access the database directly.

7. The UI reflects the domain—not the other way around.
