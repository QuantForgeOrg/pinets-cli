import { program } from "commander";
import { runCommand } from "./run";
import { checkForUpdate } from "./update";
import packageJson from "../package.json";

const VERSION = packageJson.version;
const PACKAGE_NAME = packageJson.name;
const COPYRIGHT = "Copyright (c) 2026 QuantForge.org";
const VERSION_TEXT = `pinets cli v${VERSION}\n${COPYRIGHT}`;

async function main() {
  // Fire update check early — it runs in the background and never blocks execution
  const updateCheck = checkForUpdate(VERSION, PACKAGE_NAME);

  // Helper to show update notice before exit
  async function showUpdateAndExit(code: number = 0): Promise<never> {
    const notice = await Promise.race([
      updateCheck,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
    ]);
    if (notice) {
      console.error(notice);
    }
    process.exit(code);
  }

  program
    .name("pinets")
    .description("CLI for running Pine Script indicators via PineTS")
    .version(VERSION_TEXT, "-v, --version")
    .addHelpText("after", `\n${VERSION_TEXT}`)
    .showHelpAfterError()
    .exitOverride(); // Prevent automatic exit

  program
    .command("run")
    .description("Execute a Pine Script indicator")
    .argument("[file]", "Path to indicator file (.pine or any text file)")
    // Data source
    .option(
      "-s, --symbol <ticker>",
      "Symbol to query (e.g., BTCUSDT, ETHUSDT.P)",
    )
    .option(
      "-t, --timeframe <tf>",
      "Timeframe: 1, 5, 15, 60, 240, 1D, 1W, 1M",
      "60",
    )
    .option(
      "-d, --data <path>",
      "Path to JSON data file (alternative to --symbol)",
    )
    // Output
    .option("-o, --output <path>", "Write output to file (default: stdout)")
    .option("-f, --format <type>", "Output format: default | full", "default")
    .option("--pretty", "Pretty-print JSON output")
    .option(
      "--clean",
      "Filter out null, false, and empty values from plot data",
    )
    .option(
      "--plots <names>",
      'Comma-separated list of plot names to include, e.g. --plots "Buy,Sell"',
    )
    // Candle control
    .option("-n, --candles <count>", "Number of output candles", "500")
    .option(
      "-w, --warmup <count>",
      "Extra warmup candles for indicator init",
      "0",
    )
    // Debug
    .option("--debug", "Show transpiled code")
    .option("-q, --quiet", "Suppress informational messages")
    .action(runCommand);

  try {
    await program.parseAsync();
  } catch (err: any) {
    // Commander throws errors for -v, -h, and validation errors when exitOverride is set
    if (err.code === "commander.version" || err.code === "commander.helpDisplayed") {
      // -v or -h was called - show update and exit normally
      await showUpdateAndExit(0);
    } else if (err.code === "commander.help") {
      // Help command - show update and exit normally
      await showUpdateAndExit(0);
    } else {
      // Actual error - show update and exit with error code
      console.error(err.message || err);
      await showUpdateAndExit(1);
    }
  }

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
