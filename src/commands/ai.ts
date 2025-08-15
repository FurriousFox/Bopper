import { Message, MessageFlags, Snowflake, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, InteractionResponse, OmitPartialGroupDMChannel } from 'npm:discord.js';
import { ai, splitter } from "../ai.ts";

export default {
    match: /^ai (.+)$/s,
    command: 'ai <prompt>',
    examples: ["ai Is the sky blue?"],
    description: 'ask ai something',
    slash: new SlashCommandBuilder().setName("ai").setDescription('Ask AI something').addStringOption(option => option.setRequired(true).setName("prompt").setDescription("AI prompt")).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    async handler(message: Message<true> | ChatInputCommandInteraction, match: RegExpMatchArray): Promise<void> {
        const replies: Snowflake[] = [];
        const ephemeral = message instanceof ChatInputCommandInteraction ? !!message.options.getBoolean("ephemeral") : false;

        const ai_stream = ai([{
            role: "system",
            content: "Keep the response short. Only use Discord's markdown features, this means no heading 4, no images, no tables and no LaTeX."
        }, {
            role: "user",
            content: `${match[1]}`
        }]);

        let last = +new Date();
        let reply: Promise<InteractionResponse<boolean>> | Promise<OmitPartialGroupDMChannel<Message<true>>> | Promise<Message<boolean>> = message.reply({ content: `-# AI response:\n`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | (ephemeral ? MessageFlags.Ephemeral : 0) });
        let replyn = 0;
        let ai_response = "";
        let delta: IteratorResult<(string | boolean)[], void>;
        let thought = false;
        while (!(delta = (await ai_stream.next())).done) {
            ai_response += delta.value[0];
            if (delta.value[1] && !thought) {
                thought = true;
                last += -500;
            }

            if ((+new Date() - last) > 500) {
                last = +new Date();
                replies.push((await reply).id);
                await (await reply).edit({ content: `${replyn == 0 ? "-# AI response:\n" : ""}${delta.value[1] ? "_thinking..._\n" : ""}${splitter(ai_response.trim())[replyn].trim() ?? "‎"}`, allowedMentions: {} });

                if ((splitter(ai_response.trim()).length - 1) > replyn && !ephemeral) { // it's impossible to edit an ephemeral follow-up message
                    replyn++;
                    if (message instanceof ChatInputCommandInteraction) {
                        reply = (message).followUp({ content: `${splitter(ai_response.trim())[replyn].trim() ?? "‎"}`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | (ephemeral ? MessageFlags.Ephemeral : 0) });
                    } else {
                        reply = (message).reply({ content: `${splitter(ai_response.trim())[replyn].trim() ?? "‎"}`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | (ephemeral ? MessageFlags.Ephemeral : 0) });
                    }
                }

                if ((splitter(ai_response.trim()).length - 1) > replyn && ephemeral) last += 600000;
            }
        }

        do {
            replies.push((await reply).id);
            if (!ephemeral || replyn == 0) await (await reply).edit({ content: `${replyn == 0 ? "-# AI response:\n" : ""}${splitter(ai_response.trim())[replyn].trim() ?? "Error"}`, allowedMentions: {} });

            if ((splitter(ai_response.trim()).length - 1) > replyn) {
                replyn++;
                if (message instanceof ChatInputCommandInteraction) {
                    reply = (message).followUp({ content: `${splitter(ai_response.trim())[replyn].trim() ?? "‎"}`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | (ephemeral ? MessageFlags.Ephemeral : 0) });
                } else {
                    reply = (message).reply({ content: `${splitter(ai_response.trim())[replyn].trim() ?? "‎"}`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds | (ephemeral ? MessageFlags.Ephemeral : 0) });
                }
                replies.push((await reply).id);
            }
        } while ((splitter(ai_response.trim()).length - 1) > replyn);

        if (!(message instanceof ChatInputCommandInteraction)) database.write({
            guildId: message.guildId,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, ...new Set(replies)].join("-")
        });
    },
    interactionHandler(interaction: ChatInputCommandInteraction) {
        this.handler(interaction, ["", interaction.options.getString("prompt") ?? ""]);
    }
};