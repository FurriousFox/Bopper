import { Snowflake } from 'discord.js';

export function updateLapos(guildId: Snowflake, userId: Snowflake) {
    let lapos = parseInt(database.read({
        guildId,
        userId,
        property: "lapos"
    }) ?? "0");
    lapos += 1;

    database.write({
        guildId,
        userId,
        property: "lapos",
        value: lapos
    });

    return lapos;
}

export function getLapos(guildId: Snowflake, userId: Snowflake): number {
    return parseInt(database.read({
        guildId,
        userId,
        property: "Lapos"
    }) ?? "0");
}