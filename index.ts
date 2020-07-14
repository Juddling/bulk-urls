import * as program from 'commander';
import * as fs from 'fs';
import fetch from 'node-fetch';

type Config = {
    headers?: { [key: string]: string };
}

const checks: CheckResult[] = [];

enum ResponseCode {
    OK = 200,
    ClientBadRequest = 400,
    ClientUnauthorized = 400,
    ClientForbidden = 403,
    ClientNotFound = 404,
    ServerError = 500,
}

type CheckResult = {
    url: string;
    code: number;
} | {
    url: string;
    code: -1;
    errorDetails: string;
}

function readUrls() {
    try {
        const input = fs.readFileSync(process.stdin.fd, 'utf-8');

        return input
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    } catch (err) {
        throw new Error("Error reading from stdin, did you forget to pass a file with URLs?");
    }
}

async function checkUrl(url: string, config?: Config) {
    try {
        const response = await fetch(url, {
            headers: config.headers,
            redirect: 'manual',
        });

        checks.push({
            url,
            code: response.status,
        })

        // if (response.status !== ResponseCode.OK) {
        //     console.error(`${response.status} ${url}`);
        // }
    } catch (err) {
        checks.push({
            url,
            code: -1,
            errorDetails: err.message,
        })
        // console.error(`Error with URL: ${url}, details: ${err.message}`);
    }
}

function groupBy<T extends Record<string, any>, K extends keyof T>(xs: T[], key: K): Map<K, T[]> {
    const map = new Map<K, T[]>();
    for (const x of xs) {
        map.has(x[key]) ? map.get(x[key]).push(x) : map.set(x[key], [x]);
    }
    return map;
}

function outputResults(checks: Map<string, CheckResult[]>) {
    checks.forEach((results, code) => {
        if (code == ResponseCode.OK.toString()) {
            return;
        }

        console.log('\n-----------');
        console.log(`${results.length} URLs with code ${code}:\n`);

        for (const result of results) {
            console.log(result.url);
        }
    });
}

function parseConfig(path: string): Config | undefined {
    if (!fs.existsSync(path)) {
        console.warn(`Could not read config file at path: ${path}`);
        return;
    }

    try {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (err) {
        console.error(`Error parsing config file: ${err.message}`);
    }
}

async function main(configPath?: string) {
    const config = configPath ? parseConfig(configPath) : undefined;
    const urls = readUrls();
    console.log(`Checking URLs...`);
    await Promise.all(urls.map(url => checkUrl(url, config)));
    console.log(`Finished checking ${urls.length} URLs`);
    outputResults(groupBy(checks, 'code'));
    console.log(`Done.`);
}

program.option('-c, --config <string>', 'Path to a JSON config file: ~/bulk-url-config.json');
program.parse(process.argv);

main(program.config)
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
