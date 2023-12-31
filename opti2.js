import { millisecondsToString, getServerNames } from "util/util.js"

const HACK_SCRIPT = "/single/hack.js"
const GROW_SCRIPT = "/single/grow.js"
const WEAKEN_SCRIPT = "/single/weaken.js"

/** @type {NS} **/
let ns
export async function main(_ns) {
    ns = _ns
    ns.disableLog("ALL")
    ns.clearLog()

    const worker = ns.args[0] || "home"
    const singleTarget = ns.args[1]

    let targets = {}

    if (singleTarget) {
        targets[singleTarget] = {
            nextAction: "INIT",
            msDone: 0,
            hackPercent: 90,
        }
    } else {
        getServerNames(ns).forEach(hostname => {
            if (ns.getServerMaxMoney(hostname) > 0  && ns.getServerGrowth(hostname) > 1) {
                targets[hostname] = {
                    nextAction: "INIT",
                    msDone: 0,
                    hackPercent: 90,
                }
            }
        })
    }

    await uploadScripts(worker)
    await hackLoop(worker, targets)
}

async function uploadScripts(worker) {
    await ns.scp(HACK_SCRIPT, worker)
    await ns.scp(GROW_SCRIPT, worker)
    await ns.scp(WEAKEN_SCRIPT, worker)
}

async function hackLoop(worker, targets) {
    const updateInterval = 500

    while (true) {
        await ns.sleep(updateInterval)

        for (const [target, meta] of Object.entries(targets)) {
            meta.msDone -= updateInterval

            if (meta.msDone < 0) {
                if (meta.nextAction === "INIT") {
                    init(target, meta)
                } else if (meta.nextAction === "WEAKEN") {
                    weaken(target, meta)
                } else if (meta.nextAction === "GROW") {
                    grow(target, meta)
                } else if (meta.nextAction === "HACK") {
                    hack(target, meta)
                }
            }
        }
    }

    function init(target, meta) {
        log(`exec ${meta.nextAction} on ${target}`)
        meta.raisedSecurityLevel = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)
        log(`initial weaken of ${target} ${meta.raisedSecurityLevel}`)
        meta.nextAction = "WEAKEN"
    }

    function weaken(target, meta) {
        log(`exec ${meta.nextAction} on ${target}`)

        let weakenThreads = 0
        while (ns.weakenAnalyze(weakenThreads++, 1) <= meta.raisedSecurityLevel) { }
        log(`weakening with ${weakenThreads} threads (${millisecondsToString(ns.getWeakenTime(target))})`)
        const wait = attack("weaken", worker, target, weakenThreads)
        if (wait >= 0) {
            meta.msDone = wait
            meta.raisedSecurityLevel = 0
            meta.nextAction = "GROW"
        }
    }

    function grow(target, meta) {
        log(`exec ${meta.nextAction} on ${target}`)

        const growThreads = calcNumberOfThreadsToGrowToMax(target)
        if (growThreads > 0) {
            log(`growing with ${growThreads} threads (${millisecondsToString(ns.getGrowTime(target))})`)
            const wait = attack("grow", worker, target, growThreads)
            if (wait >= 0) {
                meta.msDone = wait
                meta.raisedSecurityLevel += ns.growthAnalyzeSecurity(growThreads)
                meta.nextAction = "HACK"
            }
        } else {
            meta.msDone = 0
            meta.nextAction = "HACK"
        }

        function calcNumberOfThreadsToGrowToMax() {
            const maxMoney = ns.getServerMaxMoney(target)
            const availableMoney = ns.getServerMoneyAvailable(target)
            const alpha = (availableMoney > 0 ? (1 / (availableMoney / maxMoney)) : 100)
            return Math.round(ns.growthAnalyze(target, alpha, 1))
        }
    }

    function hack(target, meta) {
        log(`exec ${meta.nextAction} on ${target}`)

        const partHackableMoney = ns.hackAnalyze(target)
        const hackThreads = Math.floor(1 / partHackableMoney / (100 / meta.hackPercent))
        ns.print(`hacking with ${hackThreads} threads (${millisecondsToString(ns.getHackTime(target))})`)
        const wait = attack("hack", worker, target, hackThreads)
        if (wait >= 0) {
            meta.msDone = wait
            meta.raisedSecurityLevel += ns.hackAnalyzeSecurity(hackThreads)
            meta.nextAction = "WEAKEN"
        }
    }
}

function attack(type, worker, target, maxThreads) {
    let wait = 0

    let scriptName

    if (type === "hack") {
        wait = ns.getHackTime(target)
        scriptName = HACK_SCRIPT
    } else if (type === "grow") {
        wait = ns.getGrowTime(target)
        scriptName = GROW_SCRIPT
    } else if (type === "weaken") {
        wait = ns.getWeakenTime(target)
        scriptName = WEAKEN_SCRIPT
    } else {
        throw Error(`UNKNOWN TYPE: ${type}`)
    }
    const maxThreadsRam = calcMaxThreadsRam(scriptName)
    const threads = Math.min(maxThreads, maxThreadsRam)

    log(`ns.exec ${scriptName} ${worker} ${threads} ${target} ${wait}`)
    if (ns.exec(scriptName, worker, threads, target) === 0) {
        log(`Could not exec ${scriptName} on ${worker}. Ram full? Root?`)
        return -1
    }

    return wait

    function calcMaxThreadsRam(script) {
        const freeRam = ns.getServerMaxRam(worker) - ns.getServerUsedRam(worker)
        return Math.floor(freeRam / ns.getScriptRam(script, worker))
    }
}

export function autocomplete(data, args) {
    return [...data.servers]; // This script autocompletes the list of servers.
}

function log(message) {
    ns.print(`${new Date().toLocaleTimeString()} ${message}`)
}

util/util.js:

/** @param {NS} ns */
export function getServerNames(ns) {
    return getServers(ns).map(s => {return s.hostname})
}

/** @param {NS} ns */
export function getServers(ns) {
    return [...recurseServers()].filter(s => {
        return s.hostname != "darkweb"
    })

    /**
     * @generator Traverses the connection tree in pre-order
     * @param fn Function called on each server
     * @param current Starting point default to home
     * @param {string[]} visited Array of already visited servers
     * @param depth The current depth in traversal
     */
    function* recurseServers(fn = () => { }, current = "home", visited = [], depth = 0) {
        if (!visited.includes(current)) {
            //ns.print(depth.toString().padStart(4) + " ||  ".repeat(depth + 1) + current)
            yield { hostname: current, depth: depth, path: [...visited.slice().reverse(), current] }
            let next = ns.scan(current)
            for (let n of next) {
                yield* recurseServers(fn, n, [current, ...visited], depth + 1)
            }
        }
    }
}

const secondsPerYear = 31536000
const secondsPerDay = 86400
const secondsPerHour = 3600
const secondsPerMinute = 60

export function millisecondsToString(milliseconds) {
    const secs = milliseconds / 1000 // convert to seconds
    var years = Math.floor(secs / secondsPerYear);
    var days = Math.floor((secs % secondsPerYear) / secondsPerDay);
    var hours = Math.floor(((secs % secondsPerYear) % secondsPerDay) / secondsPerHour);
    var minutes = Math.floor((((secs % secondsPerYear) % secondsPerDay) % secondsPerHour) / secondsPerMinute);
    var seconds = (((secs % secondsPerYear) % secondsPerDay) % secondsPerHour) % secondsPerMinute;

    let str = ""
    if (years > 0) {
        str += years + " years "
    }
    if (days > 0) {
        str += days + " days "
    }
    if (hours > 0) {
        str += hours + " hours "
    }
    if (hours > 0) {
        str += hours + " hours "
    }
    if (minutes > 0) {
        str += minutes + " minutes "
    }
    return str + seconds + " seconds";
}

single/hack.js:

/** @param {NS} ns **/
export async function main(ns) {
    await ns.hack(ns.args[0])
}

single/grow.js:

/** @param {NS} ns **/
export async function main(ns) {
    await ns.grow(ns.args[0])
}

single/weaken.js:

/** @param {NS} ns **/
export async function main(ns) {
    await ns.weaken(ns.args[0])
}