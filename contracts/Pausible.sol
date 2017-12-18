pragma solidity ^0.4.17;


import './Ownable.sol';


contract Pausible is Ownable {
    bool public isRunning = true;

    event LogPause(address indexed sender);
    event LogResume(address indexed sender);


    modifier onlyIfRunning {
       require(isRunning);
       _;
    }

    function pause() public onlyOwner returns(bool) {
        require(isRunning == true);
        isRunning = false;
        LogPause(msg.sender);
    }

    function resume() public onlyOwner returns(bool) {
        require(isRunning == false);
        isRunning = true;
        LogResume(msg.sender);
        return true;
    }
}