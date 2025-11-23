import process from "node:process";
import Typesense from "typesense";
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import fs from "node:fs";
import wtf from "wtf_wikipedia";

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// setInterval(() => console.log("hello world"), 60000);


if (!Deno.env.get("TYPESENSE_API_KEY")) throw new Error("Environment variable \"TYPESENSE_API_KEY\" isn't set!");

const typesense = new Typesense.Client({
    nodes: [
        {
            // host: "typesense",
            host: "127.0.0.1", // debug
            port: 8108,
            protocol: "http",
        },
    ],
    apiKey: Deno.env.get("TYPESENSE_API_KEY")!,
    connectionTimeoutSeconds: 2 * 60 * 60,
});

const collectionName = `xkcd`;

type xkcd = {
    year: string;
    month: string;
    day: string;

    num: number;
    safe_title: string;
    img: string;

    transcript: string;
    alt: string;
    title: string;

    news: string;
    link: "";

    extra_parts?: object;
};


const schema: CollectionCreateSchema = {
    name: collectionName,
    fields: [
        { name: 'id', type: 'string' },
        { name: 'num', type: 'int32' },

        { name: 'title', type: 'string' },
        { name: 'altTitle', type: 'string' },
        { name: 'transcript', type: 'string' },
        { name: 'topics', type: 'string[]', facet: true },

        {
            name: 'embedding',
            type: 'float[]',
            embed: {
                from: ['title', 'transcript', 'altTitle', 'topics'],
                model_config: {
                    model_name: 'ts/e5-small-v2',
                },
            },
        },
    ],
    default_sorting_field: 'num',
};


// debug
try {
    await typesense.collections('xkcd').delete();
    console.log('Deleted existing collection');
} catch (_) {
    // Collection doesn't exist, that's fine
}

console.log(`Populating new collection in Typesense ${collectionName}`);
console.log('Creating schema: ');
await typesense.collections().create(schema);

const xkcdel = fs.readFileSync("./xkcd_explain.jsonl", "utf-8").split("\n").filter(e => e.trim().length).map(e => JSON.parse(e));
const xkcdl = fs.readFileSync("./xkcd.jsonl", "utf-8").split("\n").filter(e => e.trim().length).map((comic, index) => {
    const c = JSON.parse(comic) as xkcd;
    return {
        num: c.num,
        title: c.safe_title,
        altTitle: c.transcript,

        transcript: wtf(xkcdel.at(index).split("==Transcript==").at(-1)).text().replace(/ +?\b.*?\b: /g, ' ').replace(/\[.*?\]\s*/g, '').trim() + ' ',

        topics: (xkcdel.at(index).match(/\[\[Category:(.+?)]]/gi)?.map((e: string) => e.replace(/\[\[Category:(.+?)]]/gi, "$1")) ?? []).map((t: string) => t.replace(/^Comics featuring /g, ''))
    };
}).map(e => JSON.stringify(e));

let i = 0;
for (const xkcd of xkcdl) {
    const importResult = await typesense.collections('xkcd').documents()
        .import(xkcd, { action: 'create' });
    console.log(importResult);
    console.log(`${i++}/${xkcdl.length}`);
}
