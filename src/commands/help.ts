import path from "node:path";
import { Message } from 'npm:discord.js';
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
    handler(message: Message): void {

        const prefix = database.read({
            guildId: message.guildId!,
            property: "prefix",
        }) ?? ".";

        const commands_text = commands.map(command => {
            return `**${prefix}${command.command}**: ${command.description}${command.examples.length ? ` (\`${prefix}${command.examples.join(`\`, \`${prefix}`)}\`)` : ""}`;
        }).join('\n');

        message.reply({ content: commands_text, allowedMentions: {} });
    }
};