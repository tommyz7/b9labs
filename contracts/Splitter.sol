pragma solidity ^0.4.18;


contract Splitter {

    address public owner;

    mapping(bytes32 => address) public balances;

    function Splitter() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    function returnHalf(uint256 number) internal pure returns(uint256 half) {
        // make sure it's calculated correctly
        half = number / 2;
        assert(half + half <= number);
    }
    
    function addUser(bytes32 name, address addr) public returns(bool) {
        require(balances[name] == address(0));
        balances[name] = addr;
        return true;
    }

    function split(address addr1, address addr2) public payable returns(bool) {
        require(msg.value > 1);
        uint256 half = returnHalf(msg.value);
        addr1.transfer(half);
        addr2.transfer(half);
        return true;
    }

    function kill(address beneficiary) public onlyOwner {
        selfdestruct(beneficiary);
    }
}