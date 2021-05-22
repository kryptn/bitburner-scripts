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

export async function main(ns) {
    const hackingLevel =  ns.args[0] != null ? ns.args[0] : 10;

    await learnHacking(ns, 10, false);

    ns.run("pwn.js", 1, "joesguns", "redeploy");
    ns.run("purchase-controller.js");

    await learnHacking(ns, 50, false);
    await createProgram(ns, "BruteSSH.exe");

    await learnHacking(ns, 100, false);
    ns.scriptKill("pwn.js", "home");
    await ns.sleep(1000);
    ns.run("pwn.js", 1,  "max-hardware", "redeploy");

    await createProgram(ns, "FTPCrack.exe");
}