import { Message } from 'discord.js';

export default {
    match: /^lapostats$/,
    command: 'lapostats',
    examples: [],
    description: 'show leaderboard for lapo points',
    async handler(message: Message): Promise<void> {
        const prefix = database.read({
            guildId: message.guildId!,
            property: "prefix",
        }) ?? ".";
        const members = await message.guild!.members.fetch();
        const lapos = database.readAll({
            like: `${message.guildId}A`,
            property: "lapos",
        });
        const leaderboard = `## Lapo stats\n${lapos.sort((a, b) => (+b.value) - (+a.value)).map(e => [e.key.split("--")[1], e.value]).filter(e => members.get(e[0])?.user?.bot === false).map(e => `<@${e[0]}>: ${e[1]}`).join("\n")}\n\n-# you gain 1 lapo point when being the last user of the day to use the lapo command\n-# determined by when the message is received by discord (see ${prefix}ping for more info)`;

        const reply = await message.reply({ content: leaderboard, allowedMentions: {} });
        database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, reply.id].join("-")
        });
    }
};