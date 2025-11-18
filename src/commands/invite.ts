import { Message, SlashCommandBuilder, ChatInputCommandInteraction, InteractionContextType } from 'discord.js';
import { invite, invite_ephemeral } from "../invite.ts";

export default {
    match: /^invite$/,
    command: 'invite',
    examples: [],
    description: 'show invite link to add Bopper to a server or account',
    slash: new SlashCommandBuilder().setName("invite").setDescription('Get invite link to add Bopper to a server or your own account').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    async handler(message: Message | ChatInputCommandInteraction): Promise<void> {
        if (!(message instanceof ChatInputCommandInteraction)) database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, (await invite(message, true)).id].join("-")
        }); else await invite_ephemeral(message, true, message instanceof ChatInputCommandInteraction ? !!message.options.getBoolean("ephemeral") : false);
    },
    interactionHandler(interaction: ChatInputCommandInteraction) {
        this.handler(interaction);
    }
};