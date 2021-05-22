export async function collectServers(ns) {
    var servers = [];

    async function doscan(root, fn = (_) => true) {
        //await ns.sleep(100);

        servers.push(new Server({ name: root, ns: ns }));
        const branches = ns.scan(root).filter(fn);
        //ns.tprint(branches);
        for (const branch of branches) {
            await doscan(branch, (b) => b != root);
        }
    }

    await doscan("home", s => !s.startsWith("worker-"));

    return servers;
}

function Server(params) {
    this.name = params.name;
    this.requiredHackingLevel = params.ns.getServerRequiredHackingLevel(this.name);
    this.minimumSecurity = params.ns.getServerMinSecurityLevel(this.name);
    this.maxMoney = params.ns.getServerMaxMoney(this.name);
}


Server.prototype.canHack = function(ns) {
    return ns.getHackingLevel() >= this.requiredHackingLevel && this.maxMoney > 0 && ns.hasRootAccess(this.name);
};


Server.prototype.isFlushWithCash = function(ns) {
    let currentMoney = ns.getServerMoneyAvailable(this.name);
    return (currentMoney / this.maxMoney) > 0.80;
};

Server.prototype.isWeakEnough = function(ns) {
    return ns.getServerSecurityLevel(this.name) < this.minimumSecurity + 5;
};

Server.prototype.weakenThreads = function(ns) {
    const delta = ns.getServerSecurityLevel(this.name) - this.minimumSecurity;
    if(delta < 1) {
        return 0;
    }

    //const weakenRate = ns.getBitNodeMultipliers().ServerWeakenRate;
    const weakenRate = 1000;

    const threads = Math.max(Number.MIN_VALUE, delta * weakenRate);
    //ns.tprint(`${this.name} -> ${delta} would use ${threads} threads, current: ${ns.getServerSecurityLevel(this.name)} minimum: ${this.minimumSecurity} `);




    return Math.ceil(threads);
};

Server.prototype.threadsToMaxMoney = function(ns) {
    let currentMoney = ns.getServerMoneyAvailable(this.name);
    let neededMoney = this.maxMoney - currentMoney;

    if(currentMoney == 0) {
        return 10000;
    }

    let growth = neededMoney / currentMoney;

    if(growth < 1 || neededMoney < 1 || !Number.isFinite(growth))
        return 0;
    return Math.ceil(ns.growthAnalyze(this.name, growth));
};

Server.prototype.threadsToHack = function(ns) {
    let currentMoney = ns.getServerMoneyAvailable(this.name);
    return Math.max(Math.ceil(ns.hackAnalyzeThreads(this.name, currentMoney)), 1);
};

Server.prototype.actionsForServer = function(ns) {
    var actions = [];

    const weakenThreads = this.weakenThreads(ns);
    if (weakenThreads > 0) {
        actions.push([this.name, "weaken", weakenThreads]);
    }
    const growThreads = this.threadsToMaxMoney(ns);
    if (growThreads > 0) {
        actions.push([this.name, "grow", growThreads]);
    }

    if (this.isWeakEnough(ns) && this.isFlushWithCash(ns)) {
        const hackThreads = this.threadsToHack(ns);
        actions.push([this.name, "hack", hackThreads]);
    }

    return actions;
};

Server.prototype.info = function(ns) {
    ns.tprint(`${this.name} is flush with cash: ${this.isFlushWithCash(ns)} (has > 80%)`);
    ns.tprint(`MONEY:   has ${ns.nFormat(ns.getServerMoneyAvailable(this.name), "$0.000a")}, max: ${ns.nFormat(this.maxMoney, "$0.000a")}`);
    ns.tprint(`GROW:    would need ${this.threadsToMaxMoney(ns)}  threads to hit max money of ${ns.nFormat(this.maxMoney, "$0.000a")}`);
    ns.tprint(`WEAKEN:  needs weaknening?: ${this.isWeakEnough(ns)}  current: ${ns.getServerSecurityLevel(this.name)},  minimum: ${this.minimumSecurity}`);
    ns.tprint("\n\n\n");
};



export async function main(ns) {
    const servers = await collectServers(ns);

    if(ns.args[0] != null && ns.args[0] == "show-info") {
        servers.forEach((s) => {
            s.info(ns);
        });
        return;
    }

    if(ns.args[0] == "drain") {
        for(var i = 1; i < 21; i++) {
            ns.clear(i);
        }
    }

    var port = ns.getPortHandle(1);

    var queuedActions = [];

    function fillQueueIfEmpty() {
        if (queuedActions.length < 10) {
            const validServers = servers.filter(s => s.canHack(ns));

            //ns.tprint(`total servers: ${servers.length},  valid servers: ${validServers.map(s => s.name)}`);
            var newActions = validServers.map(server => server.actionsForServer(ns)).flat();
            // ns.tprint(`filling queue with ${newActions.length} items, \n\n${newActions}\n\n`);
            queuedActions = newActions.concat(queuedActions);
        }
    }

    while(true) {
        if(port.data.length < 10) {
            fillQueueIfEmpty();
            var action = queuedActions.pop();
            port.write(action);
            ns.print(`adding action: ${action}`);
        }
        await ns.sleep(250);
    }



}