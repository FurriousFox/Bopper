import path from "node:path";
import { Message, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, MessageFlags, ApplicationCommandType, ApplicationCommandOptionType, Collection, GuildResolvable, ApplicationCommand, SlashCommandOptionsOnlyBuilder } from 'discord.js';
const commands: {
    command: string;
    examples: string[];
    description: string;
    slash?: SlashCommandOptionsOnlyBuilder;
    slashName?: string;
}[] = [];
for (const { name: command } of Deno.readDirSync(path.join(import.meta.dirname ?? "./")).filter(e => e.isFile)) {
    if (command === "help.ts") continue;

    commands.push((await import(path.join(import.meta.dirname ?? "./", command))).default);
}

let commands_registered: Collection<string, ApplicationCommand<{
    guild: GuildResolvable;
}>> | undefined;


const help = {
    match: /^help$/,
    command: 'help',
    examples: [],
    description: 'list all commands',
    slash: new SlashCommandBuilder().setName("help").setDescription('List all commands').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    async handler(message: Message | ChatInputCommandInteraction): Promise<void> {
        let commands_registered_names: string[][];
        if (message instanceof ChatInputCommandInteraction && commands_registered == undefined) {
            commands_registered = await message.client.application.commands.fetch();
        }
        if (message instanceof ChatInputCommandInteraction) {
            commands_registered_names = commands_registered!.filter(e => e.type == ApplicationCommandType.ChatInput).map(command => {
                if (!command.options.filter(e => e.type == ApplicationCommandOptionType.Subcommand).length) return [[command.name, command.id]];
                return [[command.name, command.id], ...command.options.filter(e => e.type == ApplicationCommandOptionType.Subcommand).map(e => [`${command.name} ${e.name}`, command.id])];
            }).flat();
        }


        let reply;
        const prefix = message instanceof ChatInputCommandInteraction ? '/' : database.read({
            guildId: message.guildId!,
            property: "prefix",
        }) ?? ".";
        const ephemeral = message instanceof ChatInputCommandInteraction ? !!message.options.getBoolean("ephemeral") : false;

        const commands_text = commands.map(command => {
            if (prefix == `\``) return `**${prefix.replace("`", "\\`")}${command.command}**: ${command.description}${command.examples.length ? ` (\`\`${prefix.replace("`", " \`")}${command.examples.join(`\`\`, \`\`${prefix.replace("`", " \`")}`)}\`\`)` : ""}`;
            if (message instanceof ChatInputCommandInteraction) {
                if ((command.slashName ?? command.slash?.name) && commands_registered_names.find(e => e[0] == (command.slashName ?? command.slash?.name))?.[1]) return `**</${command.slashName ?? command.slash?.name}:${commands_registered_names.find(e => e[0] == (command.slashName ?? command.slash?.name))?.[1]}>${command.command.indexOf("<") !== -1 ? " " + command.command.slice(command.command.indexOf("<")) : ""}**: ${command.description}${command.examples.length ? ` (\`${prefix}${command.examples.join(`\`, \`${prefix}`)}\`)` : ""}`;
                else return `**${prefix}${command.command}**: ${command.description}${command.examples.length ? ` (\`${prefix}${command.examples.join(`\`, \`${prefix}`)}\`)` : ""}`;
            }
            return `**${prefix}${command.command}**: ${command.description}${command.examples.length ? ` (\`${prefix}${command.examples.join(`\`, \`${prefix}`)}\`)` : ""}`;
        }).join('\n');

        if (ephemeral) (message as ChatInputCommandInteraction).reply({ content: commands_text, allowedMentions: {}, flags: MessageFlags.Ephemeral });
        else reply = message.reply({ content: commands_text, allowedMentions: {} });

        if (message instanceof Message && reply)
            database.write({
                guildId: message.guildId!,
                channelId: message.channelId,
                userId: message.author.id,
                messageId: message.id,
                property: "handled",
                value: [2, (await reply).id].join("-")
            });
    },
    interactionHandler(interaction: ChatInputCommandInteraction) {
        this.handler(interaction);
    }
};
commands.push(help);

export default help;