import { Message } from 'discord.js';
import { getRep } from '../rep.ts';

export default {
    match: /^rep( <@(\d+)>)?$/,
    command: 'rep <user>',
    examples: ['rep', 'rep @Bopper'],
    description: 'check rep balance',
    async handler(message: Message, match: RegExpMatchArray): Promise<void> {
        let reply;
        if (match[2]) {
            reply = await message.reply({ content: `${match[1]} has ${getRep(message.guildId!, match[2]).toString()} rep points`, allowedMentions: {} });
        } else reply = await message.reply({ content: `you have ${getRep(message.guildId!, message.author.id)} rep points`, allowedMentions: {} });

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