import { Client, Events, GatewayIntentBits, Partials, Snowflake as _Snowflake } from 'npm:discord.js';
import './src/database.ts';
import { handleMessage } from "./src/handle.ts";
import { updateLapos } from './src/lapo.ts';
import process from "node:process";

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

let botPrefix: undefined | string;
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    botPrefix = `<@${readyClient.user.id}>`;

    lapoTimeout();
});

function lapoTimeout() {
    const tomorrow = new Date(new Date());
    tomorrow.setDate((new Date()).getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msTillNextDay = Math.floor((tomorrow.getTime() - (new Date()).getTime()));
    setTimeout(() => {
        lapoTimeout();

        const yesterdate = `${new Date(+new Date() - 5000).getDate()}D${new Date(+new Date() - 5000).getFullYear()}D${new Date(+new Date() - 5000).getMonth()}`;
        const lapos = database.readAll({
            like: `A`,
            property: `lapo${yesterdate}`,
        }).sort((a, b) => +(a.value) - +(b.value));

        const laporesults: Record<string, string[]> = {};
        for (const lapo of lapos) {
            laporesults[lapo.key.split("A")[0]] = [lapo.key.split("A")[1].split("--")[0], lapo.key.split("--")[1]];
        }

        for (const serverId of Object.keys(laporesults)) {
            const channelId = laporesults[serverId][0];
            const userId = laporesults[serverId][1];

            try {
                client.channels.fetch(channelId).then(channel => {
                    if (channel && 'send' in channel) channel.send(`W00t <@${userId}>!`).catch(console.error);
                }).catch(() => { });
            } catch (_e) { /*  */ }

            updateLapos(serverId, userId);
        }
    }, msTillNextDay + 1000);
}

client.on(Events.MessageCreate, message => handleMessage(message, botPrefix));
client.on(Events.MessageUpdate, (_oldMessage, message) => handleMessage(message, botPrefix, false));

client.login(Deno.env.get("DISCORD_TOKEN"));
