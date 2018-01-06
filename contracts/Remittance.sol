pragma solidity ^0.4.18;


import './Pausible.sol';


contract Remittance is Pausible {

    uint256 constant max_deadline = 2 weeks;

    enum State {empty, created, canceled, paid}

    struct Withdraw {
        uint256 value;
        uint256 deadline;
        address beneficiary;
        address creator;
        State state;
    }

    mapping(address => uint256) public commissions;

    mapping(bytes32 => Withdraw) public withdraws;

    uint256 public commission;

    event LogNewCommision(address indexed sender, uint256 newCom);

    event LogNewWithdraw(
        address indexed creator,
        bytes32 passwordHash,
        address indexed beneficiary,
        uint256 value,
        uint256 indexed deadline
    );

    event LogCancelWithdraw(
        bytes32 indexed passwordHash
    );

    event LogWithdrawCompleted(
        address indexed creator,
        address indexed beneficiary,
        uint256 value,
        uint256 indexed deadline
    );

    event LogCommissionWithdraw(
        address indexed beneficiary,
        uint256 indexed amount,
        address indexed sender
    );

    function Remittance(uint256 _commission) public {
        commission = _commission;
    }

    function createHash(bytes32 password) external pure returns(bytes32) {
        return keccak256(password);
    }

    function setCommission(uint256 newCom) public onlyOwner returns(bool) {
        commission = newCom;
        LogNewCommision(msg.sender, newCom);
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
        require(now < deadline && deadline <= now + max_deadline);

        withdraws[passwordHash] = Withdraw({
            value: msg.value,
            deadline: deadline,
            beneficiary: beneficiary,
            creator: msg.sender,
            state: State.created
        });

        LogNewWithdraw(msg.sender, passwordHash, beneficiary, msg.value, deadline);
        return true;
    }

    function cancelWithdraw(bytes32 passwordHash) public onlyIfRunning returns(bool) {
        // you must be a creator | not any more
        // require(withdrawCopy.creator == msg.sender);
        // it must be past deadline
        require(withdraws[passwordHash].deadline < now);
        // withdraw must be unused
        require(withdraws[passwordHash].value > 0);
        // must be in state Created
        require(withdraws[passwordHash].state == State.created);

        withdraws[passwordHash].state = State.canceled;
        withdraws[passwordHash].creator.transfer(withdraws[passwordHash].value);
        
        LogCancelWithdraw(passwordHash);
        return true;
    }

    function withdraw(bytes32 password) public onlyIfRunning returns(bool) {
        bytes32 hash = keccak256(password);
        Withdraw storage withdrawRef = withdraws[hash];
        uint256 value = withdrawRef.value;
        require(value > 0);
        uint256 deadline = withdrawRef.deadline;
        require(deadline >= now);
        address beneficiary = withdrawRef.beneficiary;
        require(beneficiary == msg.sender);
        require(withdrawRef.state == State.created);

        if(value > commission) {
            commissions[getOwner()] += commission;
            value -= commission;
        }
        
        withdrawRef.state = State.paid;

        LogWithdrawCompleted(
            withdrawRef.creator,
            beneficiary,
            value,
            deadline
        );
        msg.sender.transfer(value);
        return true;
    }

    function withdrawCommission(address beneficiary) public returns(bool) {
        require(beneficiary != address(0));

        uint256 tempCommission = commissions[msg.sender];
        commissions[msg.sender] = 0;

        LogCommissionWithdraw(beneficiary, tempCommission, msg.sender);
        beneficiary.transfer(tempCommission);
        return true;
    }

    // function getCut(uint256 value) internal returns(uint256) {
    //     if(value <= commission) {
    //         // take nothing
    //         return value;
    //     }
    //     commissions[getOwner()] += commission;
    //     return value - commission;
    // }

}