import { Client, Events, GatewayIntentBits, Partials, Snowflake as _Snowflake, SlashCommandBuilder, Routes, ContextMenuCommandBuilder } from 'npm:discord.js';
import './src/database.ts';
import { handleMessage, handleInteraction, handleDelete } from "./src/handle.ts";
import { updateLapos } from './src/lapo.ts';
import process from "node:process";
import path from "node:path";

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

let botPrefix: undefined | string;
client.once(Events.ClientReady, async readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    botPrefix = `<@${readyClient.user.id}>`;

    lapoTimeout();

    const commands: (SlashCommandBuilder | ContextMenuCommandBuilder)[] = [];
    for (const { name: command } of Deno.readDirSync(path.join(import.meta.dirname ?? "", "./src/commands")).filter(e => e.isFile)) {
        const command_import = (await import(path.join(import.meta.dirname ?? "", "./src/commands/", command))).default;
        if (command_import.slash) commands.push(command_import.slash);
        if (command_import.context) commands.push(command_import.context);
    }

    const commandHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(commands.map(e => e.toJSON())))))).map((b) => b.toString(16).padStart(2, "0")).join("");

    if (database.read({
        guildId: "-1",
        property: "commandsHash"
    }) == commandHash) return;
    else {
        database.write({
            guildId: "-1",
            property: "commandsHash",
            value: commandHash
        });

        console.log("updating application commands...");
        client.rest.put(Routes.applicationCommands(readyClient.user.id), { body: commands.map(e => e.toJSON()) }).then(() => {
            console.log('updated application commands!');
        }).catch(console.error);
    }
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
            laporesults[lapo.key.split("A")[0]] = [lapo.key.split("A")[1].split("--")[0], lapo.key.split("--")[1].split("C")[0]];
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
client.on(Events.MessageUpdate, (_oldMessage, message) => handleMessage(message, botPrefix, true));
client.on(Events.MessageDelete, message => handleDelete(message));
client.on(Events.InteractionCreate, interaction => handleInteraction(interaction));

client.login(Deno.env.get("DISCORD_TOKEN"));
