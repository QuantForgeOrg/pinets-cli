/**
 * Read all data from piped stdin.
 *
 * Works cross-platform (Windows, Linux, macOS) via Node's process.stdin.
 * Includes a safety timeout so the CLI never hangs if stdin is unexpectedly empty.
 */
export function readStdin(timeoutMs = 10_000): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        let settled = false;

        const settle = (fn: () => void) => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                fn();
            }
        };

        process.stdin.setEncoding('utf-8');

        process.stdin.on('data', (chunk: string) => {
            data += chunk;
        });

        process.stdin.on('end', () => {
            settle(() => resolve(data));
        });

        process.stdin.on('error', (err: Error) => {
            settle(() => reject(err));
        });

        const timer = setTimeout(() => {
            if (!data) {
                settle(() => {
                    process.stdin.destroy();
                    reject(new Error('Timeout: No data received from stdin.'));
                });
            }
        }, timeoutMs);
    });
}
