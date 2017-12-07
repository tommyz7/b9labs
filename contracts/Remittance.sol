pragma solidity ^0.4.18;


contract Remittance {

    struct Withdraw {
        uint256 value;
        uint256 deadline;
        address beneficiary;
        address creator;
    }

    uint256 public commissionBalance;

    address public owner;
    mapping(bytes32 => Withdraw) public withdraws;
    uint256 public commission;


    function Remittance() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function setCommission(uint256 newCom) public onlyOwner returns(bool) {
        commission = newCom;
        return true;
    }

    function addWithdraw(bytes32 passwordHash, uint256 deadline, address beneficiary)
        public
        payable
        returns(bool)
    {
        require(beneficiary != address(0));
        require(msg.value > 0);
        // max deadline, 2 weeks
        require(deadline > now && deadline <= now + (14*24*60*60));

        withdraws[passwordHash] = Withdraw(msg.value, deadline, beneficiary, msg.sender);
        return true;
    }

    function cancelWithdraw(bytes32 passwordHash) public returns(bool) {
        // you must be a creator
        require(withdraws[passwordHash].creator == msg.sender);
        // it must be past deadline
        require(withdraws[passwordHash].deadline < now);
        // withdraw must be unused
        require(withdraws[passwordHash].value > 0);

        uint256 value = withdraws[passwordHash].value;
        delete withdraws[passwordHash];
        msg.sender.transfer(value);
        return true;
    }

    function withdraw(bytes32 password) public returns(bool) {
        bytes32 hash = keccak256(password);
        require(withdraws[hash].value > 0);
        require(withdraws[hash].deadline >= now);
        require(withdraws[hash].beneficiary == msg.sender);

        uint256 value = getCut(withdraws[hash].value);
        delete withdraws[hash];
        msg.sender.transfer(value);
        return true;
    }

    function getCut(uint256 value) internal returns(uint256) {
        if(value <= commission) {
            // take nothing
            return value;
        }
        commissionBalance += commission;
        return value - commission;
    }

    function withdrawCommission(address beneficiary) public onlyOwner returns(bool) {
        if (beneficiary == address(0)) {
            beneficiary = msg.sender;
        }
        commissionBalance = 0;
        beneficiary.transfer(commissionBalance);
        return true;
    }

    function kill(address beneficiary) public onlyOwner {
        selfdestruct(beneficiary);
    }
}