import { Client, Events, GatewayIntentBits, Snowflake } from 'npm:discord.js';
import database from './src/database.ts';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    writeDB({
        guildId: "test" as Snowflake,
        property: "rep",
        value: "valueyay"
    });

    console.log(readDB({
        guildId: "test" as Snowflake,
        property: "test"
    }));
});

client.on(Events.MessageCreate, message => {
    if (!message.guildId) return;


    writeDB({
        guildId: message.guildId,

    });

    // if (!database.rep[message.guildId]) database.rep[message.guildId] = {};
    // if (!database.rep[message.guildId][message.author.id]) database.rep[message.guildId][message.author.id] = 0;
    // database.rep[message.guildId][message.author.id] += 1;

    // console.log(database.rep[message.guildId][message.author.id]);
});

client.login(Deno.env.get("DISCORD_TOKEN"));