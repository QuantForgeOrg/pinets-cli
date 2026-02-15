/**
 * Lightweight update check against the npm registry.
 *
 * No dependencies — just a single HTTP call with a short timeout.
 * Returns a formatted notice string, or null if up-to-date / error.
 */
export async function checkForUpdate(
    currentVersion: string,
    packageName: string,
): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(
            `https://registry.npmjs.org/${packageName}/latest`,
            { signal: controller.signal },
        );

        clearTimeout(timeoutId);
        if (!res.ok) return null;

        const { version: latest } = (await res.json()) as { version: string };

        if (latest && latest !== currentVersion) {
            return [
                '',
                `  Update available: ${currentVersion} \u2192 ${latest}`,
                `  Run: npm i -g ${packageName}`,
                '',
            ].join('\n');
        }

        return null;
    } catch {
        // Network error, timeout, abort — silently ignore
        return null;
    }
}
