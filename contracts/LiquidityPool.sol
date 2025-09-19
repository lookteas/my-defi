// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LiquidityPool
 * @dev 自动做市商(AMM)流动性池合约
 * @notice 实现了基于恒定乘积公式(x*y=k)的去中心化交易所功能
 */
contract LiquidityPool is ERC20, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    /// @dev 流动性池中的第一个代币
    IERC20 public immutable tokenA;
    /// @dev 流动性池中的第二个代币
    IERC20 public immutable tokenB;
    
    /// @dev tokenA的储备量
    uint256 public reserveA;
    /// @dev tokenB的储备量
    uint256 public reserveB;
    /// @dev 交易手续费率：0.3%
    uint256 public constant FEE_RATE = 3; // 0.3% fee
    /// @dev 手续费分母，用于计算百分比
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    /// @dev 添加流动性事件
    event AddLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    /// @dev 移除流动性事件
    event RemoveLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    /// @dev 代币交换事件
    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    
    /**
     * @dev 构造函数，初始化流动性池
     * @param _tokenA 第一个代币的合约地址
     * @param _tokenB 第二个代币的合约地址
     * @param _name LP代币的名称
     * @param _symbol LP代币的符号
     */
    constructor(
        address _tokenA,
        address _tokenB,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
    
    /**
     * @dev 添加流动性到池中
     * @param amountADesired 期望添加的tokenA数量
     * @param amountBDesired 期望添加的tokenB数量
     * @return amountA 实际添加的tokenA数量
     * @return amountB 实际添加的tokenB数量
     * @return liquidity 获得的LP代币数量
     * @notice 用户需要先授权合约使用其代币
     */
    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired
    ) external nonReentrant returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        // 简化版本：直接使用期望数量
        amountA = amountADesired;
        amountB = amountBDesired;
        
        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);
        
        if (totalSupply() == 0) {
            liquidity = _sqrt(amountA * amountB);
        } else {
            liquidity = _min((amountA * totalSupply()) / reserveA, (amountB * totalSupply()) / reserveB);
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        _mint(msg.sender, liquidity);
        
        reserveA += amountA;
        reserveB += amountB;
        
        emit AddLiquidity(msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev 从池中移除流动性
     * @param liquidity 要销毁的LP代币数量
     * @param amountAMin 期望获得的最小tokenA数量
     * @param amountBMin 期望获得的最小tokenB数量
     * @return amountA 实际获得的tokenA数量
     * @return amountB 实际获得的tokenB数量
     * @notice 用户必须持有足够的LP代币
     */
    function removeLiquidity(
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(liquidity > 0, "Insufficient liquidity");
        require(balanceOf(msg.sender) >= liquidity, "Insufficient LP tokens");
        
        amountA = (liquidity * reserveA) / totalSupply();
        amountB = (liquidity * reserveB) / totalSupply();
        
        require(amountA >= amountAMin, "Insufficient A amount");
        require(amountB >= amountBMin, "Insufficient B amount");
        
        _burn(msg.sender, liquidity);
        
        reserveA -= amountA;
        reserveB -= amountB;
        
        tokenA.safeTransfer(msg.sender, amountA);
        tokenB.safeTransfer(msg.sender, amountB);
        
        emit RemoveLiquidity(msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev 用tokenA交换tokenB
     * @param amountAIn 输入的tokenA数量
     * @param amountBOutMin 期望获得的最小tokenB数量
     * @notice 会收取0.3%的交易手续费
     */
    function swapAForB(uint256 amountAIn, uint256 amountBOutMin) external nonReentrant {
        require(amountAIn > 0, "Invalid input amount");
        
        uint256 amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut >= amountBOutMin, "Insufficient output amount");
        
        tokenA.safeTransferFrom(msg.sender, address(this), amountAIn);
        tokenB.safeTransfer(msg.sender, amountBOut);
        
        reserveA += amountAIn;
        reserveB -= amountBOut;
        
        emit Swap(msg.sender, address(tokenA), amountAIn, amountBOut);
    }
    
    /**
     * @dev 用tokenB交换tokenA
     * @param amountBIn 输入的tokenB数量
     * @param amountAOutMin 期望获得的最小tokenA数量
     * @notice 会收取0.3%的交易手续费
     */
    function swapBForA(uint256 amountBIn, uint256 amountAOutMin) external nonReentrant {
        require(amountBIn > 0, "Invalid input amount");
        
        uint256 amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut >= amountAOutMin, "Insufficient output amount");
        
        tokenB.safeTransferFrom(msg.sender, address(this), amountBIn);
        tokenA.safeTransfer(msg.sender, amountAOut);
        
        reserveB += amountBIn;
        reserveA -= amountAOut;
        
        emit Swap(msg.sender, address(tokenB), amountBIn, amountAOut);
    }
    
    /**
     * @dev 计算交换输出数量（基于恒定乘积公式）
     * @param amountIn 输入代币数量
     * @param reserveIn 输入代币的储备量
     * @param reserveOut 输出代币的储备量
     * @return 扣除手续费后的输出代币数量
     * @notice 使用公式：amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        require(amountIn > 0, "Invalid input amount");
        require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");
        
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_RATE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        
        return numerator / denominator;
    }
    
    /**
     * @dev 内部函数：计算最优流动性添加数量
     * @param amountADesired 期望的tokenA数量
     * @param amountBDesired 期望的tokenB数量
     * @param amountAMin 最小tokenA数量
     * @param amountBMin 最小tokenB数量
     * @return amountA 实际tokenA数量
     * @return amountB 实际tokenB数量
     * @notice 确保添加的流动性保持当前池子的价格比例
     */
    function _calculateLiquidityAmounts(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal view returns (uint256 amountA, uint256 amountB) {
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "Insufficient A amount");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
    
    /**
     * @dev 内部函数：计算平方根（巴比伦方法）
     * @param y 要计算平方根的数
     * @return z y的平方根
     * @notice 用于计算初始流动性代币数量
     */
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    /**
     * @dev 内部函数：返回两个数中的较小值
     * @param a 第一个数
     * @param b 第二个数
     * @return 较小的数
     */
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    /**
     * @dev 获取当前储备量
     * @return 返回tokenA和tokenB的储备量
     * @notice 外部合约可以调用此函数获取池子状态
     */
    function getReserves() external view returns (uint256, uint256) {
        return (reserveA, reserveB);
    }
    
    /**
     * @dev 获取当前价格（tokenA相对于tokenB）
     * @return tokenA相对于tokenB的价格（以18位小数表示）
     * @notice 返回1个tokenA等于多少个tokenB
     * @notice 如果储备量为0则返回0
     */
    function getPrice() external view returns (uint256) {
        if (reserveA == 0 || reserveB == 0) {
            return 0;
        }
        // 返回 1 tokenA 等于多少 tokenB（以18位小数表示）
        return (reserveB * 1e18) / reserveA;
    }
}