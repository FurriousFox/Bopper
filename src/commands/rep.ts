import { OmitPartialGroupDMChannel, Message } from 'npm:discord.js';
import { getRep } from '../rep.ts';

export default {
    match: /^rep( <@(\d+)>)?$/,
    command: 'rep <user>',
    examples: ['rep', 'rep @Bopper'],
    description: 'check rep balance',
    handler(message: OmitPartialGroupDMChannel<Message<boolean>>, match: RegExpMatchArray): void {
        if (match[2]) {
            message.reply({ content: `${match[1]} has ${getRep(message.guildId!, match[2]).toString()} rep points`, allowedMentions: {} });
        } else message.reply({ content: `you have ${getRep(message.guildId!, message.author.id)} rep points`, allowedMentions: {} });
    }
};