import { program } from 'commander';
import { runCommand } from './run';
import { checkForUpdate } from './update';

const VERSION = '0.1.0';
const PACKAGE_NAME = 'pinets-cli';

async function main() {
    // Fire update check early — it runs in the background and never blocks execution
    const updateCheck = checkForUpdate(VERSION, PACKAGE_NAME);

    program
        .name('pinets')
        .description('CLI for running Pine Script indicators via PineTS')
        .version(VERSION, '-v, --version');

    program
        .command('run')
        .description('Execute a Pine Script indicator')
        .argument('[file]', 'Path to indicator file (.pine or any text file)')
        // Data source
        .option('-s, --symbol <ticker>', 'Symbol to query (e.g., BTCUSDT, ETHUSDT.P)')
        .option('-t, --timeframe <tf>', 'Timeframe: 1, 5, 15, 60, 240, 1D, 1W, 1M', '60')
        .option('-d, --data <path>', 'Path to JSON data file (alternative to --symbol)')
        // Output
        .option('-o, --output <path>', 'Write output to file (default: stdout)')
        .option('-f, --format <type>', 'Output format: default | full', 'default')
        .option('--pretty', 'Pretty-print JSON output')
        // Candle control
        .option('-n, --candles <count>', 'Number of output candles', '500')
        .option('-w, --warmup <count>', 'Extra warmup candles for indicator init', '0')
        // Debug
        .option('--debug', 'Show transpiled code')
        .option('-q, --quiet', 'Suppress informational messages')
        .action(runCommand);

    await program.parseAsync();

    // Show update notice after the command finishes, with a short timeout
    // so we never delay the exit for a slow network
    const notice = await Promise.race([
        updateCheck,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
    ]);
    if (notice) {
        console.error(notice);
    }
}

main().catch((err) => {
    console.error(`Fatal: ${err.message || err}`);
    process.exit(1);
});
