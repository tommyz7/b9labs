pragma solidity ^0.4.17;


import './Ownable.sol';


contract Pausible is Ownable {
    bool public isRunning = true;

    modifier onlyIfRunning {
       require(isRunning);
       _;
    }

    function pause() public onlyOwner {
        isRunning = false;
    }

    function resume() public onlyOwner {
        isRunning = true;
    }
}