# Testing Guide

## Types

- **Unit**: pure functions/services.
- **Integration**: Express handlers + DB branch.
- **E2E (select)**: auth, RBAC, refresh rotation.

## Env Targeting

- `DATABASE_URL` points to Neon `dev` or `test`.
- `NODE_ENV=test` with isolated schema or branch.
- Rate-limit tests use deterministic headers and unique keys.

## Commands

- All: `npm run test -w @tcpl-cpm/api`
- Focus: `npm run test -w @tcpl-cpm/api -- path/to/file.spec.ts`
- Watch: `npm run test -w @tcpl-cpm/api -- --watch`

## Data

- Factories/fixtures; wrap in tx; clean per test.
- Avoid cross-test coupling.

## CI

- Turbo cache restore/save.
- Type errors fail fast.
- No snapshot updates in CI.

## Projects & Stages API tests

All tests run with existing Jest config (`apps/api/jest.config.ts`) and load env from `.env.test`.

- Create Project with PM:
  file: apps/api/src/test/projects.pm.spec.ts
  checks: when `projectManagerUserId` is provided, a ProjectMember is created.

- Stages ordering:
  file: apps/api/src/test/stages.ordering.spec.ts
  checks: append and middle insert keep contiguous `sortOrder`.
