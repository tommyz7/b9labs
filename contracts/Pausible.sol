pragma solidity ^0.4.17;


import './Ownable.sol';


contract Pausible is Ownable {
    bool public isRunning = true;

    event LogPause();
    event LogResume();


    modifier onlyIfRunning {
       require(isRunning);
       _;
    }

    function pause() public onlyOwner returns(bool) {
        require(isRunning == true);
        isRunning = false;
        LogPause();
    }

    function resume() public onlyOwner returns(bool) {
        require(isRunning == false);
        isRunning = true;
        LogResume();
        return true;
    }
}