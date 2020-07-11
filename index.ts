import * as fs from 'fs';
import fetch from 'node-fetch';

type Config = {
    headers?: { [key: string]: string };
}

const config: Config = {
    headers: {},
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
    // @ts-ignore
    const input = fs.readFileSync(process.stdin.fd, 'utf-8');

    return input
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

async function checkUrl(url: string) {
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

async function main() {
    const urls = readUrls();
    console.log(`Checking URLs...`);
    await Promise.all(urls.map(url => checkUrl(url)));
    console.log(`Finished checking ${urls.length} URLs`);
    outputResults(groupBy(checks, 'code'));
    console.log(`Done.`);
}

main();
