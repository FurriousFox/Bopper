const ball8_responses = ["Certainly", "Yes", "Definitely", "Without a doubt", "You can count on it", "Most likely", "Outlook good", "Signs point to yes", "Ask again later", "Not clear, try again", "Don't count on it", "My sources say no", "Outlook not so good", "Very doubtful", "No", "It is certain", "You may rely on it", "As I see it, yes", "Not a chance", "Definitely not", "I'm not convinced", "Better not tell you now", "Cannot predict now", "Concentrate and ask again", "My reply is no", "It is decidedly so", "Yes, definitely", "No... I mean yes... Well... Ask again later", "The answer is unclear... Seriously I double checked", "It's a coin flip really...", "I could tell you but I'd have to permanently ban you", "Yes, No, Maybe... I don't know, could you repeat the question?", "If you think I'm answering that, you're clearly mistaken.", "Do you REALLY want me to answer that? OK... Maybe", "YesNoYesNoYesNoYesNoYesNo",];

import { Message, SlashCommandBuilder, ChatInputCommandInteraction, InteractionContextType } from 'discord.js';
import { invite, invite_ephemeral } from "../invite.ts";

export default {
    match: /^invite$/,
    command: 'invite',
    examples: [],
    description: 'show invite link to add Bopper to a server or account',
    slash: new SlashCommandBuilder().setName("invite").setDescription('Get invite link to add Bopper to a server or your own account').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
    async handler(message: Message | ChatInputCommandInteraction): Promise<void> {
        if (!(message instanceof ChatInputCommandInteraction)) database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, (await invite(message, true)).id].join("-")
        }); else await invite_ephemeral(message, true, message instanceof ChatInputCommandInteraction ? !!message.options.getBoolean("ephemeral") : false);
    },
    interactionHandler(interaction: ChatInputCommandInteraction) {
        this.handler(interaction);
    }
};