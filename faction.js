function getMaxRep(ns, fac) {
    const owned = ns.getOwnedAugmentations();


    return Math.max(...ns.getAugmentationsFromFaction(fac).filter(aug => !owned.includes(aug)).map(aug => ns.getAugmentationCost(aug)[0]));
}


async function work(ns, fac, target) {
    while (ns.getFactionRep(fac) < target) {
        ns.workForFaction(fac, "hacking");
        await ns.sleep(60 * 1000);
    }
}

function unpurchasedAugmentations(ns, fac) {
    const owned = ns.getOwnedAugmentations(true);

    var augmentations = ns.getAugmentationsFromFaction(fac).filter(a => !owned.includes(a));
    augmentations.sort((first, second) => {
        return ns.getAugmentationCost(first)[1] < ns.getAugmentationCost(second)[1];
    });
    var augList = augmentations.filter(aug => ns.getAugmentationPrereq(aug).length == 0);
    ns.tprint(`aug list => ${augList}`);
    var hasReqsAugList = augmentations.filter(aug => ns.getAugmentationPrereq(aug).length > 0);
    ns.tprint(`has reqs aug list => ${hasReqsAugList}`);
    for(const aug of hasReqsAugList) {
        const i = Math.max(...ns.getAugmentationPrereq(aug).map(a => augList.indexOf(a)));
        augList.splice(i+1, 0, aug);
    }


    return augList;
}

function priceFactor(i) {
    return 2 ** i;
}



function getTotalCost(ns, fac) {
    var price = 0;

    const augmentations = unpurchasedAugmentations(ns, fac);
    ns.tprint(`${fac} ::`);
    for(const aug of augmentations) {
        ns.tprint(`    ${aug} --> ${ns.nFormat(ns.getAugmentationCost(aug)[1], "$0.000a")}`);
    }
    //ns.tprint(`${fac} --> ${augmentations} `);

    return augmentations.map((aug, i) => ns.getAugmentationCost(aug)[1] * priceFactor(i)).reduce((acc, x) => acc + x, 0);

}

function showFactionInfo(ns, factions) {


    for (const faction of factions) {

        let totalCost = getTotalCost(ns, faction);


        for (const aug of ns.getAugmentationsFromFaction(faction)) {
            ns.tprint(`${faction} -> ${aug}`);
            const cost = ns.getAugmentationCost(aug);
            ns.tprint(`    reputation: ${cost[0]}`);
            ns.tprint(`         price: ${ns.nFormat(cost[1], "$0.000a")}`);

        }

        ns.tprint(`${faction} total cost: ${ns.nFormat(totalCost, "$0.000a")}`);



        const currentRep = ns.getFactionRep(faction);
        const maxRequiredRep = getMaxRep(ns, faction);
        ns.tprint(`starting work, faction: ${faction} \t current rep: ${currentRep} \t max rep: ${maxRequiredRep}`);
        //await work(ns, faction, maxRequiredRep);
        //

        ns.tprint(`finished work, faction: ${faction} \t current rep: ${currentRep} \t max rep: ${maxRequiredRep}`);
    }

}

const hacks = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];

function hackingPower(ns) {
    return hacks.map(h => ns.fileExists(h) ? 1 : 0).reduce((acc, x) => acc + x);

    var acc = 0;
    for (const hack of hacks) {
        if (ns.fileExists(hack))
            acc++;
    }

    return acc;
}

const cityFactions = ["Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven"];
const hackingFactions = ["CyberSec", "NiteSec", "The Black Hand", "BitRunners"];



async function tryJoinFaction(ns, faction) {
    if(ns.isBusy())
        return;

    if (hackingFactions.includes(faction)) {
        var serv = "";
        if (faction == "CyberSec")
            serv = "CSEC";
        if (faction == "NiteSec")
            serv = "avmnite-02h";
        if (faction == "The Black Hand")
            serv = "I.I.I.I";
        if (faction == "BitRunners")
            serv = "run4theh111z";

        ns.tprint(`faction: ${faction} -> server: ${serv}`);

        let canRoot = hackingPower(ns) >= ns.getServerNumPortsRequired(serv);
        let canHack = ns.getServerRequiredHackingLevel(serv) <= ns.getHackingLevel();

        ns.tprint(`can root: ${canRoot}, can hack: ${canHack}`);

        if (canRoot && canHack) {
            ns.run("pwn.js", 1, "backdoor", faction);
        }
    } else if (cityFactions.includes(faction)) {
        if(ns.getPlayer().city != faction)
            ns.travelToCity(faction);
    } else if (faction == "Tian Di Hui") {
        if(ns.getPlayer().city != "New Tokyo")
            ns.travelToCity("New Tokyo");
    }

}

async function money(ns, value) {
    while(ns.getServerMoneyAvailable("home") < value) {
        await ns.sleep(60000);
    }
}


export async function main(ns) {

    const factions = [
        "Sector-12",
        "CyberSec",
        "Tian Di Hui",
        "Chongqing",
        "NiteSec",
        "The Black Hand",
        "BitRunners",
        "Daedalus",
    ];

    var target = "";
    for (const faction of factions) {
        const unpurchased = unpurchasedAugmentations(ns, faction);
        ns.tprint(unpurchased);
        if (unpurchased.length > 0) {
            target = faction;
            break;
        }
    }

    if(ns.args[0] != null) {
        target = ns.args[0];
    }

    if (target == "") {
        ns.tprint("could not identify a target faction");
        return;
    } else {
        ns.tprint(`target faction: ${target}`);
    }

    if (!ns.getPlayer().factions.includes(target)) {
        ns.tprint(`attempting to join ${target}`);
        while (!ns.checkFactionInvitations().includes(target)) {
            await tryJoinFaction(ns, target);
            await ns.sleep(60 * 1000);
        }


        ns.tprint(`joined faction ${target}: ${ns.joinFaction(target)}`);

    } else {
        ns.tprint(`already a member of target faction: ${target}`);
    }



    const maxRequiredRep = getMaxRep(ns, target);
    ns.tprint(`waiting until we have ${ns.nFormat(maxRequiredRep, "0.000a")} rep`);
    await work(ns, target, maxRequiredRep);

    const requiredMoney = getTotalCost(ns, target);

    ns.tprint(`waiting until we have ${ns.nFormat(requiredMoney, "$0.000a")}`);

    await money(ns, requiredMoney);

    unpurchasedAugmentations(ns, target).forEach(aug => {
        ns.purchaseAugmentation(target, aug);
    });

    while(ns.purchaseAugmentation(target, "NeuroFlux Governor")) {
        await ns.sleep(100);
    }

    ns.spawn("reset.js", 1);

}