import { Message } from 'npm:discord.js';

export default {
    match: /^(?:leaderboard( lapo| rep| streak| streaks)?)|(lapostats)|(repstats)|(streak)|(streaks)|(streakstats)$/,
    command: 'leaderboard',
    examples: ["leaderboard", "leaderboard lapo", "leaderboard rep", "lapostats", "repstats", "streakstats"],
    description: 'show leaderboard for lapo, rep and streaks\n',
    async handler(message: Message, match: RegExpMatchArray): Promise<void> {
        const members = await message.guild!.members.fetch();

        let leaderboard = '';

        const reps = database.readAll({
            like: `${message.guildId}A`,
            property: "rep",
        });
        leaderboard += `## Rep stats\n${reps.sort((a, b) => (+b.value) - (+a.value)).map(e => [e.key.split("--")[1], e.value]).filter(e => members.get(e[0])?.user?.bot === false).map(e => `<@${e[0]}>: ${e[1]}`).join("\n")}`;

        message.reply({ content: leaderboard, allowedMentions: {} });

        // if (match[2]) {
        //     message.reply({ content: `${match[1]} has ${getRep(message.guildId!, match[2]).toString()} rep points`, allowedMentions: {} });
        // } else message.reply({ content: `you have ${getRep(message.guildId!, message.author.id)} rep points`, allowedMentions: {} });
    }
};