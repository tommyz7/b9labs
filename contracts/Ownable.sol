pragma solidity ^0.4.17;


contract Ownable {
    address private owner;

    modifier onlyOwner {
       require(msg.sender == owner);
       _;
    }

    event LogOwnerTransfer(address indexed newOwner);

    function Ownable() public {
        owner = msg.sender;
    }

    function getOwner() public view returns(address) {
        return owner;
    }

    function transferOwnership(address newOwner) public onlyOwner returns(bool) {
        require(owner != address(0));
        require(owner != newOwner);

        owner = newOwner;
        LogOwnerTransfer(newOwner);
        return true;
    }
}