import { Snowflake } from 'npm:discord.js';

export function updateRep(guildId: Snowflake, userId: Snowflake, change: number) {
    let rep = parseInt(database.read({
        guildId,
        userId,
        property: "rep"
    }) ?? "0");
    rep += change;

    database.write({
        guildId,
        userId,
        property: "rep",
        value: rep
    });

    return rep;
}