import fs from "node:fs";

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

const xkcds: xkcd[] = [];

let i = 1;
while (i <= latest.num) {
    xkcds.push(await xkcd.xkcd(i));
    console.log(i);
    i++;
}

fs.writeFileSync("xkcd.jsonl", xkcds.map(e => JSON.stringify(e)).join("\n"));;