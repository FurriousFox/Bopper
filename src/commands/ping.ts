import { Message, SnowflakeUtil } from 'npm:discord.js';

export default {
    match: /^ping|pong$/,
    command: 'ping',
    examples: [],
    description: 'check bot ping and your latency',
    handler(message: Message): void {
        let response = '';
        const nonce = message.nonce ? SnowflakeUtil.timestampFrom(message.nonce.toString()) : undefined;
        const id = SnowflakeUtil.timestampFrom(message.id);
        const now = +new Date();

        if (nonce) response += `latency:   ${Math.round((id - nonce))}ms`;
        response += `\nping: ${nonce ? "        " : ""}${Math.round((now - id))}ms\n`;

        if (nonce) response += "\n-# latency: time between you sending your message, and the message being received by discord";
        response += "\n-# ping: time between discord receiving your message, and the message being received by the bot";

        message.reply({ content: response, allowedMentions: {} });
    }
};