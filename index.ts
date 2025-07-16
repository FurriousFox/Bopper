import { Client, Events, GatewayIntentBits, Snowflake } from 'npm:discord.js';
import './src/database.ts';
import { updateRep } from './src/rep.ts';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, message => {
    if (!message.guildId || message.author.bot || message.author.system) return;
    updateRep(message.guildId, message.author.id, +1);
    // console.log("new rep:", updateRep(message.guildId, message.author.id, +1));
});

client.login(Deno.env.get("DISCORD_TOKEN"));