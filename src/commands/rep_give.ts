import { Message } from 'discord.js';
import { getRep, updateRep } from '../rep.ts';

export default {
    match: /^rep (?:give|gift) <@(\d+)> +?(\d+)$/,
    command: 'rep give <user> <amount>',
    examples: ['rep give @Bopper 10'],
    description: 'gift rep points to someone else',
    handler(message: Message, match: RegExpMatchArray): void {
        let lowrep: number;
        if ((lowrep = getRep(message.guildId!, message.author.id)) < parseInt(match[2])) {
            message.reply({ content: `You only have ${lowrep} rep points!`, allowedMentions: {} });
        } else {
            updateRep(message.guildId!, message.author.id, -parseInt(match[2]));
            updateRep(message.guildId!, match[1], parseInt(match[2]));
            message.reply({ content: `Gifted ${match[2]} rep ${match[2] === "1" ? "point" : "points"} to <@${match[1]}>!`, allowedMentions: { users: [match[1]] } });
        }
    }
};