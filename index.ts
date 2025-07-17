import { Client, Events, GatewayIntentBits, Partials, Snowflake as _Snowflake } from 'npm:discord.js';
import './src/database.ts';
import { watchFile } from "node:fs";
import { handleMessage } from "./src/handle.ts";

watchFile(import.meta.filename ?? "index.ts", {
    interval: 100,
}, () => {
    Deno.exit(0);
});
watchFile("./src/database.ts", {
    interval: 100,
}, () => {
    Deno.exit(0);
});
watchFile("./src/handle.ts", {
    interval: 100,
}, () => {
    Deno.exit(0);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

let botPrefix: undefined | string;
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    botPrefix = `<@${readyClient.user.id}>`;
});

client.on(Events.MessageCreate, message => handleMessage(message, botPrefix));
client.on(Events.MessageUpdate, (_oldMessage, message) => handleMessage(message, botPrefix, false));

client.login(Deno.env.get("DISCORD_TOKEN"));