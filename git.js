function pathForFilename(filename){
    return `https://raw.githubusercontent.com/kryptn/bitburner-scripts/main/${filename}`;
}


async function get(ns, filename) {
    ns.tprint(`fetching ${filename}`);
    await ns.wget(pathForFilename(filename), filename);
}

const files = [
    "awaken.js",
    "controller.js",
    "deploy.script",
    "do-it-all.script",
    "faction.js",
    "fill.js",
    "git.js",
    "grow.script",
    "hack.script",
    "home-hack.script",
    "info.script",
    "nodes.script",
    "old-hack.script",
    "propagate.script",
    "purchase-controller.js",
    "purchase.js",
    "push.script",
    "pwn.js",
    "reset.js",
    "scan.js",
    "single-hack.script",
    "startup.script",
    "test.script",
    "weaken.script"
];

export async function main(ns) {
    for(const filename of files) {
        await get(ns, filename);
        await ns.sleep(100);
    }



}