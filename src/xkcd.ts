import { TextDisplayBuilder, MediaGalleryItemBuilder, MediaGalleryBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

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

    error?: true;
    latest?: xkcd;
} | {
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

    components(comic: xkcd) {
        if (comic.error) {
            if (!comic.latest?.error && comic.latest!.num < comic.num) return [
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
        else return [
            new TextDisplayBuilder().setContent(`## xkcd ${comic.num}: ${comic.title}`),
            new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(comic.img)),
            new TextDisplayBuilder().setContent(comic.alt),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('View on xkcd').setStyle(ButtonStyle.Link).setURL(`https://xkcd.com/${comic.num}/`),
                new ButtonBuilder().setLabel('Explanation').setStyle(ButtonStyle.Link).setURL(`https://explainxkcd.com/${comic.num}`)
            ),
        ].map(component => component.toJSON());
    }
};