# Recipes

Practical examples and common workflows for pinets-cli.

---

## Piping and Scripting

### Extract a specific value with jq

```bash
# Get the last RSI value
pinets run rsi.pine -s BTCUSDT -t 60 -q | jq '.plots.RSI.data[-1].value'

# Get all plot names
pinets run macd.pine -s BTCUSDT -q | jq '.plots | keys'

# Get the last 5 values of a plot
pinets run sma.pine -s BTCUSDT -q | jq '.plots["SMA 20"].data[-5:] | .[].value'
```

### Pipe indicator code from stdin

This is useful when generating indicators dynamically:

```bash
# Linux / macOS
cat my_indicator.pine | pinets run -s BTCUSDT -t 60

# Windows PowerShell
Get-Content my_indicator.pine | pinets run -s BTCUSDT -t 60

# Windows CMD
type my_indicator.pine | pinets run -s BTCUSDT -t 60
```

### Run inline Pine Script

```bash
echo '//@version=5
indicator("Quick RSI")
plot(ta.rsi(close, 14), "RSI")' | pinets run -s BTCUSDT -t 60 -n 10 -q --pretty
```

---

## Working with Multiple Symbols

### Bash loop

```bash
for symbol in BTCUSDT ETHUSDT SOLUSDT BNBUSDT; do
  echo "=== $symbol ==="
  pinets run rsi.pine -s $symbol -t 1D -n 1 -q | jq '.plots.RSI.data[0].value'
done
```

### Save results per symbol

```bash
for symbol in BTCUSDT ETHUSDT SOLUSDT; do
  pinets run macd.pine -s $symbol -t 60 -o "results/${symbol}_macd.json" -q
done
```

---

## Working with Multiple Timeframes

```bash
for tf in 15 60 240 1D; do
  echo "--- Timeframe: $tf ---"
  pinets run rsi.pine -s BTCUSDT -t $tf -n 1 -q | jq '.plots.RSI.data[0].value'
done
```

---

## Integration with Python

### Basic Python consumption

```python
import subprocess
import json

result = subprocess.run(
    ['pinets', 'run', 'rsi.pine', '-s', 'BTCUSDT', '-t', '60', '-n', '100', '-q'],
    capture_output=True, text=True
)

data = json.loads(result.stdout)
rsi_values = [point['value'] for point in data['plots']['RSI']['data']]

print(f"Current RSI: {rsi_values[-1]:.2f}")
print(f"Average RSI: {sum(rsi_values) / len(rsi_values):.2f}")
```

### Feed into pandas

```python
import subprocess
import json
import pandas as pd

result = subprocess.run(
    ['pinets', 'run', 'sma.pine', '-s', 'BTCUSDT', '-t', '1D', '-f', 'full', '-q'],
    capture_output=True, text=True
)

data = json.loads(result.stdout)

# Create DataFrame from market data
df = pd.DataFrame(data['marketData'])
df['time'] = pd.to_datetime(df['openTime'], unit='ms')

# Add indicator values
for plot_name, plot_data in data['plots'].items():
    values = [p['value'] for p in plot_data['data']]
    df[plot_name] = values

print(df[['time', 'close', 'Fast SMA', 'Slow SMA']].tail(10))
```

---

## Custom JSON Data

### Convert CSV to JSON

If your data is in CSV format, convert it to the expected JSON format:

```python
import csv
import json

candles = []
with open('data.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        candles.append({
            'openTime': int(row['timestamp']),
            'open': float(row['open']),
            'high': float(row['high']),
            'low': float(row['low']),
            'close': float(row['close']),
            'volume': float(row['volume']),
        })

with open('data.json', 'w') as f:
    json.dump(candles, f)
```

Then run:

```bash
pinets run my_indicator.pine --data data.json
```

### Use data from another exchange API

Fetch data from any source, format it as JSON, and pass it to pinets-cli:

```bash
# Example: fetch from your own API, pipe to pinets
curl -s https://api.example.com/candles/BTCUSD/1h > candles.json
pinets run rsi.pine --data candles.json --candles 100
```

---

## Warm-up Patterns

### When to use warmup

Indicators with lookback periods need historical data to "warm up". Without warmup, the first N values may be `NaN` or inaccurate.

| Indicator | Recommended warmup |
|-----------|-------------------|
| SMA(20) | 20+ |
| EMA(50) | 50+ (more is better for EMA) |
| RSI(14) | 30+ |
| MACD(12,26,9) | 50+ |
| Bollinger Bands(20) | 30+ |
| SMA(200) | 200+ |

### Rule of thumb

Set warmup to at least the longest lookback period used in your indicator. For safety, use 1.5x to 2x:

```bash
# Indicator uses SMA(200) → warmup at least 200, prefer 300
pinets run sma200.pine -s BTCUSDT -t 1D -n 365 -w 300
```

---

## Debugging

### View transpiled code

See what PineTS generates from your Pine Script:

```bash
pinets run my_indicator.pine -s BTCUSDT --debug 2>debug.txt
```

The `--debug` output goes to stderr. Redirect with `2>` to capture it separately from the JSON output.

### Verbose execution info

Without `-q`, pinets-cli prints progress to stderr:

```
Indicator: my_indicator.pine
Data source: Binance | BTCUSDT | 60 | 500 candles
Executing...
Done.
```

### Validate data without running

Check that your JSON data file is valid:

```bash
pinets run /dev/null --data candles.json 2>&1 | head -1
# If it starts with "Error:", your data has issues
```

---

## Automation

### Cron job (Linux/macOS)

Run an indicator every hour and append the latest value to a log:

```bash
# crontab -e
0 * * * * pinets run /path/to/rsi.pine -s BTCUSDT -t 60 -n 1 -q | jq -r '.plots.RSI.data[0] | "\(.time),\(.value)"' >> /var/log/btc_rsi.csv
```

### Scheduled task (Windows)

Create a batch file `run_indicator.bat`:

```batch
@echo off
pinets run C:\indicators\rsi.pine -s BTCUSDT -t 60 -n 1 -q -o C:\results\latest_rsi.json
```

Then schedule it with Task Scheduler.

---

## Tips and Tricks

### Compact output for piping

When piping to another tool, use `-q` to suppress informational messages:

```bash
pinets run rsi.pine -s BTCUSDT -q | jq '.'
```

### Check if an indicator compiles

Run with `--candles 1` for a quick syntax check:

```bash
pinets run my_indicator.pine -s BTCUSDT -n 1 -w 20 -q > /dev/null && echo "OK" || echo "FAIL"
```

### Compare indicators across symbols

```bash
# Side-by-side RSI for BTC and ETH
paste <(pinets run rsi.pine -s BTCUSDT -t 1D -n 5 -q | jq '[.plots.RSI.data[].value]') \
      <(pinets run rsi.pine -s ETHUSDT -t 1D -n 5 -q | jq '[.plots.RSI.data[].value]')
```
