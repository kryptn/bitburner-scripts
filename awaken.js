async function learnHacking(ns, to, free=true) {
    const university = "Rothman University";
    const course = free ? "Study Computer Science" : "Algorithms";

    if(ns.getHackingLevel() >= to) {
        return;
    }


    ns.tprint(`started learning: ${ns.universityCourse(university, course)}`);

    while(ns.getHackingLevel() < to) {
        await ns.sleep(2000);
    }

    ns.stopAction();
}

async function createProgram(ns, program) {
    if(ns.fileExists(program)) {
        return;
    }

    ns.tprint(`started creating program ${program}: ${ns.createProgram(program)}`);
    while(!ns.fileExists(program)){
        await ns.sleep(2000);
    }
}

async function pwn(ns, target) {
    ns.scriptKill("pwn.js", "home");
    await ns.sleep(1000);
    ns.run("pwn.js", 1,  target, "redeploy");
}

async function hack(ns, fac) {
    ns.run("pwn.js", 1, "backdoor", fac);
}

async function waitUntilHackingLevel(ns, level) {
    while(ns.getHackingLevel() < level) {
        await ns.sleep(30000);
    }
}

async function deployWhenReady(ns, target) {
    const requiredLevel = ns.getServerRequiredHackingLevel(target);
    await waitUntilHackingLevel(ns, requiredLevel);

    await pwn(ns, target);
}

export async function main(ns) {
    let free = ns.getServerMoneyAvailable("home") < 100000;

    ns.tprint(`free: ${free}`);

    await learnHacking(ns, 10, free);

    await pwn(ns, "joesguns");
    ns.run("purchase-controller.js");
    ns.run("faction.js");

    await learnHacking(ns, 50, free);
    await createProgram(ns, "BruteSSH.exe");

    await learnHacking(ns, 100, free);
    await pwn(ns, "max-hardware");


    await createProgram(ns, "FTPCrack.exe");

    await deployWhenReady(ns, "crush-fitness");

    await deployWhenReady(ns, "rho-construction");

    await waitUntilHackingLevel(ns, 3000);
    await hack(ns, "bitnode");

}