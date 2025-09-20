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
