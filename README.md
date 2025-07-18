# Bopper

a Discord bot to boost engagement, keeping the community active

## Features

- reputation (you gain 1 rep point / message, it's also possible to gift rep points to other users)
- rep leaderboard
- 8ball
- ai answers
- lapo (last post of the day)
- lapo leaderboard
- ping (showing user latency and bot ping)
- changing command prefix (`.` by default)
- streak (send a message every day to keep up your streak)
- streak leaderboard

<sup><sub>**slash-commands are still a work in progress, use `.help` to get started**</sup></sub>

## Inviting

Add the bot to your own server by using [this link](https://discord.com/oauth2/authorize?client_id=1395103292899590337)  
Use the `.help` command to get started

## Running yourself

1. create an app (scopes: `applications.commands, bot`) and get a token from [https://discord.com/developers/applications/](https://discord.com/developers/applications/)
2. modify `example.env` with your token and rename it to `.env`
3. run the bot (requires Deno to be installed)

    ```sh
    deno install
    deno run --env-file -A ./index.ts
    ```

<sup><sub>AI usage: No AI is used, except to generate the profile picture</sup></sub>
