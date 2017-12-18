pragma solidity ^0.4.18;


import './Pausible.sol';


contract Splitter is Pausible {

    mapping(address => uint256) private balances;

    event LogSplit(
        address indexed addr1,
        address indexed addr2,
        uint256 amount,
        address indexed sender
    );

    event LogWithdraw(address indexed beneficiary, uint256 amount);

    function getBalance(address addr) public view returns(uint256) {
        return balances[addr];
    }

    function splitFunds(address addr1, address addr2)
        public
        payable
        onlyIfRunning
        returns(bool)
    {
        // if amount not splitable, return the difference to sender
        if (msg.value % 2 == 1) {
            balances[msg.sender] += 1;
        }

        uint256 half = msg.value / 2;
        balances[addr1] += half;
        balances[addr2] += half;

        LogSplit(addr1, addr2, half, msg.sender);
        return true;
    }

    function withdraw() public onlyIfRunning returns(bool) {
        require(balances[msg.sender] > 0);
        uint256 value = balances[msg.sender];
        balances[msg.sender] = 0;
        msg.sender.transfer(value);

        LogWithdraw(msg.sender, value);
        return true;
    }
}