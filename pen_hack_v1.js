/** @param {NS} ns **/export async function main(ns) {

    var target = ns.args[0];
 
    // Brute force open the ports
    if (ns.fileExists("BruteSSH.exe"))
    ns.brutessh(target);
    
    // Open the FTP port
    if (ns.fileExists("ftpcrack.exe"))
    ns.ftpcrack(target);
    
    // Open the SMTP port
    if (ns.fileExists('RelaySMTP.exe'))
    ns.relaysmtp(target);
   
    // Open the SMTP port
    if (ns.fileExists('HTTPWorm.exe'))
    ns.httpworm(target);
   
    // Open the SMTP port
    if (ns.fileExists('SQLInject.exe'))
    ns.sqlinject(target);
   
    // Nuke the machine if we don't have access yet
    ns.nuke(target);
   
    // Install the backdoor
    // ns.installBackdoor(target);
   }