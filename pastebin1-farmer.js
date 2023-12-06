/** @param {NS} ns **/
export async function main(ns) {
    let toFarm = []
 
    const farmScriptName = "farm.js"
    const forceUpdate = ns.args.length > 0 && ns.args[0] == "force"
    const myServers = [...ns.getPurchasedServers(), "home"]
 
    let usedServers = {
        "home": extendServerInfo(ns.getServer("home")),
        "darkweb": extendServerInfo(ns.getServer("darkweb"))
    }
 
    const player = ns.getPlayer()
 
    function extendServerInfo(sInfo) {
        sInfo.hostname ||= ""
        sInfo.moneyMax ||= 0
        sInfo.name = sInfo.hostname
        sInfo.hasAdminRights ||= false
        sInfo.requiredHackingSkill ||= 0
        sInfo.moneyMax ||= 0
        try {
            sInfo.ht = ns.getHackTime(sInfo.hostname) / 1000
            sInfo.gt = ns.getGrowTime(sInfo.hostname) / 1000
            sInfo.wt = ns.getWeakenTime(sInfo.hostname) / 1000
            sInfo.cf = sInfo.moneyMax / (sInfo.ht + sInfo.gt + sInfo.wt)
        } catch {
            sInfo.ht = 0
            sInfo.gt = 0
            sInfo.wt = 0
            sInfo.cf = 0
        }
        return sInfo
    }
 
    async function prepareToHackServer(sInfo) {
        if (!sInfo.sshPortOpen && ns.fileExists("BruteSSH.exe", "home")) {
            await ns.brutessh(sInfo.hostname)
            ns.print(sInfo.hostname, " sshPortOpen")
        }
        if (!sInfo.ftpPortOpen && ns.fileExists("FTPCrack.exe", "home")) {
            await ns.ftpcrack(sInfo.hostname)
            ns.print(sInfo.hostname, " ftpPortOpen")
        }
        if (!sInfo.httpPortOpen && ns.fileExists("HTTPWorm.exe", "home")) {
            await ns.httpworm(sInfo.hostname)
            ns.print(sInfo.hostname, " httpPortOpen")
        }
        if (!sInfo.smtpPortOpen && ns.fileExists("relaySMTP.exe", "home")) {
            await ns.relaysmtp(sInfo.hostname)
            ns.print(sInfo.hostname, " smtpPortOpen")
        }
        if (!sInfo.sqlPortOpen && ns.fileExists("SQLInject.exe", "home")) {
            await ns.sqlinject(sInfo.hostname)
            ns.print(sInfo.hostname, " sqlPortOpen")
        }
        if (!sInfo.hasAdminRights && sInfo.openPortCount >= sInfo.numOpenPortsRequired) {
            try {
                await ns.nuke(sInfo.hostname)
                ns.print(sInfo.hostname, " hasAdminRights")
            } catch {
                ns.print(sInfo.hostname, " hack fail")
            }
        }
    }
 
 
    async function createFarm() {
        const content = `/** @param {NS} ns **/
export async function main(ns) {
    let target = ns.args[0];
    let moneyThresh = ns.getServerMaxMoney(target) * 0.99;
    let securityThresh = ns.getServerMinSecurityLevel(target) + 5;
    while (true) {
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }
    }
}`
        await ns.write(farmScriptName, content, "w")
    }
 
 
 
    if (forceUpdate || !ns.fileExists(farmScriptName, "home")) {
        await createFarm()
    }
    const farmScriptCost = ns.getScriptRam(farmScriptName, "home")
 
    let toScan = ["home"]
    while (toScan.length > 0) {
        const servers = ns.scan(toScan.pop())
        for (let serverName of servers) {
            if (serverName in usedServers) {
                continue
            }
            toScan.push(serverName)
            let sInfo = extendServerInfo(ns.getServer(serverName))
            usedServers[serverName] = sInfo
            if (player.hacking + 5 < sInfo.requiredHackingSkill) { continue }
 
            await prepareToHackServer(sInfo)
            sInfo = extendServerInfo(ns.getServer(serverName))
            usedServers[serverName] = sInfo
 
            if (sInfo.hasAdminRights) {
                if (myServers.indexOf(serverName) != -1) {
                    continue
                }
                if (sInfo.moneyMax > 0) {
                    toFarm.push(sInfo)
                }
            }
        }
    }
 
    toFarm.sort((a, b) => a.moneyMax - b.moneyMax)
    let servers = Object.values(usedServers).sort((a, b) => b.maxRam - a.maxRam)
    for (const srv of servers) {
        ns.scriptKill(farmScriptName, srv.hostname)
 
        if (toFarm.length < 1) {
            continue
        }
        if (!srv.hasAdminRights) {
            continue
        }
        const maxRam = srv.maxRam + (srv.hostname == "home" ? -20 : 0)
        if (maxRam < farmScriptCost) {
            continue
        }
        ns.tprintf("%s RAM %f", srv.hostname, maxRam)
 
        const farmData = toFarm.pop()
        ns.tprintf("FARM %s MONEY MAX %f", farmData.hostname, farmData.moneyMax)
 
        if (forceUpdate || !ns.fileExists(farmScriptName, srv.hostname)) {
            await ns.scp(farmScriptName, "home", srv.hostname)
        }
        const threads = Math.trunc(maxRam / farmScriptCost)
        ns.exec(farmScriptName, srv.hostname, threads, farmData.hostname)
 
    }
 
    ns.tprintf("FARM SCRIPT COST %f", farmScriptCost)
    ns.tprint("FINISH")
}