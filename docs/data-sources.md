# Data Sources

pinets-cli supports two data sources: **live market data from Binance** and **local JSON files**.

---

## Binance (Live Data)

Use `--symbol` and `--timeframe` to fetch live candle data from the Binance exchange.

```bash
pinets run rsi.pine --symbol BTCUSDT --timeframe 60
```

### Supported symbols

Any symbol available on Binance:

- **Spot**: `BTCUSDT`, `ETHUSDT`, `SOLUSDT`, `BNBUSDT`, etc.
- **Perpetual futures**: `BTCUSDT.P`, `ETHUSDT.P` (append `.P` to the symbol)

The symbol is automatically uppercased, so `btcusdt` and `BTCUSDT` are equivalent.

### How it works

1. The CLI connects to the Binance public API (no API key required)
2. It fetches the requested number of candles (`--candles` + `--warmup`)
3. If the default Binance endpoint is unavailable, it automatically falls back to the Binance US endpoint

### Timeframes

| Value | Period | Value | Period |
|-------|--------|-------|--------|
| `1` | 1 minute | `120` | 2 hours |
| `3` | 3 minutes | `240` | 4 hours |
| `5` | 5 minutes | `1D` / `D` | 1 day |
| `15` | 15 minutes | `1W` / `W` | 1 week |
| `30` | 30 minutes | `1M` / `M` | 1 month |
| `60` | 1 hour | | |

### Limits

Binance allows up to 1000 candles per API request. For larger counts, pinets-cli automatically paginates by making multiple requests.

---

## JSON Files (Custom Data)

Use `--data` to load candle data from a local JSON file. This is useful for:

- Offline analysis
- Custom data sources (other exchanges, CSV converted to JSON, etc.)
- Backtesting with historical datasets
- Reproducible results (same data every run)

```bash
pinets run my_indicator.pine --data ./candles.json
```

### Format

The JSON file must contain an **array of candle objects** in chronological order (oldest first):

```json
[
  {
    "openTime": 1704067200000,
    "open": 42000.50,
    "high": 42500.00,
    "low": 41800.00,
    "close": 42300.00,
    "volume": 1234.56,
    "closeTime": 1704070799999
  },
  {
    "openTime": 1704070800000,
    "open": 42300.00,
    "high": 42600.00,
    "low": 42100.00,
    "close": 42450.00,
    "volume": 987.65,
    "closeTime": 1704074399999
  }
]
```

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `open` | number | Opening price |
| `high` | number | Highest price |
| `low` | number | Lowest price |
| `close` | number | Closing price |
| `volume` | number | Trading volume |

### Recommended fields

| Field | Type | Description |
|-------|------|-------------|
| `openTime` | number | Candle open timestamp in milliseconds |
| `closeTime` | number | Candle close timestamp in milliseconds |

If `openTime` is not provided, the `time` values in the output will be `undefined`.

### Validation

pinets-cli validates the JSON data on load:

- The file must parse as valid JSON
- The root element must be a non-empty array
- The first candle must contain all required fields (`open`, `high`, `low`, `close`, `volume`)

If validation fails, a clear error message is shown:

```
Error: JSON candle data is missing required fields: volume
```

### Candle control with JSON data

When using JSON data:
- `--candles` controls how many entries appear in the **output** (taken from the end)
- `--warmup` is effectively automatic - all candles before the output window serve as warmup
- If the file has fewer candles than `--candles`, all candles are included

```bash
# File has 1000 candles, output the last 100
pinets run rsi.pine --data big_dataset.json --candles 100
```

---

## Data Source Priority

- If `--data` is provided, it is always used (even if `--symbol` is also specified)
- `--timeframe` is only relevant with `--symbol` and is ignored with `--data`
