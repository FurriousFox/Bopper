import { TextDisplayBuilder, MediaGalleryItemBuilder, MediaGalleryBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import typesense_search from "./xkcd_search.ts";

export type xkcd_success = {
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

export type xkcd = xkcd_success | {
    num: number;
    latest: xkcd;

    error: true;
};

export default {
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

    async components(comic: xkcd) {
        if ((comic as unknown) == 1 || comic.error) {
            if ((comic as unknown) == 1) return [
                new TextDisplayBuilder()
                    .setContent(`
_ _    O
_ _   /|\\
_ _   / \\
This comic doesn't exist.


*Or, more likely, the search engine failed you.*
`)
            ].map(component => component.toJSON()); else if (!comic.latest?.error && comic.latest!.num < comic.num) return [
                new TextDisplayBuilder()
                    .setContent(`
_ _    O
_ _   /|\\
_ _   / \\
This comic doesn't exist yet.


The latest comic is #${comic.latest?.num}. You'll have to wait for Randall to draw #${comic.num}.

*Or you could try traveling forward in time at 1 second per second.*
`)
            ].map(component => component.toJSON());
            else return [
                new TextDisplayBuilder()
                    .setContent(`
_ _    O
_ _   /|\\
_ _   / \\
Some unknown error occurred, xkcd is probably down, but if it isn't, https://xkcd.com/2200/.`)
            ].map(component => component.toJSON());
        }
        else {
            try {
                const url_splits = (comic as xkcd_success).img.split(".");
                url_splits[url_splits.length - 2] += "_2x";
                const x2_url = url_splits.join(".");

                if ((await fetch(x2_url, { method: "HEAD" })).status == 200) comic.img = x2_url;
            } catch (_) { /*  */ }

            const interactive = ((comic.num == 880 || comic.extra_parts) && comic.num != 3074);
            let alt = comic.alt ?? "";
            if (interactive) alt += "\n### This is an interactive comic, click the button below to launch it!";


            return [
                new TextDisplayBuilder().setContent(`## xkcd ${comic.num}: ${comic.title}`),
                ...((comic.img?.length && !comic.img.endsWith("/")) ? [new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(comic.img))] : []),
                ...(alt?.length ? [new TextDisplayBuilder().setContent(alt)] : []),
                new ActionRowBuilder().addComponents(
                    ...(interactive ? [new ButtonBuilder().setLabel('Interactive comic').setStyle(ButtonStyle.Primary).setCustomId('xkcd_interactive_' + comic.num.toString())] : []),
                    new ButtonBuilder().setLabel('View on xkcd').setStyle(ButtonStyle.Link).setURL(`https://xkcd.com/${comic.num}/`),
                    new ButtonBuilder().setLabel('Explanation').setStyle(ButtonStyle.Link).setURL(`https://explainxkcd.com/${comic.num}`),
                ),
            ].map(component => component.toJSON());
        }
    },

    async search(query: string): Promise<xkcd> {
        const result = (await typesense_search(query))?.[0]?.[0];
        if (!result) return 1 as unknown as xkcd;
        return this.xkcd((await typesense_search(query))[0][0]);
    }
};