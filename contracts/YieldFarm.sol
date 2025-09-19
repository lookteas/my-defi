// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title YieldFarm
 * @dev 流动性挖矿合约
 * @notice 允许用户质押LP代币获得奖励代币
 */
contract YieldFarm is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    /**
     * @dev 用户信息结构体
     * @param amount 用户质押的代币数量
     * @param rewardDebt 奖励债务，用于计算待领取奖励
     * @param pendingRewards 待领取的奖励数量
     * @param lastUpdateTime 最后更新时间
     */
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
        uint256 lastUpdateTime;
    }
    
    /**
     * @dev 矿池信息结构体
     * @param lpToken 质押的LP代币合约
     * @param allocPoint 分配点数，决定奖励分配比例
     * @param lastRewardTime 最后奖励时间
     * @param accRewardPerShare 累积每股奖励
     * @param totalStaked 总质押数量
     */
    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardTime;
        uint256 accRewardPerShare;
        uint256 totalStaked;
    }
    
    /// @dev 奖励代币合约
    IERC20 public immutable rewardToken;
    /// @dev 每秒奖励数量
    uint256 public rewardPerSecond;
    /// @dev 总分配点数
    uint256 public totalAllocPoint;
    /// @dev 挖矿开始时间
    uint256 public startTime;
    /// @dev 精度常量，用于计算累积奖励
    uint256 public constant ACC_PRECISION = 1e12;
    
    /// @dev 矿池信息数组
    PoolInfo[] public poolInfo;
    /// @dev 用户信息映射：矿池ID => 用户地址 => 用户信息
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    /// @dev 质押事件
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    /// @dev 提取事件
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    /// @dev 收获奖励事件
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    /// @dev 添加矿池事件
    event PoolAdded(uint256 indexed pid, address lpToken, uint256 allocPoint);
    /// @dev 更新矿池事件
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint);
    
    /**
     * @dev 构造函数，初始化流动性挖矿合约
     * @param _rewardToken 奖励代币合约地址
     * @param _rewardPerSecond 每秒奖励数量
     * @param _startTime 挖矿开始时间
     */
    constructor(
        address _rewardToken,
        uint256 _rewardPerSecond,
        uint256 _startTime
    ) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
        rewardPerSecond = _rewardPerSecond;
        startTime = _startTime;
    }
    
    /**
     * @dev 获取矿池数量
     * @return 矿池总数
     */
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }
    
    /**
     * @dev 添加新的矿池（仅限所有者）
     * @param _allocPoint 分配点数
     * @param _lpToken LP代币合约地址
     * @notice 添加前会更新所有矿池的奖励
     */
    function addPool(uint256 _allocPoint, IERC20 _lpToken) external onlyOwner {
        massUpdatePools();
        
        totalAllocPoint += _allocPoint;
        
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardTime: block.timestamp > startTime ? block.timestamp : startTime,
            accRewardPerShare: 0,
            totalStaked: 0
        }));
        
        emit PoolAdded(poolInfo.length - 1, address(_lpToken), _allocPoint);
    }
    
    /**
     * @dev 更新矿池分配点数（仅限所有者）
     * @param _pid 矿池ID
     * @param _allocPoint 新的分配点数
     * @notice 更新前会更新所有矿池的奖励
     */
    function updatePool(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        massUpdatePools();
        
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        
        emit PoolUpdated(_pid, _allocPoint);
    }
    
    /**
     * @dev 更新每秒奖励数量（仅限所有者）
     * @param _rewardPerSecond 新的每秒奖励数量
     * @notice 更新前会更新所有矿池的奖励
     */
    function updateRewardPerSecond(uint256 _rewardPerSecond) external onlyOwner {
        massUpdatePools();
        rewardPerSecond = _rewardPerSecond;
    }
    
    /**
     * @dev 批量更新所有矿池的奖励
     * @notice 遍历所有矿池并更新奖励计算
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePoolRewards(pid);
        }
    }
    
    /**
     * @dev 更新指定矿池的奖励
     * @param _pid 矿池ID
     * @notice 根据时间流逝和分配点数计算累积奖励
     */
    function updatePoolRewards(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        
        if (pool.totalStaked == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
        uint256 reward = (timeElapsed * rewardPerSecond * pool.allocPoint) / totalAllocPoint;
        
        pool.accRewardPerShare += (reward * ACC_PRECISION) / pool.totalStaked;
        pool.lastRewardTime = block.timestamp;
    }
    
    /**
     * @dev 质押LP代币到矿池
     * @param _pid 矿池ID
     * @param _amount 质押数量
     * @notice 用户需要先授权合约使用其LP代币
     * @notice 质押前会自动收获之前的奖励
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused {
        require(_pid < poolInfo.length, "Invalid pool ID");
        require(_amount > 0, "Amount must be greater than 0");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePoolRewards(_pid);
        
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare) / ACC_PRECISION - user.rewardDebt;
            user.pendingRewards += pending;
        }
        
        pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        user.amount += _amount;
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / ACC_PRECISION;
        user.lastUpdateTime = block.timestamp;
        
        pool.totalStaked += _amount;
        
        emit Deposit(msg.sender, _pid, _amount);
    }
    
    /**
     * @dev 从矿池提取LP代币
     * @param _pid 矿池ID
     * @param _amount 提取数量
     * @notice 提取前会自动收获之前的奖励
     * @notice 不能提取超过质押的数量
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        require(_pid < poolInfo.length, "Invalid pool ID");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "Insufficient staked amount");
        
        updatePoolRewards(_pid);
        
        uint256 pending = (user.amount * pool.accRewardPerShare) / ACC_PRECISION - user.rewardDebt;
        user.pendingRewards += pending;
        
        user.amount -= _amount;
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / ACC_PRECISION;
        user.lastUpdateTime = block.timestamp;
        
        pool.totalStaked -= _amount;
        
        pool.lpToken.safeTransfer(msg.sender, _amount);
        
        emit Withdraw(msg.sender, _pid, _amount);
    }
    
    /**
     * @dev 收获奖励代币
     * @param _pid 矿池ID
     * @notice 收获所有待领取的奖励代币
     * @notice 如果没有奖励则不执行任何操作
     */
    function harvest(uint256 _pid) external nonReentrant {
        require(_pid < poolInfo.length, "Invalid pool ID");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePoolRewards(_pid);
        
        uint256 pending = (user.amount * pool.accRewardPerShare) / ACC_PRECISION - user.rewardDebt;
        uint256 totalReward = user.pendingRewards + pending;
        
        if (totalReward > 0) {
            user.pendingRewards = 0;
            user.rewardDebt = (user.amount * pool.accRewardPerShare) / ACC_PRECISION;
            user.lastUpdateTime = block.timestamp;
            
            rewardToken.safeTransfer(msg.sender, totalReward);
            
            emit Harvest(msg.sender, _pid, totalReward);
        }
    }
    
    /**
     * @dev 查看用户待领取的奖励数量
     * @param _pid 矿池ID
     * @param _user 用户地址
     * @return 待领取的奖励数量
     * @notice 这是一个视图函数，不会改变合约状态
     */
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        
        if (block.timestamp > pool.lastRewardTime && pool.totalStaked != 0) {
            uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
            uint256 reward = (timeElapsed * rewardPerSecond * pool.allocPoint) / totalAllocPoint;
            accRewardPerShare += (reward * ACC_PRECISION) / pool.totalStaked;
        }
        
        return user.pendingRewards + (user.amount * accRewardPerShare) / ACC_PRECISION - user.rewardDebt;
    }
    
    /**
     * @dev 紧急提取，放弃所有奖励
     * @param _pid 矿池ID
     * @notice 紧急情况下使用，会放弃所有待领取的奖励
     * @notice 只能提取质押的LP代币，不会获得任何奖励
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        
        pool.totalStaked -= amount;
        
        pool.lpToken.safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, _pid, amount);
    }
    
    /**
     * @dev 暂停合约（仅限所有者）
     * @notice 暂停后质押操作会被禁止，但提取和收获仍可进行
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约（仅限所有者）
     * @notice 恢复后所有操作恢复正常
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}