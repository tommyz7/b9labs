pragma solidity ^0.4.18;


contract Splitter {

    address public owner;

    mapping(bytes32 => address) public users;

    event NewUser(bytes32 indexed name, address indexed addr);
    event Split(address addr1, address addr2, uint256 amount);

    function Splitter() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    function addUser(bytes32 name, address addr) public returns(bool) {
        require(users[name] == address(0));

        users[name] = addr;

        NewUser(name, addr);
        return true;
    }

    function splitByName(bytes32 name1, bytes32 name2) public payable returns(bool) {
        require(users[name1] != address(0));
        require(users[name2] != address(0));

        splitByAddress(users[name1], users[name2]);
        return true;
    }

    function splitByAddress(address addr1, address addr2) public payable returns(bool) {
        // require splitable amount
        require(msg.value % 2 == 0);

        uint256 half = msg.value / 2;
        addr1.transfer(half);
        addr2.transfer(half);

        Split(addr1, addr2, half);
        return true;
    }

    function kill(address beneficiary) public onlyOwner {
        selfdestruct(beneficiary);
    }
}