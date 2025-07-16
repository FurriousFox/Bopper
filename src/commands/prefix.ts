import { Message } from 'npm:discord.js';

export default {
    match: /^prefix .$/,
    command: 'prefix <prefix>',
    examples: ['prefix !', 'prefix .'],
    description: 'change bot prefix',
    handler(message: Message): void {
        if (message.content.match(/^prefix ([a-zA-Z0-9 ])$/)) {
            message.reply({ content: `\`${message.content.match(/^prefix ([a-zA-Z0-9 ])$/)![1]}\` isn't allowed as prefix`, allowedMentions: {} });
        } else {
            database.write({
                guildId: message.guildId!,
                property: "prefix",
                value: message.content.match(/^prefix ([^a-zA-Z0-9 ])$/)![1]
            });

            message.reply({ content: `set prefix to \`${message.content.match(/^prefix ([^a-zA-Z0-9 ])$/)![1]}\``, allowedMentions: {} });
        }
    }
};