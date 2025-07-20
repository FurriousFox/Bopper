import { updateRep } from './rep.ts';
import path from "node:path";
import { Message, PartialMessage, SlashCommandBuilder, Interaction, ChatInputCommandInteraction, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ButtonInteraction } from "npm:discord.js";
import { invite } from './add.ts';

const commands: {
    match: RegExp;
    command: string;
    examples: string[];
    description: string;
    slash?: SlashCommandBuilder;
    context?: ContextMenuCommandBuilder;
    handler: (message: Message, match?: RegExpMatchArray) => void | Promise<void>;
    interactionHandler?: (interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction, match?: RegExpMatchArray) => void | Promise<void>;
}[] = [];

for (const { name: command } of Deno.readDirSync(path.join(import.meta.dirname ?? "", "./commands")).filter(e => e.isFile)) {
    commands.push((await import(path.join(import.meta.dirname ?? "", "./commands/", command))).default);
}


export async function handleMessage(message: Message | PartialMessage, botPrefix: string | undefined, gainRep = true) {
    if (message.partial) {
        message = await message.fetch();
    }
    if (!message.guildId || message.author.bot || message.author.system) return;
    if (gainRep) updateRep(message.guildId, message.author.id, +1);
    if (!gainRep) if (database.read({
        guildId: message.guildId,
        channelId: message.channelId,
        userId: message.author.id,
        messageId: message.id,
        property: "handled",
    }) !== undefined) return;

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

    if (!message.content.startsWith(prefix ?? ".")) {
        if (botPrefix !== undefined) if (message.content.startsWith(botPrefix)) message.content = message.content.substring(botPrefix.length + +(message.content[botPrefix.length] == " ")); else return;
    } else message.content = message.content.substring(1);

    const handlers = commands.map(command => { return { command: command, match: message.content.match(new RegExp(command.match.source, command.match.flags.includes('i') ? command.match.flags : command.match.flags + 'i')) }; }).filter(e => e.match !== null);
    if (handlers.length > 0) database.write({
        guildId: message.guildId,
        channelId: message.channelId,
        userId: message.author.id,
        messageId: message.id,
        property: "handled",
        value: 1
    });
    for (const { command: { handler }, match } of handlers) {
        await handler(message, match!);
    }
};

export function handleInteraction(interaction: Interaction) {
    if (interaction instanceof ChatInputCommandInteraction) { // slash command
        /*
            group dm / generic dms / dms with the bot: guildId == null
            guild: guildId !== null
        */

        commands.find(command => command.slash?.name == interaction.commandName)?.interactionHandler?.(interaction);
    } else if (interaction instanceof MessageContextMenuCommandInteraction) {
        commands.find(command => command.context?.name == interaction.commandName)?.interactionHandler?.(interaction);
    } else if (interaction instanceof ButtonInteraction) {
        if (interaction.customId == "public_add") invite(interaction);
    }
}
