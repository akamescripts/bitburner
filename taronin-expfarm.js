/** @param {NS} ns */
export async function main(ns) {
    for (let host of ns.getPurchasedServers()) {
        if (ns.ps(host).length == 0) {
            let ram = ns.getServerMaxRam(host);
            let threads = Math.floor(ram/ns.getScriptRam("weaken.js"));
            await ns.scp("weaken.js", host);
            ns.exec("weaken.js", host, threads, "joesguns");
            ns.tprint(host);
        }
    }
}