async function worm(ns, node) {

	await ns.sleep(100);
 
	
	if (ns.hasRootAccess(node) && taken_over.includes(node))
	{
		past_nodes.push(node); 

		var children = ns.scan(node);
		for (var i = 0; i < children.length; i++) 
		{
			if(past_nodes.includes(children[i])) continue; 

			if(node != children[i])
			{
				await worm(ns, children[i]);
				await ns.sleep(100);
			}
		}
	}
	else 
	{
		// takeover node 
		if (ns.getHackingLevel() > ns.getServerRequiredHackingLevel(node)) 
		{
			ns.print("taking over node: " + node);
			ns.run("takeover.script", 1, node);
			await ns.sleep(100); 

			taken_over.push(node);
		}
	}
}

var past_nodes = ["home"];
var taken_over = ["home"]; 


/** @param {NS} ns **/
export async function main(ns) {

	var root_host = ns.getHostname(); 
	
	ns.print("rooting worm at: " + root_host);

	while (true) 
	{
		await ns.sleep(10000);
		await worm(ns, root_host);

		past_nodes = ["home"];
	}
}