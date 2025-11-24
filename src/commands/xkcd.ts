import { Message, ChatInputCommandInteraction, SlashCommandBuilder, InteractionContextType, MessageFlags } from 'discord.js';
import xkcd from "../xkcd.ts";

export default {
    match: /^xkcd ?(\d+)?$/,
    command: 'xkcd <number>',
    examples: ['xkcd', 'xkcd 2347', 'xkcd Geologic Core Sample'],
    description: 'show xkcd comic',
    slash: new SlashCommandBuilder().setName("xkcd").setDescription('Show xkcd comic').addSubcommand(command => command.setName("random").setDescription('Show random xkcd comic').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).addSubcommand(command => command.setName("latest").setDescription('Show latest xkcd comic').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).addSubcommand(command => command.setName("search").setDescription('Search for an xkcd comic').addStringOption(option => option.setRequired(true).setName("query").setDescription("Seach query").setAutocomplete(true)).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).addSubcommand(command => command.setName("number").setDescription('Show a specific xkcd comic').addIntegerOption(option => option.setRequired(true).setName("number").setDescription("Number of xkcd comic to show").setMinValue(1)).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    slashName: "xkcd number",
    async handler(message: Message | ChatInputCommandInteraction): Promise<void> {
        const reply = await message.reply({ content: "not implemented yet, use /xkcd", allowedMentions: {} });

        if (message instanceof Message) database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, reply.id].join("-")
        });
    },
    async interactionHandler(interaction: ChatInputCommandInteraction) {
        const ephemeral = interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : 0;
        // this.handler(interaction);

        let comic;
        switch (interaction.options.getSubcommand(true)) {
            case "random":
                comic = await xkcd.random();
                break;

            case "latest":
                comic = await xkcd.latest();
                break;

            case "number":
                comic = await xkcd.xkcd(interaction.options.getInteger("number", true));
                break;

            case "search": {
                const query = interaction.options.getString("query", true);
                comic = await xkcd.search(query);
                break;
            }
        }

        return interaction.reply({
            components: await xkcd.components(comic ?? await xkcd.latest()),
            flags: MessageFlags.IsComponentsV2 | ephemeral
        });
    }
};