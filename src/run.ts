import fs from 'fs';
import path from 'path';
import { PineTS, Provider } from 'pinets';
import { readStdin } from './stdin';
import { formatOutput, writeOutput } from './output';

// ── Types ─────────────────────────────────────────────────────

export interface RunOptions {
    symbol?: string;
    timeframe: string;
    data?: string;
    output?: string;
    format: string;
    pretty?: boolean;
    clean?: boolean;
    plots?: string;
    candles: string;
    warmup: string;
    debug?: boolean;
    quiet?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────

function log(quiet: boolean, ...args: any[]) {
    if (!quiet) console.error(...args);
}

function fail(message: string, hint?: string): never {
    console.error(`Error: ${message}`);
    if (hint) console.error(hint);
    process.exit(1);
}

// ── Run command ───────────────────────────────────────────────

export async function runCommand(file: string | undefined, options: RunOptions) {
    const candles = parseInt(options.candles, 10);
    const warmup = parseInt(options.warmup, 10);
    const totalCandles = candles + warmup;
    const quiet = !!options.quiet;

    // Validate numeric options
    if (isNaN(candles) || candles <= 0) {
        fail('--candles must be a positive integer.');
    }
    if (isNaN(warmup) || warmup < 0) {
        fail('--warmup must be a non-negative integer.');
    }

    // ── 1. Read indicator source ──────────────────────────────

    let indicatorCode: string;

    if (file) {
        const filePath = path.resolve(file);
        if (!fs.existsSync(filePath)) {
            fail(`File not found: ${filePath}`);
        }
        indicatorCode = fs.readFileSync(filePath, 'utf-8');
        log(quiet, `Indicator: ${path.basename(filePath)}`);
    } else if (!process.stdin.isTTY) {
        log(quiet, 'Reading indicator from stdin...');
        indicatorCode = await readStdin();

        if (!indicatorCode.trim()) {
            fail('Empty input received from stdin.');
        }
        log(quiet, `Indicator: <stdin> (${indicatorCode.length} chars)`);
    } else {
        fail(
            'No indicator provided. Pass a file argument or pipe via stdin.',
            '\n  Examples:\n' +
            '    pinets run my_indicator.pine --symbol BTCUSDT\n' +
            '    cat my_indicator.pine | pinets run --symbol BTCUSDT',
        );
    }

    // ── 2. Setup data source ──────────────────────────────────

    let dataSource: any;
    let tickerId: string | undefined;
    let timeframe: string | undefined;
    let limit: number | undefined;

    if (options.data) {
        // ── JSON file data source ─────────────────────────────
        const dataPath = path.resolve(options.data);
        if (!fs.existsSync(dataPath)) {
            fail(`Data file not found: ${dataPath}`);
        }

        let jsonData: any[];
        try {
            const raw = fs.readFileSync(dataPath, 'utf-8');
            jsonData = JSON.parse(raw);
        } catch (e: any) {
            fail(`Failed to parse JSON data file: ${e.message}`);
        }

        if (!Array.isArray(jsonData!) || jsonData!.length === 0) {
            fail(
                'JSON data must be a non-empty array of candle objects.',
                'Expected: [{ openTime, open, high, low, close, volume, closeTime }, ...]',
            );
        }

        // Validate first candle has required fields
        const required = ['open', 'high', 'low', 'close', 'volume'];
        const missing = required.filter((f) => jsonData![0][f] === undefined);
        if (missing.length > 0) {
            fail(`JSON candle data is missing required fields: ${missing.join(', ')}`);
        }

        dataSource = jsonData!;
        log(quiet, `Data source: JSON file (${jsonData!.length} candles)`);

    } else if (options.symbol) {
        // ── Live Binance provider ─────────────────────────────
        dataSource = Provider.Binance;
        tickerId = options.symbol.toUpperCase();
        timeframe = options.timeframe;
        limit = totalCandles;
        log(quiet, `Data source: Binance | ${tickerId} | ${timeframe} | ${totalCandles} candles`);

    } else {
        fail(
            'No data source provided.',
            'Use --symbol <ticker> for live data or --data <file.json> for a JSON file.',
        );
    }

    // ── 3. Create PineTS instance and execute ─────────────────

    try {
        const pineTS = new PineTS(dataSource, tickerId, timeframe, limit);

        if (options.debug) {
            pineTS.setDebugSettings({ ln: false, debug: true });
        }

        log(quiet, 'Executing...');
        const context = await pineTS.run(indicatorCode);
        log(quiet, 'Done.');

        // ── 4. Format and write output ────────────────────────
        const output = formatOutput(context, options.format, candles, options.clean, options.plots);

        // Pretty-print: explicit flag > auto-detect
        //   --pretty     → always pretty
        //   --output     → compact (file)
        //   stdout + TTY → pretty
        //   stdout + pipe → compact
        const pretty =
            options.pretty !== undefined
                ? true
                : options.output
                    ? false
                    : !!process.stdout.isTTY;

        writeOutput(output, options.output, pretty, quiet);

    } catch (err: any) {
        console.error(`Execution failed: ${err.message || err}`);
        if (options.debug && err.stack) {
            console.error(err.stack);
        }
        process.exit(1);
    }
}
