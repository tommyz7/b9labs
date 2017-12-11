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

    struct Move {
        uint8 move;
        bool revealed;
    }

    struct Game {
        address player1;
        address player2;
        uint256 stake;
        State state;
        // uint256 deadline;
        mapping(address => bytes32) movesHash;
        mapping(address => Move) revealedMoves;
    }

    mapping(bytes32 => Game) public games;
    mapping(bytes32 => uint8) public results;
    mapping(address => uint256) public balances;

    event LogNewGame(
        bytes32 indexed id,
        address indexed player1,
        address indexed player2,
        uint256 stake
    );

    event LogJoinedGame(bytes32 indexed id, address indexed player2);
    
    event LogHashPosted(
        bytes32 indexed id,
        address indexed player,
        bytes32 indexed movesHash
    );

    event LogMoveRevealed(
        bytes32 indexed id,
        address indexed player,
        uint8 indexed move,
        bytes32 secretWord
    );

    event LogGameWinner(bytes32 indexed id, address indexed winner);

    event LogWithdraw(address indexed player, uint256 indexed value);

    function RockPaperScissors() public  {
        // rock 0, paper 1, scissors 2
        // 0 - draw, 1 - player 1 wins, 2 - player 2 wins
        // 00 => draw
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

    function getMoveHash(bytes32 gameID, address player) external view returns (bytes32) {
        require(player != address(0));
        return games[gameID].movesHash[player];
    }

    function getRevealedMove(bytes32 gameID, address player) external view returns (uint8) {
        require(player != address(0));
        require(games[gameID].revealedMoves[player].revealed == true);
        return games[gameID].revealedMoves[player].move;
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
        LogNewGame(gameID, games[gameID].player1, games[gameID].player2, games[gameID].stake);
        return true;
    }

    function joinGame(bytes32 id) public payable returns(bool) {
        Game storage game = games[id];
        require(game.stake == msg.value);
        require(game.player1 != address(0));
        require(game.player2 == msg.sender || games[id].player2 == address(0));

        game.player2 = msg.sender;
        game.stake += msg.value;
        game.state = State.active;
        LogJoinedGame(id, game.player2);
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
        LogHashPosted(id, msg.sender, moveHash);
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

        game.revealedMoves[msg.sender].move = move;
        game.revealedMoves[msg.sender].revealed = true;
        LogMoveRevealed(id, msg.sender, move, secretWord);

        // update state
        if(game.revealedMoves[game.player1].revealed == true 
            && game.revealedMoves[game.player2].revealed == true) {
            game.state = State.revealed;
            address winner = getWinner(id);
            LogGameWinner(id, winner);
        }
        return true;
    }

    function withdrawReward() public returns(bool) {
        require(balances[msg.sender] > 0);

        uint256 value = balances[msg.sender];
        balances[msg.sender] = 0;
        msg.sender.transfer(value);
        LogWithdraw(msg.sender, value);
        return true;
    }

    function getWinner(bytes32 id) internal returns(address) {
        Game storage game = games[id];
        uint8 p1Move = game.revealedMoves[game.player1].move;
        uint8 p2Move = game.revealedMoves[game.player2].move;

        // check for illigal moves
        if(p1Move > 2 && p2Move <= 2) {
            balances[game.player2] += game.stake;
            return game.player2;
        } else if (p1Move <= 2 && p2Move > 2) {
            balances[game.player1] += game.stake;
            return game.player1;
        } else if (p1Move > 2 && p2Move > 2) {
            balances[game.player1] += game.stake / 2;
            balances[game.player2] += game.stake / 2;
            return address(0);
        }

        if(results[keccak256(p1Move, p2Move)] == 0) {
            balances[game.player1] += game.stake / 2;
            balances[game.player2] += game.stake / 2;
            return address(0);
        } else if (results[keccak256(p1Move, p2Move)] == 1) {
            balances[game.player1] += game.stake;
            return game.player1;
        } else if (results[keccak256(p1Move, p2Move)] == 2) {
            balances[game.player2] += game.stake;
            return game.player2;
        }
    }
}

