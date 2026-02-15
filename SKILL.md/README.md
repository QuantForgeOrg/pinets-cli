# AI Integrations

This folder contains skill definitions that teach AI coding assistants how to use `pinets-cli`. When installed, the AI can run Pine Script indicators, fetch live market data, and parse the output — all from natural language prompts.

## Supported Platforms

### Claude Code

**Spec**: [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)

Install as a **personal skill** (available in all your projects):

```bash
# Copy to your personal skills directory
mkdir -p ~/.claude/skills/pinets
cp SKILL.md/claude-code/SKILL.md ~/.claude/skills/pinets/SKILL.md
```

Or as a **project skill** (available only in this repo):

```bash
mkdir -p .claude/skills/pinets
cp SKILL.md/claude-code/SKILL.md .claude/skills/pinets/SKILL.md
```

Once installed, Claude Code will automatically use `pinets` when you ask things like:

- _"Calculate the RSI for BTCUSDT on the daily timeframe"_
- _"Run this Pine Script indicator against ETHUSDT"_
- _"What's the current MACD for Solana?"_

You can also invoke it explicitly with `/pinets`.

---

### OpenClaw / ClawHub

**Spec**: [github.com/openclaw/clawhub — skill-format.md](https://github.com/openclaw/clawhub/blob/main/docs/skill-format.md)

Install to your personal skills:

```bash
mkdir -p ~/.openclaw/workspace/skills/pinets
cp SKILL.md/openclaw/SKILL.md  ~/.openclaw/workspace/skills/pinets/SKILL.md
```

The OpenClaw skill includes `metadata.openclaw` with:

- `requires.bins: [pinets]` — declares the CLI binary dependency
- `homepage` — links to the pinets-cli repo

---

### OpenAI Codex

**Spec**: [developers.openai.com/codex/skills](https://developers.openai.com/codex/skills/)

Install as a **repo skill**:

```bash
mkdir -p .agents/skills/pinets
cp SKILL.md/openai-codex/SKILL.md .agents/skills/pinets/SKILL.md
```

Or as a **user skill** (available in all your projects):

```bash
mkdir -p ~/.agents/skills/pinets
cp SKILL.md/openai-codex/SKILL.md ~/.agents/skills/pinets/SKILL.md
```

Codex will automatically activate the skill when your task matches the description, or you can invoke it explicitly with `$pinets`.

---

## Prerequisites

All skills require `pinets-cli` to be installed globally, or available via `npx`:

```bash
# Global install
npm install -g pinets-cli

# Or use npx (no install needed — downloads on first use)
npx pinets-cli run indicator.pine --symbol BTCUSDT -q
```

## What the skills teach the AI

Each skill file contains the same core knowledge:

1. **Full command reference** — all flags and options for `pinets run`
2. **Usage patterns** — file input, piped stdin, live Binance data, JSON data
3. **Output filtering** — `--clean` to filter null/false values, `--plots` to select specific plots
4. **Output structure** — how to parse the JSON response (`default` and `full` formats)
5. **JSON data format** — the expected candle object schema for `--data`
6. **Pine Script primer** — basic Pine Script v5 syntax so the AI can write indicators
7. **Warmup recommendations** — how many extra candles each indicator type needs
8. **Best practices** — always use `-q` when parsing, handle `NaN` values, etc.

## Platform differences

| Feature             | Claude Code                              | OpenClaw                                              | OpenAI Codex                             |
| ------------------- | ---------------------------------------- | ----------------------------------------------------- | ---------------------------------------- |
| Frontmatter         | `name`, `description`                    | `name`, `description`, `version`, `metadata.openclaw` | `name`, `description`                    |
| Install location    | `~/.claude/skills/` or `.claude/skills/` | `~/.claude/skills/`                                   | `~/.agents/skills/` or `.agents/skills/` |
| Invoke explicitly   | `/pinets`                                | `/pinets`                                             | `$pinets`                                |
| Implicit invocation | Yes (via description matching)           | Yes                                                   | Yes (via description matching)           |
