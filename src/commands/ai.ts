import { Message, MessageFlags, Snowflake, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, InteractionResponse, OmitPartialGroupDMChannel, ButtonBuilder, ActionRowBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { ai } from "../ai.ts";

export default {
    match: /^ai (.+)$/s,
    command: 'ai <prompt>',
    examples: ["ai Is the sky blue?"],
    description: 'ask ai something',
    async handler(message: Message<true>, match: RegExpMatchArray, reason?: string): Promise<void> {
        const web = (reason == "retry_web_search" || reason == "web_search");

        const ai_stream = ai([{
            role: "system",
            content: "Keep the response short. Only use Discord's markdown features, this means no heading 4, no images, no tables and no LaTeX."
        }, {
            role: "user",
            content: `${match[1]}`
        }], { web });

        const reply = message.reply({ content: `-# AI response:\n_thinking..._`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds });
        if (web) (async () => {
            await reply;
            await message.channel.sendTyping();
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

                        await (await reply).edit({ content: `-# AI response:\n${(thinking || forcedEdit) ? `_thinking..._\n\n${ai_thought_formatted.length > 1900 ? "..." + ai_thought_formatted.slice(-1900) : ai_thought_formatted}` : ""}${(thinking || forcedEdit) ? "" : ai_response}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds });
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

        // Must be 2000 or fewer in length.
        const components = [];
        if (!web) components.push(new ButtonBuilder().setLabel("Use web search").setCustomId("retry_web_search").setStyle(ButtonStyle.Secondary).setEmoji("🌐"));
        if (ai_thought.trim().length) components.push(new ButtonBuilder().setLabel("Show reasoning").setCustomId("show_reasoning").setStyle(ButtonStyle.Secondary).setEmoji("💡"));

        (await reply).edit({
            content: `-# AI response:\n${ai_response}`.slice(0, 2000), allowedMentions: {}, flags: MessageFlags.SuppressEmbeds,
            ...(components.length ? { components: [(new ActionRowBuilder().addComponents(...components).toJSON())] } : {}),
        });
        console.log(ai_response);

        if (!(message instanceof ChatInputCommandInteraction)) database.write({
            guildId: message.guildId,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, (await reply).id].join("-")
        });
    },
    buttonIds: ["retry_web_search", "show_reasoning"],
    async buttonHandler(buttonId: string, interaction: ButtonInteraction, rehandle: () => void) {
        switch (buttonId) {
            case "retry_web_search":
                rehandle();
                break;
            case "show_reasoning":
                break;
        }
    }
};
