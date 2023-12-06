/** @param {NS} ns **/

export async function main(ns) {

    var target = ns.args[0];
    
    var cashTresh = ns.getServerMaxMoney(target) * 0.75;
    
    var secuTresh = ns.getServerMinSecurityLevel(target) + 5;
    
    // Main extraction loop
    
    while (true) {
    
    if (ns.getServerSecurityLevel(target) > secuTresh) {
    
    await ns.weaken(target);
    
    } else if (ns.getServerMoneyAvailable(target) > cashTresh) {
    
    await ns.hack(target);
    
    } else {
    
    await ns.grow(target);
    
    }
    
    }
    
    }