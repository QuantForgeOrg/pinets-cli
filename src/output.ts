import fs from 'fs';
import path from 'path';

// ── Public API ────────────────────────────────────────────────

/**
 * Format the PineTS execution context into the requested output shape.
 *
 * @param context  - The Context returned by pineTS.run()
 * @param format   - "default" (plots only) or "full" (plots + result + marketData)
 * @param candles  - How many output bars to include (taken from the end)
 * @param clean    - Filter out null, false, and empty values from plot data
 * @param plotFilter - Comma-separated list of plot names to include (undefined = all)
 */
export function formatOutput(
    context: any,
    format: string,
    candles: number,
    clean?: boolean,
    plotFilter?: string,
): any {
    switch (format) {
        case 'full':
            return formatFull(context, candles, clean, plotFilter);
        case 'default':
        default:
            return formatDefault(context, candles, clean, plotFilter);
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
function formatDefault(context: any, candles: number, clean?: boolean, plotFilter?: string): any {
    const plots: Record<string, any> = {};
    
    // Parse plot filter into set of names
    const includePlots = plotFilter 
        ? new Set(plotFilter.split(',').map(s => s.trim()).filter(s => s.length > 0))
        : null;

    for (const [title, plotData] of Object.entries(context.plots) as [string, any][]) {
        // Skip if plot filter is active and this plot isn't in the list
        if (includePlots && !includePlots.has(title)) {
            continue;
        }

        let data: any[] = plotData.data;
        
        // Apply candle trimming first
        data = data.length > candles ? data.slice(-candles) : data;
        
        // Apply cleaning filter if requested
        if (clean) {
            data = data.filter(entry => {
                const val = entry.value;
                return val !== null && val !== false && val !== undefined && val !== '';
            });
        }
        
        plots[title] = {
            title: plotData.title,
            options: plotData.options,
            data,
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
function formatFull(context: any, candles: number, clean?: boolean, plotFilter?: string): any {
    const defaultOutput = formatDefault(context, candles, clean, plotFilter);

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
