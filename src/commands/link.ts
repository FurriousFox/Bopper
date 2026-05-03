import { Message } from 'discord.js';

function normalizeHandle(value: string) {
    return value.trim().replace(/^@/, "");
}

function isMatrixId(value: string) {
    return value.startsWith("@") && value.includes(":");
}

function shortFromMatrixId(value: string) {
    const trimmed = value.trim();
    if (!isMatrixId(trimmed)) return null;
    return normalizeHandle(trimmed.split(":")[0]);
}

function extractShortHandles(content: string) {
    const handles = new Set<string>();
    const regex = /(^|\s)(@[A-Za-z0-9_.=\-]+)\b/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
        const raw = match[2];
        handles.add(normalizeHandle(raw));
    }
    return [...handles];
}

export default {
    match: /^link( .+)?$/,
    command: 'link <@full:server>',
    examples: ['link @lennsteenbergen:lennsteenbergen.nl'],
    description: 'map short Matrix handles to full Matrix IDs and expand @short in chat',
    matchFunction: (message: Message) => {
        const content = message.content.trim();
        if (content.startsWith("link ") || content === "link") return true;
        return extractShortHandles(content).length > 0;
    },
    async handler(message: Message): Promise<void> {
        const content = message.content.trim();

        if (content === "link" || content.startsWith("link ")) {
            const args = content.split(/\s+/).slice(1);
            const fullRaw = args[0];

            if (!fullRaw) {
                await message.reply({ content: "Usage: `link @full:server`", allowedMentions: {} });
                return;
            }

            const fullId = fullRaw.trim();
            if (!isMatrixId(fullId)) {
                await message.reply({ content: "Full Matrix ID must look like `@name:server`", allowedMentions: {} });
                return;
            }

            const shortHandle = shortFromMatrixId(fullId);
            if (!shortHandle) {
                await message.reply({ content: "Couldn't derive short handle from Matrix ID", allowedMentions: {} });
                return;
            }

            database.write({
                guildId: message.guildId!,
                userId: shortHandle,
                property: "matrix_links",
                value: fullId,
            });

            database.write({
                guildId: message.guildId!,
                userId: fullId,
                property: "matrix_links_rev",
                value: `@${shortHandle}`,
            });

            await message.reply({ content: `Saved: @${shortHandle} → ${fullId}`, allowedMentions: {} });
            return;
        }

        const handles = extractShortHandles(content);
        const mapped = handles
            .map((handle) => {
                const fullId = database.read({
                    guildId: message.guildId!,
                    userId: handle,
                    property: "matrix_links",
                });
                return fullId ? `@${handle} → ${fullId}` : null;
            })
            .filter(Boolean) as string[];

        if (mapped.length > 0) {
            await message.reply({ content: mapped.join("\n"), allowedMentions: {} });
        }
    }
};