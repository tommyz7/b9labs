const Splitter = artifacts.require('./Splitter.sol');
const Promise = require('bluebird');
const isTxSuccessful = require('../utils/isTxSuccessful');

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('Splitter', function(accounts) {
    let spl, bob, alice, carol;

    before("deploy new Splitter", async () => {
        spl = await Splitter.new({from: accounts[0]});
        bob = accounts[2];
        alice = accounts[3];
        carol = accounts[4];
    });


    it('should split ether between peers', async () => {
        var tx = await spl.splitFunds(bob, carol, {from: alice, value: 21, gas: 200000});
        assert(isTxSuccessful(tx, 200000), "Split transaction failed.");

        var bobWBal = await spl.getBalance.call(bob);
        var carolWBal = await spl.getBalance.call(carol);
        var aliceWBal = await spl.getBalance.call(alice);

        assert.equal(bobWBal.toNumber(), 10, "Bob share incorrect.");
        assert.equal(carolWBal.toNumber(), 10, "Carol share incorrect.");
        assert.equal(aliceWBal.toNumber(), 1, "Alice share incorrect.");
    });

    it('should allow to withdraw funds', async () => {
        var bobWBal = await spl.getBalance.call(bob);
        var carolWBal = await spl.getBalance.call(carol);
        var aliceWBal = await spl.getBalance.call(alice);

        // withdraw bob
        var bobBal = await web3.eth.getBalancePromise(bob);
        var tx = await spl.withdraw({from: bob, gas: 200000});
        assert(isTxSuccessful(tx, 200000), "Bob Withdraw transaction failed.");
        var gasUsed = tx.receipt.gasUsed;
        tx = web3.eth.getTransaction(tx.tx);
        var gasPrice = tx.gasPrice.toNumber();

        var txCost = gasPrice * gasUsed;
        var bobNewBal = await web3.eth.getBalancePromise(bob);
        assert(bobNewBal.plus(txCost).minus(bobWBal).toNumber(), bobBal.toNumber(), "Bob after withdraw balance incorrect.");

        // withdraw carol
        var carolBal = await web3.eth.getBalancePromise(carol);
        var tx = await spl.withdraw({from: carol, gas: 200000});
        assert(isTxSuccessful(tx, 200000), "carol Withdraw transaction failed.");
        var gasUsed = tx.receipt.gasUsed;
        tx = web3.eth.getTransaction(tx.tx);
        var gasPrice = tx.gasPrice.toNumber();

        var txCost = gasPrice * gasUsed;
        var carolNewBal = await web3.eth.getBalancePromise(carol);
        assert(carolNewBal.plus(txCost).minus(carolWBal).toNumber(), carolBal.toNumber(), "Carol after withdraw balance incorrect.");

        // withdraw alice
        var aliceBal = await web3.eth.getBalancePromise(alice);
        var tx = await spl.withdraw({from: alice, gas: 2000000});
        assert(isTxSuccessful(tx, 200000), "alice Withdraw transaction failed.");
        var gasUsed = tx.receipt.gasUsed;
        tx = web3.eth.getTransaction(tx.tx);
        var gasPrice = tx.gasPrice.toNumber();

        var txCost = gasPrice * gasUsed;
        var aliceNewBal = await web3.eth.getBalancePromise(alice);
        assert(aliceNewBal.plus(txCost).minus(aliceWBal).toNumber(), aliceBal.toNumber(), "alice after withdraw balance incorrect.");
    });

    it('should be pausible only by owner', async () => {
        var bob = accounts[2];
        var alice = accounts[3];
        var carol = accounts[4];
        
        var isRunning = await spl.isRunning.call()
        assert.equal(isRunning, true, "isRunning 1 incorrect.");
        var tx = await spl.pause({from: accounts[0]});
        var isRunning = await spl.isRunning.call()
        assert.equal(isRunning, false, "isRunning 2 incorrect.");
        try {
            tx = await spl.splitFunds(bob, carol, {from: alice, value: 21});
        } catch(e) {
            tx = await spl.resume({from: accounts[0]});
            isRunning = await spl.isRunning.call()
            assert.equal(isRunning, true, "isRunning 3 incorrect.");
            tx = await spl.splitFunds(bob, carol, {from: alice, value: 21});
        }
    });
    
});