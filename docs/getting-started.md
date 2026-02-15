# Getting Started

## Prerequisites

- **Node.js 18+** (pinets-cli uses modern features like `fetch` that are built into Node 18+)

## Installation

### Global install (recommended)

```bash
npm install -g pinets-cli
```

This makes the `pinets` command available system-wide.

### Verify installation

```bash
pinets --version
# 0.1.0
```

### npx (no install needed)

You can also run without installing globally. `npx` downloads the package on first use and caches it:

```bash
npx pinets-cli run my_indicator.pine --symbol BTCUSDT --timeframe 60
```

When using `npx`, replace `pinets` with `npx pinets-cli` in all examples in this documentation.

---

## Your First Indicator

### 1. Create a Pine Script file

Create a file called `rsi.pine`:

```pinescript
//@version=5
indicator("RSI", overlay=false)
rsiValue = ta.rsi(close, 14)
plot(rsiValue, "RSI", color=color.purple)
```

### 2. Run it

```bash
pinets run rsi.pine --symbol BTCUSDT --timeframe 60
```

This will:
1. Fetch the last 500 hourly candles for BTCUSDT from Binance
2. Run the RSI indicator across all candles
3. Print the results as JSON to stdout

### 3. Understand the output

The output is a JSON object with two top-level keys:

```json
{
  "indicator": {
    "title": "RSI",
    "overlay": false
  },
  "plots": {
    "RSI": {
      "title": "RSI",
      "options": { "color": "#7E57C2" },
      "data": [
        { "time": 1704067200000, "value": 58.23 },
        { "time": 1704070800000, "value": 61.45 },
        ...
      ]
    }
  }
}
```

- **`indicator`** : Metadata from the `indicator()` call (title, overlay, etc.)
- **`plots`** : A map of plot names to their data. Each plot has a `data` array of `{ time, value }` entries.

---

## Key Concepts

### Indicator Source

The indicator is the Pine Script code you want to execute. It can come from:

- **A file** : `pinets run my_script.pine ...`
- **Piped stdin** : `cat my_script.pine | pinets run ...`

The file extension doesn't matter (`.pine` is conventional but not required).

### Data Source

The data source provides the OHLCV candle data that the indicator runs against. You must specify one of:

- **`--symbol`** : Live data from Binance (e.g., `--symbol BTCUSDT --timeframe 60`)
- **`--data`** : A local JSON file with candle data (e.g., `--data ./candles.json`)

### Candle Control

Two options control how many candles are involved:

| Option | What it does | Default |
|--------|-------------|---------|
| `--candles` (`-n`) | How many candles appear in the output | 500 |
| `--warmup` (`-w`) | Extra candles fetched before the output window | 0 |

**Total candles fetched** = `candles` + `warmup`

The warmup candles are processed by the indicator (so moving averages, RSI, etc. have time to initialize) but are **excluded from the output**.

#### Example

```bash
pinets run ema200.pine --symbol BTCUSDT --timeframe 1D --candles 100 --warmup 200
```

This fetches 300 daily candles, runs the indicator on all 300, but only outputs the last 100 data points.

### Output Destination

By default, results go to **stdout**. Use `--output` to write to a file:

```bash
pinets run rsi.pine --symbol BTCUSDT -o results.json
```

### Quiet Mode

Informational messages (like "Executing...", "Done.") go to **stderr**, so they don't interfere with JSON output. To suppress them entirely:

```bash
pinets run rsi.pine --symbol BTCUSDT -q
```

---

## Next Steps

- [Command Reference](command-reference.md) - Full details on every option
- [Data Sources](data-sources.md) - Learn about JSON data format and live providers
- [Output Formats](output-formats.md) - Understand `default` vs `full` format
- [Recipes](recipes.md) - Common workflows and integration patterns
