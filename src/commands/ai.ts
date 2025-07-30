import { Message, MessageFlags } from 'npm:discord.js';
import { ai, splitter } from "../ai.ts";

export default {
    match: /^ai (.+)$/,
    command: 'ai <question>',
    examples: ["ai Is the sky blue?"],
    description: 'ask ai something',
    async handler(message: Message, match: RegExpMatchArray): Promise<void> {
        const ai_stream = ai([{
            role: "system",
            content: "Keep the response short. Only use Discord's markdown features, this means no heading 4, no images and no tables."
        }, {
            role: "user",
            content: `${match[1]}`
        }]);

        let last = +new Date();
        let reply = message.reply({ content: `-# AI response:\n`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds });
        let replyn = 0;
        let ai_response = "";
        let delta: IteratorResult<string, void>;
        while (!(delta = (await ai_stream.next())).done) {
            if ((+new Date() - last) > 500) {
                last = +new Date();
                await (await reply).edit({ content: `-# AI response:\n${splitter(ai_response.trim())[replyn].trim() ?? "‎"}`, allowedMentions: {} });

                if ((splitter(ai_response.trim()).length - 1) > replyn) {
                    replyn++;
                    reply = (message).reply({ content: `${splitter(ai_response.trim())[replyn].trim() ?? "‎"}`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds });
                }
            }

            ai_response += delta.value;
        }

        do {
            await (await reply).edit({ content: `-# AI response:\n${splitter(ai_response.trim())[replyn].trim() ?? "Error"}`, allowedMentions: {} });

            if ((splitter(ai_response.trim()).length - 1) > replyn) {
                replyn++;
                reply = (message).reply({ content: `${splitter(ai_response.trim())[replyn].trim() ?? "Error"}`, allowedMentions: {}, flags: MessageFlags.SuppressEmbeds });
            }
        } while ((splitter(ai_response.trim()).length - 1) > replyn);
    }
};