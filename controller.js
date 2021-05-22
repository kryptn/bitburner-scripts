async function getFreeRam(ns, serv, pct=false) {
    let used = ns.getServerUsedRam(serv);
    let max = ns.getServerMaxRam(serv);
    // ns.tprint(serv, "  used ram: ", used, "   max ram: ", max);
    //
    if(pct)
        return used/max;
    return max - used;
}

async function maxInstances(ns, serv, action) {
    let scriptRam = await ns.getScriptRam(action + ".script");
    let freeRam = await getFreeRam(ns, serv);
    // ns.tprint(serv, "  scriptRam: ", scriptRam, "   freeRam: ", freeRam);
    return Math.floor(freeRam / scriptRam);
}

// this is apparently a global
var readLock = false;

export async function main(ns) {
    var actions = await ns.getPortHandle(1);
    var self = await ns.getHostname();

    ns.tprint(`${self} controller starting`);

    var id = 0;

    while (true) {
        if (id > 1024)
            id = 0;

        if (!actions.empty() && !readLock) {
            readLock = true;
            var data = actions.peek();

            if(data == null) {
                // consume broken data?
                _ = actions.read();
                readLock = false;
                await ns.sleep(500);
                continue;
            }



            let serv = data[0];
            let action = data[1];
            let threads = data[2];

            // ns.tprint("target: ", serv, "   action: ", action, "   with ", threads, " threads");

            let availableInstances = await maxInstances(ns, self, action);

            if (availableInstances > 0) {
                ns.print(`${self} received ${data}`);
                _ = actions.read();


                var remainder = null;
                if (availableInstances < threads) {
                    // push remainder of work back onto the queue
                    const delta = threads - availableInstances;

                    if(Number.isInteger(delta)) {
                        remainder = [serv, action, delta];
                        actions.write(remainder);
                    }

                    threads = availableInstances;
                }

                //const remainderMessage = remainder != null ? `adding remainder back onto queue: ${remainder}` : "";
                //ns.tprint(`${self} :: ${action} \t ${threads}t on ${serv} ${remainderMessage}`);
                // ns.tprint("would try to run this. max available: ", availableInstances, "   needed: ", threads);
                await ns.run(action + ".script", threads, serv, id);
                id++;
            }
            readLock = false;
        }

        if(await getFreeRam(ns, self, true) < 0.10 || actions.full()) {
            await ns.sleep(5000);
        } else {
            await ns.sleep(500);
        }

    }
}