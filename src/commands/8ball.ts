const ball8_responses = [
    "Certainly",
    "Yes",
    "Definitely",
    "Without a doubt",
    "You can count on it",
    "Most likely",
    "Outlook good",
    "Signs point to yes",
    "Ask again later",
    "Not clear, try again",
    "Don't count on it",
    "My sources say no",
    "Outlook not so good",
    "Very doubtful",
    "No",
    "It is certain",
    "You may rely on it",
    "As I see it, yes",
    "Not a chance",
    "Definitely not",
    "I'm not convinced",
    "Better not tell you now",
    "Cannot predict now",
    "Concentrate and ask again",
    "My reply is no",
    "It is decidedly so",
    "Yes, definitely",
    "No... I mean yes... Well... Ask again later",
    "The answer is unclear... Seriously I double checked",
    "It's a coin flip really...",
    "I could tell you but I'd have to permanently ban you",
    "Yes, No, Maybe... I don't know, could you repeat the question?",
    "If you think I'm answering that, you're clearly mistaken.",
    "Do you REALLY want me to answer that? OK... Maybe",
    "YesNoYesNoYesNoYesNoYesNo",
];

import { Message } from 'npm:discord.js';

export default {
    match: /^8ball.+$/,
    command: '8ball',
    examples: ['8ball', '8ball Should I invest in Bitcoin?'],
    description: 'let the magic 8-ball answer your question',
    handler(message: Message): void {
        message.reply({ content: ball8_responses[Math.floor(Math.random() * ball8_responses.length)], allowedMentions: {} });
    }
};