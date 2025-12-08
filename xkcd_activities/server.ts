import xkcd from "../src/xkcd.ts";

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const r_map: { [activityInstanceId: string]: (value: true) => void | undefined; } = {};
const p_map: { [activityInstanceId: string]: Promise<true> | undefined; } = {};
const c_map: { [activityInstanceId: string]: number | undefined; } = {};

const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith("/xkcd/") || req.url?.startsWith("/imgs/")) {
        const hostname = req.url!.startsWith("/xkcd/") ? "xkcd.com" : "imgs.xkcd.com";

        if (req.method === "OPTIONS") {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, PATCH',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '1728000',
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Length': '0'
            });
            res.end();
            return;
        }

        const r = await fetch("https://" + hostname + req.url!.substring(req.url!.indexOf("/", 1)), {
            headers: {
                'Host': hostname,
                'X-Real-IP': req.socket.remoteAddress || "",
            },
        });

        const headers: http.OutgoingHttpHeaders = {};
        r.headers.forEach((value, key) => {
            headers[key] = value;
        });

        delete headers['cache-control'];
        delete headers['expires'];
        delete headers['last-modified'];
        delete headers['etag'];

        headers['Cache-Control'] = 'public, max-age=60';

        headers['Access-Control-Allow-Origin'] = '*';
        headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE, PATCH';
        headers['Access-Control-Allow-Headers'] = '*';
        headers['Access-Control-Allow-Credentials'] = 'true';

        res.writeHead(r.status, headers);
        if (r.body == null) {
            res.end();
            return;
        }
        const contentType = r.headers.get('content-type') || '';
        if (contentType.startsWith('text/') || contentType.includes('application/javascript') || contentType.includes('application/json')) {
            res.end((await r.text()).replaceAll(/(https:|http:)?\/?\/?imgs.xkcd.com/g, "/imgs").replaceAll(/(https:|http:)?\/?\/?xkcd.com/g, "/xkcd").replace("d28668.js", "d28668.js?r"));
        } else {
            Readable.fromWeb(r.body as ReadableStream).pipe(res);
        }
        return;
    }

    if (req.url === "/" || req.url === "/xkcd" || req.url === "/xkcd/") {
        res.writeHead(302, { 'Location': `https://xkcd.com/` });
        res.end();
        return;
    }

    let c_num: number | null = null;
    const url = new URL(req.url ?? "/", `http://localhost/`);
    url.searchParams.get("instance_id");
    if (url.searchParams.get("instance_id")) {
        if (url.searchParams.get("c_num")) {
            let i = 0;
            while (i < 100) {
                await new Promise(resolve => setTimeout(resolve, 100));
                i++;
                if (r_map[url.searchParams.get("instance_id")!]) break;
            }

            c_num = parseInt(url.searchParams.get("c_num")!);
            c_map[url.searchParams.get("instance_id")!] = c_num;
            r_map[url.searchParams.get("instance_id")!](true);

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
            return;
        }

        const instance_id = url.searchParams.get("instance_id");
        if (instance_id && r_map[instance_id] && p_map[instance_id]) {
            await p_map[instance_id];
            c_num = c_map[instance_id]!;
        } else {
            await (p_map[instance_id!] = new Promise((resolve) => {
                r_map[instance_id!] = resolve;
            }));
            c_num = c_map[instance_id!]!;
        }

        res.writeHead(307, { 'Location': `/${c_num}/` });
        res.end();
        return;
    }


    if (req.url === "/xkcd-Regular-v3.woff" || req.url === "/jquery.min.js") {
        res.writeHead(200, { 'Content-Type': 'font/woff' });
        fs.createReadStream(path.join(import.meta.dirname ?? "./", req.url)).pipe(res);
        return;
    }

    const match = req.url?.match(/^\/(\d+)(\/|\/\?.*)?$/);
    if (match && !req.url?.startsWith(`/${match[1]}/`)) { res.writeHead(307, { 'Location': `/${match[1]}/` }); res.end(); return; }

    if (match) {
        const number = parseInt(match[1]);
        xkcd.xkcd(number).then(comic => {
            if (comic.error) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Comic not found');
                return;
            }

            if (!comic.extra_parts && comic.num !== 880) {
                res.writeHead(302, { 'Location': `https://xkcd.com/${comic.num}/` });
                res.end();
                return;
            } else {
                if (comic.num === 880) comic.extra_parts = {};

                res.writeHead(200, { 'Content-Type': 'text/html' });
                if ('links' in comic.extra_parts!) delete comic.extra_parts["links"];
                switch (comic.num) {
                    case 3074: // only works on xkcd.com because of push notifications
                        res.writeHead(302, { 'Location': `https://xkcd.com/${comic.num}/` });
                        res.end();
                        return;
                    case 880: // 3d comic, 3d.xkcd.com
                        res.write(`<html><meta charset="UTF-8"><style>body>* { flex-shrink: 0; object-fit: contain; max-width: 100%; max-height: 100%; } \n body { background-color: white; display: flex; justify-content: center; align-items: center; min-height: 100svh; margin: 0; } </style><body><div id="comic">`);
                        res.write(`<script src="/jquery.min.js"></script><script src="/imgs/xk3d/xk3d.js"></script><style>#comic { position:relative; display:inline-block; margin:10px; }\n.menuCont a { position:relative; z-index:999; }\n.credit { font-size:1.05em; margin:1.75em 0 .5em 0; }\n.credit strong { font-size:1.175em; } </style><script>$(function() { omgitsin3d({"parallax_layers": [{"src": "880/headache_box.png", "z": 60, "o": 0.52}, {"src": "880/headache_corners.png", "z": 50, "o": 0.54}, {"src": "880/headache_corners.png", "z": 40, "o": 0.56}, {"src": "880/headache_corners.png", "z": 30, "o": 0.58}, {"src": "880/headache_corners.png", "z": 20, "o": 0.6}, {"src": "880/headache_corners.png", "z": 10, "o": 0.65}, {"src": "880/headache_corners.png", "z": 0, "o": 0.7}, {"src": "880/headache_corners.png", "z": -10, "o": 0.75}, {"src": "880/headache_corners.png", "z": -20, "o": 0.8}, {"src": "880/headache_corners.png", "z": -30, "o": 0.85}, {"src": "880/headache_corners.png", "z": -40, "o": 0.9}, {"src": "880/headache_corners.png", "z": -50, "o": 0.95}, {"src": "880/headache_box.png", "z": -60, "o": 1}, {"src": "880/headache_handle.png", "z": 55, "o": 1}, {"src": "880/headache_bike.png", "z": 40, "o": 1}, {"src": "880/headache_handle.png", "z": 25, "o": 1}, {"src": "880/headache_girl.png", "z": 25, "o": 1}, {"src": "880/headache_desk.png", "z": -20, "o": 1}, {"src": "880/headache_mask.png", "z": -25, "o": 1}, {"src": "880/headache_desk_corners.png", "z": -35, "o": 1}, {"src": "880/headache_desk.png", "z": -50, "o": 1}, {"src": "880/headache_computer.png", "z": -30, "o": 1}, {"src": "880/headache_computer.png", "z": -40, "o": 1}, {"src": "880/headache_guy.png", "z": -35, "o": 1}, {"src": "880/headache_text.png", "z": -60, "o": 1}], "converted_by": "Randall Munroe", "alt_text": "I'm only willing to visit placid lakes, salt flats, and painting exhibits until the world's 3D technology improves."}) })</script><div id="comic"></div><noscript><img src="/imgs/comics/headache.png" title="I&#39;m only willing to visit placid lakes, salt flats, and painting exhibits until the world&#39;s 3D technology improves." alt="Headache" /></noscript><br/>`);
                        res.write(`</div></body></html>`);
                        break;
                    case 1350: // comic div must be closed early
                        res.write(`<html><meta charset="UTF-8"><style>body>* { flex-shrink: 0; object-fit: contain; max-width: 100%; max-height: 100%; } \n body { background-color: white; display: flex; justify-content: center; align-items: center; min-height: 100svh; margin: 0; } </style><body><div id="comic"></div>`);
                        res.write(Object.entries(comic.extra_parts!).map(([_key, value]) => value).join("\n").replaceAll(/(https:|http:)?\/?\/?imgs.xkcd.com/g, "/imgs").replaceAll(/(https:|http:)?\/?\/?xkcd.com/g, "/xkcd").replace("d28668.js", "d28668.js?r"));
                        res.write(`</body></html>`);
                        break;
                    case 2765: // fix toasts
                        res.write(`<html><meta charset="UTF-8"><style>@font-face { font-family: 'xkcd-Regular-v3'; src: url('/xkcd-Regular-v3.woff') format('woff'); }\nbody>* { flex-shrink: 0; object-fit: contain; max-width: 100%; max-height: 100%; } \n body { background-color: white; display: flex; justify-content: center; align-items: center; min-height: 100svh; margin: 0; }\nbody>div:not(#comic) {display: none !important}</style><body><div id="comic"><div style="font-variant: normal; font-weight: normal; position: absolute; bottom: 10%; padding: 2px 7px; margin: 0px 20px; font-family: xkcd-Regular-v3; font-size: 24px; text-align: center; min-width: 60px; background: white; border-width: 2px 2px 3px; border-style: solid; border-color: black; border-image: none; border-radius: 4px; opacity: 0; pointer-events: none; transform: translateY(0px); transition: 250ms ease-out;"></div>`);
                        res.write(Object.entries(comic.extra_parts!).map(([_key, value]) => value).join("\n").replaceAll(/(https:|http:)?\/?\/?imgs.xkcd.com/g, "/imgs").replaceAll(/(https:|http:)?\/?\/?xkcd.com/g, "/xkcd").replace("d28668.js", "d28668.js?r"));
                        res.write(`</div></body></html>`);
                        break;
                    default:
                        if (comic.num === 1506) res.write(`<style>#comic { min-height: auto !important; }</style>`); // best effort fix
                        res.write(`<html><meta charset="UTF-8"><style>@font-face { font-family: 'xkcd-Regular-v3'; src: url('/xkcd-Regular-v3.woff') format('woff'); }\nbody>* { flex-shrink: 0; object-fit: contain; max-width: 100%; max-height: 100%; } \n body { background-color: white; display: flex; justify-content: center; align-items: center; min-height: 100svh; margin: 0; } </style><body><div id="comic">`);
                        if ('headerextra' in comic.extra_parts!) {
                            res.write((comic.extra_parts["headerextra"] as string).replaceAll(/(https:|http:)?\/?\/?imgs.xkcd.com/g, "/imgs").replaceAll(/(https:|http:)?\/?\/?xkcd.com/g, "/xkcd").replace("d28668.js", "d28668.js?r"));
                            delete comic.extra_parts["headerextra"];
                        }

                        if ('imgAttr' in comic.extra_parts!) {
                            if ('pre' in comic.extra_parts) {
                                res.write((comic.extra_parts["pre"] as string).replaceAll(/(https:|http:)?\/?\/?imgs.xkcd.com/g, "/imgs").replaceAll(/(https:|http:)?\/?\/?xkcd.com/g, "/xkcd").replace("d28668.js", "d28668.js?r"));
                                delete comic.extra_parts["pre"];
                            }

                            res.write(`<img src="${comic.img.replaceAll(/(https:|http:)?\/?\/?imgs.xkcd.com/g, "/imgs").replaceAll(/(https:|http:)?\/?\/?xkcd.com/g, "/xkcd").replace("d28668.js", "d28668.js?r")}" ${(comic.extra_parts.imgAttr as string).replaceAll(/(https:|http:)?\/?\/?imgs.xkcd.com/g, "/imgs").replaceAll(/(https:|http:)?\/?\/?xkcd.com/g, "/xkcd")} style="image-orientation:none">`);
                            delete comic.extra_parts["imgAttr"];

                            if ('post' in comic.extra_parts) {
                                res.write((comic.extra_parts["post"] as string).replaceAll(/(https:|http:)?\/?\/?imgs.xkcd.com/g, "/imgs").replaceAll(/(https:|http:)?\/?\/?xkcd.com/g, "/xkcd").replace("d28668.js", "d28668.js?r"));
                                delete comic.extra_parts["post"];
                            }
                        }

                        res.write(Object.entries(comic.extra_parts!).map(([_key, value]) => value).join("\n").replaceAll(/(https:|http:)?\/?\/?imgs.xkcd.com/g, "/imgs").replaceAll(/(https:|http:)?\/?\/?xkcd.com/g, "/xkcd").replace("d28668.js", "d28668.js?r"));
                        res.write(`</div></body></html>`);
                        break;
                }
                res.end();
                return;
            }
        }).catch(e => {
            console.error(e);

            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
        });
    } else {
        res.writeHead(307, { 'Location': `/xkcd${req.url}` });
        res.end();
        return;
    }

});
server.listen(4733, "127.0.0.1");