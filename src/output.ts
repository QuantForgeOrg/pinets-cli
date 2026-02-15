import fs from 'fs';
import path from 'path';

// ── Public API ────────────────────────────────────────────────

/**
 * Format the PineTS execution context into the requested output shape.
 *
 * @param context  - The Context returned by pineTS.run()
 * @param format   - "default" (plots only) or "full" (plots + result + marketData)
 * @param candles  - How many output bars to include (taken from the end)
 */
export function formatOutput(context: any, format: string, candles: number): any {
    switch (format) {
        case 'full':
            return formatFull(context, candles);
        case 'default':
        default:
            return formatDefault(context, candles);
    }
}

/**
 * Serialize and write the formatted output to stdout or a file.
 */
export function writeOutput(
    data: any,
    outputPath: string | undefined,
    pretty: boolean,
    quiet: boolean,
): void {
    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

    if (outputPath) {
        const resolved = path.resolve(outputPath);
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
        fs.writeFileSync(resolved, json, 'utf-8');
        if (!quiet) {
            console.error(`Output written to: ${resolved}`);
        }
    } else {
        process.stdout.write(json + '\n');
    }
}

// ── Format helpers ────────────────────────────────────────────

/**
 * Default format: indicator metadata + plots data.
 * Plots are trimmed to the last `candles` entries.
 */
function formatDefault(context: any, candles: number): any {
    const plots: Record<string, any> = {};

    for (const [title, plotData] of Object.entries(context.plots) as [string, any][]) {
        const data: any[] = plotData.data;
        plots[title] = {
            title: plotData.title,
            options: plotData.options,
            data: data.length > candles ? data.slice(-candles) : data,
        };
    }

    return {
        indicator: context.indicator || {},
        plots,
    };
}

/**
 * Full format: everything in default + result + marketData.
 * All arrays are trimmed to the last `candles` entries.
 */
function formatFull(context: any, candles: number): any {
    const defaultOutput = formatDefault(context, candles);

    // ── Trim market data ──────────────────────────────────────
    const md: any[] = context.marketData;
    const trimmedMarketData = md.length > candles ? md.slice(-candles) : md;

    // ── Trim result ───────────────────────────────────────────
    let result = context.result;

    if (result != null) {
        if (Array.isArray(result)) {
            result = result.length > candles ? result.slice(-candles) : result;
        } else if (typeof result === 'object') {
            const trimmed: Record<string, any> = {};
            for (const [key, val] of Object.entries(result)) {
                if (Array.isArray(val)) {
                    trimmed[key] = (val as any[]).length > candles ? (val as any[]).slice(-candles) : val;
                } else {
                    trimmed[key] = val;
                }
            }
            result = trimmed;
        }
    }

    return {
        ...defaultOutput,
        result,
        marketData: trimmedMarketData,
    };
}
