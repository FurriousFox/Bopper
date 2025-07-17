import { Message, SnowflakeUtil, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction } from 'npm:discord.js';

export default {
    match: /^ping|pong$/,
    command: 'ping',
    examples: [],
    description: 'check bot ping and your latency',
    slash: new SlashCommandBuilder().setName("ping").setDescription('check bot ping and your latency').setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    handler(message: Message): void {
        let response = '';
        const nonce = message.nonce ? SnowflakeUtil.timestampFrom(message.nonce.toString()) : undefined;
        const id = SnowflakeUtil.timestampFrom(message.id);
        const now = +new Date();

        if (nonce) response += `latency:   ${Math.round((id - nonce))}ms`;
        response += `\nping: ${nonce ? "        " : ""}${Math.round((now - id))}ms\n`;

        if (nonce) response += "\n-# latency: time between you sending your message, and the message being received by discord";
        response += "\n-# ping: time between discord receiving your message, and the message being received by the bot";

        message.reply({ content: response, allowedMentions: {} });
    },
    async interactionHandler(interaction: ChatInputCommandInteraction) {
        const id = SnowflakeUtil.timestampFrom(interaction.id);
        const now = +new Date();
        await interaction.reply({ content: `ping: ${Math.round((now - id))}ms\n\n-# ping: time between discord receiving your message, and the message being received by the bot`, allowedMentions: {} });
        const reply = await interaction.fetchReply();
        if (reply.nonce) { // fsr, the nonce of the reply is equal to the nonce of the interaction request, but hey, I'll take it
            interaction.editReply({ content: `latency:   ${Math.round((id - SnowflakeUtil.timestampFrom(reply.nonce.toString())))}ms\nping:         ${Math.round((now - id))}ms\n\n-# latency: time between you sending your message, and the message being received by discord\n-# ping: time between discord receiving your message, and the message being received by the bot`, allowedMentions: {} });
        }
    }
};