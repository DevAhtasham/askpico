# Pico Documentation

This folder holds the product, module, and engineering plans for Pico. Each document states its status at the top. Start with the [Beta launch plan](plans/product/beta-launch.md) for the current release scope.

## Product

| Document | Purpose |
|---|---|
| [Beta launch](plans/product/beta-launch.md) | Scope, pages, launch scenarios, and exit criteria for the web and Android beta |
| [Feature catalog](plans/product/feature-catalog.md) | Every planned feature by platform, with cost, effort, and agent structure |
| [Roadmap](plans/product/roadmap.md) | Complex, costly, or legally sensitive features planned for after the beta |

## Modules

| Document | Purpose |
|---|---|
| [Pico character](plans/modules/pico-character.md) | Character state, visual layers, and the multi-agent router |
| [Agent persona](plans/modules/agent-persona.md) | Persona model, emotional states, reactions, and the chibi character's style and animation |
| [Voice mode](plans/modules/voice-mode.md) | Step-by-step voice input, speech output, quota, and voice-to-voice plan |
| [Pico vault](plans/modules/pico-vault.md) | Encrypted on-device vault that tokenizes personal data before it reaches the AI |

## Engineering

| Document | Purpose |
|---|---|
| [Agent development](plans/engineering/agent-development.md) | Agent framework, persona assignments, tool build order, and API routing |
| [Authentication](plans/engineering/authentication.md) | Accounts, sessions, home page, referrals, and phased rollout |
| [Database](plans/engineering/database.md) | Current storage inventory and the Supabase migration plan |
| [Testing guide](plans/engineering/testing-guide.md) | Manual test steps and prompts for each agent and tool |
| [Branching strategy](plans/engineering/branching-strategy.md) | Permanent branches, feature and device branches, release and hotfix flow |

## Conventions

- **Status line:** every document states its status (Planning, Active, Living document, or Icebox items inside the roadmap).
- **Cross-references:** documents link to each other by relative path. Section numbers are stable, so references stay valid when content is added.
- **Moving a feature:** when a feature moves between documents, record the move in the Removed and Archived table of the [Roadmap](plans/product/roadmap.md).
- **New data storage:** any feature that saves data must be added to the [Database](plans/engineering/database.md) document.
- **Language:** documents are written in English. Product names and persona names keep their original spelling.
