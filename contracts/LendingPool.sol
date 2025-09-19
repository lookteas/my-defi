// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LendingPool
 * @dev 去中心化借贷池合约
 * @notice 允许用户存入代币获得利息，或抵押代币进行借贷
 */
contract LendingPool is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    /**
     * @dev 用户信息结构体
     * @param supplied 用户存入的代币数量
     * @param borrowed 用户借出的代币数量
     * @param lastUpdateTime 最后更新时间
     */
    struct UserInfo {
        uint256 supplied;
        uint256 borrowed;
        uint256 lastUpdateTime;
    }
    
    /// @dev 借贷池支持的代币合约
    IERC20 public immutable token;
    /// @dev 池中总存入量
    uint256 public totalSupplied;
    /// @dev 池中总借出量
    uint256 public totalBorrowed;
    /// @dev 年化利率：5%
    uint256 public constant INTEREST_RATE = 5; // 5% annual interest rate
    /// @dev 抵押率：150%（需要150%的抵押才能借出100%）
    uint256 public constant COLLATERAL_RATIO = 150; // 150% collateralization ratio
    
    /// @dev 用户信息映射
    mapping(address => UserInfo) public users;
    
    /// @dev 存入代币事件
    event Supply(address indexed user, uint256 amount);
    /// @dev 提取代币事件
    event Withdraw(address indexed user, uint256 amount);
    /// @dev 借出代币事件
    event Borrow(address indexed user, uint256 amount);
    /// @dev 还款事件
    event Repay(address indexed user, uint256 amount);
    
    /**
     * @dev 构造函数，初始化借贷池
     * @param _token 支持借贷的代币合约地址
     */
    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }
    
    /**
     * @dev 向池中存入代币
     * @param amount 存入的代币数量
     * @notice 用户需要先授权合约使用其代币
     * @notice 存入的代币可以作为抵押品用于借贷
     */
    function supply(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        UserInfo storage user = users[msg.sender];
        user.supplied += amount;
        user.lastUpdateTime = block.timestamp;
        totalSupplied += amount;
        
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        emit Supply(msg.sender, amount);
    }
    
    /**
     * @dev 从池中提取代币
     * @param amount 提取的代币数量
     * @notice 提取后必须保持足够的抵押率（如果有借款）
     * @notice 不能提取会导致抵押不足的数量
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        UserInfo storage user = users[msg.sender];
        require(user.supplied >= amount, "Insufficient supplied balance");
        require(getAvailableToWithdraw(msg.sender) >= amount, "Withdrawal would make position undercollateralized");
        
        user.supplied -= amount;
        user.lastUpdateTime = block.timestamp;
        totalSupplied -= amount;
        
        token.safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, amount);
    }
    
    /**
     * @dev 从池中借出代币
     * @param amount 借出的代币数量
     * @notice 需要有足够的抵押品（150%抵押率）
     * @notice 池中必须有足够的流动性
     */
    function borrow(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(token.balanceOf(address(this)) >= amount, "Insufficient liquidity");
        
        UserInfo storage user = users[msg.sender];
        uint256 maxBorrow = (user.supplied * 100) / COLLATERAL_RATIO;
        require(user.borrowed + amount <= maxBorrow, "Exceeds borrowing capacity");
        
        user.borrowed += amount;
        user.lastUpdateTime = block.timestamp;
        totalBorrowed += amount;
        
        token.safeTransfer(msg.sender, amount);
        
        emit Borrow(msg.sender, amount);
    }
    
    /**
     * @dev 还款
     * @param amount 还款数量
     * @notice 用户需要先授权合约使用其代币
     * @notice 还款后可以提取更多抵押品
     */
    function repay(uint256 amount) external nonReentrant whenNotPaused {
        UserInfo storage user = users[msg.sender];
        require(user.borrowed >= amount, "Repay amount exceeds borrowed amount");
        
        user.borrowed -= amount;
        user.lastUpdateTime = block.timestamp;
        totalBorrowed -= amount;
        
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        emit Repay(msg.sender, amount);
    }
    
    /**
     * @dev 计算用户可提取的最大数量
     * @param user 用户地址
     * @return 可提取的代币数量
     * @notice 考虑抵押率要求，确保提取后仍有足够抵押
     */
    function getAvailableToWithdraw(address user) public view returns (uint256) {
        UserInfo memory userInfo = users[user];
        if (userInfo.borrowed == 0) {
            return userInfo.supplied;
        }
        
        uint256 requiredCollateral = (userInfo.borrowed * COLLATERAL_RATIO) / 100;
        if (userInfo.supplied <= requiredCollateral) {
            return 0;
        }
        
        return userInfo.supplied - requiredCollateral;
    }
    
    /**
     * @dev 获取用户完整信息
     * @param user 用户地址
     * @return supplied 用户存入数量
     * @return borrowed 用户借出数量
     * @return availableToWithdraw 可提取数量
     * @notice 外部合约和前端可以调用此函数获取用户状态
     */
    function getUserInfo(address user) external view returns (uint256 supplied, uint256 borrowed, uint256 availableToWithdraw) {
        UserInfo memory userInfo = users[user];
        return (userInfo.supplied, userInfo.borrowed, getAvailableToWithdraw(user));
    }
    
    /**
     * @dev 暂停合约（仅限所有者）
     * @notice 暂停后所有借贷操作都会被禁止
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约（仅限所有者）
     * @notice 恢复后所有借贷操作恢复正常
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}