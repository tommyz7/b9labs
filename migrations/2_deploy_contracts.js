var Splitter = artifacts.require("./Splitter.sol");
var Splitter = artifacts.require("./Remittance.sol");

module.exports = function(deployer) {
  deployer.deploy(Splitter);
  deployer.deploy(Remittance);
};
