export async function main(ns) {
    var port = ns.getPortHandle(1);

    let targets = ["iron-gym", "silver-helix", "comptek", "millenium-fitness", "catalyst"];
    let i = 0;

    while(true) {
        while(port.full()) {
            await ns.sleep(2500);
        }

        await port.write([targets[i], "do-it-all", 69]);
        i = (i + 1) % targets.length;

    }

}