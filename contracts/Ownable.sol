pragma solidity ^0.4.17;


contract Ownable {
    address public owner;

    modifier onlyOwner {
       require(msg.sender == owner);
       _;
    }

    event LogOnwerTransfer(address newOwner);

    function Ownable() public {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) public onlyOwner returns(bool) {
        require(owner != newOwner);
        owner = newOwner;
        LogOnwerTransfer(newOwner);
        return true;
    }
}