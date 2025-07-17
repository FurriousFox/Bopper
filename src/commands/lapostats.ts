import { Message } from 'npm:discord.js';

export default {
    match: /^lapostats$/,
    command: 'lapostats',
    examples: [],
    description: 'show leaderboard for lapo points',
    async handler(message: Message): Promise<void> {
        const members = await message.guild!.members.fetch();

        const lapos = database.readAll({
            like: `${message.guildId}A`,
            property: "lapos",
        });
        const leaderboard = `## Lapo stats\n${lapos.sort((a, b) => (+b.value) - (+a.value)).map(e => [e.key.split("--")[1], e.value]).filter(e => members.get(e[0])?.user?.bot === false).map(e => `<@${e[0]}>: ${e[1]}`).join("\n")}\n\n-# you gain 1 lapo point when being the last user of the day to use the lapo command`;

        message.reply({ content: leaderboard, allowedMentions: {} });
    }
};