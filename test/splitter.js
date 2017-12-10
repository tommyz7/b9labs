var Splitter = artifacts.require('./Splitter.sol');


contract('Splitter', function(accounts) {
    var spl;

    beforeEach(async () => {
        spl = await Splitter.new({from: accounts[0]});
    });


    it('should split ether between peers', async () => {
        var bob = accounts[2];
        var alice = accounts[3];
        var carol = accounts[4];

        tx = await spl.splitFunds(bob, carol, {from: alice, value: 21});
        assert.equal(tx.receipt.status, 1, "Split transaction failed.");

        var bobWBal = await spl.balances.call(bob);
        var carolWBal = await spl.balances.call(carol);
        var aliceWBal = await spl.balances.call(alice);

        assert.equal(bobWBal.toNumber(), 10, "Bob share incorrect.");
        assert.equal(carolWBal.toNumber(), 10, "Carol share incorrect.");
        assert.equal(aliceWBal.toNumber(), 1, "Alice share incorrect.");

        // withdraw funds
        var bobBal = await web3.eth.getBalance(bob);
        var tx = await spl.withdraw({from: bob, gasPrice: web3.toWei(1, "gwei")});
        assert.equal(tx.receipt.status, 1, "Bob Withdraw transaction failed.");
        var txCost = web3.toWei(1, "gwei") * tx.receipt.gasUsed;
        var bobNewBal = await web3.eth.getBalance(bob);
        assert(bobNewBal.plus(txCost).minus(bobWBal).toNumber(), bobBal.toNumber(), "Bob after withdraw balance incorrect.");

        var carolBal = await web3.eth.getBalance(carol);
        var tx = await spl.withdraw({from: carol, gasPrice: web3.toWei(1, "gwei")});
        assert.equal(tx.receipt.status, 1, "carol Withdraw transaction failed.");
        var txCost = web3.toWei(1, "gwei") * tx.receipt.gasUsed;
        var carolNewBal = await web3.eth.getBalance(carol);
        assert(carolNewBal.plus(txCost).minus(carolWBal).toNumber(), carolBal.toNumber(), "Carol after withdraw balance incorrect.");

        var aliceBal = await web3.eth.getBalance(alice);
        var tx = await spl.withdraw({from: alice, gasPrice: web3.toWei(1, "gwei")});
        assert.equal(tx.receipt.status, 1, "alice Withdraw transaction failed.");
        var txCost = web3.toWei(1, "gwei") * tx.receipt.gasUsed;
        var aliceNewBal = await web3.eth.getBalance(alice);
        assert(aliceNewBal.plus(txCost).minus(aliceWBal).toNumber(), aliceBal.toNumber(), "alice after withdraw balance incorrect.");


    });

    it('should be killable only by owner', async () => {
        var spl = await Splitter.new({from: accounts[0]});
        try {
            await spl.kill(accounts[1], {from: accounts[1]});
            assert(false, "Revert expected");
        } catch(e) {
            var owner = await spl.owner({from: accounts[0]});
            assert.equal(owner, accounts[0], "Contract killed.");

            var tx = await spl.kill(accounts[0], {from: accounts[0]});
            assert.equal(tx.receipt.status, 1, "Transaction failed.");
        }

        var owner = await spl.owner({from: accounts[0]});
        assert.equal(owner, '0x0', "Contract not killed.");
    });
    
});