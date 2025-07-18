import path from "node:path";
import { Message, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, MessageFlags } from 'npm:discord.js';
const commands: {
    command: string,
    examples: string[],
    description: string,
}[] = [];
for (const { name: command } of Deno.readDirSync(path.join(import.meta.dirname ?? "./")).filter(e => e.isFile)) {
    if (command === "help.ts") continue;

    commands.push((await import(path.join(import.meta.dirname ?? "./", command))).default);
}
commands.push({ command: "help", examples: [], description: "list all commands" });

export default {
    match: /^help$/,
    command: 'help',
    examples: [],
    description: 'list all commands',
    slash: new SlashCommandBuilder().setName("help").setDescription('List all commands').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    handler(message: Message | ChatInputCommandInteraction): void {
        const prefix = message instanceof ChatInputCommandInteraction ? '/' : database.read({
            guildId: message.guildId!,
            property: "prefix",
        }) ?? ".";
        const ephemeral = message instanceof ChatInputCommandInteraction ? !!message.options.getBoolean("ephemeral") : false;

        const commands_text = commands.map(command => {
            if (prefix == `\``) return `**${prefix.replace("`", "\\`")}${command.command}**: ${command.description}${command.examples.length ? ` (\`\`${prefix.replace("`", " \`")}${command.examples.join(`\`\`, \`\`${prefix.replace("`", " \`")}`)}\`\`)` : ""}`;
            return `**${prefix}${command.command}**: ${command.description}${command.examples.length ? ` (\`${prefix}${command.examples.join(`\`, \`${prefix}`)}\`)` : ""}`;
        }).join('\n');

        if (ephemeral) (message as ChatInputCommandInteraction).reply({ content: commands_text, allowedMentions: {}, flags: MessageFlags.Ephemeral });
        else message.reply({ content: commands_text, allowedMentions: {} });
    },
    interactionHandler(interaction: ChatInputCommandInteraction) {
        this.handler(interaction);
    }
};