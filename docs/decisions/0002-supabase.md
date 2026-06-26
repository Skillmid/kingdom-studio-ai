# ADR-0002: Adopt Supabase as the Backend Platform

**Status:** Accepted

**Date:** 2026-06-26

---

# Context

Kingdom Studio AI requires a backend platform that provides authentication, database services, storage, security, and future scalability without requiring extensive backend infrastructure during the early stages of development.

---

# Decision

We selected **Supabase** as the backend platform for Version 1.

Supabase will provide:

* User Authentication
* PostgreSQL Database
* Row Level Security
* File Storage
* Edge Functions (future)
* Realtime Capabilities (future)

---

# Why Supabase

Supabase aligns well with the goals of Kingdom Studio AI because it allows the team to focus on product development rather than backend infrastructure.

Benefits include:

* PostgreSQL database
* Excellent TypeScript support
* Strong security model
* Modern authentication
* Storage buckets
* Good developer experience
* Easy scaling

---

# Alternatives Considered

## Firebase

Advantages

* Mature platform
* Excellent ecosystem

Reasons not selected

* No PostgreSQL
* Less flexible relational modeling
* Vendor-specific query model

---

## Self-hosted PostgreSQL

Advantages

* Full control

Reasons not selected

* Higher operational overhead
* Longer setup time
* Additional DevOps requirements

---

## Appwrite

Advantages

* Open source
* Good developer experience

Reasons not selected

* Smaller ecosystem
* Less mature than Supabase for our planned architecture

---

# Consequences

Positive

* Faster development
* Built-in authentication
* Strong relational database
* Easier deployment

Trade-offs

* Dependence on a managed platform
* Future migration planning may be required if scale demands it

---

# Future Review

This decision should be reviewed if:

* Enterprise hosting becomes necessary.
* Infrastructure requirements significantly change.
* Scaling needs exceed the platform's capabilities.

---

# Decision Owner

Skillmid Creatives

Project: Kingdom Studio AI
