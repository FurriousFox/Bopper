import { Message, SlashCommandBuilder, ChatInputCommandInteraction, InteractionContextType } from 'discord.js';

const outcomes = ["Heads", "Tails"] as const;

function flip() {
    return outcomes[Math.floor(Math.random() * outcomes.length)];
}

export default {
    match: /^coinflip$/,
    command: 'coinflip',
    examples: ['coinflip'],
    description: 'flip a coin',
    slash: new SlashCommandBuilder().setName("coinflip").setDescription('Flip a coin').setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    async handler(message: Message): Promise<void> {
        const reply = await message.reply({ content: flip(), allowedMentions: {} });
        database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, reply.id].join("-")
        });
    },
    interactionHandler(interaction: ChatInputCommandInteraction) {
        interaction.reply({ content: flip(), allowedMentions: {} });
    }
};
