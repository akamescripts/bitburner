/** @param {NS} ns **/

export async function main(ns) {

    // Arguments provided by network_crawler script
    
    var hostServer = ns.args[0];
    
    var hostMaxRam = ns.getServerMaxRam(hostServer);
    
    var hostUsedRam;
    
    var serverList = [‘zb-def’, ‘taiyang-digital’, ‘nova-med’, ‘infocomm’,
    
    ‘defcomm’, ‘univ-energy’, ‘solaris’, ‘icarus’, ‘zeus-med’,
    
    ‘unitalife’, ‘omnia’, ‘deltaone’,
    
    ‘global-pharm’, ‘snap-fitness’, ‘galactic-cyber’, ‘aerocorp’,
    
    ‘aevum-police’, ‘millenium-fitness’, ‘lexo-corp’, ‘alpha-ent’, ‘rho-construction’,
    
    ‘zb-institute’, ‘catalyst’, ‘summit-uni’, ‘rothman-uni’, ‘syscore’,
    
    ‘comptek’, ‘crush-fitness’, ‘the-hub’, ‘netlink’, ‘johnson-ortho’,
    
    ‘omega-net’, ‘silver-helix’, ‘phantasy’, ‘neo-net’,
    
    ‘max-hardware’, ‘zer0’, ‘CSEC’, ‘nectar-net’,
    
    ‘iron-gym’, ‘harakiri-sushi’, ‘hong-fang-tea’, ‘joesguns’, ‘sigma-cosmetics’, ‘foodnstuff’, ‘n00dles’];
    
    // Calculate threadcount based on available hosts’s RAM
    
    var threadCount = hostMaxRam / (serverList.length * ns.getScriptRam(“back_hack_v1.js”));
    
    // No decimals!
    
    threadCount.toPrecision(2);
    
    // Copy the script to the host server if it isn’t there yet
    
    if (!ns.fileExists(‘back_hack_v1.js’, hostServer))
    
    await ns.scp(“back_hack_v1.js”, “home”, hostServer);
    
    // For each server in the server list, run the hack script with calculated threadcount
    
    for (var i = 0; i < serverList.length; i++) {
    
    // Update RAM usage
    
    hostUsedRam = ns.getServerUsedRam(hostServer);
    
    // Check if root access exists, and if not hack the system first
    
    if (ns.hasRootAccess(serverList) == false)
    
    ns.exec(“pen_hack_v1.js”, “home”, 1, serverList);
    
    // Ensure enough RAM exists by calculating script RAM usage (2.4GB * Threadcount)
    
    if ((hostMaxRam – hostUsedRam) > (2.4 * threadCount))
    
    ns.exec(“back_hack_v1.js”, hostServer, threadCount, serverList);
    
    else
    
    break;
    
    }
    
    }[/code]