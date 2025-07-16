import { Client, Events, GatewayIntentBits, Partials, Snowflake as _Snowflake, Message, OmitPartialGroupDMChannel } from 'npm:discord.js';
import './src/database.ts';
import { updateRep } from './src/rep.ts';
import { watchFile } from "node:fs";
import path from "node:path";

const commands: {
    match: RegExp,
    command: string,
    examples: string[],
    description: string,
    handler: (message: OmitPartialGroupDMChannel<Message<boolean>>, match?: RegExpMatchArray) => void;
}[] = [];

for (const { name: command } of Deno.readDirSync(path.join(import.meta.dirname ?? "", "./src/commands")).filter(e => e.isFile)) {
    commands.push((await import(path.join(import.meta.dirname ?? "", "./src/commands/", command))).default);

    watchFile(path.join(import.meta.dirname ?? "", "./src/commands/", command), {
        interval: 100,
    }, () => {
        Deno.exit(0);
    });
}

watchFile(import.meta.filename ?? "index.ts", {
    interval: 100,
}, () => {
    Deno.exit(0);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

let botPrefix: undefined | string;
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    botPrefix = `<@${readyClient.user.id}>`;
});

client.on(Events.MessageCreate, message => {
    if (!message.guildId || message.author.bot || message.author.system) return;
    updateRep(message.guildId, message.author.id, +1);

    const prefix = database.read({
        guildId: message.guildId!,
        property: "prefix",
    });

    if (!message.content.startsWith(prefix ?? ".")) {
        if (botPrefix !== undefined) if (message.content.startsWith(botPrefix)) message.content = message.content.substring(botPrefix.length + +(message.content[botPrefix.length] == " ")); else return;
    } else message.content = message.content.substring(1);

    const handlers = commands.map(command => { return { command: command, match: message.content.match(command.match) }; }).filter(e => e.match !== null);
    for (const { command: { handler }, match } of handlers) {
        handler(message, match!);
    }
});

client.login(Deno.env.get("DISCORD_TOKEN"));