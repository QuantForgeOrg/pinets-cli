---
name: pinets
description: Run Pine Script indicators from the command line using pinets-cli. Use when asked to execute, test, or analyze Pine Script indicators, calculate technical analysis values (RSI, SMA, EMA, MACD, etc.), or fetch market data for crypto trading pairs. This tool can run PineScript indicators from .pine files or stdin and output the resulting plots and variables data.
version: 1.0.0
metadata:
  openclaw:
    requires:
      bins:
        - pinets
    primaryEnv: ""
    emoji: "\U0001F4C8"
    homepage: https://github.com/QuantForgeOrg/pinets-cli
---

# pinets-cli — Run Pine Script Indicators from the Terminal

`pinets` is a CLI tool that executes TradingView Pine Script indicators via the [PineTS](https://github.com/QuantForgeOrg/PineTS) runtime. It outputs structured JSON with calculated indicator values.

## Installation

```bash
# Global install
npm install -g pinets-cli

# Or run directly with npx (no install needed)
npx pinets-cli run indicator.pine --symbol BTCUSDT -q
```

Verify (if installed globally):

```bash
pinets --version
```

When using `npx`, replace `pinets` with `npx pinets-cli` in all examples below.

## Core command

```
pinets run [file] [options]
```

The indicator can be a **file argument** or **piped from stdin**.

## Options

### Data source (one required)

| Flag                    | Description                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `-s, --symbol <ticker>` | Symbol from Binance (e.g., `BTCUSDT`, `ETHUSDT`, `SOLUSDT.P` for futures)                    |
| `-t, --timeframe <tf>`  | Candle timeframe: `1`, `5`, `15`, `30`, `60`, `120`, `240`, `1D`, `1W`, `1M` (default: `60`) |
| `-d, --data <path>`     | JSON file with candle data (alternative to `--symbol`)                                       |

### Output

| Flag                  | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| `-o, --output <path>` | Write to file instead of stdout                                |
| `-f, --format <type>` | `default` (plots only) or `full` (plots + result + marketData) |
| `--pretty`            | Pretty-print JSON                                              |
| `--clean`             | Filter out null, false, and empty values from plot data        |
| `--plots <names>`     | Comma-separated list of plot names to include (default: all)   |
| `-q, --quiet`         | Suppress info messages (essential when parsing stdout)         |

### Candle control

| Flag                | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `-n, --candles <N>` | Number of output candles (default: `500`)                |
| `-w, --warmup <N>`  | Extra warmup candles excluded from output (default: `0`) |

### Debug

| Flag      | Description                                 |
| --------- | ------------------------------------------- |
| `--debug` | Show transpiled JavaScript code (to stderr) |

## Usage patterns

### Run a .pine file with live Binance data

```bash
pinets run indicator.pine --symbol BTCUSDT --timeframe 60 --candles 100 -q
```

### Run with warmup (important for long-period indicators)

```bash
# EMA 200 needs at least 200 bars to initialize
pinets run ema200.pine -s BTCUSDT -t 1D -n 100 -w 200 -q
```

### Pipe Pine Script from stdin

```bash
echo '//@version=5
indicator("RSI")
plot(ta.rsi(close, 14), "RSI")' | pinets run -s BTCUSDT -t 60 -n 20 -q
```

### Run with custom JSON data

```bash
pinets run indicator.pine --data candles.json --candles 50 -q
```

### Save output to file

```bash
pinets run rsi.pine -s BTCUSDT -t 60 -o results.json -q
```

### Get full execution context

```bash
pinets run indicator.pine -s BTCUSDT -f full -q --pretty
```

### Filter signals with --clean (for signal-based indicators)

```bash
# Without --clean: 500 entries, mostly false
pinets run ma_cross.pine -s BTCUSDT -t 1D -n 500 -q

# With --clean: Only actual signals
pinets run ma_cross.pine -s BTCUSDT -t 1D -n 500 --clean -q
```

### Select specific plots with --plots

```bash
# Get only RSI, ignore bands
pinets run rsi_bands.pine -s BTCUSDT --plots "RSI" -q

# Get only Buy and Sell signals
pinets run signals.pine -s BTCUSDT --plots "Buy,Sell" -q

# Combine both: only signals, only true values
pinets run signals.pine -s BTCUSDT --plots "Buy,Sell" --clean -q
```

## Output structure

### `default` format

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
        { "time": 1704070800000, "value": 61.45 }
      ]
    }
  }
}
```

### `full` format

Adds `result` (raw return values per bar) and `marketData` (OHLCV candles) to the default output.

## JSON data format (for --data)

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

Required fields: `open`, `high`, `low`, `close`, `volume`. Recommended: `openTime`, `closeTime`.

## Pine Script quick reference

pinets-cli accepts standard TradingView Pine Script v5+:

```pinescript
//@version=5
indicator("My Indicator", overlay=false)

// Technical analysis functions
rsi = ta.rsi(close, 14)
[macdLine, signalLine, hist] = ta.macd(close, 12, 26, 9)
sma = ta.sma(close, 20)
ema = ta.ema(close, 9)
bb_upper = ta.sma(close, 20) + 2 * ta.stdev(close, 20)

// Output — each plot() creates a named entry in the JSON output
plot(rsi, "RSI", color=color.purple)
```

## Important notes

- **Always use `-q`** when parsing JSON output programmatically.
- **Warmup matters**: Indicators with long lookback periods (SMA 200, EMA 200) produce `NaN` for the first N bars. Use `--warmup` to pre-feed the indicator.
- **`time` values** are Unix timestamps in milliseconds.
- **Errors** go to stderr with exit code 1.
- The tool bundles PineTS internally — no additional npm packages are needed at runtime.

## Warmup recommendations

| Indicator           | Minimum warmup |
| ------------------- | -------------- |
| SMA(N) / EMA(N)     | N              |
| RSI(14)             | 30             |
| MACD(12,26,9)       | 50             |
| Bollinger Bands(20) | 30             |
| SMA(200)            | 200+           |

Rule of thumb: set warmup to 1.5x-2x the longest lookback period.
