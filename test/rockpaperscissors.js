var abi = require('ethereumjs-abi');
var RockPaperScissors = artifacts.require('./RockPaperScissors.sol');


contract('RockPaperScissors', (accounts) => {
    var rps;
    var alice = accounts[0];
    var bob = accounts[1];
    beforeEach(async () => {
        rps = await RockPaperScissors.deployed();
    });

    it('should have results pre-calculated', async () => {
        // rock 0, paper 1, scissors 2
        // 0 - draw, 1 - player 1 wins, 2 - player 2 wins
        var choices = ['rock', 'paper', 'scissors'];
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                let check;
                var hash = '0x' + abi.soliditySHA3(["uint8", "uint8"], [i, j]).toString('hex');
                var result = await rps.results.call(hash);
                if (i == j) {
                    check = 0;
                } else if(
                    (i == 0 && j == 2) ||
                    (i == 1 && j == 0) ||
                    (i == 2 && j == 1)
                    ) {
                    check = 1;
                } else {
                    check = 2;
                }
                assert.equal(result.toNumber(), check, "Result "+choices[i]+", "+choices[j]+" is incorrect.");
            }
        }
    });

    it('should create new game', async () => {
        let value = web3.toWei(1, "ether");
        var gameID = '0x' + abi.soliditySHA3(["address", "uint256"], [alice, 1]).toString('hex');
        var tx = await rps.newGame(gameID, '0x0', {from: alice, value: value});
        assert.equal(tx.receipt.status, 1, "newGame transaction failed.");
        var game = await rps.games.call(gameID);
        assert.equal(game[0], alice, "Player1 address incorrect.");
        assert.equal(game[1], '0x0000000000000000000000000000000000000000', "Player2 address incorrect.");
        assert.equal(game[2].toNumber(), value, "Stake incorrect.");
        assert.equal(game[3].toNumber(), 1, "State incorrect.");

        var rpsBal = await web3.eth.getBalance(rps.address);
        assert.equal(rpsBal, value, "Contract balance incorrect.");
    });

    it('should join game', async () => {
        let value = web3.toWei(1, "ether");
        var gameID = '0x' + abi.soliditySHA3(["address", "uint256"], [alice, 1]).toString('hex');
        var tx = await rps.joinGame(gameID, {from: bob, value: value});
        assert.equal(tx.receipt.status, 1, "joinGame transaction failed.");
        var game = await rps.games.call(gameID);
        assert.equal(game[0], alice, "Player1 address incorrect.");
        assert.equal(game[1], bob, "Player2 address incorrect.");
        assert.equal(game[2].toNumber(), value, "Stake incorrect.");
        assert.equal(game[3].toNumber(), 2, "State incorrect.");

        var rpsBal = await web3.eth.getBalance(rps.address);
        assert.equal(rpsBal, value*2, "Contract balance incorrect.");
    });

    it('should post hashed move', async () => {
        let value = web3.toWei(1, "ether");
        var gameID = '0x' + abi.soliditySHA3(["address", "uint256"], [alice, 1]).toString('hex');

        // post alice move
        var aliceMoveHash = '0x' + abi.soliditySHA3(["uint8", "bytes32"], [0, 'alice'])
            .toString('hex');
        var tx = await rps.postMoveHash(gameID, aliceMoveHash, {from: alice});
        assert.equal(tx.receipt.status, 1, "post move hash transaction failed.");

        var alicehash = await rps.getMoveHash.call(gameID, alice);
        assert.equal(alicehash, aliceMoveHash, "Alcie move hash incorrect.");

        // post bob move
        var bobMoveHash = '0x' + abi.soliditySHA3(["uint8", "bytes32"], [1, 'bob'])
            .toString('hex');
        var tx = await rps.postMoveHash(gameID, bobMoveHash, {from: bob});
        assert.equal(tx.receipt.status, 1, "post move hash transaction failed.");

        var bobhash = await rps.getMoveHash.call(gameID, bob);
        assert.equal(bobhash, bobMoveHash, "Bob move hash incorrect.");

        // check status
        var game = await rps.games.call(gameID);
        assert.equal(game[0], alice, "Player1 address incorrect.");
        assert.equal(game[1], bob, "Player2 address incorrect.");
        assert.equal(game[2].toNumber(), value, "Stake incorrect.");
        assert.equal(game[3].toNumber(), 3, "State incorrect.");

    });

    it('should reveal hashed move', async () => {
        let value = web3.toWei(1, "ether");
        var gameID = '0x' + abi.soliditySHA3(["address", "uint256"], [alice, 1]).toString('hex');

        // reveal alice
        var tx = await rps.revealMove(gameID, 0, 'alice', {from: alice});
        assert.equal(tx.receipt.status, 1, "Alcie reveal move transaction failed.");

        var aliceMove = await rps.getRevealedMove(gameID, alice, {from: alice});
        assert.equal(aliceMove, 0, "Alice move incorrect.");

        // reveal bob
        var tx = await rps.revealMove(gameID, 1, 'bob', {from: bob});
        assert.equal(tx.receipt.status, 1, "Bob reveal move transaction failed.");

        var bobMove = await rps.getRevealedMove(gameID, bob, {from: bob});
        assert.equal(bobMove, 1, "Bob move incorrect.");

        // check status
        var game = await rps.games.call(gameID);
        assert.equal(game[0], alice, "Player1 address incorrect.");
        assert.equal(game[1], bob, "Player2 address incorrect.");
        assert.equal(game[2].toNumber(), value, "Stake incorrect.");
        assert.equal(game[3].toNumber(), 4, "State incorrect.");

    });

    it('should send reward', async () => {
        var aliceBal = await web3.eth.getBalance(alice);
        var bobBal = await web3.eth.getBalance(bob);

        let value = web3.toWei(1, "ether");
        var gameID = '0x' + abi.soliditySHA3(["address", "uint256"], [alice, 1]).toString('hex');
        var tx = await rps.sendReward(gameID, {from: alice, gasPrice: web3.toWei(1, "gwei")});
        assert.equal(tx.receipt.status, 1, "Send reward transaction failed.");
        var txCost = web3.toWei(1, "gwei") * tx.receipt.gasUsed;

        var aliceNewBal = await web3.eth.getBalance(alice);
        var bobNewBal = await web3.eth.getBalance(bob);

        assert.equal(aliceBal.minus(txCost).toNumber(), aliceNewBal.toNumber(), "Alice balance incorrect.");
        assert.equal(bobBal.plus(value*2).toNumber(), bobNewBal.toNumber(), "Bob balance incorrect.");

    });

});





