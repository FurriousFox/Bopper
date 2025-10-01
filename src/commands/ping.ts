import { Message, SnowflakeUtil, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';

export default {
    match: /^ping|pong$/,
    command: 'ping',
    examples: [],
    description: 'check bot ping and your latency',
    slash: new SlashCommandBuilder().setName("ping").setDescription('Check bot ping and your latency').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    async handler(message: Message): Promise<void> {
        let response = '';
        let nonce = message.nonce ? SnowflakeUtil.timestampFrom(message.nonce.toString()) : undefined;
        const id = SnowflakeUtil.timestampFrom(message.id);
        const id_edit = message.editedTimestamp ?? SnowflakeUtil.timestampFrom(message.id);
        const now = +new Date();

        if (nonce) if (Math.abs((id - nonce)) > 60000) nonce = undefined;
        if (nonce) response += `latency:   ${Math.round((id - nonce))}ms`;
        response += `\nping: ${nonce ? "        " : ""}${Math.round((now - id_edit))}ms\n`;

        if (nonce) response += "\n-# latency: time between you sending your message, and the message being received by discord";
        response += "\n-# ping: time between discord receiving your message, and the message being received by the bot";

        const reply = await message.reply({ content: response, allowedMentions: {} });
        database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, reply.id].join("-")
        });
    },
    async interactionHandler(interaction: ChatInputCommandInteraction) {
        let response = '';
        const id = SnowflakeUtil.timestampFrom(interaction.id);
        const now = +new Date();
        const ephemeral = !!interaction.options.getBoolean("ephemeral");
        const reply = await interaction.deferReply({ withResponse: true, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        const nonce = reply.resource?.message?.nonce ? SnowflakeUtil.timestampFrom(reply.resource.message.nonce.toString()) : undefined;

        if (nonce) response += `latency:   ${Math.round((id - nonce))}ms`;
        response += `\nping: ${nonce ? "        " : ""}${Math.round((now - id))}ms\n`;
        if (nonce) response += "\n-# latency: time between you sending your message, and the message being received by discord";
        response += "\n-# ping: time between discord receiving your message, and the message being received by the bot";

        interaction.editReply({ content: response, allowedMentions: {} });
    }
};
