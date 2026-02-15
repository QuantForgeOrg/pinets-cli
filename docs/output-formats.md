# Output Formats

pinets-cli outputs JSON data in one of two formats, controlled by the `--format` option.

---

## `default` Format

The default format includes indicator metadata and all plot data.

```bash
pinets run rsi.pine --symbol BTCUSDT --format default
```

### Structure

```json
{
  "indicator": {
    "title": "RSI",
    "shorttitle": "",
    "overlay": false,
    "format": "inherit",
    "precision": 10,
    "scale": "points",
    "timeframe": "",
    ...
  },
  "plots": {
    "RSI": {
      "title": "RSI",
      "options": {
        "color": "#7E57C2"
      },
      "data": [
        {
          "title": "RSI",
          "time": 1704067200000,
          "value": 58.2341567891
        },
        {
          "title": "RSI",
          "time": 1704070800000,
          "value": 61.4523891245
        }
      ]
    }
  }
}
```

### Fields

#### `indicator`

Metadata from the Pine Script `indicator()` declaration:

| Field | Description |
|-------|-------------|
| `title` | Indicator name |
| `shorttitle` | Short name (if specified) |
| `overlay` | `true` if drawn on the price chart, `false` for separate pane |
| `format` | Number format (`inherit`, `price`, `volume`, `percent`) |
| `precision` | Decimal precision |
| `scale` | Scale type |
| `timeframe` | Indicator timeframe override (if any) |

#### `plots`

A map of plot names to their data. Each entry corresponds to a `plot()`, `plotchar()`, `plotshape()`, or similar call in the Pine Script.

**Plot entry structure:**

| Field | Description |
|-------|-------------|
| `title` | Plot name (from the Pine Script `title` parameter) |
| `options` | Plot styling (color, overlay, etc.) |
| `data` | Array of data points |

**Data point structure:**

| Field | Type | Description |
|-------|------|-------------|
| `time` | number | Candle open timestamp (milliseconds since epoch) |
| `value` | number | Calculated indicator value at this bar |
| `title` | string | Plot name (repeated for convenience) |
| `options` | object | Per-bar styling overrides (if any) |

---

## `full` Format

The full format includes everything in `default`, plus the raw execution result and the market data used.

```bash
pinets run rsi.pine --symbol BTCUSDT --format full
```

### Structure

```json
{
  "indicator": { ... },
  "plots": { ... },
  "result": {
    "rsiValue": [58.23, 61.45, 55.12, ...]
  },
  "marketData": [
    {
      "openTime": 1704067200000,
      "open": 42000.50,
      "high": 42500.00,
      "low": 41800.00,
      "close": 42300.00,
      "volume": 1234.56,
      "closeTime": 1704070799999,
      "quoteAssetVolume": 52345678.90,
      "numberOfTrades": 15234,
      "takerBuyBaseAssetVolume": 678.90,
      "takerBuyQuoteAssetVolume": 28765432.10
    }
  ]
}
```

### Additional fields

#### `result`

The raw return value from the Pine Script execution. The shape depends on what the indicator returns:

- If the indicator has `return { a, b, c }` in PineTS syntax, `result` is an object where each key maps to an array of values (one per bar).
- If the indicator doesn't return anything explicitly, `result` may contain the plot data or be `null`.

#### `marketData`

The full candle data that was used for execution, trimmed to the output window. This is the raw OHLCV data from Binance or your JSON file.

When using Binance, additional fields are included:
- `quoteAssetVolume`
- `numberOfTrades`
- `takerBuyBaseAssetVolume`
- `takerBuyQuoteAssetVolume`

---

## Pretty Printing

### Auto-detection

When `--pretty` is not specified, pinets-cli auto-detects:

| Scenario | Format |
|----------|--------|
| stdout to a terminal | Pretty-printed (indented) |
| stdout piped to another command | Compact (single line) |
| `--output` to a file | Compact |

### Forcing pretty-print

Use `--pretty` to always produce indented output:

```bash
pinets run rsi.pine -s BTCUSDT --pretty > output.json
```

---

## Output Destination

### stdout (default)

Results are written to stdout. Informational messages go to stderr so they don't mix:

```bash
# Only JSON appears in the pipe; progress messages go to stderr (terminal)
pinets run rsi.pine -s BTCUSDT | jq '.plots'
```

### File (`--output`)

```bash
pinets run rsi.pine -s BTCUSDT -o ./results/btc_rsi.json
```

Parent directories are created automatically. File output is always compact unless `--pretty` is specified.

### Suppressing noise

Use `-q` / `--quiet` to suppress all informational messages:

```bash
pinets run rsi.pine -s BTCUSDT -q | python3 analyze.py
```
