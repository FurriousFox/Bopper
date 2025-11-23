import { Client } from 'discord.js';

const guildMembersFetched: Record<string, Promise<unknown>> = {};
async function members_fetch_fun(guildId: string | null) {
    try {
        if (!guildId) return;
        if (!(globalThis.client instanceof Client)) return console.log("fetching members without client!");
        if (!globalThis.client.isReady()) return console.log("fetching members while client not ready!");

        if (!Object.hasOwn(guildMembersFetched, guildId)) guildMembersFetched[guildId] = (await globalThis.client.guilds.fetch(guildId)).members.fetch();

        await guildMembersFetched[guildId].catch(_ => {
            if (Object.hasOwn(guildMembersFetched, guildId)) delete guildMembersFetched[guildId];
            return;
        });
    } catch (_) {
        if (guildId && Object.hasOwn(guildMembersFetched, guildId)) delete guildMembersFetched[guildId];
        return;
    };
};

if (typeof globalThis.membersFetch !== 'function') globalThis.membersFetch = members_fetch_fun;

declare global {
    var membersFetch: typeof members_fetch_fun;
}
