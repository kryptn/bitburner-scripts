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

export async function main(ns) {

    const factions = [
        //"Tian Di Hui",
        //"NiteSec",
        "Chongqing",
        //"New Tokyo",
        //"Ishima",
        "BitRunners"
    ];

    for (const faction of factions) {
        // ns.tprint(ns.getAugmentationsFromFaction(faction));

        const currentRep = ns.getFactionRep(faction);
        const maxRequiredRep = getMaxRep(ns, faction);
        ns.tprint(`starting work, faction: ${faction} \t current rep: ${currentRep} \t max rep: ${maxRequiredRep}`);
        await work(ns, faction, maxRequiredRep);

        ns.tprint(`finished work, faction: ${faction} \t current rep: ${currentRep} \t max rep: ${maxRequiredRep}`);
    }

}