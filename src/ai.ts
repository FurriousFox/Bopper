import readline from "node:readline";
import { Readable } from "node:stream";

type Messages = {
    role: "user" | "system" | "assistant",
    content: string;
}[];

export async function* ai(messages: Messages) {
    let thinking = false;

    const stream = await fetch("https://ai.hackclub.com/chat/completions", { method: "POST", body: JSON.stringify({ messages, stream: true }), headers: { "Content-Type": "application/json", "Accept": "text/event-stream" } });
    if (!stream.body) return;

    try {
        for await (const complete_json of readline.createInterface({ input: Readable.fromWeb(stream.body as import("stream/web").ReadableStream) })) {
            const complete = JSON.parse(complete_json);
            // console.log(complete);
            if (complete?.object == "chat.completion.chunk" && complete?.choices?.[0]?.delta?.content != undefined && typeof complete?.choices?.[0]?.delta?.content === "string") {
                if (complete.choices[0].delta.content == "<think>") thinking = true;
                if (!thinking) yield complete.choices[0].delta.content;
                if (complete.choices[0].delta.content == "</think>") thinking = false;
            }
        }
    } catch { /*  */ }
};

export function splitter(text: string) {
    let parts: string[] = [];
    let part = "";
    let codeblock = false;
    for (const i in text as unknown as object) {
        if (text.startsWith("```", +i)) codeblock = !codeblock;

        if (!codeblock && text.startsWith("\n\n", +i)) {
            parts.push(part);
            part = "";
        }

        part += text[+i];
    }
    parts.push(part);
    parts = parts.map(part => {
        const party = part.split("\n");

        let codeblock = false;
        let codepad = "";
        for (const par in party) {
            if (party[par].match(/^( *)```/)) {
                codeblock = !codeblock;
                codepad = party[par].match(/^( *)```/)![1]!;
            }

            if ((codeblock || party[par].match(/^( *)```/)) && party[par].startsWith(codepad)) {
                party[par] = party[par].slice(codepad.length);
            }
        }

        return party.join("\n");
    });
    parts = parts!.flatMap(part => part.length > 1950 ? part.match(/(.{1,1950}\.)(?=\s|$)|(.{1,1950})(?=\s)|(.{1,1950})/g)! : part);

    const merged: string[] = [];
    for (const part of parts) {
        const last = merged[merged.length - 1];
        if (last && (last + part).length <= 1950) merged[merged.length - 1] = last + part;
        else merged.push(part);
    }

    return merged;
}