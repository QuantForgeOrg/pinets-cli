import esbuild from 'rollup-plugin-esbuild';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

const LicenseHeader = `#!/usr/bin/env node
/* 
 * pinets-cli - CLI for PineTS
 * Copyright (C) 2025 Alaa-eddine KADDOURI
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */`;

const build = process.env.BUILD || 'dev';
const isProd = build === 'prod';

// Plugin to prepend the shebang + license header
function addHeader() {
    return {
        name: 'add-header',
        generateBundle(options, bundle) {
            for (const fileName in bundle) {
                const chunk = bundle[fileName];
                if (chunk.type === 'chunk') {
                    // Remove any shebang that esbuild/rollup might have added
                    chunk.code = chunk.code.replace(/^#!.*\n?/, '');
                    chunk.code = `${LicenseHeader}\n${chunk.code}`;
                }
            }
        },
    };
}

export default {
    input: './src/index.ts',
    output: {
        file: isProd ? './dist/pinets-cli.min.cjs' : './dist/pinets-cli.dev.cjs',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
        // Ensure the bundle is self-contained
        exports: 'none',
    },
    plugins: [
        resolve({
            browser: false,
            preferBuiltins: true,
            mainFields: ['module', 'main'],
            extensions: ['.js', '.ts', '.json'],
        }),
        commonjs(),
        json(),
        esbuild({
            sourceMap: true,
            minify: isProd,
            treeShaking: isProd,
            target: 'node18',
        }),
        addHeader(),
    ],
    // Node.js built-ins are NOT bundled - they're available at runtime
    external: [
        'fs', 'path', 'os', 'url', 'util', 'events', 'stream', 'buffer',
        'crypto', 'http', 'https', 'net', 'tls', 'zlib', 'querystring',
        'child_process', 'worker_threads', 'readline',
        // Node.js prefixed built-ins
        /^node:/,
    ],
};
