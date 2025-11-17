import { ChatInputCommandInteraction, MessageFlags, ButtonBuilder, ActionRowBuilder, ButtonStyle, ButtonInteraction, Snowflake, Message } from 'discord.js';

const interactions: Record<Snowflake, ChatInputCommandInteraction | Message> = {};

export function invite_ephemeral(interaction: ChatInputCommandInteraction | Message, invite = false, ephemeral = true) {
    const reply = interaction.reply({
        content: (invite ? `Add Bopper to get access to all of its features!\n\n` :
            `Bopper must be added to this server to use this command\n\n`) + `-# https://discord.com/oauth2/authorize?client_id=${interaction.applicationId ?? "1395103292899590337"}`,
        allowedMentions: {},
        ...((interaction instanceof ChatInputCommandInteraction && ephemeral) ? { flags: 0 | (ephemeral ? MessageFlags.Ephemeral : 0), components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Add Bopper").setURL(`https://discord.com/oauth2/authorize?client_id=${interaction.applicationId ?? "1395103292899590337"}`).setStyle(ButtonStyle.Link), new ButtonBuilder().setLabel("Send visibly").setCustomId("public_add").setStyle(ButtonStyle.Secondary)).toJSON()], } : {
            components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Add Bopper").setURL(`https://discord.com/oauth2/authorize?client_id=${interaction.applicationId ?? "1395103292899590337"}`).setStyle(ButtonStyle.Link)).toJSON()]
        })
    });

    interactions[interaction.id] = interaction;
    return reply;
}

export function invite(interaction: ButtonInteraction | Message, invite = false) {
    const reply = {
        content: (invite ? `Add Bopper to get access to all of its features!\n\n` : `Bopper must be added to this server for some features to work\n\n`) + `-# invite link: https://discord.com/oauth2/authorize?client_id=${interaction.applicationId ?? "1395103292899590337"}\n-# source code: <https://github.com/FurriousFox/Bopper>`,
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Add Bopper").setURL(`https://discord.com/oauth2/authorize?client_id=${interaction.applicationId ?? "1395103292899590337"}`).setStyle(ButtonStyle.Link)).toJSON()],
        allowedMentions: {},
    };

    if (interaction instanceof ButtonInteraction && interaction?.message?.interactionMetadata?.id) {
        const old_interaction = interactions[interaction?.message?.interactionMetadata?.id];
        if (old_interaction) if (Date.now() - old_interaction?.createdTimestamp < 890000) {
            (old_interaction as ChatInputCommandInteraction)?.deleteReply()?.catch?.(console.error);
            delete interactions[interaction?.message?.interactionMetadata?.id];
        }
    }

    return interaction.reply(reply);
}