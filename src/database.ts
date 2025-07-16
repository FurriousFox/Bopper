import { Snowflake } from 'npm:discord.js';
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const db = new DatabaseSync(path.join(import.meta.dirname ?? "", "../bopper.db"));
console.log(path.join(import.meta.dirname ?? "", "../bopper.db"));

function read(options: {
    guildId: Snowflake;
    channelId?: Snowflake;
    userId?: Snowflake;

    property: string;
}): string | undefined {
    if (!options.property.match(/^[a-zA-Z_]\w+$/)) return undefined;
    db.exec(`CREATE TABLE IF NOT EXISTS ${options.property} ( key TEXT PRIMARY KEY, value TEXT )`);

    const query = db.prepare(`SELECT value FROM ${options.property} WHERE key=?`);
    const result = query.get(`${options.guildId}-${options.channelId ?? ""}--${options.userId ?? ""}`);
    if (result == undefined) return undefined;
    if (result.value == undefined) return undefined;
    return result.value.toString();
}

function write(options: {
    guildId: Snowflake;
    channelId?: Snowflake;
    userId?: Snowflake;

    property: string;
    value: string;
}): boolean {
    if (!options.property.match(/^[a-zA-Z_]\w+$/)) return false;
    db.exec(`CREATE TABLE IF NOT EXISTS ${options.property} ( key TEXT PRIMARY KEY, value TEXT )`);

    db.prepare(`INSERT OR REPLACE INTO ${options.property} (key, value) VALUES (?,?)`)
        .run(`${options.guildId}-${options.channelId ?? ""}--${options.userId ?? ""}`, options.value);

    return true;
}

export default { read, write };