import { Message, PermissionsBitField, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, MessageFlags, ApplicationIntegrationType } from 'npm:discord.js';
import { invite_ephemeral } from "../add.ts";

export default {
    match: /^prefix .$/,
    command: 'prefix <prefix>',
    examples: ['prefix !', 'prefix .'],
    description: 'change bot prefix',
    slash: new SlashCommandBuilder().setName("prefix").setDescription('Set bot prefix').addStringOption(option => option.setMinLength(1).setMaxLength(1).setRequired(true).setName("prefix").setDescription("Bot prefix (e.g. ! , . ?)")).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.Guild]),
    async handler(message: Message): Promise<void> {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator) && !message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            const reply = await message.reply({ content: "You don't have permission to change the prefix", allowedMentions: {} });
            database.write({
                guildId: message.guildId!,
                channelId: message.channelId,
                userId: message.author.id,
                messageId: message.id,
                property: "handled",
                value: [2, reply.id].join("-")
            });
            return;
        }

        let reply;
        if (message.content.match(/^prefix ([a-zA-Z0-9 ])$/)) {
            reply = await message.reply({ content: `\`${message.content.match(/^prefix ([a-zA-Z0-9 ])$/)![1]}\` isn't allowed as prefix`, allowedMentions: {} });
        } else {
            database.write({
                guildId: message.guildId!,
                property: "prefix",
                value: message.content.match(/^prefix ([^a-zA-Z0-9 ])$/)![1]
            });

            reply = await message.reply({ content: `set prefix to \`${message.content.match(/^prefix ([^a-zA-Z0-9 ])$/)![1].replace("`", "\` \` \`")}\``, allowedMentions: {} });
        }

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
        const ephemeral = !!interaction.options.getBoolean("ephemeral");

        if (!interaction.authorizingIntegrationOwners[ApplicationIntegrationType.GuildInstall]) {
            invite_ephemeral(interaction);
            return;
        }

        if (typeof interaction.member?.permissions === 'string' || (!interaction.member?.permissions.has(PermissionsBitField.Flags.Administrator) && !interaction.member?.permissions.has(PermissionsBitField.Flags.ManageGuild))) {
            interaction.reply({ content: "You don't have permission to change the prefix", allowedMentions: {}, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
            return;
        }

        if (interaction.options.getString("prefix", true).match(/^([a-zA-Z0-9 ])$/)) {
            interaction.reply({ content: `\`${interaction.options.getString("prefix", true)}\` isn't allowed as prefix`, allowedMentions: {}, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        } else {
            database.write({
                guildId: interaction.guildId!,
                property: "prefix",
                value: interaction.options.getString("prefix", true)
            });

            interaction.reply({ content: `Set prefix to \`${interaction.options.getString("prefix", true).replace("`", "\` \` \`")}\``, allowedMentions: {}, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        }
    }
};