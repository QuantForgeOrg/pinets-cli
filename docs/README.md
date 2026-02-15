# pinets-cli Documentation

Complete documentation for the pinets-cli command-line tool.

## Table of Contents

- [Getting Started](getting-started.md) - Installation, first run, basic concepts
- [Command Reference](command-reference.md) - Full reference for all commands and options
- [Data Sources](data-sources.md) - Using live providers and JSON data files
- [Output Formats](output-formats.md) - Understanding and working with CLI output
- [Recipes](recipes.md) - Common workflows, piping, scripting, and integration patterns

---

## Overview

**pinets-cli** is the command-line interface for [PineTS](https://github.com/QuantForgeOrg/PineTS). It lets you run Pine Script indicators from the terminal without writing any JavaScript code.

### What can you do with it?

- Run any Pine Script v5+ indicator against live Binance market data
- Process indicators against your own historical data (JSON files)
- Pipe output into tools like `jq`, Python scripts, or databases
- Automate indicator calculations in CI/CD or cron jobs
- Debug Pine Script transpilation

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   .pine file    │     │   pinets-cli    │     │   JSON output   │
│   or stdin      │────>│   (PineTS)      │────>│   stdout / file │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                        ┌─────┴─────┐
                        │ Data src  │
                        ├───────────┤
                        │ Binance   │
                        │ JSON file │
                        └───────────┘
```

The CLI is distributed as a single self-contained binary with the PineTS runtime bundled in. No additional `npm install` is required after the initial global install.
