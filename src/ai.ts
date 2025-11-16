import readline from "node:readline";
import { Readable } from "node:stream";

type Messages = {
    role: "user" | "system" | "assistant",
    content: string;
}[];

let models = [
    {
        "id": "openai/gpt-5-mini",
        "context_length": 400000,
        "architecture": {
            "modality": "text+image->text",
            "input_modalities": [
                "text",
                "image",
                "file"
            ],
            "output_modalities": [
                "text"
            ],
            "tokenizer": "GPT",
            "instruct_type": null
        },
        "pricing": {
            "prompt": "0.00000025",
            "completion": "0.000002",
            "request": "0",
            "image": "0",
            "web_search": "0.01",
            "internal_reasoning": "0",
            "input_cache_read": "0.000000025"
        },
        "top_provider": {
            "context_length": 400000,
            "max_completion_tokens": 128000,
            "is_moderated": true
        },
        "per_request_limits": null,
        "supported_parameters": [
            "include_reasoning",
            "max_tokens",
            "reasoning",
            "response_format",
            "seed",
            "structured_outputs",
            "tool_choice",
            "tools"
        ],
        "default_parameters": {}
    },
    {
        "id": "openai/gpt-oss-120b",
        "context_length": 131072,
        "architecture": {
            "modality": "text->text",
            "input_modalities": [
                "text"
            ],
            "output_modalities": [
                "text"
            ],
            "tokenizer": "GPT",
            "instruct_type": null
        },
        "pricing": {
            "prompt": "0.00000004",
            "completion": "0.0000004",
            "request": "0",
            "image": "0",
            "web_search": "0",
            "internal_reasoning": "0"
        },
        "top_provider": {
            "context_length": 131072,
            "max_completion_tokens": 131072,
            "is_moderated": false
        },
        "per_request_limits": null,
        "supported_parameters": [
            "frequency_penalty",
            "include_reasoning",
            "logit_bias",
            "logprobs",
            "max_tokens",
            "min_p",
            "presence_penalty",
            "reasoning",
            "repetition_penalty",
            "response_format",
            "seed",
            "stop",
            "structured_outputs",
            "temperature",
            "tool_choice",
            "tools",
            "top_k",
            "top_logprobs",
            "top_p"
        ],
        "default_parameters": {
            "temperature": null,
            "top_p": null,
            "frequency_penalty": null
        }
    },
    {
        "id": "google/gemini-2.5-flash",
        "context_length": 1048576,
        "architecture": {
            "modality": "text+image->text",
            "input_modalities": [
                "file",
                "image",
                "text",
                "audio",
                "video"
            ],
            "output_modalities": [
                "text"
            ],
            "tokenizer": "Gemini",
            "instruct_type": null
        },
        "pricing": {
            "prompt": "0.0000003",
            "completion": "0.0000025",
            "request": "0",
            "image": "0.001238",
            "web_search": "0",
            "internal_reasoning": "0",
            "input_cache_read": "0.00000003",
            "input_cache_write": "0.0000003833"
        },
        "top_provider": {
            "context_length": 1048576,
            "max_completion_tokens": 65535,
            "is_moderated": false
        },
        "per_request_limits": null,
        "supported_parameters": [
            "include_reasoning",
            "max_tokens",
            "reasoning",
            "response_format",
            "seed",
            "stop",
            "structured_outputs",
            "temperature",
            "tool_choice",
            "tools",
            "top_p"
        ],
        "default_parameters": {
            "temperature": null,
            "top_p": null,
            "frequency_penalty": null
        }
    },
    {
        "id": "deepseek/deepseek-r1-0528",
        "context_length": 163840,
        "architecture": {
            "modality": "text->text",
            "input_modalities": [
                "text"
            ],
            "output_modalities": [
                "text"
            ],
            "tokenizer": "DeepSeek",
            "instruct_type": "deepseek-r1"
        },
        "pricing": {
            "prompt": "0.0000004",
            "completion": "0.00000175",
            "request": "0",
            "image": "0",
            "web_search": "0",
            "internal_reasoning": "0"
        },
        "top_provider": {
            "context_length": 163840,
            "max_completion_tokens": 163840,
            "is_moderated": false
        },
        "per_request_limits": null,
        "supported_parameters": [
            "frequency_penalty",
            "include_reasoning",
            "logit_bias",
            "logprobs",
            "max_tokens",
            "min_p",
            "presence_penalty",
            "reasoning",
            "repetition_penalty",
            "response_format",
            "seed",
            "stop",
            "structured_outputs",
            "temperature",
            "tool_choice",
            "tools",
            "top_k",
            "top_logprobs",
            "top_p"
        ],
        "default_parameters": {}
    },
];

setInterval(async () => {
    const models = await (await fetch("https://ai.hackclub.com/proxy/v1/models", {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${Deno.env.get("HACKCLUB_AI_TOKEN")}` }
    })).json();

    if (!models.data) return;
}, 60 * 60 * 1000);

// async function selectModel({ text = true, image = false }) {
//     const models = await fetch("https://ai.hackclub.com/proxy/v1/models", {
//         headers: { "Accept": "application/json", "Authorization": `Bearer ${Deno.env.get("HACKCLUB_AI_TOKEN")}` }
//     });

//     if (!models.data) return;
// }

export async function* ai(messages: Messages) {
    let thinking = false;

    // const model = "openai/gpt-oss-120b";
    const model = "openai/gpt-5-mini";
    // try {
    //     const models = (await (await fetch("https://ai.hackclub.com/model")).text());
    //     if (!models.includes(model)) {
    //         const modela = models.split(",")[0];
    //         const modelb = models.split(",").filter(e => e.includes("openai") || e.includes("gpt"))[0];
    //         model = modelb ?? modela;
    //     }
    // } catch (e) {
    //     console.log(e);
    // }

    // https://ai.hackclub.com/chat/completions
    const stream = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions",
        {
            method: "POST",
            body: JSON.stringify({
                messages, stream: true, model: model,
                // tools: [{ "type": "web_search" }],
            }),
            headers: { "Content-Type": "application/json", "Accept": "text/event-stream", "Authorization": `Bearer ${Deno.env.get("HACKCLUB_AI_TOKEN")}` }
        });
    if (!stream.body) return console.log("huh no stream.body");

    try {
        for await (let complete_json of readline.createInterface({ input: Readable.fromWeb(stream.body as import("stream/web").ReadableStream) })) {
            // console.log(complete_json);
            if (complete_json.startsWith("data: ")) complete_json = complete_json.slice(6);
            if (!complete_json.trim().length) continue;

            if (complete_json == "[DONE]") continue;
            if (complete_json == ": OPENROUTER PROCESSING") continue;

            try {
                const complete = JSON.parse(complete_json);

                if (complete?.object == "chat.completion.chunk" && complete?.choices?.[0]?.delta?.content != undefined && typeof complete?.choices?.[0]?.delta?.content === "string") {
                    if (complete.choices[0].delta.content == "<think>") thinking = true;
                    if (!thinking) yield [complete.choices[0].delta.content as string, false];
                    if (complete.choices[0].delta.content == "</think>") thinking = false;
                } else if (complete?.object == "chat.completion.chunk" && complete?.choices?.[0]?.delta?.reasoning != undefined && typeof complete?.choices?.[0]?.delta?.reasoning === "string") {
                    yield ["", true];
                }
            } catch (e) {
                console.log(complete_json, e);
                continue;
            }
            // console.log(complete);
        }
    } catch (e) { console.log("error in ai.ts", e); }
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