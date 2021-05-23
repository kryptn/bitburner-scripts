async function learnHacking(ns, to, free=true) {
    const university = "Rothman University";
    const course = free ? "Study Computer Science" : "Algorithms";

    ns.tprint(`started learning: ${ns.universityCourse(university, course)}`);

    while(ns.getHackingLevel() < to) {
        await ns.sleep(2000);
    }

    ns.stopAction();
}

async function createProgram(ns, program) {
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
    const hackingLevel =  ns.args[0] != null ? ns.args[0] : 10;

    await learnHacking(ns, 10, false);

    await pwn(ns, "joesguns");
    ns.run("purchase-controller.js");

    await learnHacking(ns, 50, false);
    await createProgram(ns, "BruteSSH.exe");

    await learnHacking(ns, 100, false);
    await pwn(ns, "max-hardware");


    await createProgram(ns, "FTPCrack.exe");

    await deployWhenReady(ns, "crush-fitness");

    await deployWhenReady(ns, "rho-construction");

}