import { updateRep } from './rep.ts';
import path from "node:path";
import { Message, PartialMessage, SlashCommandBuilder, Interaction, ChatInputCommandInteraction, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ButtonInteraction } from "discord.js";
import { invite } from './invite.ts';

type command = {
    match: RegExp;
    matchFunction?: (message: Message) => boolean;
    command: string;
    examples: string[];
    description: string;
    slash?: SlashCommandBuilder;
    context?: ContextMenuCommandBuilder | ContextMenuCommandBuilder[];
    handler: (message: Message<true>, match?: RegExpMatchArray | true, reason?: string) => void | Promise<void>;
    interactionHandler?: (interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction, match?: RegExpMatchArray) => void | Promise<void>;
    buttonIds: string[];
    buttonHandler: (buttonId: string, interaction: ButtonInteraction, rehandle?: () => void) => void | Promise<void>;
};
const commands: command[] = [];

for (const { name: command } of Deno.readDirSync(path.join(import.meta.dirname ?? "", "./commands")).filter(e => e.isFile)) {
    commands.push((await import(path.join(import.meta.dirname ?? "", "./commands/", command))).default);
}


export async function handleMessage(message: Message | PartialMessage, botPrefix: string | undefined, isEdit = false, reason?: string) {
    if (message.partial) {
        message = await message.fetch();
    }
    if (!message.inGuild() || !message.guildId || message.author.bot || message.author.system) return;
    if (!isEdit) updateRep(message.guildId, message.author.id, +1);
    if (isEdit) {
        handleDelete(message);

        if (database.read({
            guildId: message.guildId,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
        }) !== undefined) return;
    }

    // streak update [first, last]
    const streak = (database.read({
        guildId: message.guildId,
        userId: message.author.id,
        property: "streak",
    }) ?? "0-0").split("-").map(e => parseInt(e));
    if (((+new Date()) - streak[1]) < 48 * 3600 * 1000) {
        database.write({
            guildId: message.guildId,
            userId: message.author.id,
            property: "streak",
            value: `${streak[0]}-${+new Date()}`
        });
    } else {
        database.write({
            guildId: message.guildId,
            userId: message.author.id,
            property: "streak",
            value: `${+new Date()}-${+new Date()}`
        });
    }

    const prefix = database.read({
        guildId: message.guildId!,
        property: "prefix",
    });

    let prefixed = true;
    if (!message.content.startsWith(prefix ?? ".")) {
        if (botPrefix !== undefined) if (message.content.startsWith(botPrefix)) message.content = message.content.substring(botPrefix.length + +(message.content[botPrefix.length] == " "));
        else prefixed = false; else prefixed = false;
    } else message.content = message.content.substring(1);

    let handlers: {
        command: command;
        match: RegExpMatchArray | true;
    }[] = [];
    if (prefixed) handlers = [...handlers, ...commands.map(command => { return { command: command, match: message.content.match(command.match.ignoreCase ? command.match : new RegExp(command.match, `${command.match.flags}i`)) }; }).filter(e => e.match !== null)] as typeof handlers;
    handlers = [...handlers, ...commands.map(command => { return { command: command, match: command?.matchFunction?.(message) }; }).filter(e => (e.match !== undefined && e.match !== false))] as typeof handlers;

    if (handlers.length > 0) database.write({
        guildId: message.guildId,
        channelId: message.channelId,
        userId: message.author.id,
        messageId: message.id,
        property: "handled",
        value: 1
    });
    for (const { command: { handler }, match } of handlers) {
        try {
            await handler(message, match!, reason);
        } catch (e) { console.log(e); }
    }
};

export function handleInteraction(interaction: Interaction, botPrefix: string | undefined) {
    if (interaction instanceof ChatInputCommandInteraction) { // slash command
        /*
            group dm / generic dms / dms with the bot: guildId == null
            guild: guildId !== null
        */

        commands.find(command => command.slash?.name == interaction.commandName)?.interactionHandler?.(interaction);
    } else if (interaction instanceof MessageContextMenuCommandInteraction) {
        commands.find(command => {
            if (command.context instanceof Array) {
                return command.context.filter(context => context?.name == interaction.commandName).length > 0;
            } else {
                return command.context?.name == interaction.commandName;
            }
        })?.interactionHandler?.(interaction);
    } else if (interaction instanceof ButtonInteraction) {
        if (interaction.customId == "public_add") invite(interaction);
        else commands.find(command => command.buttonIds?.includes(interaction.customId))?.buttonHandler?.(interaction.customId, interaction,
            async () => { try { if (interaction.message.reference) { const ref = await interaction.message.fetchReference(); handleDelete(ref); } } catch (_) {/*  */ console.log(_); } finally { try { handleMessage(await interaction.message.fetchReference(), botPrefix, true, interaction.customId); } catch (_) {/*  */ } } });
    }
}

export function handleDelete(message: Message | PartialMessage) {
    if (!message.inGuild() /* || message.author?.bot */ || message.author?.system) return;
    let state: string | undefined;
    if ((state = database.readAll({
        property: "handled",
        like: `${message.guildId}A${message.channelId}--%C${message.id}`
    })?.[0]?.value) !== undefined) {
        const key = database.readAll({
            property: "handled",
            like: `${message.guildId}A${message.channelId}--%C${message.id}`
        })[0].key;
        const _author = database.readAll({
            property: "handled",
            like: `${message.guildId}A${message.channelId}--%C${message.id}`
        })[0].key.split("--")[1].split("C")[0];

        if (state.split("-")[0] == "1") { /*  */ }
        else if (state.split("-")[0] == "2") {
            for (const reply of state.split("-").slice(1)) {
                try {
                    message.channel.messages.fetch(reply).then(message => message.delete().catch(() => { })).catch(() => { }).then(() => { });
                } catch { /*  */ }
            }

            database.remove({
                property: "handled",
                key: key,
            });
        }
        else if (state.split("-")[0] == "3") {
            database.remove({
                property: state.split("-")[1],
                key: key,
            });
            database.remove({
                property: "handled",
                key: key,
            });

            try {
                message?.reactions?.cache?.find(reaction => reaction.me)?.users?.remove(message.client.user.id).catch(() => { });
            } catch { /*  */ }
        }

    }
}