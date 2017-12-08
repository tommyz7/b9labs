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
        var counter = 1;
        console.log(bob);
        var gameID = abi.soliditySHA3(["address", "uint256"], [alice, counter]).toString('hex');
        console.log(bob);
        var tx = await rps.newGame(gameID, bob, {from: alice, value: value});
        assert.equal(tx.receipt.status, 1, "newGame transaction failed.");
        var game = await rps.games.call(gameID);
        console.log(game);
        console.log(accounts);
        assert.equal(game[0], alice, "Player1 address incorrect.");
        assert.equal(game[1], bob, "Player2 address incorrect.");
        assert.equal(game[2].toNumber(), value, "Stake incorrect.");
        assert.equal(game[3].toNumber(), 1, "State incorrect.");

    });

    var input1 = "0x82298dac"+"3830653961326332643039326263366239383136633331393731316138323633"+"000000000000000000000000"+"f17f52151ebef6c7334fad080c5704d77216b732";
    var inputDev = "0x82298dac"
        +"3830653961326332643039326263366239383136633331393731316138323633"
        +"6336633936376664303164333032646262346234333539383465613831653763"
        +"000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732";

    it('should join game', async () => {
        
    });

    it('should post hashed move', async () => {
        
    });

    it('should reveal hashed move', async () => {
        
    });

    it('should send reward', async () => {
        
    });

});





