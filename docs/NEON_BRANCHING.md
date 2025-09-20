# Neon Branching Strategy

## Branches
- **dev**: integration; all feature PRs target this.
- **test**: cut from `dev` for QA/UAT; tagged `rc-YYYYMMDD`.
- **prod**: promotion-only from `test`; tagged `release-YYYYMMDD`.

## Workflow
1. Feature → PR → `dev` (CI: build, lint, typecheck, test).
2. Release cut: create/update `test` from `dev`; tag `rc-YYYYMMDD`.
3. QA on `test`. Fixes land on `dev` → cherry-pick to `test`.
4. Promote: fast-forward `prod` from `test`, run migrations, deploy.

## DB Branching (Neon)
- Branches: `dev`, `test`, `prod`.
- Apply migrations to `dev`, snapshot for `test`, promote after backup.
- Use `DATABASE_URL` per branch; pooled `PRISMA_DATABASE_URL` if enabled.

## Rollbacks
- **Schema**: revert tag, apply down migration if needed.
- **App**: redeploy previous image tag. Keep migrations idempotent where possible.
