import { Message, MessageFlags, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, InteractionResponse, OmitPartialGroupDMChannel, ButtonBuilder, ActionRowBuilder, ButtonStyle, ButtonInteraction, ContextMenuCommandBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction, ContextMenuCommandInteraction, InteractionCallbackResponse } from 'discord.js';
import { ai, splitter, splitter4000 } from "../ai.ts";

export default {
    match: /^ai (.+)$/s,
    matchFunction: function (message: Message) {
        if ('reference' in message && message.reference?.messageId && (metabase.readAll({
            property: "ai_context",
            like: `C%-${message.reference.messageId}-`
        })?.[0]?.value) !== undefined) {
            return true;
        } else return false;
    },
    command: 'ai <prompt>',
    examples: ["ai Is the sky blue?"],
    description: 'ask ai something',
    slash: new SlashCommandBuilder().setName("ai").setDescription('Ask AI something').addStringOption(option => option.setRequired(true).setName("prompt").setDescription("AI prompt")).addBooleanOption(option => option.setRequired(false).setName("web").setDescription("Search the web")).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    context: [new ContextMenuCommandBuilder().setName('ai').setType(ApplicationCommandType.Message).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]), new ContextMenuCommandBuilder().setName('ai (web search)').setType(ApplicationCommandType.Message).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel])],
    async handler(message: Message<true> | ChatInputCommandInteraction | MessageContextMenuCommandInteraction, match: RegExpMatchArray | boolean, reason?: string): Promise<void> {
        const ephemeral = message instanceof ChatInputCommandInteraction ? message.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : 0 : 0;
        const isInteraction = message instanceof ChatInputCommandInteraction || message instanceof ContextMenuCommandInteraction;
        const withResponse = isInteraction ? { withResponse: true } : {};

        let web = (reason == "retry_web_search" || reason == "web_search");
        if (message instanceof ChatInputCommandInteraction) {
            web = !!message.options.getBoolean("web");
        }

        let context: string;
        let context_a: Array<{ role: "user" | "system" | "assistant", content: string; }> = [];
        if ('reference' in message && message.reference?.messageId && (context = metabase.readAll({
            property: "ai_context",
            like: `C%-${message.reference.messageId}-`
        })?.[0]?.value) !== undefined) {
            try {
                context_a = JSON.parse(context)?.messages;
                if (!(context_a instanceof Array)) context_a = [];
            } catch (_) { /*  */ }
        }

        const ai_stream = ai([{
            role: "system",
            content: "Keep the response short. Only use Discord's markdown features, this means no heading 4, no images, no tables and no LaTeX."
        }, ...context_a, {
            role: "user",
            content: `${typeof match == "boolean" ? (message as Message).content : match[1]}`
        }], { web });

        const replies: (typeof reply)[] = [];

        let reply: Promise<Message> | Message | Promise<InteractionResponse> | InteractionResponse | Promise<OmitPartialGroupDMChannel<Message>> | OmitPartialGroupDMChannel<Message> = message.reply({ content: `-# AI response:\n_thinking..._`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | ephemeral, ...withResponse });
        replies.push(reply);

        if (web) (async () => {
            await reply;
            if (message instanceof Message) await message.channel.sendTyping();
        })();

        let ai_response = "";
        let ai_thought = "";

        let delta: IteratorResult<[string, boolean], void>;

        let canEdit: boolean = true;
        let canEditPromise: boolean | Promise<boolean> = true;
        let shouldEdit = false;
        let forceEdit = false;

        let skipWaitResolve;
        const skipWait = new Promise(r => skipWaitResolve = r);

        let wasThinking = true;

        while (!(delta = (await ai_stream.next() as IteratorResult<[string, boolean], void>)).done) {
            const [text, thinking] = (delta.value);

            if (text.trim().length) shouldEdit = true;

            if (thinking) ai_thought += text;
            else ai_response += text;

            if (!thinking && wasThinking && ai_thought.length) forceEdit = true;
            wasThinking = thinking;

            const ai_response_splits = splitter(ai_response.trim()).map(e => e.trim() ?? "_ _");

            if ((canEdit && shouldEdit) || forceEdit) {
                const forcedEdit = forceEdit;
                forceEdit = false;

                if (forcedEdit) await canEditPromise;

                canEdit = false;
                shouldEdit = false;

                // deno-lint-ignore no-async-promise-executor
                canEditPromise = new Promise(async resolve => {
                    try {
                        const ai_thought_formatted = ai_thought.split("\n").map(e => e.trim().length ? `-# ${e}` : e).join("\n").trim();

                        if (isInteraction) {
                            await message.editReply({ message: (await reply).id, content: `-# AI response:\n${(thinking || forcedEdit) ? `_thinking..._\n\n${ai_thought_formatted.length > 1900 ? "..." + ai_thought_formatted.slice(-1900) : ai_thought_formatted}` : ""}${(thinking || forcedEdit) ? "" : ai_response_splits[replies.length - 1]}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | ephemeral });
                        } else {
                            await (await reply).edit({ content: `-# AI response:\n${(thinking || forcedEdit) ? `_thinking..._\n\n${ai_thought_formatted.length > 1900 ? "..." + ai_thought_formatted.slice(-1900) : ai_thought_formatted}` : ""}${(thinking || forcedEdit) ? "" : ai_response_splits[replies.length - 1]}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | ephemeral });
                        }

                        if (ai_response_splits.length > replies.length) {
                            if (isInteraction) {
                                reply = await message.followUp({ content: `${ai_response_splits[replies.length]}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | ephemeral, ...withResponse });
                            } else {
                                reply = await message.reply({ content: `${ai_response_splits[replies.length]}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | ephemeral, ...withResponse });
                            }
                            replies.push(reply);
                        }
                    } finally {
                        await Promise.allSettled([Promise.any([skipWait, new Promise(r => setTimeout(r, 500))]), ...(forcedEdit ? [new Promise(r => setTimeout(r, 1000))] : [])]);

                        canEdit = true;
                        resolve(true);
                    }
                });
            }
        }

        skipWaitResolve!();
        await canEditPromise;

        const components = [];
        if (!web && !isInteraction) components.push(new ButtonBuilder().setLabel("Use web search").setCustomId("retry_web_search").setStyle(ButtonStyle.Secondary).setEmoji("🌐"));
        if (ai_thought.trim().length) components.push(new ButtonBuilder().setLabel("Show reasoning").setCustomId("show_reasoning").setStyle(ButtonStyle.Secondary).setEmoji("💡"));

        const ai_response_splits = splitter(ai_response.trim()).map(e => e.trim() ?? "_ _");

        if (isInteraction) {
            await message.editReply({
                message: (await reply).id, content: `${replies.length == 1 ? "-# AI response:\n" : ""}${ai_response_splits[replies.length - 1]}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds,
                ...((components.length && ai_response_splits.length == replies.length) ? { components: [(new ActionRowBuilder().addComponents(...components).toJSON())] } : {}),
            });
        } else {
            await (await reply).edit({
                content: `${replies.length == 1 ? "-# AI response:\n" : ""}${ai_response_splits[replies.length - 1]}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds,
                ...((components.length && ai_response_splits.length == replies.length) ? { components: [(new ActionRowBuilder().addComponents(...components).toJSON())] } : {}),
            });
        }

        if (ai_thought.trim().length && components.length && ai_response_splits.length == replies.length) {
            reply = await reply;
            metabase.write({
                guildId: message.guildId!,
                channelId: message.channelId,
                userId: message instanceof Message ? message.author.id : message.user.id,
                messageId: `${(reply instanceof InteractionCallbackResponse && reply.resource?.message?.id) ? reply.resource.message.id : reply.id}`,
                property: "reasoning",
                value: ai_thought
            });
        }



        while (ai_response_splits.length > replies.length) {
            if (ai_response_splits.length > replies.length) {
                if (isInteraction) {
                    replies.push(reply = message.followUp({
                        content: `${ai_response_splits[replies.length]}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | ephemeral,
                        ...withResponse,
                        ...((components.length && ai_response_splits.length == (replies.length + 1)) ? { components: [(new ActionRowBuilder().addComponents(...components).toJSON())] } : {}),
                    }));
                } else {
                    replies.push(reply = message.reply({
                        content: `${ai_response_splits[replies.length]}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | ephemeral,
                        ...withResponse,
                        ...((components.length && ai_response_splits.length == (replies.length + 1)) ? { components: [(new ActionRowBuilder().addComponents(...components).toJSON())] } : {}),
                    }));
                }

                if (ai_thought.trim().length && components.length && ai_response_splits.length == replies.length) {
                    reply = await reply;
                    metabase.write({
                        guildId: message.guildId!,
                        channelId: message.channelId,
                        userId: message instanceof Message ? message.author.id : message.user.id,
                        messageId: `${(reply instanceof InteractionCallbackResponse && reply.resource?.message?.id) ? reply.resource.message.id : reply.id}`,
                        property: "reasoning",
                        value: ai_thought
                    });
                }
            }
        }

        // console.log(ai_response);

        const reply_ids = [];
        for await (const reply of replies) {
            if (reply instanceof InteractionCallbackResponse && reply.resource?.message?.id)
                reply_ids.push(reply.resource.message.id);
            else
                reply_ids.push(reply.id);
        }

        metabase.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message instanceof Message ? message.author.id : message.user.id,
            messageId: `-${message.id}-${reply_ids.join("-")}-`,
            property: "ai_context",
            value: JSON.stringify({
                messages: [
                    ...context_a,
                    { role: "user", content: `${typeof match == "boolean" ? (message as Message).content : match[1]}` },
                    { role: "assistant", content: ai_response }
                ]
            })
        });

        if (!isInteraction) database.write({
            guildId: message.guildId,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, ...reply_ids].join("-")
        });
    },
    interactionHandler(interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction) {
        if (interaction instanceof ChatInputCommandInteraction) {
            this.handler(interaction, ["", interaction.options.getString("prompt") ?? ""]);
        } else {
            const web = interaction.commandName.includes("web");
            this.handler(interaction, ["", interaction.targetMessage.content], web ? "web_search" : undefined);
        }
    },
    buttonIds: ["retry_web_search", "show_reasoning"],
    async buttonHandler(buttonId: string, interaction: ButtonInteraction, rehandle: () => void) {
        switch (buttonId) {
            case "retry_web_search":
                try {
                    const oAuthor = (await interaction.message.fetchReference()).author.id;
                    if (oAuthor == interaction.user.id) rehandle();
                    else interaction.reply({ content: `You can't interact with <@${oAuthor}>'s message!`, allowedMentions: {}, flags: MessageFlags.Ephemeral });
                } catch (_) {/*  */ }
                break;
            case "show_reasoning":
                if (metabase.readAll({ property: "reasoning", like: `C${interaction.message.id}` }).length) {
                    const reasoning = metabase.readAll({ property: "reasoning", like: `C${interaction.message.id}` })[0].value;
                    const reasoning_splits = splitter4000(reasoning.trim()).filter(e => e.trim()).map(e => e.trim() ?? "_ _");

                    let a: "reply" | "followUp" = "reply";
                    for (const reasoning_split of reasoning_splits) {
                        await interaction[a]({
                            embeds: [{
                                title: 'Reasoning',
                                description: reasoning_split,
                                color: /* green */ 0x57F287
                            }],
                            flags: MessageFlags.Ephemeral
                        });
                        a = "followUp";
                    }
                } else {
                    await interaction.reply({
                        embeds: [{
                            title: 'Unknown reasoning',
                            description: 'There was either no reasoning at all, or the reasoning got lost in time.',
                            color: /* red */ 0xED4245
                        }],
                        flags: MessageFlags.Ephemeral
                    });
                }
                break;
        }
    }
};
