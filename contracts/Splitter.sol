pragma solidity ^0.4.18;


import './Pausible.sol';


contract Splitter is Pausible {

    mapping(address => uint256) public balances;

    event LogSplit(address addr1, address addr2, uint256 amount);

    function splitFunds(address addr1, address addr2)
        public
        payable
        onlyIfRunning
        returns(bool)
    {
        // require splitable amount
        if (msg.value % 2 == 1) {
            balances[msg.sender] += 1;
        }

        uint256 half = msg.value / 2;
        balances[addr1] += half;
        balances[addr2] += half;

        LogSplit(addr1, addr2, half);
        return true;
    }

    function withdraw() public onlyIfRunning returns(bool) {
        require(balances[msg.sender] > 0);
        uint256 value = balances[msg.sender];
        balances[msg.sender] = 0;
        msg.sender.transfer(value);
        return true;
    }
}