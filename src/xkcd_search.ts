import Typesense from "typesense";
import STOP_WORDS from './stop_words.json' with {type: "json"};
import path from "node:path";
import { load } from "@std/dotenv";

await load({
    envPath: path.join(import.meta.dirname ?? "", "../xkcd/.env"),
    export: true,
});

if (!Deno.env.get("TYPESENSE_API_KEY")) console.log("Environment variable \"TYPESENSE_API_KEY\" isn't set!");


export default async function (query: string): Promise<[number, string][]> {
    if (!Deno.env.get("TYPESENSE_API_KEY")) return [];

    const typesense = new Typesense.Client({
        nodes: [
            {
                host: "127.0.0.1",
                port: 8108,
                protocol: "http",
            },
        ],
        apiKey: Deno.env.get("TYPESENSE_API_KEY")!,
        connectionTimeoutSeconds: 2 * 60 * 60,
        numRetries: 8,
        useServerSideSearchCache: true,
    });

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
                q: queryWithoutStopWords(query) ?? query ?? "",
                per_page: 10,

                query_by: 'title,altTitle,transcript,topics,embedding',
                query_by_weights: '127,80,80,1,1',

                num_typos: 2,
                exclude_fields: 'embedding',
                vector_query: 'embedding:([], k: 30, distance_threshold: 0.1, alpha: 0.9)',
            });

        return searchResults;
    }

    const hits = (await searchComics(query ?? "")).hits!;
    console.log(hits.map(e => [(e.document as xkcd).num, (e.document as xkcd).title]));
    return hits.map(e => [(e.document as xkcd).num, (e.document as xkcd).title]);
}