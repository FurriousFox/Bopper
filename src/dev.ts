import process from "node:process";

export const dev = !!process.argv.filter(e => e.includes("-dev")).length;
export default dev;
globalThis.dev = dev;
declare global {
    var dev: boolean;
}