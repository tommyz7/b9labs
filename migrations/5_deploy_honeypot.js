var HackHoneyPot = artifacts.require("./HackHoneyPot.sol");
var HoneyPot = artifacts.require("./HoneyPot.sol");

module.exports = function(deployer) {
    deployer.deploy(HoneyPot, {value: web3.toWei(5, "ether")});
    deployer.deploy(HackHoneyPot);
};
