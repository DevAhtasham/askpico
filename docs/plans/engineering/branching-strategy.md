# Branching Strategy

**Status:** Active. Adopt before beta work begins.
**Owner:** Pico engineering
**Repository:** `origin` → `https://github.com/DevAhtasham/askpico.git`
**Related:** [Beta launch](../product/beta-launch.md) (release flow) · [Testing guide](testing-guide.md)

## 1. Purpose

This document defines which branches exist, who owns them, and how work moves between them. The model supports one developer working on several devices at the same time, and a later team without a rewrite of the workflow.

## 2. Current State (Snapshot)

| Branch | Location | Status |
|---|---|---|
| `main` | Local and `origin/main` | Production. The only branch on the remote today |
| `develop` | Local only | Integration branch. Not yet pushed |
| `release` | Local only | Beta candidate. Not yet pushed |
| `hotfix` | Local only | Rename to the `hotfix/<name>` pattern (section 4.4) |
| `feature/login-page` | Local only | Feature branch. Follow the feature naming rule (section 5) |

The working tree also contains many uncommitted changes. Commit or stash them before switching branches.

## 3. Long-Lived Branches

Only these branches are permanent. Everything else is temporary.

| Branch | Purpose | Who may push | Deployed |
|---|---|---|---|
| `main` | Production code. Every commit is releasable | Merge only, through a reviewed pull request | Production (GitHub Pages workflow) |
| `develop` | Integration. Completed features are merged here | Merge only, through a pull request | Not deployed |
| `release` | Beta stabilization. Only fixes are added here | Merge only | Beta (web and Android internal testing) |

**Rules**

- No direct commits to `main`, `develop`, or `release`. Use pull requests.
- Branch protection is recommended on GitHub for `main` and `develop`: require a pull request, and block force pushes and deletion.

## 4. Flow of Work

### 4.1 Feature work

1. Branch from `develop`: `feature/<name>`.
2. Build and test on the feature branch.
3. Open a pull request into `develop`.
4. Delete the feature branch after merging.

### 4.2 Beta release

1. Cut `release` from `develop` when the beta scope is complete (see [Beta launch](../product/beta-launch.md), section 6).
2. Only fixes go into `release`. New features wait for the next cycle.
3. Tag each beta build on `release`: `v<major>.<minor>.<patch>-beta.<n>`, for example `v0.9.0-beta.1`.
4. When the beta passes its exit criteria, merge `release` into `main` and tag the release, for example `v1.0.0`.
5. Merge `release` back into `develop` so the fixes are not lost.

### 4.3 Hotfix (production bug)

1. Branch from `main`: `hotfix/<name>`.
2. Fix, test, and open a pull request into `main`.
3. After merging, merge the same change into `develop` (and `release`, if it exists).

### 4.4 Naming

- Permanent: `main`, `develop`, `release`.
- Feature: `feature/<kebab-case-name>`, for example `feature/voice-mode`, `feature/auth-google`.
- Hotfix: `hotfix/<kebab-case-name>`, for example `hotfix/image-upload-crash`.
- Current local `hotfix` branch should be renamed to a specific hotfix branch, or deleted if it is not needed.

## 5. Multi-Device Development

One developer working on several devices (for example, a Windows laptop and a desktop PC) needs a branch per device. This keeps each machine's in-progress work separate and makes it easy to see where the latest work is.

### 5.1 Device branches

Device branches are named `dev/<device>/<feature>`, for example `dev/laptop/voice-mode` or `dev/desktop/auth-google`.

- Branch from the matching feature branch, `feature/<feature>`.
- Use short device names: `laptop`, `desktop`, `work`.
- Do not name a device branch `feature/<feature>/<device>`. Git stores branches as files, so `feature/voice-mode` and `feature/voice-mode/laptop` cannot both exist.

### 5.2 Syncing between devices

1. At the start of each session on a device, run `git fetch` and then rebase the device branch onto its feature branch.
2. Push the device branch to `origin` at the end of each session, so the work is available on other devices.
3. When a device branch is ready, merge it into `feature/<feature>` (fast-forward or squash), then delete it.
4. Never force-push shared branches. Force-pushing a device branch is allowed only when it is yours alone.

### 5.3 Local and remote branches

| Type | Where | Examples |
|---|---|---|
| Permanent | Local and remote | `main`, `develop`, `release` |
| Active feature | Remote (push once started) | `feature/voice-mode` |
| Device work | Remote (push at end of session) | `dev/laptop/voice-mode` |
| Scratch or experiments | Local only | `scratch/<topic>`, deleted when done |

Push the permanent branches to `origin` now, so every device sees the same base. Keep at most three or four active feature branches at a time.

## 6. Commit Messages

Use Conventional Commits:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `refactor:` code change without behavior change
- `test:` tests only
- `chore:` tooling, dependencies, or configuration

Example: `feat(voice): add continuous listening with silence timeout`.

## 7. Versioning

- Tags follow Semantic Versioning: `vMAJOR.MINOR.PATCH`, with `-beta.N` for beta builds.
- Tags are created on `main` for production and on `release` for betas.

## 8. Housekeeping

- Delete merged feature, device, and hotfix branches, locally and on `origin`.
- Review branches each week. Anything with no commits for two weeks is either finished or deleted.
- Keep `develop` and `release` up to date with `main` after every production release.

## 9. Setup Commands

Run these once to publish the permanent branches:

```powershell
git push -u origin develop
git push -u origin release
```

Create a device branch for new work:

```powershell
git switch feature/voice-mode
git switch -c dev/laptop/voice-mode
git push -u origin dev/laptop/voice-mode
```

## 10. Open Decisions

- Whether the team adopts squash merging or regular merge commits for pull requests.
- Whether `release` is deployed to a separate beta URL, or to the Android internal testing track only.
- Who reviews pull requests once there is more than one developer.
