pragma solidity ^0.4.18;


import './Pausible.sol';


contract Remittance is Pausible {

    struct Withdraw {
        uint256 value;
        uint256 deadline;
        address beneficiary;
        address creator;
    }

    uint256 public commissionBalance;

    mapping(bytes32 => Withdraw) public withdraws;
    uint256 public commission;

    event LogNewCommision(uint256 indexed newCom, uint256 blockNumber);

    event LogNewWithdraw(
        address indexed creator,
        address indexed beneficiary,
        uint256 value,
        uint256 indexed deadline
    );

    event LogCancelWithdraw(
        address indexed creator,
        address indexed beneficiary,
        uint256 value,
        uint256 indexed deadline
    );

    event LogWithdrawCompleted(
        address indexed creator,
        address indexed beneficiary,
        uint256 value,
        uint256 indexed deadline
    );

    event CommissionWithdrawn(address indexed beneficiary, uint256 indexed amount);


    function setCommission(uint256 newCom) public onlyOwner returns(bool) {
        commission = newCom;
        LogNewCommision(newCom, block.number);
        return true;
    }

    function addWithdraw(bytes32 passwordHash, uint256 deadline, address beneficiary)
        public
        payable
        onlyIfRunning
        returns(bool)
    {
        require(withdraws[passwordHash].creator == address(0));
        require(beneficiary != address(0));
        require(msg.value > 0);
        // max deadline, 2 weeks
        require(deadline > now && deadline <= now + (14*24*60*60));

        withdraws[passwordHash] = Withdraw(msg.value, deadline, beneficiary, msg.sender);

        LogNewWithdraw(msg.sender, beneficiary, msg.value, deadline);
        return true;
    }

    function cancelWithdraw(bytes32 passwordHash) public onlyIfRunning returns(bool) {
        // you must be a creator
        require(withdraws[passwordHash].creator == msg.sender);
        // it must be past deadline
        require(withdraws[passwordHash].deadline < now);
        // withdraw must be unused
        require(withdraws[passwordHash].value > 0);

        Withdraw memory withdrawCopy = withdraws[passwordHash];
        uint256 value = withdraws[passwordHash].value;
        delete withdraws[passwordHash];
        msg.sender.transfer(value);
        
        LogCancelWithdraw(
            withdrawCopy.creator,
            withdrawCopy.beneficiary,
            withdrawCopy.value,
            withdrawCopy.deadline
        );
        return true;
    }

    function withdraw(bytes32 password) public onlyIfRunning returns(bool) {
        bytes32 hash = keccak256(password);
        require(withdraws[hash].value > 0);
        require(withdraws[hash].deadline >= now);
        require(withdraws[hash].beneficiary == msg.sender);

        Withdraw memory withdrawCopy = withdraws[hash];
        uint256 value = getCut(withdraws[hash].value);
        delete withdraws[hash];
        msg.sender.transfer(value);

        LogWithdrawCompleted(
            withdrawCopy.creator,
            withdrawCopy.beneficiary,
            withdrawCopy.value,
            withdrawCopy.deadline
        );
        return true;
    }

    function withdrawCommission(address beneficiary) public onlyOwner returns(bool) {
        if (beneficiary == address(0)) {
            beneficiary = msg.sender;
        }
        uint256 tempCommission = commissionBalance;
        commissionBalance = 0;
        beneficiary.transfer(commissionBalance);

        CommissionWithdrawn(beneficiary, tempCommission);
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

}