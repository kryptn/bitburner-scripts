// run pwn.js target-server [redeploy]

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

async function traverse(ns, from, to) {

    async function doscan(root, fn = (_) => true) {
        if (root == to) {
            return [root];
        }

        const branches = ns.scan(root).filter(fn);

        if (branches.length == 0) {
            return [];
        }

        var deeper = [];
        for (const branch of branches) {
            const thing = await doscan(branch, sb => sb != root);
            deeper.push(thing);
        }

        const flattened = deeper.flat();
        if (flattened.length > 0) {
            return [root, ...flattened];
        }


        return [];
    }

    const path = await doscan(from);

    return path;
}

const hacks = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];

function hackingPower(ns) {
    var acc = 0;
    for(const hack of hacks) {
        if(ns.fileExists(hack))
            acc++;
    }

    return acc;
}

function buyAllHacks(ns) {

    ns.purchaseTor();
    for (const hack of hacks) {
        ns.purchaseProgram(hack);
    }
}

function Server(params) {
    this.name = params.name;
    this.requiredHackingLevel = params.ns.getServerRequiredHackingLevel(this.name);
    this.minimumSecurity = params.ns.getServerMinSecurityLevel(this.name);
    this.maxMoney = params.ns.getServerMaxMoney(this.name);
    this.redeployed = false;
}


Server.prototype.canHack = function(ns) {
    return ns.getHackingLevel() >= this.requiredHackingLevel;
};


Server.prototype.canPwn = function(ns) {
    const power = hackingPower(ns);
    const required = ns.getServerNumPortsRequired(this.name);

    const canPwn = power >= required;

    ns.print(`can${canPwn ? "" : "'t"} pwn ${this.name} \t power: ${power}, server requires: ${required}`);

    return canPwn && !ns.hasRootAccess(this.name);
};

Server.prototype.pwn = function(ns) {

    const level = hackingPower(ns);

    if (level >= 1)
        ns.brutessh(this.name);

    if (level >= 2)
        ns.ftpcrack(this.name);

    if (level >= 3)
        ns.relaysmtp(this.name);

    if (level >= 4)
        ns.httpworm(this.name);

    if (level >= 5)
        ns.sqlinject(this.name);

    ns.nuke(this.name);

};


async function pwnAllServers(ns, servers, redeploy, target) {
    for (const server of servers) {

        const canpwn = server.canPwn(ns);

        if (canpwn) {
            ns.tprint(`pwning ${server.name}`);
            server.pwn(ns);
        }
        await ns.sleep(100);

        if(!server.redeployed || !ns.scriptRunning("old-hack.script", target)){
            //ns.tprint(`redeploying ${server.name}. redeploy: ${redeploy}, old-hack running: ${ns.scriptRunning("old-hack.script", server.name)}`)
            ns.run("deploy.script", 1, server.name, target);
            server.redeployed = true;
        }
    }
}


function ignores(server) {
    if (server.name == "darkweb" || server.name == "home" || server.name.startsWith("worker-"))
        return false;
    return true;
}


async function hackFaction(ns, faction) {
    var serv = "";
    if(faction == "CSEC")
        serv = "CSEC";
    if(faction == "NiteSec")
        serv = "avmnite-02h";
    if(faction == "Black Hand")
        serv = "I.I.I.I";
    if(faction == "BitRunners")
        serv = "run4theh111z";

    if(serv == "")
        return;

    const path = await traverse(ns, "home", serv);

    for(const node of path) {
        ns.connect(node);
    }

    await ns.installBackdoor();

    ns.connect("home");
}




export async function main(ns) {
    const allServers = await collectServers(ns);
    const servers = allServers.filter(ignores);

    const target = ns.args[0];
    const redeploy = ns.args[1] == "redeploy";


    if(ns.args[0] == "backdoor") {
        await hackFaction(ns, ns.args[1]);
        return
    }




    do {
        buyAllHacks(ns);
        await pwnAllServers(ns, servers, redeploy, target);

        await ns.sleep(10000);
    } while (!servers.every((s) => ns.hasRootAccess(s.name)));


    ns.tprint("everything pwned?");

    //const path = await traverse(ns, "home", "CSEC", () => {ns.tprint("action ran")});

    const from = ns.args[0];
    const to = ns.args[1];

    //const path = await traverse(ns, from, to, (path) => {ns.tprint("action ran, path is ", path)});


}