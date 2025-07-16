# Bopper

a Discord bot to boost engagement, keeping the community active

## Features

- reputation (you gain 1 rep / message)

## Inviting

Add the bot to your own server by using [this link](https://discord.com/oauth2/authorize?client_id=1395103292899590337)

## Running yourself

1. create an app (scopes: `applications.commands, bot`, permissions: `Add Reactions, Send Messages, Send Messages in Threads, Use External Emojis, Use Slash Commands, View Channels`) and get a token from [https://discord.com/developers/applications/](https://discord.com/developers/applications/)
2. modify `example.env` with your token and rename it to `.env`
3. run the bot (requires Deno to be installed)

    ```sh
    deno install
    deno run --env-file -A ./index.ts
    ```

<sup><sub>AI usage: No AI is used, except to generate the profile picture</sup></sub>
