const RockPaperScissors = artifacts.require('./RockPaperScissors.sol');
const isTxSuccessful = require('../utils/isTxSuccessful');
const Promise = require('bluebird');

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('RockPaperScissors', (accounts) => {
    let rps;
    let alice = accounts[0];
    let bob = accounts[1];
    beforeEach("get deployed RockPaperScissors", async () => {
        rps = await RockPaperScissors.deployed();
    });

    it('should have results pre-calculated', async () => {
        // rock 0, paper 1, scissors 2
        // 0 - draw, 1 - player 1 wins, 2 - player 2 wins
        var choices = ['none', 'rock', 'paper', 'scissors'];
        for (var i = 1; i < 4; i++) {
            for (var j = 1; j < 4; j++) {
                let check;
                var result = await rps.results.call(i, j);
                if (i == j) {
                    check = 1;
                } else if(
                    (i == 1 && j == 3) ||
                    (i == 2 && j == 1) ||
                    (i == 3 && j == 2)
                    ) {
                    check = 2;
                } else {
                    check = 3;
                }
                assert.equal(result.toNumber(), check, "Result "+choices[i]+", "+choices[j]+" is incorrect.");
            }
        }
    });

    it('should create new game', async () => {
        let value = web3.toWei(1, "ether");
        var moveHash = await rps.createMoveHash.call(1, 'alice');
        var gameID = await rps.createGameId.call(alice, 1);

        var tx = await rps.newGame(gameID, '0x0', moveHash, {from: alice, value: value, gas: 200000});
        assert(isTxSuccessful(tx, 200000), "newGame transaction failed.");
        var game = await rps.games.call(gameID);
        
        assert.equal(game[0], alice, "Player1 address incorrect.");
        assert.equal(game[1], '0x0000000000000000000000000000000000000000', "Player2 address incorrect.");
        assert.equal(game[2].toNumber(), value, "Stake incorrect.");
        assert.equal(game[3].toNumber(), 1, "State incorrect.");

        var rpsBal = await web3.eth.getBalancePromise(rps.address);
        assert.equal(rpsBal, value, "Contract balance incorrect.");
    });

    it('should join game', async () => {
        let value = web3.toWei(1, "ether");
        var gameID = await rps.createGameId.call(alice, 1);
        var tx = await rps.joinGame(gameID, 2, {from: bob, value: value, gas: 200000});
        assert(isTxSuccessful(tx, 200000), "joinGame transaction failed.");
        var game = await rps.games.call(gameID);
        assert.equal(game[0], alice, "Player1 address incorrect.");
        assert.equal(game[1], bob, "Player2 address incorrect.");
        assert.equal(game[2].toNumber(), value*2, "Stake incorrect.");
        assert.equal(game[3].toNumber(), 3, "State incorrect.");

        var rpsBal = await web3.eth.getBalancePromise(rps.address);
        assert.equal(rpsBal, value*2, "Contract balance incorrect.");
    });

    it('should reveal hashed move', async () => {
        let value = web3.toWei(1, "ether");
        var gameID = await rps.createGameId.call(alice, 1);

        // reveal alice
        var tx = await rps.revealMove(gameID, 1, 'alice', {from: alice, gas: 200000});
        assert(isTxSuccessful(tx, 200000), "Alcie reveal move transaction failed.");

        var aliceMove = await rps.getRevealedMove(gameID, alice, {from: alice});
        assert.equal(aliceMove, 1, "Alice move incorrect.");

        // check status
        var game = await rps.games.call(gameID);
        assert.equal(game[0], alice, "Player1 address incorrect.");
        assert.equal(game[1], bob, "Player2 address incorrect.");
        assert.equal(game[2].toNumber(), value*2, "Stake incorrect.");
        assert.equal(game[3].toNumber(), 4, "State incorrect.");

        var aliceBal = await rps.balances.call(alice);
        assert(aliceBal, 0, "Alice balance after game incorrect.");

        var bobBal = await rps.balances.call(bob);
        assert(bobBal, value*2, "bob balance after game incorrect.");

    });

    it('should send reward', async () => {
        var aliceBal = await web3.eth.getBalancePromise(alice);
        var bobBal = await web3.eth.getBalancePromise(bob);

        let value = web3.toWei(1, "ether");

        tx = await rps.withdrawReward({from: bob, gasPrice: web3.toWei(1, "gwei"), gas: 200000});
        assert(isTxSuccessful(tx, 200000), "Bob withdraw reward transaction failed.");
        txCost = web3.toWei(1, "gwei") * tx.receipt.gasUsed;
        var bobNewBal = await web3.eth.getBalancePromise(bob);
        assert.equal(
            bobBal.minus(txCost).plus(value*2).toNumber(),
            bobNewBal.toNumber(),
            "Alice balance incorrect."
        );

    });

});





