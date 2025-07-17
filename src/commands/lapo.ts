import { Message, SnowflakeUtil } from 'npm:discord.js';

export default {
    match: /^lapo$/,
    command: 'lapo',
    examples: [],
    description: '**la**st **po**st of the day',
    handler(message: Message): void {
        const date = `${new Date(SnowflakeUtil.timestampFrom(message.id)).getDate()}D${new Date(SnowflakeUtil.timestampFrom(message.id)).getFullYear()}D${new Date(SnowflakeUtil.timestampFrom(message.id)).getMonth()}`;
        database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            property: `lapo${date}`,
            value: `${+new Date()}`
        });

        message.react('✅');
    }
};