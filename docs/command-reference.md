# Command Reference

## `pinets`

```
Usage: pinets [options] [command]

CLI for running Pine Script indicators via PineTS

Options:
  -v, --version         Show version number
  -h, --help            Display help

Commands:
  run [options] [file]  Execute a Pine Script indicator
  help [command]        Display help for a specific command
```

---

## `pinets run`

Execute a Pine Script indicator against market data.

```
Usage: pinets run [options] [file]

Arguments:
  file                   Path to indicator file (.pine or any text file)
```

### Data Source Options

You must provide **one** of `--symbol` or `--data`.

#### `--symbol <ticker>`, `-s`

Symbol to query from the Binance exchange.

```bash
pinets run rsi.pine --symbol BTCUSDT
pinets run rsi.pine -s ETHUSDT.P     # Perpetual futures
```

**Supported formats:**
- Spot: `BTCUSDT`, `ETHUSDT`, `SOLUSDT`
- Perpetual futures: `BTCUSDT.P`, `ETHUSDT.P` (append `.P`)

#### `--timeframe <tf>`, `-t`

Timeframe for candle data. Only used with `--symbol`.

**Default:** `60` (1 hour)

| Value | Description |
|-------|-------------|
| `1` | 1 minute |
| `3` | 3 minutes |
| `5` | 5 minutes |
| `15` | 15 minutes |
| `30` | 30 minutes |
| `60` | 1 hour |
| `120` | 2 hours |
| `240` | 4 hours |
| `1D` or `D` | 1 day |
| `1W` or `W` | 1 week |
| `1M` or `M` | 1 month |

```bash
pinets run rsi.pine -s BTCUSDT -t 1D    # Daily candles
pinets run rsi.pine -s BTCUSDT -t 15    # 15-minute candles
```

#### `--data <path>`, `-d`

Path to a JSON file containing candle data. Use this instead of `--symbol` for custom or offline data.

```bash
pinets run rsi.pine --data ./my_candles.json
```

See [Data Sources](data-sources.md) for the expected JSON format.

---

### Output Options

#### `--output <path>`, `-o`

Write output to a file instead of stdout.

```bash
pinets run rsi.pine -s BTCUSDT -o results.json
```

When writing to a file, parent directories are created automatically if they don't exist.

#### `--format <type>`, `-f`

Choose the output format.

**Default:** `default`

| Format | Contents |
|--------|----------|
| `default` | Indicator metadata + plot data |
| `full` | Everything in `default` + raw result + market data |

```bash
pinets run rsi.pine -s BTCUSDT -f full
```

See [Output Formats](output-formats.md) for detailed examples.

#### `--pretty`

Force pretty-printed (indented) JSON output.

**Default behavior** (when `--pretty` is not specified):
- stdout to a terminal: pretty-printed
- stdout piped to another command: compact (single line)
- `--output` to a file: compact

```bash
pinets run rsi.pine -s BTCUSDT --pretty       # Always pretty
pinets run rsi.pine -s BTCUSDT | jq '.'       # Auto-compact (piped)
```

#### `--clean`

Filter out null, false, and empty values from plot data arrays. Useful for signal-based indicators where most candles don't have values.

```bash
# Without --clean: Buy/Sell plots have 500 entries (mostly false)
pinets run signals.pine -s BTCUSDT

# With --clean: Only actual signals are included
pinets run signals.pine -s BTCUSDT --clean
```

**When to use:**
- Indicators with `plotshape`, `plotchar`, or `plotarrow` that only trigger occasionally
- Reducing output size when most values are false/null
- Extracting only meaningful signals

#### `--plots <names>`

Select specific plots to include in the output. Takes a comma-separated list of plot names (must match the titles from your Pine Script).

```bash
# Get only the Fast and Slow moving averages
pinets run ma_cross.pine -s BTCUSDT --plots "Fast MA,Slow MA"

# Get only the Buy signals
pinets run signals.pine -s BTCUSDT --plots "Buy"

# Combine with --clean to get only true signals
pinets run signals.pine -s BTCUSDT --plots "Buy,Sell" --clean
```

**When to use:**
- Your indicator has many plots but you only need specific ones
- Building pipelines that process individual plots separately
- Reducing output size and processing time

---

### Candle Control Options

#### `--candles <count>`, `-n`

Number of candles to include in the output.

**Default:** `500`

```bash
pinets run rsi.pine -s BTCUSDT -n 100    # Output 100 candles
```

#### `--warmup <count>`, `-w`

Extra candles fetched before the output window to give indicators time to initialize. These candles are processed but **not** included in the output.

**Default:** `0`

```bash
# Fetch 700 candles, output the last 500
pinets run ema200.pine -s BTCUSDT -n 500 -w 200
```

**When to use warmup:**
- Indicators with long lookback periods (e.g., SMA 200, EMA 200)
- When you need accurate values from the very first output candle
- When the indicator uses `ta.rsi()`, `ta.macd()`, or similar functions that need history

---

### Debug Options

#### `--debug`

Show the transpiled JavaScript code that PineTS generates from the Pine Script input. Useful for debugging indicator issues.

```bash
pinets run my_indicator.pine -s BTCUSDT --debug
```

The transpiled code is printed to **stderr** so it doesn't interfere with the JSON output.

#### `--quiet`, `-q`

Suppress all informational messages (progress, data source info, etc.). Only the JSON output and errors are shown.

```bash
pinets run rsi.pine -s BTCUSDT -q
```

Essential when piping output to other tools:

```bash
pinets run rsi.pine -s BTCUSDT -q | jq '.plots.RSI.data[-1].value'
```

---

### General Options

#### `--version`, `-v`

Show the pinets-cli version.

```bash
pinets --version
```

#### `--help`, `-h`

Show help. Can be used at any level:

```bash
pinets --help          # General help
pinets run --help      # Help for the run command
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (file not found, invalid options, execution failure, etc.) |
