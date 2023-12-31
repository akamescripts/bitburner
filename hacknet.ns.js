function toN(ns, nodecount, count) {
	var c = 0;
	for (var i = 0; i < nodecount; i++) {
		var stat = ns.hacknet.getNodeStats(i);
		if (stat.level < count) {
			if (ns.hacknet.upgradeLevel(i, 1)) {
				ns.print("upgraded level");
				c++;
			}
		}
	}
	return c;
}

function maxN(ns, nodecount) {
	var m = 0;
	for (var i = 0; i < nodecount; i++) {
		var stat = ns.hacknet.getNodeStats(i);
		if (stat.level > m) {
			m = stat.level;
		}
	}
	return m;
}

function minN(ns, nodecount) {
	var m = 1024;
	for (var i = 0; i < nodecount; i++) {
		var stat = ns.hacknet.getNodeStats(i);
		if (stat.level < m) {
			m = stat.level;
		}
	}
	return m;
}

function maxMem(ns, nodecount) {
	var m = 0;
	for (var i = 0; i < nodecount; i++) {
		var stat = ns.hacknet.getNodeStats(i);
		if (stat.ram > m) {
			m = stat.ram;
		}
	}
	return m;
}
function minMem(ns, nodecount) {
	var m = 1024;
	for (var i = 0; i < nodecount; i++) {
		var stat = ns.hacknet.getNodeStats(i);
		if (stat.ram < m) {
			m = stat.ram;
		}
	}
	return m;
}


function toMaxMem(ns, nodecount) {
	var c = 0;
	for (var i = 0; i < nodecount; i++) {
		var stat = ns.hacknet.getNodeStats(i);
		if (stat.ram < 64) {
			if (ns.hacknet.upgradeRam(i, 1)) {
				ns.print("upgraded memory");
				c++;
			}
		}
	}
	return c;
}

function toCore(ns, nodecount, count) {
	var c = 0;
	for (var i = 0; i < nodecount; i++) {
		var stat = ns.hacknet.getNodeStats(i);
		if (stat.cores < count) {
			if (ns.hacknet.upgradeCore(i, 1)) {
				c++;
				ns.print("upgraded core count");
			}
		}
	}
	return c;
}


/** @param {NS} ns **/
export async function main(ns) {

	while (true) {
		var nodecount = ns.hacknet.numNodes();

		if (nodecount < 4) {
			ns.purchaseNode();
			continue;
		}
		var c = 0;
		var min_level = minN(ns, nodecount);
		var min_mem = minMem(ns, nodecount);

		c += toN(ns, nodecount, 100);
		c += toMaxMem(ns, nodecount);
		c += toCore(ns, nodecount, 2);

		if (min_level >= 100 && min_mem >= 32) {
			c += toN(ns, nodecount, 150);
			c += toCore(ns, nodecount, 4);
			if (min_level >= 150 && min_mem >= 64) {
				c += toN(ns, nodecount, 190);
				c += toCore(ns, nodecount, 6);
				if (c == 0) {
					c += toN(ns, nodecount, 200);
					c += toCore(ns, nodecount, 10);
					if (nodecount == ns.hacknet.numNodes()) {
						if (ns.hacknet.purchaseNode() < 0) await ns.sleep(10000);
						else ns.print("added node");
					}
				}
			}
		}
		if(c == 0) await ns.sleep(1000);
		else await ns.sleep(1); 
	}
}