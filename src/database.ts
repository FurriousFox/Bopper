import { Snowflake } from 'npm:discord.js';
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const db = new DatabaseSync(path.join(import.meta.dirname ?? "", "../bopper.db"));

export type readFunction = (options: {
    guildId: Snowflake;
    channelId?: Snowflake;
    userId?: Snowflake;
    messageId?: Snowflake;

    property: string;
}) => string | undefined;
export type readAllFunction = (options: {
    like: string;

    property: string;
}) => { key: string, value: string; }[];

export type writeFunction = (options: {
    guildId: Snowflake;
    channelId?: Snowflake;
    userId?: Snowflake;
    messageId?: Snowflake;

    property: string;
    value: string | number;
}) => boolean;

export type removeFunction = (options: {
    guildId: Snowflake;
    channelId?: Snowflake;
    userId?: Snowflake;
    messageId?: Snowflake;

    property: string;
} | {
    key: string;

    property: string;
}) => boolean;


export const read: readFunction = function (options) {
    if (!options.property.match(/^[a-zA-Z_]\w+$/)) return undefined;
    db.exec(`CREATE TABLE IF NOT EXISTS ${options.property} ( key TEXT PRIMARY KEY, value TEXT )`);

    const query = db.prepare(`SELECT value FROM ${options.property} WHERE key=?`);
    const result = query.get(`${options.guildId}A${options.channelId ?? ""}--${options.userId ?? ""}${options.messageId ? `C${options.messageId}` : ""}`);
    if (result == undefined) return undefined;
    if (result.value == undefined) return undefined;
    return result.value.toString();
};

export const readAll: readAllFunction = function (options) {
    if (!options.property.match(/^[a-zA-Z_]\w+$/)) return [];
    db.exec(`CREATE TABLE IF NOT EXISTS ${options.property} ( key TEXT PRIMARY KEY, value TEXT )`);

    const query = db.prepare(`SELECT * FROM ${options.property} WHERE key LIKE ?`);
    const result = query.all(`%${options.like}%`);
    if (result == undefined) return [];
    return result as { key: string, value: string; }[];
};

export const write: writeFunction = function (options) {
    if (!options.property.match(/^[a-zA-Z_]\w+$/)) return false;
    db.exec(`CREATE TABLE IF NOT EXISTS ${options.property} ( key TEXT PRIMARY KEY, value TEXT )`);

    db.prepare(`INSERT OR REPLACE INTO ${options.property} (key, value) VALUES (?,?)`)
        .run(`${options.guildId}A${options.channelId ?? ""}--${options.userId ?? ""}${options.messageId ? `C${options.messageId}` : ""}`, options.value.toString());

    return true;
};

export const remove: removeFunction = function (options) {
    if (!options.property.match(/^[a-zA-Z_]\w+$/)) return false;
    db.exec(`CREATE TABLE IF NOT EXISTS ${options.property} ( key TEXT PRIMARY KEY, value TEXT )`);

    if ("key" in options) {
        db.prepare(`DELETE FROM ${options.property} WHERE key=?`)
            .run(options.key);
    } else {
        db.prepare(`DELETE FROM ${options.property} WHERE key=?`)
            .run(`${options.guildId}A${options.channelId ?? ""}--${options.userId ?? ""}${options.messageId ? `C${options.messageId}` : ""}`);
    }

    return true;
};



declare global {
    var database: {
        read: readFunction;
        readAll: readAllFunction;
        write: writeFunction;
        remove: removeFunction;
    };
}
globalThis.database = { read, write, readAll, remove };
