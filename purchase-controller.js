function getCurrentWorkerServerRamExp(ns) {
    const servers = ns.getPurchasedServers();
    if(servers.length == 0)  {
        return 0;
    }

    return  Math.log2(ns.getServerMaxRam(servers[0]));
}

function getAffordableExp(ns, pct=0.8) {
    var limit = ns.getPurchasedServerLimit();
    var money = ns.getServerMoneyAvailable("home") * pct;

    var ram = 2;
    while(ns.getPurchasedServerCost(ram*2)*limit < money) {
        ram = ram * 2;
    }
    return Math.log2(ram);
}


function shouldPurchaseServers(ns) {
    const maximum = Math.log2(ns.getPurchasedServerMaxRam());
    var current = getCurrentWorkerServerRamExp(ns);
    var affordable = getAffordableExp(ns);

    const expDelta = affordable - current;

    // never purchase if we can't get at least 64gb each
    if(affordable < Math.log2(64) || expDelta < 4) {
       return 0;
    }

    return Math.min(affordable, maximum);
}



export async function main(ns) {

    const maximum = Math.log2(ns.getPurchasedServerMaxRam());

    while(getCurrentWorkerServerRamExp(ns) < maximum) {
        var current = getCurrentWorkerServerRamExp(ns);
        var affordable = getAffordableExp(ns);

        const purchaseAt = shouldPurchaseServers(ns);

        if(purchaseAt > 0) {
            if(!ns.scriptRunning("scan.js", "home")){
                ns.run("scan.js", 1, "drain");
                await ns.sleep(500);
            }

            ns.tprint(`replacing servers. current: ${current}, replacing at: ${purchaseAt}`);
            ns.run("purchase.js", 1, 2**purchaseAt, "replace");

        } else {
            ns.print(`exp delta is ${purchaseAt}. current: ${current} -> ${2**current}GB`);
        }

        await ns.sleep(60000);
    }

    ns.tprint(`at maximum of ${maximum} -> ${2**maximum}GB reached, exiting`);
}