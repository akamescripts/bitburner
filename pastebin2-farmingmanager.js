// If the percentage of money on server is LESS than this, grow it to max
const growPercent =  90
// hack the sever only if the percentage of money on server is MORE than this 
const hackPercent =  75
// hack the sever only if the security of the server is this many above the minimal
const secThreshold =  50
 
/** @param {NS} ns **/
export async function main(ns) {
    while (true) {
        // scan and hack all accesible servers
        var servers = scanAndHack(ns);
        // ns.tprint(`servers:${[...servers.values()]}`)
 
        // transfer file to servers
        for (let server of servers) {
            await ns.scp("hack.js", "home", server)
            await ns.scp("weaken.js", "home", server)
            await ns.scp("grow.js", "home", server)
            // some script to help you save time backdooring servers
            // , requires singularity module
            //             if(server === "CSEC" || server === "I.I.I.I" 
            //             || server === "avmnite-02h" || server === "run4theh111z"){
            // await ns.installBackdoor(server)
            //             }
 
        }
 
        // find servers that we can run scripts on
        var freeRams = getFreeRam(ns, servers);
        // ns.tprint(`freeRams:${freeRams.map(value => JSON.stringify(value))}`)
 
        // find servers that we can hack
        var hackables = getHackable(ns, servers);
        // ns.tprint(`hackable:${[...hackables.values()]}`)
 
        // get currently running scripts on servers
        var hackstates = getHackStates(ns, servers, hackables)
        // ns.tprint(`hackstates:${[...hackstates.entries()].map((v, _i) => `${v[0]}:{${JSON.stringify(v[1])}}\n`)}`)
 
        // Main logic sits here, determine whether or not and how many threadsd
        // we should call weaken, grow and hack asynchronously 
        manageAndHack(ns, freeRams, hackables, hackstates)
 
        await ns.sleep(2000)
    }
}
 
function manageAndHack(ns, freeRams, hackables, hackstates) {
    for (let target of hackables) {
        const money = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        const sec = ns.getServerSecurityLevel(target);
 
        var secDiff = sec - minSec
        // weaken if the security of the host is not at its minimum
        if (secDiff > 0) {
            var threads = Math.floor(secDiff * 20) - hackstates.get(target).weaken;
            if (threads > 0) {
                // if we didnt find any place to run, 
                // it means we have ran out of places to run anything, so stop this 
                // and wait for next cycle
                if (!findPlaceToRun(ns, "weaken.js", threads, freeRams, target)) {
                    return
                }
            }
 
        }
 
        var moneyPercent = money / maxMoney * 100
        // grow if money is less then the percentage 
        if (moneyPercent < growPercent) {
            var threads = Math.floor(ns.growthAnalyze(target, 100 / moneyPercent))
                - hackstates.get(target).grow;
            if (threads > 0) {
                // if we didnt find any place to run, 
                // it means we have ran out of places to run anything, so stop this 
                // and wait for next cycle
                if (!findPlaceToRun(ns, "grow.js", threads, freeRams, target)) {
                    return;
                }
            }
        }
 
        if (moneyPercent > hackPercent && secDiff < secThreshold) {
            var threads = Math.floor(ns.hackAnalyzeThreads(target, money - (0.4 * maxMoney)))
                - hackstates.get(target).hack
            if (threads > 0) {
                // hack to money percent = 70
                if (!findPlaceToRun(ns, "hack.js", threads, freeRams, target)) {
                    return;
                }
            }
        }
        // ns.tprint(`target:${target} secDiff:${secDiff.toFixed(2)} moneyPercent:${moneyPercent.toFixed(2)}`)
    }
 
}
 
// find some place to run the script with given amount of threads
// returns ture means script was executed, false means it didnt
function findPlaceToRun(ns, script, threads, freeRams, target) {
    let scriptRam = ns.getScriptRam(script)
    var remaingThread = threads;
    while (true) {
        // if no more host with ram, return false
        if (freeRams.length === 0) {
            return false;
        }
 
        // try with first availiable host
        var host = freeRams[0].host;
        var ram = freeRams[0].freeRam;
 
        // if not enough ram on host to even run 1 thread, remove the host from list
        if (ram < scriptRam) {
            freeRams.shift()
 
            // else if the ram on the host is not enough to run all threads, just run as much as it can
        } else if (ram < scriptRam * remaingThread) {
            const threadForThisHost = Math.floor(ram / scriptRam)
 
            // try to run the script, at this point this will only fail if
            // the host is already running the script against the same target,
            // from an earlier cycle
            if (ns.exec(script, host, threadForThisHost, target) === 0) {
                // if failed, than find the next host to run it, and return its result
                return findPlaceToRun(ns, script, threads, freeRams.slice(1), target)
            } else {
                // if run successed update thread to run and remove this host from the list
                // if (script === "hack.js") {
                // ns.tprint(`executing ${script} on ${host} with ${threadForThisHost} threads, targeting ${target}`)
                // }
                remaingThread -= threadForThisHost
                freeRams.shift()
            }
 
        } else {
            // try to run the script, at this point this will only fail if
            // the host is already running the script against the same target,
            // from an earlier cycle
            if (ns.exec(script, host, remaingThread, target) === 0) {
                // if failed, than find the next host to run it, and return its result
                if (!findPlaceToRun(ns, script, threads, freeRams.slice(1), target)) {
                    return false;
                }
            } else {
                // if run successed update the remaining ram for this host
                // if (script === "hack.js") {
                //     ns.tprint(`executing ${script} on ${host} with ${remaingThread} threads, targeting ${target}`)
                // }
                freeRams[0].freeRam -= scriptRam * remaingThread
            }
 
            return true;
        }
    }
}
 
// gets the number of running threads against hackable servers
function getHackStates(ns, servers, hackables) {
    var hackstates = new Map();
    for (let server of servers.values()) {
        for (let hackable of hackables.values()) {
            let weakenScript = ns.getRunningScript("weaken.js", server, hackable);
            let growScript = ns.getRunningScript("grow.js", server, hackable);
            let hackScript = ns.getRunningScript("hack.js", server, hackable);
            if (hackstates.has(hackable)) {
                hackstates.get(hackable).weaken += weakenScript === null ? 0 : weakenScript.threads
                hackstates.get(hackable).grow += growScript === null ? 0 : growScript.threads
                hackstates.get(hackable).hack += hackScript === null ? 0 : hackScript.threads
            } else {
                hackstates.set(hackable, {
                    weaken: weakenScript === null ? 0 : weakenScript.threads,
                    grow: growScript === null ? 0 : growScript.threads,
                    hack: hackScript === null ? 0 : hackScript.threads
                })
            }
        }
    }
    return hackstates
}
 
// filter the list for hackable servers
function getHackable(ns, servers) {
    return [...servers.values()].filter(server => ns.getServerMaxMoney(server) > 100000
        && ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()
        && ns.getServerMoneyAvailable(server) > 1000
        && ns.getServerGrowth(server))
        .sort((a, b) => ns.getServerRequiredHackingLevel(a) - ns.getServerRequiredHackingLevel(b))
}
 
// filter the list for servers where we can run script on
function getFreeRam(ns, servers) {
    const freeRams = [];
    for (let server of servers) {
        const freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        if (freeRam > 1) {
            freeRams.push({ host: server, freeRam: freeRam });
        }
 
    }
    var sortedFreeRams = freeRams.sort((a, b) => b.freeRam - a.freeRam);
    return sortedFreeRams;
}
 
// scan all servers from home and hack them if we can
function scanAndHack(ns) {
    let servers = new Set(["home"]);
    scanAll("home", servers, ns);
    const accesibleServers = new Set();
    for (let server of servers) {
        if (ns.hasRootAccess(server)) {
            accesibleServers.add(server)
        } else {
            var portOpened = 0;
            if (ns.fileExists("BruteSSH.exe")) {
                ns.brutessh(server);
                portOpened++;
            }
            if (ns.fileExists("FTPCrack.exe")) {
                ns.ftpcrack(server);
                portOpened++;
            }
 
            if (ns.fileExists("HTTPWorm.exe")) {
                ns.httpworm(server);
                portOpened++;
            }
            if (ns.fileExists("relaySMTP.exe")) {
                ns.relaysmtp(server);
                portOpened++;
            }
 
            if (ns.fileExists("SQLInject.exe")) {
                ns.sqlinject(server);
                portOpened++;
            }
 
            if (ns.getServerNumPortsRequired(server) <= portOpened) {
                ns.nuke(server);
                accesibleServers.add(server);
            }
        }
 
 
    }
    return accesibleServers;
}
 
function scanAll(host, servers, ns) {
    var hosts = ns.scan(host);
    for (let i = 0; i < hosts.length; i++) {
        if (!servers.has(hosts[i])) {
            servers.add(hosts[i]);
            scanAll(hosts[i], servers, ns);
        }
 
    }
}