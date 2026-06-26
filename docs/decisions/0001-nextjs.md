# ADR-0001: Adopt Next.js as the Application Framework

**Status:** Accepted

**Date:** 2026-06-26

---

## Context

Kingdom Studio AI requires a modern web framework capable of supporting server-side rendering, API routes, authentication, and future scalability.

The platform will grow into a full AI-powered filmmaking system with dashboards, project management, media generation, and collaboration features.

---

## Decision

We chose **Next.js** as the primary application framework.

---

## Reasons

* Excellent support for React.
* App Router architecture.
* Server Components.
* Strong TypeScript support.
* Easy deployment to Vercel.
* Mature ecosystem.
* Excellent performance.
* Long-term maintainability.

---

## Alternatives Considered

* React + Vite
* Nuxt
* Remix

These were not selected because Next.js provides the best balance between developer experience, scalability, and production readiness for our goals.

---

## Consequences

Positive:

* Fast development.
* Scalable architecture.
* Excellent deployment options.

Trade-offs:

* Slightly steeper learning curve.
* Framework conventions must be followed.

---

## Decision Owner

Skillmid Creatives

Project: Kingdom Studio AI
