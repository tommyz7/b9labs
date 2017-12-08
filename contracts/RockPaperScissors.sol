pragma solidity ^0.4.18;


contract RockPaperScissors {

    enum State {
        none,
        newGame,
        active,
        movesPosted,
        revealed,
        paid
    }

    struct Game {
        address player1;
        address player2;
        uint256 stake;
        State state;
        // uint256 deadline;
        mapping(address => bytes32) movesHash;
        mapping(address => uint8) revealedMoves;
    }

    mapping(bytes32 => Game) public games;
    mapping(bytes32 => uint8) public results;

    event NewGame(bytes32 id, address player1, address player2, uint256 stake);

    function RockPaperScissors() public  {
        // rock 0, paper 1, scissors 2
        // 0 - draw, 1 - player 1 wins, 2 - player 2 wins
        // 00 => draw
        // could use for inside for but it looks ugly
        results[keccak256(uint8(0), uint8(0))] = 0;
        // 01 => p2
        results[keccak256(uint8(0), uint8(1))] = 2;
        // 02 => p1
        results[keccak256(uint8(0), uint8(2))] = 1;
        // 10 => p1
        results[keccak256(uint8(1), uint8(0))] = 1;
        // 11 => draw
        results[keccak256(uint8(1), uint8(1))] = 0;
        // 12 => p2
        results[keccak256(uint8(1), uint8(2))] = 2;
        // 20 => p2
        results[keccak256(uint8(2), uint8(0))] = 2;
        // 21 => p1
        results[keccak256(uint8(2), uint8(1))] = 1;
        // 22 => draw
        results[keccak256(uint8(2), uint8(2))] = 0;
    }

    modifier onlyPlayer(bytes32 id) {
        require(games[id].player1 == msg.sender || games[id].player2 == msg.sender);
        _;
    }

    modifier inState(bytes32 id, State state) {
        require(games[id].state == state);
        _;
    }

    /**
     * Create game. If coplayer's address is 0x0, it's an open table
     */
    function newGame(bytes32 gameID, address coplayer)
        public
        payable
        inState(gameID, State.none)
        returns(bool)
    {
        require(coplayer != msg.sender);
        games[gameID] = Game({
            player1: msg.sender,
            player2: coplayer,
            stake: msg.value,
            state: State.newGame
        });
        NewGame(gameID, games[gameID].player1, games[gameID].player2, games[gameID].stake);
        return true;
    }

    function joinGame(bytes32 id) public payable returns(bool) {
        Game storage game = games[id];
        require(game.stake == msg.value);
        require(game.player1 != address(0));
        require(game.player2 == msg.sender || games[id].player2 == address(0));

        game.player2 = msg.sender;
        game.state = State.active;
        return true;
    }

    function postMoveHash(bytes32 id, bytes32 moveHash)
        public
        onlyPlayer(id)
        inState(id, State.active)
        returns(bool)
    {
        Game storage game = games[id];
        require(game.movesHash[msg.sender] == '');

        game.movesHash[msg.sender] = moveHash;

        // update state
        if(game.movesHash[game.player1] != '' && game.movesHash[game.player2] != '') {
            game.state = State.movesPosted;
        }
        return true;
    }

    function revealMove(bytes32 id, uint8 move, bytes32 secretWord)
        public
        onlyPlayer(id)
        inState(id, State.movesPosted)
        returns(bool)
    {
        // get reference
        Game storage game = games[id];

        bytes32 hash = keccak256(move, secretWord);
        assert(game.movesHash[msg.sender] == hash);

        game.revealedMoves[msg.sender] = move;

        // update state
        if(game.revealedMoves[game.player1] != 0 && game.revealedMoves[game.player2] != 0) {
            game.state = State.revealed;
        }
        return true;
    }

    function sendReward(bytes32 id)
        public
        onlyPlayer(id)
        inState(id, State.revealed)
        returns(bool) 
    {
        Game storage game = games[id];
        address winner = getWinner(id);

        if (winner == address(0)) {
            game.player1.transfer(game.stake);
            game.player2.transfer(game.stake);
        } else {
            winner.transfer(game.stake * 2);
        }
        game.state = State.paid;
        return true;
    }

    function getWinner(bytes32 id) internal view returns(address) {
        Game storage game = games[id];
        uint8 p1Move = game.revealedMoves[game.player1];
        uint8 p2Move = game.revealedMoves[game.player2];

        // check for illigal moves
        if(p1Move > 2 && p2Move <= 2) {
            return game.player2;
        } else if (p1Move <= 2 && p2Move > 2) {
            return game.player1;
        } else if (p1Move > 2 && p2Move > 2) {
            return address(0);
        }

        if(results[keccak256(p1Move, p2Move)] == 0) {
            return address(0);
        } else if (results[keccak256(p1Move, p2Move)] == 1) {
            return game.player1;
        } else if (results[keccak256(p1Move, p2Move)] == 2) {
            return game.player2;
        }
    }
}

