async function bootstrapServer(ns, hostname) {
    ns.tprint(`bootstraping ${hostname}`);

    ns.scriptKill("controller.js", hostname);

    let files = ["controller.js", "hack.script", "weaken.script", "grow.script", "do-it-all.script"];
    ns.scp(files, hostname);

    ns.exec("controller.js", hostname, 1, 1);
}



export async function main(ns) {
    let size = ns.args[0];
    ns.tprint("size: ", size);

    var limit = ns.getPurchasedServerLimit();
    var money = ns.getServerMoneyAvailable("home");

    if(size == "max") {
        var ram = 2;
        while(ns.getPurchasedServerCost(ram*2)*limit < money*0.8) {
            ram = ram * 2;
        }
        size = ram;
    }

    ns.tprint("determined size: ", size);

    const ctrl = ns.args.length > 1 ? ns.args[1] : null;

    if(ctrl == "dry-run") {
        return;
    }


    let replace = ctrl == "replace";

    if(replace) {
        for(const hostname of ns.getPurchasedServers()) {
            ns.tprint(`deleting ${hostname}`);
            ns.killall(hostname);
            await ns.sleep(100);
            ns.tprint(`deleted: ${ns.deleteServer(hostname)}`);
        }

        await ns.sleep(1000);
    }


    let servers = ns.getPurchasedServers();
    for (const hostname of servers) {
        ns.tprint(`re-applying ${hostname}`);
        await bootstrapServer(ns, hostname);
        await ns.sleep(1000);
    }

    var i = servers.length;


    while(i < limit) {
        let money = await ns.getServerMoneyAvailable("home");
        let cost = await ns.getPurchasedServerCost(size);
        if(money > cost) {
            let hostname = await ns.purchaseServer(`worker-${size}gb-${i}`, size);
            ns.tprint(`purchased ${hostname}`);
            bootstrapServer(ns, hostname);
            i++;
        }
        await ns.sleep(1000);
    }

    //let cost = await ns.getPurchasedServerCost(size);
    //await ns.tprint(`${size}GB costs ${cost}`);
}