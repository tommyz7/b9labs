var Splitter = artifacts.require('./Splitter.sol');


contract('Splitter', function(accounts) {
    var spl;

    beforeEach(async () => {
        spl = await Splitter.new({from: accounts[0]});
    });

    it('should add 3 addresses to mapping', async () => {
        var bob = accounts[0];
        var alice = accounts[1];
        var carol = accounts[2];

        var tx = await spl.addUser(web3.fromAscii('bob'), bob, {from: accounts[0]});
        assert.equal(tx.receipt.status, 1, "Transaction (bob) failed.");
        tx = await spl.addUser(web3.fromAscii('alice'), alice, {from: accounts[0]});
        assert.equal(tx.receipt.status, 1, "Transaction (alice) failed.");
        tx = await spl.addUser(web3.fromAscii('carol'), carol, {from: accounts[0]});
        assert.equal(tx.receipt.status, 1, "Transaction (carol) failed.");

        var bobAddr = await spl.users('bob', {from: accounts[0]});
        assert.equal(bobAddr, bob, "Bob's address incorrect.");

        var aliceAddr = await spl.users('alice', {from: accounts[0]});
        assert.equal(aliceAddr, alice, "Alice's address incorrect.");

        var carolAddr = await spl.users('carol', {from: accounts[0]});
        assert.equal(carolAddr, carol, "Carol's address incorrect.");
    });

    it('should split ether between peers', async () => {
        var bob = accounts[2];
        var alice = accounts[3];
        var carol = accounts[4];

        var tx = await spl.addUser(web3.fromAscii('bob'), bob, {from: bob});
        assert.equal(tx.receipt.status, 1, "Transaction (bob) failed.");
        tx = await spl.addUser(web3.fromAscii('alice'), alice, {from: bob});
        assert.equal(tx.receipt.status, 1, "Transaction (alice) failed.");
        tx = await spl.addUser(web3.fromAscii('carol'), carol, {from: bob});
        assert.equal(tx.receipt.status, 1, "Transaction (carol) failed.");

        var bobBal = await web3.eth.getBalance(bob);
        var aliceBal = await web3.eth.getBalance(alice);
        var carolBal = await web3.eth.getBalance(carol);

        tx = await spl.splitByAddress(bob, carol, {from: alice, value: 20});
        assert.equal(tx.receipt.status, 1, "Split transaction failed.");

        var newBobBal = await web3.eth.getBalance(bob);
        var newCarolBal = await web3.eth.getBalance(carol);

        assert.equal(newBobBal.toNumber(), bobBal.minus(10), "Split not equal.");
        assert.equal(newCarolBal.toNumber(), carolBal.minus(10), "Split not equal.");
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