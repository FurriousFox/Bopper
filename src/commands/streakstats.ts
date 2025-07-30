import { Message } from 'npm:discord.js';

export default {
    match: /^streakstats$/,
    command: 'streakstats',
    examples: [],
    description: 'show leaderboard for streaks',
    async handler(message: Message): Promise<void> {
        const members = await message.guild!.members.fetch();

        const streaks = database.readAll({
            like: `${message.guildId}A`,
            property: "streak",
        }).map(e => [e.key.split("--")[1], e.value.split("-").map(e => {
            const a = new Date(+e);
            a.setHours(0, 0, 0, 0);
            return +a;
        })]).filter(e => ((+new Date()) - +e[1][1]) < 48 * 3600 * 1000).map(e => {
            const b = Math.round((+e[1][1] - +e[1][0]) / (1000 * 24 * 3600)) + 1;
            return [e[0], b];
        });

        const leaderboard = `## Streak stats\n${streaks.sort((a, b) => (+b[1]) - (+a[1])).filter(e => members.get(e[0] as string)?.user?.bot === false).map(e => `<@${e[0]}>: ${e[1]} ${e[1] == 1 ? 'day' : 'days'}`).join("\n")}\n\n-# maintain your streak by sending a message every day`;
        message.reply({ content: leaderboard, allowedMentions: {} });
    }
};