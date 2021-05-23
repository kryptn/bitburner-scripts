
function display(ns, hostname, indent=0) {

    const spacer = `${"--".repeat(indent)}`;

    ns.tprint(`${spacer}>${hostname}`);

    const rootAccess = ns.hasRootAccess(hostname) ? "YES" : "NO";
    const reqHacking = ns.getServerRequiredHackingLevel(hostname);
    ns.tprint(`${spacer}--Root Access: ${rootAccess}, Required Hacking Skill: ${reqHacking}`);

    const reqPorts = ns.getServerNumPortsRequired(hostname);
    ns.tprint(`${spacer}--Number of open ports required to NUKE: ${reqPorts}`);

    const maxRam = ns.getServerMaxRam(hostname);
    ns.tprint(`${spacer}--RAM: ${ns.nFormat(maxRam, "0.00")}GB`);
    //ns.tprint(`${spacer}`);

    ns.tprint("");
}


function scan(ns, displayFunc, start, maxDepth=3) {

    function doscan(root, depth=0, fn = (_) => true) {
        const branches = ns.scan(root).filter(fn).sort();

        displayFunc(ns, root, depth);
        if(depth == maxDepth)
            return;

        for (const branch of branches) {
            doscan(branch, depth+1, (b) => b != root);
        }
    }

    doscan(start, 0, s => !s.startsWith("worker-"));

}


export async function main(ns) {

    const start = ns.getHostname();
    const depth = ns.args[0] != null ? ns.args[0] : 3;

    scan(ns, display, start, depth);

}