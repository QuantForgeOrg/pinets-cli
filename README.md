<h1 align="center">pinets-cli</h1>

<p align="center">
  Run Pine Script® indicators from the command line
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/pinets-cli"><img src="https://img.shields.io/npm/v/pinets-cli.svg?style=flat-square" alt="npm version"></a>
  <a href="https://opensource.org/licenses/AGPL-3.0"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=flat-square" alt="License"></a>
  <a href="https://github.com/LuxAlgo/PineTS"><img src="https://img.shields.io/badge/powered%20by-PineTS-blue?style=flat-square" alt="Powered by PineTS"></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#usage">Usage</a> &bull;
  <a href="#options">Options</a> &bull;
  <a href="#examples">Examples</a> &bull;
  <a href="#use-with-ai-agents">AI Agents</a> &bull;
  <a href="docs/README.md">Full Docs</a>
</p>

---

## What is pinets-cli?

**pinets-cli** is a command-line interface for [PineTS](https://github.com/LuxAlgo/PineTS), the open-source Pine Script® transpiler and runtime. It lets you execute TradingView® Pine Script® indicators directly from your terminal, with live market data or custom JSON datasets.

```bash
pinets run rsi.pine --symbol BTCUSDT --timeframe 60
```

No code to write. No project to set up. Just point it at a `.pine` file and go.

> _**Disclaimer**: pinets-cli and PineTS are independently developed open-source projects. LuxAlgo Global, LLC and the PineTS project are NOT affiliated with, sponsored by, endorsed by, or in any way officially associated with TradingView, Inc. "Pine Script®" and "TradingView®" are registered trademarks of TradingView, Inc._

---

## Quick Start

### Install

```bash
npm install -g pinets-cli
```

Or run directly without installing:

```bash
npx pinets-cli run sma_cross.pine --symbol BTCUSDT --timeframe 60
```

### Run your first indicator

Create a file called `sma_cross.pine`:

```pinescript
//@version=5
indicator("SMA Cross", overlay=true)
fast = ta.sma(close, 9)
slow = ta.sma(close, 21)
plot(fast, "Fast SMA", color=color.blue)
plot(slow, "Slow SMA", color=color.red)
```

Run it:

```bash
pinets run sma_cross.pine --symbol BTCUSDT --timeframe 60
```

That's it. You'll get JSON output with the calculated SMA values for the last 500 hourly candles.

---

## Usage

```
pinets run [options] [file]
```

The `run` command executes a Pine Script® indicator and outputs the results as JSON.

### Indicator source

Provide the indicator as a **file argument** or via **piped stdin**:

```bash
# From a file
pinets run my_indicator.pine --symbol BTCUSDT

# Piped from stdin (works on Linux, macOS, and Windows)
cat my_indicator.pine | pinets run --symbol BTCUSDT
```

### Data source

Choose between **live market data** or a **local JSON file**:

```bash
# Live data from Binance
pinets run rsi.pine --symbol BTCUSDT --timeframe 60

# Custom data from a JSON file
pinets run rsi.pine --data ./my_candles.json
```

---

## Options

### Data Source

| Option              | Short | Description                                              | Default |
| ------------------- | ----- | -------------------------------------------------------- | ------- |
| `--symbol <ticker>` | `-s`  | Symbol to query (e.g., `BTCUSDT`, `ETHUSDT.P`)           | &mdash; |
| `--timeframe <tf>`  | `-t`  | Timeframe: `1`, `5`, `15`, `60`, `240`, `1D`, `1W`, `1M` | `60`    |
| `--data <path>`     | `-d`  | Path to a JSON data file (alternative to `--symbol`)     | &mdash; |

### Output

| Option            | Short   | Description                                         | Default   |
| ----------------- | ------- | --------------------------------------------------- | --------- |
| `--output <path>` | `-o`    | Write output to a file instead of stdout            | stdout    |
| `--format <type>` | `-f`    | Output format: `default` or `full`                  | `default` |
| `--pretty`        | &mdash; | Force pretty-printed JSON                           | auto      |
| `--clean`         | &mdash; | Filter out null, false, and empty values from plots | &mdash;   |
| `--plots <names>` | &mdash; | Comma-separated list of plot names to include       | all plots |

### Candle Control

| Option              | Short | Description                                                 | Default |
| ------------------- | ----- | ----------------------------------------------------------- | ------- |
| `--candles <count>` | `-n`  | Number of candles in the output                             | `500`   |
| `--warmup <count>`  | `-w`  | Extra candles for indicator warmup (not included in output) | `0`     |

### Other

| Option      | Short   | Description                              |
| ----------- | ------- | ---------------------------------------- |
| `--debug`   | &mdash; | Show the transpiled code (for debugging) |
| `--quiet`   | `-q`    | Suppress all informational messages      |
| `--version` | `-v`    | Show version number                      |
| `--help`    | `-h`    | Show help                                |

---

## Examples

### Basic indicator with live data

```bash
pinets run rsi.pine --symbol BTCUSDT --timeframe 1D --candles 100
```

### Indicator warmup

Many indicators need historical data to initialize (e.g., a 200-period SMA needs at least 200 bars before producing meaningful output). Use `--warmup` to fetch extra candles that are processed but excluded from the output:

```bash
# Fetch 700 candles (200 warmup + 500 output), return only the last 500
pinets run ema200.pine --symbol ETHUSDT --timeframe 60 --candles 500 --warmup 200
```

### Save output to a file

```bash
pinets run macd.pine --symbol BTCUSDT --timeframe 15 -o results.json
```

### Pipe into other tools

```bash
# Pretty-print with jq
pinets run rsi.pine -s BTCUSDT -t 60 -q | jq '.plots'

# Extract last RSI value
pinets run rsi.pine -s BTCUSDT -t 60 -q | jq '.plots.RSI.data[-1].value'
```

### Use custom JSON data

```bash
pinets run my_indicator.pine --data ./historical_btc.json --candles 50 --pretty
```

### Pipe indicator from stdin

```bash
cat my_indicator.pine | pinets run --symbol BTCUSDT --timeframe 60

# Or on Windows PowerShell
Get-Content my_indicator.pine | pinets run --symbol BTCUSDT --timeframe 60
```

### Full execution context

```bash
pinets run rsi.pine --symbol BTCUSDT --format full --pretty
```

### Debug transpilation

```bash
pinets run my_indicator.pine --symbol BTCUSDT --debug
```

### Filter signals with --clean

For indicators that generate signals (like crossovers), most candles will have `false` values. Use `--clean` to filter them out:

```bash
# Without --clean: 500 entries, mostly false
pinets run ma_cross.pine -s BTCUSDT -t 1D -n 500

# With --clean: Only actual signals
pinets run ma_cross.pine -s BTCUSDT -t 1D -n 500 --clean
```

### Select specific plots

When you only need specific plots from an indicator:

```bash
# Get only the Fast SMA (ignore Slow SMA)
pinets run sma_cross.pine -s BTCUSDT --plots "Fast SMA"

# Get only Buy and Sell signals
pinets run signals.pine -s BTCUSDT --plots "Buy,Sell" --clean -q | jq '.plots'
```

---

## Use with AI agents

pinets-cli is designed to be driven programmatically. Indicators go in on stdin, structured JSON comes out on stdout, and there is no interactive prompt or project scaffolding to negotiate — which makes it usable as a tool call from an agent, a script, or a CI job without a wrapper.

A `SKILL.md` is included in the repository root for agent frameworks that consume skill definitions.

Three flags matter when an agent is the caller:

| Flag              | Why it matters for automated callers                                     |
| ----------------- | ------------------------------------------------------------------------ |
| `--quiet` / `-q`  | Suppresses informational output so stdout is valid JSON and nothing else  |
| `--clean`         | Drops null, false, and empty plot values, cutting response size sharply   |
| `--plots <names>` | Returns only the plots you asked for instead of everything the script emits |

```bash
# Generate an indicator, execute it, and return only the signal values
cat generated_strategy.pine | pinets run -s BTCUSDT -t 60 --plots "Buy,Sell" --clean -q
```

Because the runtime is self-contained and reads from stdin, the whole loop &mdash; write a script, execute it against real data, read the result &mdash; can run locally without a charting platform in the path.

---

## Output Formats

### `default` format

Contains the indicator metadata and all plot data:

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
        { "time": 1704067200000, "value": 65.42 },
        { "time": 1704070800000, "value": 62.18 }
      ]
    }
  }
}
```

### `full` format

Everything in `default`, plus the raw execution result and market data:

```json
{
  "indicator": { ... },
  "plots": { ... },
  "result": { ... },
  "marketData": [
    { "openTime": 1704067200000, "open": 42000, "high": 42500, "low": 41800, "close": 42300, "volume": 1234.5 },
    ...
  ]
}
```

---

## JSON Data Format

When using `--data`, provide a JSON file with an array of candle objects:

```json
[
  {
    "openTime": 1704067200000,
    "open": 42000.5,
    "high": 42500.0,
    "low": 41800.0,
    "close": 42300.0,
    "volume": 1234.56,
    "closeTime": 1704070799999
  }
]
```

**Required fields**: `open`, `high`, `low`, `close`, `volume`

**Recommended fields**: `openTime`, `closeTime` (millisecond timestamps)

---

## How It Works

pinets-cli is a self-contained binary that bundles the [PineTS](https://github.com/LuxAlgo/PineTS) library. When you run an indicator:

1. The Pine Script® file is read and passed to the PineTS transpiler
2. Market data is fetched from Binance (or loaded from your JSON file)
3. The indicator is executed bar-by-bar with full time-series semantics
4. Plot data is collected and output as structured JSON

There are no runtime dependencies. The single bundled file includes everything needed.

---

## Supported Timeframes

| Value       | Description |
| ----------- | ----------- |
| `1`         | 1 minute    |
| `3`         | 3 minutes   |
| `5`         | 5 minutes   |
| `15`        | 15 minutes  |
| `30`        | 30 minutes  |
| `60`        | 1 hour      |
| `120`       | 2 hours     |
| `240`       | 4 hours     |
| `1D` or `D` | 1 day       |
| `1W` or `W` | 1 week      |
| `1M` or `M` | 1 month     |

---

## Related Projects

- **[PineTS](https://github.com/LuxAlgo/PineTS)** : The underlying transpiler and runtime engine

---

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

---

## License

AGPL-3.0-or-later - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with <a href="https://github.com/LuxAlgo/PineTS">PineTS</a> by <a href="https://luxalgo.com">LuxAlgo</a></sub>
</p>
