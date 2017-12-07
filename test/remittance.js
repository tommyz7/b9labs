var abi = require('ethereumjs-abi')
var Remittance = artifacts.require('./Remittance.sol');


contract('Remittance', (accounts) => {
    var rem;

    beforeEach(async () => {
        rem = await Remittance.new({from: accounts[0]});
    });

    it('should set commission', async () => {
        var tx = await rem.setCommission(100000, {from: accounts[0]});
        assert.equal(tx.receipt.status, 1, "Transaction failed.");

        var commission = await rem.commission.call();
        assert.equal(commission, 100000, "Commission not set.");
    });

    it('should have owner', async () => {
        var owner = await rem.owner.call({from: accounts[0]});
        assert.equal(owner, accounts[0], "Owner not set correctly.");
    });

    it('should be killable only by owner', async () => {
        try {
            await rem.kill(accounts[1], {from: accounts[1]});
            assert(false, "Revert expected");
        } catch(e) {
            var owner = await rem.owner.call({from: accounts[0]});
            assert.equal(owner, accounts[0], "Contract killed.");

            var tx = await rem.kill(accounts[0], {from: accounts[0]});
            assert.equal(tx.receipt.status, 1, "Transaction failed.");
        }

        var owner = await rem.owner({from: accounts[0]});
        assert.equal(owner, '0x0', "Contract not killed.");
    });

    it('should add withdraw', async () => {
        var alice = accounts[1];
        var carol = accounts[2];
        var pass = 'pass';
        var passHash = web3.sha3(pass);
        var deadline = Math.floor(Date.now() / 1000 + 120);
        var value = web3.toWei(1, "ether");

        var tx = await rem.addWithdraw(passHash, deadline, carol, {from: alice, value: value});
        assert.equal(tx.receipt.status, 1, "Transaction failed.");

        var w = await rem.withdraws.call(passHash);
        assert.equal(w[0].toNumber(), value, "Value is set incorrectly.");
        assert.equal(w[1].toNumber(), deadline, "Deadline is set incorrectly.");
        assert.equal(w[2], carol, "Beneficiary is set incorrectly.");
        assert.equal(w[3], alice, "Creator is set incorrectly.");
    });

    it('should allow beneficiary to withdraw ether', async () => {
        // set commission
        var tx = await rem.setCommission(100000, {from: accounts[0]});
        assert.equal(tx.receipt.status, 1, "Transaction failed.");

        var commission = await rem.commission.call();
        assert.equal(commission, 100000, "Commission not set.");

        // add withdraw
        var alice = accounts[1];
        var carol = accounts[2];
        var pass = 'pass';
        var passHash = '0x' + abi.soliditySHA3(["bytes32"], [pass]).toString('hex');
        var deadline = Math.floor(Date.now() / 1000 + 120);
        var value = web3.toWei(1, "ether");

        var tx = await rem.addWithdraw(passHash, deadline, carol, {from: alice, value: value});
        assert.equal(tx.receipt.status, 1, "addWithdraw transaction failed.");

        var w = await rem.withdraws.call(passHash);
        assert.equal(w[0].toNumber(), value, "Value is set incorrectly.");
        assert.equal(w[1].toNumber(), deadline, "Deadline is set incorrectly.");
        assert.equal(w[2], carol, "Beneficiary is set incorrectly.");
        assert.equal(w[3], alice, "Creator is set incorrectly.");
        
        var carolBal = await web3.eth.getBalance(carol);
        
        // withdraw
        var tx = await rem.withdraw(pass, {from: carol, gasPrice: web3.toWei(1, "gwei")});
        assert.equal(tx.receipt.status, 1, "withdraw transaction failed.");
        
        var txCost = tx.receipt.gasUsed * web3.toWei(1, "gwei");
        var carolNewBal = await web3.eth.getBalance(carol);
        
        assert.equal(
            carolNewBal.toNumber(),
            carolBal.plus(value).minus(txCost).minus(100000).toNumber(),
            "Carol balance does not match.");
    });

    it('should return value if withdraw passes deadline', async () => {
        // add withdraw
        var alice = accounts[1];
        var carol = accounts[2];
        var pass = 'pass';
        var passHash = '0x' + abi.soliditySHA3(["bytes32"], [pass]).toString('hex');
        var deadline = Math.floor(Date.now() / 1000 + 100);
        var value = web3.toWei(1, "ether");

        var aliceBal = await web3.eth.getBalance(alice);
        var tx = await rem.addWithdraw(passHash, deadline, carol, {from: alice, value: value, gasPrice: web3.toWei(1, "gwei")});
        assert.equal(tx.receipt.status, 1, "addWithdraw transaction failed.");
        var gasUsed = tx.receipt.gasUsed;

        var w = await rem.withdraws.call(passHash);
        assert.equal(w[0].toNumber(), value, "Value is set incorrectly.");
        assert.equal(w[1].toNumber(), deadline, "Deadline is set incorrectly.");
        assert.equal(w[2], carol, "Beneficiary is set incorrectly.");
        assert.equal(w[3], alice, "Creator is set incorrectly.");

        // move timer 200 sec
        await web3.currentProvider.send({
            jsonrpc: "2.0", 
            method: "evm_increaseTime", 
            params: [200], id: 0
        });

        tx = await rem.cancelWithdraw(passHash, {from: alice, gasPrice: web3.toWei(1, "gwei")});
        gasUsed += tx.receipt.gasUsed;
        var txPrice = gasUsed * web3.toWei(1, "gwei");
        var aliceNewBal = await web3.eth.getBalance(alice);

        assert.equal(
            aliceNewBal.toNumber(),
            aliceBal.minus(txPrice).toNumber(),
            "Alice balance is incorrect.");
    });

});

