/** @param {NS} ns */
export async function main(ns) {
  const root = "https://raw.githubusercontent.com/akamescripts/bitburner/master/";
  const files = [
    "adv_server_setup.js", "ap-hacknet-node.js", "aps-lite.js", "atkman.script", "auto-purchase-server.js", "auto-purchase-server.script",
    "auto-starter.js", "autoFarm.js", "autoFarm.script", "autodeploy.js", "autofarmv2.ns.js", "autohack.script",
    "autostart.script", "back_hack_v1.js", "backdoorall.js", "base_server_setup.js", "bestweaken.js", "bin.gr.js",
    "bin.hk.js", "bin.wk.js", "book-keeper.js", "captain.js", "commit_crimes.js", "crimes.js", "diamond-hands.js",
    "e9-app-hacknet-node.js", "early-hack-template.script", "ep-pirate.js", "ep12-gtfo.js", "ep13-coordinator.js",
    "ep13-receiver.js", "ep13-sender.js", "ep14-port-utils.js", "ep14-queue-service.js", "ep17-book-keeper.js",
    "ep17-captain.js", "ep17-port-utils.js", "ep17-probe.js", "ep17-queue-service.js", "ep17-strategist.js",
    "ep17-utils.js", "ep8-apps-lite.js", "ep8-find-targets.js", "ep8-launch-fleets.js", "ep8-watchtower.js",
    "expfarmer1.js", "exploit-click.js", "exploit-edit.script", "exploit.js", "farm.js", "find-server.js", "find-targets.js",
    "findspecificserver.js", "gimme-money.js", "git-download.js", "go.js", "grow.js", "grow.script", "gtfo.js",
    "hack.js", "hack.script", "hacknet.ns.js", "hacknetbot.js", "launch-fleets.js", "manage-gang.js", "nodescript.js",
    "one_script_start.js", "opti2.js", "pastebin1-farmer.js", "pastebin2-farmingmanager.js", "pen_hack_v1.js",
    "pirate.js", "port-utils.js", "probe.js", "queue-service.js", "runner.js", "share.js", "startport.js", "startup.script",
    "stock-trader.js", "stocks.js", "stocksmarketer.ns.js", "strategist.js", "takeover.script", "taronin-expfarm.js",
    "utils.js", "warmonger.js", "watcher.js", "watchtower.js", "weak.js", "weak.script", "weaken.js", "weaken.script",
    "wgetAll.js", "worm.js", "worm.ns.js"
  ];
  for (const file of files) {
    await ns.wget(root + file, file);
  }

}
