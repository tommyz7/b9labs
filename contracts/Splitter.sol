pragma solidity ^0.4.18;


contract Splitter {

    address public owner;

    mapping(address => uint256) public balances;

    event Split(address addr1, address addr2, uint256 amount);

    function Splitter() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function splitFunds(address addr1, address addr2) public payable returns(bool) {
        // require splitable amount
        if (msg.value % 2 == 1) {
            balances[msg.sender] += 1;
        }

        uint256 half = msg.value / 2;
        balances[addr1] += half;
        balances[addr2] += half;

        Split(addr1, addr2, half);
        return true;
    }

    function withdraw() public returns(bool) {
        require(balances[msg.sender] > 0);
        msg.sender.transfer(balances[msg.sender]);
        return true;
    }

    function kill(address beneficiary) public onlyOwner {
        selfdestruct(beneficiary);
    }
}