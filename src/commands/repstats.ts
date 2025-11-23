import { Message } from 'discord.js';

export default {
    match: /^repstats$/,
    command: 'repstats',
    examples: [],
    description: 'show leaderboard for rep points',
    slashName: "rep stats",
    async handler(message: Message): Promise<void> {
        const members = message.guild!.members.cache;

        const reps = database.readAll({
            like: `${message.guildId}A`,
            property: "rep",
        });
        const leaderboard = `## Rep stats\n${reps.sort((a, b) => (+b.value) - (+a.value)).map(e => [e.key.split("--")[1], e.value]).filter(e => members.get(e[0])?.user?.bot === false).map(e => `<@${e[0]}>: ${e[1]}`).join("\n")}\n\n-# you gain 1 rep point per message\n-# rep points can be gifted using the rep give command`;

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