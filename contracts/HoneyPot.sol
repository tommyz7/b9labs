pragma solidity ^0.4.17;


contract HoneyPot {
    mapping (address => uint) public balances;

    function HoneyPot() payable {
        put();
    }

    function put() payable {
        balances[msg.sender] = msg.value;
    }

    function get() {
        require(msg.sender.call.value(balances[msg.sender])());
        balances[msg.sender] = 0;
    }

    function() {
        revert();
    }
}