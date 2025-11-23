import fs from "node:fs";
import bot from "nodemw";

const client = new bot({
    protocol: "https",
    server: "www.explainxkcd.com",
    path: "/wiki",
    debug: false,
    userAgent: "Bopper (explainxkcd.bopper@argv.nl)"
});


type xkcd_success = {
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

    error?: true;
    latest?: xkcd;
};

type xkcd = xkcd_success | {
    num: number;
    latest: xkcd;

    error: true;
};

const xkcd = {
    async random() {
        const latest = await this.latest();
        const random_num = Math.floor(Math.random() * latest.num) + 1;
        const random = await this.xkcd(random_num);
        return random;
    },
    async latest() {
        const latest = (await (await fetch("https://xkcd.com/info.0.json")).json()) as xkcd;
        return latest;
    },
    async xkcd(num: number): Promise<xkcd> {
        try {
            return (await (await fetch(`https://xkcd.com/${num}/info.0.json`)).json()) as xkcd;
        } catch (_e) {
            // return await this.xkcd(630);
            return { error: true, num: num, latest: await this.latest() };
        }
    },
};

const latest = await xkcd.latest();
console.log(latest.num);

const xkcd_explains: string[] = [];
const getArticleAsync: (page: string) => Promise<string> = (page: string) => new Promise((resolve, reject) => client.getArticle(page, true, (err, data) => { if (err) { return reject(err); } else resolve(data as string); }));

let i = 1;
while (i <= latest.num) {
    try {
        const article = await getArticleAsync(`${i}`);
        xkcd_explains.push(article);
        i++;
    } catch (e) {
        console.log(e);
    } finally {
        console.log(i - 1);
    }
}

fs.writeFileSync("xkcd_explain.jsonl", xkcd_explains.map(e => JSON.stringify(e)).join("\n"));