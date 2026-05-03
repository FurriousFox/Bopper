# Bopper
# WIP
a Discord bot to boost engagement, keeping the community active

## Demo video

[Bopper demo week 11](https://youtu.be/UVX9fiYHZY0)  
[Bopper demo week 12](https://youtu.be/dzF8Elj4WAA)  
[Bopper demo week 14](https://youtu.be/SFAZkTJjjDU)  

## Features

- reputation (you gain 1 rep point / message, it's also possible to gift rep points to other users)
- rep leaderboard
- 8ball
- ai answers
- lapo (last post of the day)
- lapo leaderboard
- ping (showing user latency and bot ping)
- changing command prefix (`,` by default)
- streak (send a message every day to keep up your streak)
- streak leaderboard

## Inviting

Add the bot to your own server by using [this link](https://discord.com/oauth2/authorize?client_id=1395103292899590337)  
Use `/help` or `<prefix>help` to get started (default prefix is `,`)

## Running yourself

1. create an app (scopes: `applications.commands, bot`) and get a token from [https://discord.com/developers/applications/](https://discord.com/developers/applications/)
2. modify `example.env` with your token and rename it to `.env`
3. run the bot (requires Deno to be installed)

    ```sh
    deno install
    deno run --env-file -A ./index.ts
    ```

Optional: set `AUTO_RELOAD=1` in `.env` to restart on file changes.
## Commands

All commands (slash examples):

- `/8ball [question]`
- `/ai <prompt> [web] [ephemeral]`
- `/coinflip`
- `/erm <text> [ephemeral]`
- `/fipo`
- `/fipostats [ephemeral]`
- `/help [ephemeral]`
- `/invite [ephemeral]`
- `/lapo`
- `/lapostats [ephemeral]`
- `/ping [ephemeral]`
- `/prefix <prefix> [ephemeral]`
- `/rep bal [user] [ephemeral]`
- `/rep stats [ephemeral]`
- `/rep give <user> <amount>`
- `/streak stats [ephemeral]`
- `/xkcd latest [ephemeral]`
- `/xkcd random [ephemeral]`
- `/xkcd number <number> [ephemeral]`
- `/xkcd search <query> [ephemeral]`
- `/xkcd subscribe <channel>`
- `/xkcd unsubscribe <channel>`
- `/yp [decimals]`


## xkcd search

1. modify `xkcd/example.env` with your token and rename it to `xkcd/.env`
2. update the xkcd and xkcd-explain index by running

    ```sh
    cd xkcd/src/

    # start typesense server
    docker compose -f docker-compose.yml up -d --build

    # update index
    deno run -A initial_fetch.ts
    deno run -A initial_fetch_explain.ts

    # add index to typesense
    deno run -A add.ts
    ```

3. no automatic updating of the index is implemented yet, re-run these commands once a while to update the search index

## Interactive xkcd comics

1. For interactive xkcd comics, use the existing [xkcd.argv.nl](https://xkcd.argv.nl) server, or run using the http server in `xkcd_activities` (server.ts)
2. Add a url mapping for `/` to `xkcd.argv.nl` (or your own server), and enable activities in the discord developer portal

<sup><sub>AI usage: No AI is used, except to generate the profile picture</sup></sub>
