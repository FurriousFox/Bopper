import process from "node:process";
import Typesense from "typesense";
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import STOP_WORDS from './stop_words.json' with {type: "json"};

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

if (!Deno.env.get("TYPESENSE_API_KEY")) throw new Error("Environment variable \"TYPESENSE_API_KEY\" isn't set!");

let TYPESENSE_SERVER_CONFIG;
const typesense = new Typesense.Client(TYPESENSE_SERVER_CONFIG = {
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
    numRetries: 8,
    useServerSideSearchCache: true,
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
        { name: 'transcript', type: 'string' },
        { name: 'altTitle', type: 'string' },
        // { name: 'topics', type: 'string[]', facet: true },

        {
            name: 'embedding',
            type: 'float[]',
            embed: {
                from: ['title', 'transcript', /* 'altTitle', 'topics' */],
                model_config: {
                    model_name: 'ts/e5-small-v2',
                },
            },
        },
    ],
    default_sorting_field: 'num',
};


function queryWithoutStopWords(query: string) {
    const words = query.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '').split(' ');
    return words
        .map((word) => {
            if (STOP_WORDS.includes(word.toLowerCase())) {
                return null;
            } else {
                return word;
            }
        })
        .filter((w) => w)
        .join(' ')
        .trim();
}

async function searchComics(query: string) {
    const searchResults = await typesense.collections('xkcd')
        .documents()
        .search({
            q: query,
            per_page: 10,
            query_by: 'title,altTitle,transcript,explanation,topics,embedding',
            query_by_weights: '127,80,80,20,1,1',

            num_typos: 1,
            exclude_fields: 'embedding',
            vector_query: 'embedding:([], k: 30, distance_threshold: 0.1, alpha: 0.9)',
        });

    return searchResults;
}

const results = await searchComics('aws outage');
console.log('Search results:');
results.hits!.forEach(hit => {
    console.log(`#${(hit.document as xkcd).num}: ${(hit.document as xkcd).title}`);
});