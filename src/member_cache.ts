import { Client } from 'discord.js';

const guildsFetched: Record<string, Promise<unknown>> = {};
async function members_fetch_fun(guildId: string | null) {
    try {
        if (!guildId) return;
        if (!(globalThis.client instanceof Client)) return console.log("fetching members without client!");
        if (!globalThis.client.isReady()) return console.log("fetching members while client not ready!");

        if (!Object.hasOwn(guildsFetched, guildId))
            guildsFetched[guildId] = globalThis.client.guilds.fetch(guildId);

        await guildsFetched[guildId].catch(_ => { return; });
    } catch (_) { return; };
};

if (typeof globalThis.membersFetch !== 'function') globalThis.membersFetch = members_fetch_fun;

declare global {
    var membersFetch: typeof members_fetch_fun;
}
