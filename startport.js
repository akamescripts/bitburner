disableLog("sleep");
disableLog("getServerMaxRam");
disableLog("getServerUsedRam");

clearPort(2);
clearPort(9);
clearPort(10);


var i = 0;
while (i < 25) {
	while (getServerUsedRam("pserv-" + i)) { sleep(10000); }
	++i;
}

clearPort(1);
var i = 0;
while (i < 25) {
	writePort(1, i);
	writePort(1, 599186);
	++i;
}
clearPort(3);
writePort(3, 14979650);

exec("AtkMan.script", "home", 1, "megacorp", 1, 4);