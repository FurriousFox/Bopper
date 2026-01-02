import { Message, SlashCommandBuilder, ChatInputCommandInteraction, InteractionContextType } from 'discord.js';

export default {
    match: /^(?:yp|yp (\d+))$/s,
    command: 'yp <n>',
    examples: ['yp', 'yp 5'],
    description: 'show year progress (%) with <n> decimals',
    slash: new SlashCommandBuilder().setName("yp").setDescription('Show year progress (%) with n decimals').addIntegerOption(option => option.setRequired(false).setName("decimals").setMinValue(0).setDescription("Number of decimals")).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    async handler(message: Message | ChatInputCommandInteraction, match: RegExpMatchArray): Promise<void> {
        let d = +(match[1] ?? "2");

        const n = performance.timeOrigin + performance.now();
        const nd = n.toString().split('.')[1]?.length ?? 0;
        const nb = BigInt(n.toString().replace('.', ''));

        const ty = BigInt(parseInt((+new Date(new Date().getFullYear() + 0, 0, 1)).toString()).toString() + "0".repeat(nd));
        const ny = BigInt(parseInt((+new Date(new Date().getFullYear() + 1, 0, 1)).toString()).toString() + "0".repeat(nd));
        const yp = nb - ty;

        const ml = `We're already ysu **%** into the year\n\n-# ≈ ${yp}/${ny - ty}`.length;
        d = Math.min(d, 2000 - ml - 3);

        const ypp = (yp * BigInt(`1${"0".repeat(2 + d + 1)}`) / (ny - ty)).toString().padStart(2 + d + 1, "0");
        const yppp = (ypp.slice(0, 1) == "0" ? ypp.slice(1, 2) : ypp.slice(0, 2)) + (d ? "." : "") + ypp.slice(2, -2) + Math.round(+ypp.slice(-2) / 10);

        const reply = await message.reply({ content: `We're already ysu **${yppp}%** into the year${d >= 10 ? `\n\n-# ≈ ${yp}/${ny - ty}` : ""}`, allowedMentions: {} });

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
        this.handler(interaction, ["yp", `${interaction.options.getInteger("decimals", false) ?? 2}`]);
    }
};