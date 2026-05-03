import { Message, SlashCommandBuilder, ChatInputCommandInteraction, InteractionContextType, MessageFlags } from 'discord.js';
import { ai } from "../ai.ts";

async function generateCorrection(text: string) {
    let response = "";
    try {
        const stream = ai([
            {
                role: "system",
                content: "You correct grammar and spelling. Respond with two lines: 'Corrected: ...' and 'Explanation: ...'. Keep it short and clear."
            },
            {
                role: "user",
                content: text
            }
        ], { web: false });

        for await (const [chunk, thinking] of stream) {
            if (!thinking) response += chunk;
        }
    } catch (_e) {
        return "Failed to contact the AI service.";
    }

    const trimmed = response.trim();
    if (!trimmed.length) return "No correction found.";
    return trimmed.slice(0, 2000);
}

export default {
    match: /^erm(?:\s+(.+))?$/s,
    command: 'erm <text>',
    examples: ['erm I has a apple'],
    description: 'correct grammar/spelling and explain the fix',
    slash: new SlashCommandBuilder().setName("erm").setDescription('Correct grammar/spelling and explain the fix').addStringOption(option => option.setRequired(true).setName("text").setDescription("Text to correct")).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    async handler(message: Message | ChatInputCommandInteraction, match: RegExpMatchArray): Promise<void> {
        let text = message instanceof ChatInputCommandInteraction ? message.options.getString("text", true) : match[1];
        const ephemeral = message instanceof ChatInputCommandInteraction ? !!message.options.getBoolean("ephemeral") : false;

        if (message instanceof ChatInputCommandInteraction) {
            await message.deferReply({ withResponse: true, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
            const output = await generateCorrection(text);
            await message.editReply({ content: output, allowedMentions: {} });
            return;
        }

        if (message.reference?.messageId) {
            const referenced = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
            if (referenced?.content?.trim().length) {
                text = referenced.content;
            }
        }

        if (!text?.trim().length) {
            const reply = await message.reply({ content: "Usage: `erm <text>` (or reply to a message)", allowedMentions: {} });
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

        const reply = await message.reply({ content: "Erm...", allowedMentions: {} });
        const output = await generateCorrection(text);
        await reply.edit({ content: output, allowedMentions: {} });

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
        this.handler(interaction, ["erm", interaction.options.getString("text", true)]);
    }
};
