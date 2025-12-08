import { Message, ChatInputCommandInteraction, SlashCommandBuilder, InteractionContextType, MessageFlags } from 'discord.js';
import xkcd from "../xkcd.ts";

export default {
    match: /^xkcd ?(\d+|.+)?$/,
    command: 'xkcd <number>',
    examples: ['xkcd', 'xkcd 2347', 'xkcd Linux', 'xkcd random'],
    description: 'show xkcd comic',
    slash: new SlashCommandBuilder().setName("xkcd").setDescription('Show xkcd comic').addSubcommand(command => command.setName("random").setDescription('Show random xkcd comic').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).addSubcommand(command => command.setName("latest").setDescription('Show latest xkcd comic').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).addSubcommand(command => command.setName("search").setDescription('Search for an xkcd comic').addStringOption(option => option.setRequired(true).setName("query").setDescription("Seach query").setAutocomplete(true)).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).addSubcommand(command => command.setName("number").setDescription('Show a specific xkcd comic').addIntegerOption(option => option.setRequired(true).setName("number").setDescription("Number of xkcd comic to show").setMinValue(1)).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")))/* .addSubcommand(command => command.setName("subscribe").setDescription('Subscribe to daily xkcd comics')) */.setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    slashName: "xkcd number",
    async handler(message: Message | ChatInputCommandInteraction, match?: RegExpMatchArray): Promise<void> {
        const ephemeral = message instanceof ChatInputCommandInteraction ? message.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : 0 : 0;
        const isInteraction = message instanceof ChatInputCommandInteraction;
        let comic;

        let action: "random" | "latest" | "number" | "search" = "latest";
        let number: number | null = null;
        let query: string | null = null;

        if (isInteraction) {
            action = message.options.getSubcommand(true) as "number" | "random" | "latest" | "search";

            if (action == "number") number = message.options.getInteger("number", true);
            if (action == "search") query = message.options.getString("query", true);
        } else {
            if (match?.[1] == undefined || match?.[1] == null || match?.[1].toLowerCase() == "latest") {
                action = "latest";
            } else if (match?.[1].toLowerCase() == "random" || match?.[1].toLowerCase() == "r") {
                action = "random";
            } else if (match?.[1].match(/^\d+$/)) {
                action = "number";
                number = parseInt(match[1]);
            } else {
                action = "search";
                query = match?.[1];
            }
        }

        switch (action) {
            case "latest":
                comic = await xkcd.latest();
                break;

            case "random":
                comic = await xkcd.random();
                break;

            case "number":
                comic = await xkcd.xkcd(number ?? -1);
                break;

            case "search":
                comic = await xkcd.search(query ?? "");
                break;

            default:
                comic = await xkcd.latest();
                break;
        }


        const reply = await message.reply({
            components: await xkcd.components(comic ?? await xkcd.latest()),
            flags: MessageFlags.IsComponentsV2 | ephemeral,
            allowedMentions: {}
        });



        if (message instanceof Message) database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, reply.id].join("-")
        });
    },
    interactionHandler(interaction: ChatInputCommandInteraction) {
        this.handler(interaction);
    }
};