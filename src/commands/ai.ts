import { Message } from 'npm:discord.js';

function getChunk(text: string, maxLen: number = 1900): { chunk: string, remainder: string; } {
    if (text.length <= maxLen) return { chunk: text, remainder: '' };
    let idx = text.lastIndexOf(' ', maxLen);
    if (idx === -1 || idx < 1000) {
        idx = maxLen;
    }
    return { chunk: text.slice(0, idx), remainder: text.slice(idx) };
}

export default {
    match: /^ai (.+)$/,
    command: 'ai',
    examples: [],
    description: 'ask ai something',
    async handler(message: Message, match: RegExpMatchArray): Promise<void> {
        let answer = "";
        let resdata = '';
        const res = await fetch("https://ai.hackclub.com/chat/completions", {
            method: "POST",
            body: JSON.stringify({
                messages: [{
                    role: "user",
                    content: `${match[1]}`
                }],
                stream: true
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let reply = await message.reply({ content: "## AI response:\n\n``", allowedMentions: {} });

        let last = +new Date();
        let g = false;

        while (true) {
            let read;
            try { read = await reader.read(); } catch (_e) { break; }

            resdata += decoder.decode(read.value);

            if (resdata.includes("\n")) {
                const complete = resdata.slice(0, -resdata.split("\n").at(-1)!.length - 1).split("\n");
                resdata = resdata.split("\n").at(-1)!;

                for (const com of complete) {
                    const respd = JSON.parse(com);
                    if (respd.object == "chat.completion.chunk") {
                        if (respd?.choices?.[0]?.delta?.content != undefined) {
                            answer += respd.choices[0].delta.content;

                            if ((+new Date() - last) > 500) {
                                const parts = getChunk(answer);
                                await reply.edit({ content: `${g ? '' : '## AI response:\n\n'}${parts.chunk}`, allowedMentions: {} });
                                last = +new Date();
                                if (answer.length > parts.chunk.length) {
                                    g = true;
                                    answer = parts.remainder;
                                    const nextParts = getChunk(answer);
                                    reply = await message.reply({ content: `${nextParts.chunk}`, allowedMentions: {} });
                                    answer = nextParts.remainder;
                                }
                            }
                        }
                    }
                }
            }

            if (read.done) {
                break;
            };
        }

        const parts = getChunk(answer);
        await reply.edit({ content: `${g ? '' : '## AI response:\n\n'}${parts.chunk}`, allowedMentions: {} });
        answer = parts.remainder;
        while (answer.length > 0) {
            const np = getChunk(answer);
            g = true;
            reply = await message.reply({ content: `${np.chunk}`, allowedMentions: {} });
            answer = np.remainder;
        }
    }
};