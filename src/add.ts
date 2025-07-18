import { ChatInputCommandInteraction, MessageFlags, ButtonBuilder, ActionRowBuilder, ButtonStyle, ButtonInteraction, Snowflake } from 'npm:discord.js';

const interactions: Record<Snowflake, ChatInputCommandInteraction> = {};

export function invite_ephemeral(interaction: ChatInputCommandInteraction) {
    interaction.reply({
        content: `Bopper must be added to this server to use this command\n\n-# https://discord.com/oauth2/authorize?client_id=${interaction.applicationId}`,
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Add Bopper").setURL(`https://discord.com/oauth2/authorize?client_id=${interaction.applicationId}`).setStyle(ButtonStyle.Link), new ButtonBuilder().setLabel("Send visibly").setCustomId("public_add").setStyle(ButtonStyle.Secondary)).toJSON()],
        allowedMentions: {},
        flags: MessageFlags.Ephemeral,
    });

    interactions[interaction.id] = interaction;
}

export function invite(interaction: ButtonInteraction) {
    const reply = {
        content: `Bopper must be added to this server for some features to work\n\n-# invite link: https://discord.com/oauth2/authorize?client_id=${interaction.applicationId}\n-# source code: <https://github.com/FurriousFox/Bopper>`,
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Add Bopper").setURL(`https://discord.com/oauth2/authorize?client_id=${interaction.applicationId}`).setStyle(ButtonStyle.Link)).toJSON()],
        allowedMentions: {},
    };

    if (interaction?.message?.interactionMetadata?.id) {
        const old_interaction = interactions[interaction?.message?.interactionMetadata?.id];
        if (old_interaction) if (Date.now() - old_interaction?.createdTimestamp < 890000) {
            old_interaction?.deleteReply()?.catch?.(console.error);
            delete interactions[interaction?.message?.interactionMetadata?.id];
        }
    }

    interaction.reply(reply);
}