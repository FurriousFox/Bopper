import { Snowflake } from 'discord.js';

export function fipoTimeout(date: string) {
    if (database.readAll({
        like: `A`,
        property: `fipo${date}`,
    }).length !== 0) return;

    setTimeout(() => {
        const fipos = database.readAll({
            like: `A`,
            property: `fipo${date}`,
        }).sort((b, a) => +(a.value) - +(b.value));

        const fiporesults: Record<string, string[]> = {};
        for (const fipo of fipos) {
            fiporesults[fipo.key.split("A")[0]] = [fipo.key.split("A")[1].split("--")[0], fipo.key.split("--")[1].split("C")[0]];
        }

        for (const serverId of Object.keys(fiporesults)) {
            const channelId = fiporesults[serverId][0];
            const userId = fiporesults[serverId][1];

            try {
                client.channels.fetch(channelId).then(channel => {
                    if (channel && 'send' in channel) channel.send(`W00t <@${userId}>!`).catch(console.error);
                }).catch(() => { });
            } catch (_e) { /*  */ }

            updateFipos(serverId, userId);
        }
    }, 1000);
}

export function updateFipos(guildId: Snowflake, userId: Snowflake) {
    let fipos = parseInt(database.read({
        guildId,
        userId,
        property: "fipos"
    }) ?? "0");
    fipos += 1;

    database.write({
        guildId,
        userId,
        property: "fipos",
        value: fipos
    });

    return fipos;
}

export function updateFiposs(guildId: Snowflake, userId: Snowflake, count: number) {
    database.write({
        guildId,
        userId,
        property: "fipos",
        value: count
    });

    return count;
}