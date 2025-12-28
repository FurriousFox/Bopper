import { Message, ChatInputCommandInteraction, PermissionsBitField, ApplicationIntegrationType, MessageFlags } from 'discord.js';
import { invite_ephemeral } from "../invite.ts";
import xkcd from "../xkcd.ts";

export default {
    match: /^xkcd (un)?subscribe ?<#(\d+)>$/,
    command: 'xkcd subscribe <channel>',
    examples: ['xkcd subscribe #general', 'xkcd unsubscribe #general'],
    description: 'subscribe to xkcd comics',
    slashName: "xkcd subscribe",
    async handler(message: Message | ChatInputCommandInteraction, match?: RegExpMatchArray, unsub?: boolean): Promise<void> {
        const isInteraction = message instanceof ChatInputCommandInteraction;

        if (isInteraction && !message.authorizingIntegrationOwners[ApplicationIntegrationType.GuildInstall]) {
            invite_ephemeral(message);
            return;
        }

        const channelId = isInteraction ? message.options.getChannel("channel", true).id : match?.[2];
        unsub = unsub ?? !!match?.[1];

        if ((!isInteraction && !message.member?.permissions.has(PermissionsBitField.Flags.Administrator) && !message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) || (isInteraction && !message.memberPermissions?.has(PermissionsBitField.Flags.Administrator) && !message.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild))) {
            if (!isInteraction) {
                const reply = await message.reply({ content: "You don't have permission to subscribe to xkcd", allowedMentions: {} });
                database.write({
                    guildId: message.guildId!,
                    channelId: message.channelId,
                    userId: message.author.id,
                    messageId: message.id,
                    property: "handled",
                    value: [2, reply.id].join("-")
                });
            } else {
                await message.reply({
                    content: "You don't have permission to subscribe to xkcd", allowedMentions: {},
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }

        const channel = await (async () => {
            try {
                if (!channelId) return undefined;
                return await client.channels.fetch(channelId);
            } catch (_e) {
                return undefined;
            }
        })();
        if (!channel || channel.isDMBased() || channel.guildId != message.guildId || !channel.guild.members.me || !channelId) {
            if (!isInteraction) {
                const reply = await message.reply({ content: "Channel not found", allowedMentions: {} });
                database.write({
                    guildId: message.guildId!,
                    channelId: message.channelId,
                    userId: message.author.id,
                    messageId: message.id,
                    property: "handled",
                    value: [2, reply.id].join("-")
                });
            } else {
                await message.reply({
                    content: "Channel not found", allowedMentions: {},
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }

        const prefix = message instanceof ChatInputCommandInteraction ? '/' : database.read({
            guildId: message.guildId!,
            property: "prefix",
        }) ?? ".";

        if (unsub) {
            if (database.read({
                guildId: message.guildId,
                channelId: channelId,
                property: "xkcd",
            }) == "1") {
                database.write({
                    guildId: message.guildId,
                    channelId: channelId,
                    property: "xkcd",
                    value: "0",
                });
                database.remove({
                    guildId: message.guildId,
                    channelId: channelId,
                    property: "xkcd",
                });

                if (!isInteraction) {
                    const reply = await message.reply({ content: `Unsubscribed <#${channelId}>`, allowedMentions: {} });
                    database.write({
                        guildId: message.guildId!,
                        channelId: message.channelId,
                        userId: message.author.id,
                        messageId: message.id,
                        property: "handled",
                        value: [2, reply.id].join("-")
                    });
                } else {
                    await message.reply({
                        content: `Unsubscribed <#${channelId}>`, allowedMentions: {},
                        flags: MessageFlags.Ephemeral
                    });
                }
                return;
            } else {
                if (!isInteraction) {
                    const reply = await message.reply({ content: `<#${channelId}> isn't subscribed`, allowedMentions: {} });
                    database.write({
                        guildId: message.guildId!,
                        channelId: message.channelId,
                        userId: message.author.id,
                        messageId: message.id,
                        property: "handled",
                        value: [2, reply.id].join("-")
                    });
                } else {
                    await message.reply({
                        content: `<#${channelId}> isn't subscribed`, allowedMentions: {},
                        flags: MessageFlags.Ephemeral
                    });
                }
                return;
            }
        } else if (database.read({
            guildId: message.guildId,
            channelId: channelId,
            property: "xkcd",
        }) == "1") {
            if (!isInteraction) {
                const reply = await message.reply({ content: `<#${channelId}> is already subscribed, unsubscribe using \`${prefix}xkcd unsubscribe #${channel.name}\``, allowedMentions: {} });
                database.write({
                    guildId: message.guildId!,
                    channelId: message.channelId,
                    userId: message.author.id,
                    messageId: message.id,
                    property: "handled",
                    value: [2, reply.id].join("-")
                });
            } else {
                await message.reply({
                    content: `<#${channelId}> is already subscribed, unsubscribe using \`${prefix}xkcd unsubscribe #${channel.name}\``, allowedMentions: {},
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }

        const botPermissions = channel.permissionsFor(channel.guild.members.me);
        let testFailed = false;
        if (botPermissions?.has(PermissionsBitField.Flags.SendMessages) && channel.isSendable()) {
            try {
                await channel.send({
                    components: await xkcd.components(await xkcd.latest()),
                    flags: MessageFlags.IsComponentsV2,
                    allowedMentions: {}
                });
            } catch (_e) {
                testFailed = true;
            }
        }

        if (!botPermissions?.has(PermissionsBitField.Flags.SendMessages) || !channel.isSendable() || testFailed) {
            if (!isInteraction) {
                const reply = await message.reply({ content: "Bopper can't send messages in that channel, update permissions and try again", allowedMentions: {} });
                database.write({
                    guildId: message.guildId!,
                    channelId: message.channelId,
                    userId: message.author.id,
                    messageId: message.id,
                    property: "handled",
                    value: [2, reply.id].join("-")
                });
            } else {
                await message.reply({
                    content: "Bopper can't send messages in that channel, update permissions and try again", allowedMentions: {},
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }

        database.write({
            guildId: message.guildId,
            channelId: channelId,
            property: "xkcd",
            value: "1"
        });

        if (!isInteraction) {
            const reply = await message.reply({ content: `Successfully subscribed to xkcd comics!\nUse \`${prefix}xkcd unsubscribe #${channel.name}\` to unsubscribe.`, allowedMentions: {} });
            database.write({
                guildId: message.guildId!,
                channelId: message.channelId,
                userId: message.author.id,
                messageId: message.id,
                property: "handled",
                value: [2, reply.id].join("-")
            });
        } else {
            await message.reply({
                content: `Successfully subscribed to xkcd comics!\nUse \`${prefix}xkcd unsubscribe #${channel.name}\` to unsubscribe.`, allowedMentions: {},
                flags: MessageFlags.Ephemeral
            });
        }

        return;
    }
};