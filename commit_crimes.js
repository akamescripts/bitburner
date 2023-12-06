/** @param {JS} js **/
export async function main(ns) {
	let num = 0.3;// chance of success eg: 1=100%,
	ns.tail();
	let time;
	let a = 0;
	let crime;
	let chance;
	let crimes = ["heist", "assassination", "kidnap", "grand theft auto",
		"homicide", "larceny", "mug someone", "rob store", "shoplift"];
	while (true) {
		while (!ns.isBusy()) {
			crime = crimes[a];
			if (a == "9") {
				ns.commitCrime("shoplift");
				time = 3000;
			}
			else {

				if (a > crimes.length)
					a = 0;
				chance = ns.getCrimeChance(crime)
				if (chance >= num) {
					ns.commitCrime(crime);
					a = 0;
					time = ns.commitCrime(crime);
				}
				else
					a++;
			}

		}
		await ns.sleep(time);
	}
}