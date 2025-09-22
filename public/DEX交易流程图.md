# DEX交易流程图

## 1. 技术架构图

```mermaid
graph TB
    subgraph "前端层"
        A[DEXInterface.tsx] --> B[useWallet Hook]
        A --> C[ethers.js]
        A --> D[合约 ABI]
    end
    
    subgraph "Web3 交互层"
        C --> E[Provider/Signer]
        E --> F[合约实例]
    end
    
    subgraph "智能合约层"
        F --> G[LiquidityPool.sol]
        G --> H[MyDeFiToken.sol]
        G --> I[MockUSDC.sol]
    end
    
    subgraph "AMM 核心机制"
        J[恒定乘积公式 x*y=k]
        K[流动性提供]
        L[代币交换]
        M[手续费机制]
    end
    
    G --> J
    G --> K
    G --> L
    G --> M
```

## 2. 核心组件架构

```mermaid
graph LR
    subgraph "DEXInterface 组件"
        A[状态管理] --> B[数据获取]
        B --> C[用户操作]
        C --> D[UI 渲染]
    end
    
    subgraph "智能合约功能"
        E[LiquidityPool] --> F[添加流动性]
        E --> G[移除流动性]
        E --> H[代币交换A→B]
        E --> I[代币交换B→A]
        E --> J[价格计算]
    end
    
    subgraph "AMM 机制"
        K[恒定乘积 x*y=k]
        L[滑点保护]
        M[手续费 0.3%]
        N[LP代币铸造]
    end
    
    C --> E
    E --> K
    E --> L
    E --> M
    E --> N
```

## 3. DEX交易详细流程

### 3.1 初始化流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant D as DEXInterface
    participant W as useWallet
    participant L as LiquidityPool合约
    participant T as Token合约
    
    U->>D: 访问DEX页面
    D->>W: 获取钱包连接状态
    W-->>D: 返回账户信息
    D->>T: 获取MDT余额
    T-->>D: 返回MDT余额
    D->>T: 获取USDC余额
    T-->>D: 返回USDC余额
    D->>L: 获取LP代币余额
    L-->>D: 返回LP余额
    D->>L: 获取储备量信息
    L-->>D: 返回储备量
    D->>L: 获取当前价格
    L-->>D: 返回价格信息
    D-->>U: 显示DEX概览
```

### 3.2 添加流动性流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant D as DEXInterface
    participant T1 as MDT合约
    participant T2 as USDC合约
    participant L as LiquidityPool合约
    
    U->>D: 输入MDT和USDC数量
    D->>D: 验证输入有效性
    D->>T1: 检查MDT余额
    T1-->>D: 返回余额信息
    D->>T2: 检查USDC余额
    T2-->>D: 返回余额信息
    D->>T1: 调用 approve() 授权MDT
    T1-->>D: 授权成功
    D->>T2: 调用 approve() 授权USDC
    T2-->>D: 授权成功
    D->>L: 调用 addLiquidity()
    L->>T1: 转移MDT到合约
    L->>T2: 转移USDC到合约
    L->>L: 计算LP代币数量
    L->>L: 铸造LP代币给用户
    L->>L: 更新储备量
    L-->>D: 添加流动性成功
    D->>D: 刷新用户信息
    D-->>U: 显示成功消息
```

### 3.3 代币交换流程 (MDT → USDC)

```mermaid
sequenceDiagram
    participant U as 用户
    participant D as DEXInterface
    participant T1 as MDT合约
    participant L as LiquidityPool合约
    participant T2 as USDC合约
    
    U->>D: 选择MDT→USDC，输入数量
    D->>D: 验证输入有效性
    D->>L: 调用 getAmountOut() 计算输出
    L-->>D: 返回预期USDC数量
    D-->>U: 显示预期输出
    U->>D: 确认交换
    D->>T1: 检查MDT余额
    T1-->>D: 返回余额信息
    D->>T1: 调用 approve() 授权MDT
    T1-->>D: 授权成功
    D->>L: 调用 swapAForB()
    L->>L: 验证滑点保护
    L->>T1: 从用户转移MDT到合约
    L->>L: 根据AMM公式计算输出
    L->>T2: 从合约转移USDC给用户
    L->>L: 更新储备量
    L-->>D: 交换成功
    D->>D: 刷新用户信息
    D-->>U: 显示成功消息
```

### 3.4 移除流动性流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant D as DEXInterface
    participant L as LiquidityPool合约
    participant T1 as MDT合约
    participant T2 as USDC合约
    
    U->>D: 输入LP代币数量
    D->>D: 验证输入有效性
    D->>L: 检查LP代币余额
    L-->>D: 返回LP余额
    D->>L: 调用 removeLiquidity()
    L->>L: 验证LP代币数量
    L->>L: 计算可获得的MDT和USDC
    L->>L: 销毁用户的LP代币
    L->>T1: 转移MDT给用户
    L->>T2: 转移USDC给用户
    L->>L: 更新储备量
    L-->>D: 移除流动性成功
    D->>D: 刷新用户信息
    D-->>U: 显示成功消息
```

## 4. AMM 核心算法

### 4.1 恒定乘积公式

```mermaid
graph TD
    A[恒定乘积公式] --> B[x * y = k]
    B --> C[x: TokenA 储备量]
    B --> D[y: TokenB 储备量]
    B --> E[k: 恒定值]
    
    F[交换计算] --> G[输入 Δx]
    G --> H[输出 Δy = y - k /（x + Δx）]
    H --> I[扣除手续费 0.3%]
    I --> J[实际输出 = Δy * 0.997]
```

### 4.2 价格计算机制

```mermaid
graph LR
    A[当前价格] --> B[Price = ReserveB / ReserveA]
    C[交换影响] --> D[价格滑点]
    D --> E[大额交换 → 高滑点]
    D --> F[小额交换 → 低滑点]
    
    G[滑点保护] --> H[最小输出量检查]
    H --> I[amountOut >= amountOutMin]
```

## 5. 核心代码结构

### 5.1 智能合约结构

```solidity
// LiquidityPool.sol 核心结构
contract LiquidityPool is ERC20, ReentrancyGuard, Ownable {
    // 状态变量
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public constant FEE_RATE = 3; // 0.3%
    
    // 核心功能
    function addLiquidity(uint256 amountADesired, uint256 amountBDesired) external;
    function removeLiquidity(uint256 liquidity, uint256 amountAMin, uint256 amountBMin) external;
    function swapAForB(uint256 amountAIn, uint256 amountBOutMin) external;
    function swapBForA(uint256 amountBIn, uint256 amountAOutMin) external;
    
    // 辅助功能
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure;
    function getReserves() external view returns (uint256, uint256);
}
```

### 5.2 前端组件结构

```typescript
// DEXInterface.tsx 核心结构
interface DEXInterface {
  // 状态管理
  tokenBalance: string;
  usdcBalance: string;
  lpBalance: string;
  reserves: { token: string; usdc: string };
  price: string;
  
  // 核心功能
  fetchDEXInfo(): Promise<void>;
  handleAddLiquidity(): Promise<void>;
  handleRemoveLiquidity(): Promise<void>;
  handleSwap(): Promise<void>;
  calculateExpectedOutput(): Promise<void>;
  
  // UI 渲染
  renderOverview(): JSX.Element;
  renderActions(): JSX.Element;
}
```

## 6. 状态管理机制

```mermaid
stateDiagram-v2
    [*] --> 未连接钱包
    未连接钱包 --> 已连接钱包: 连接钱包
    已连接钱包 --> 加载中: 获取DEX信息
    加载中 --> 显示概览: 数据加载完成
    显示概览 --> 添加流动性中: 用户添加流动性
    显示概览 --> 移除流动性中: 用户移除流动性
    显示概览 --> 交换中: 用户交换代币
    添加流动性中 --> 显示概览: 操作完成
    移除流动性中 --> 显示概览: 操作完成
    交换中 --> 显示概览: 操作完成
    添加流动性中 --> 显示概览: 操作失败
    移除流动性中 --> 显示概览: 操作失败
    交换中 --> 显示概览: 操作失败
```

## 7. 手续费机制

```mermaid
graph TD
    A[用户交换] --> B[输入金额]
    B --> C[扣除手续费 0.3%]
    C --> D[实际用于交换: 99.7%]
    D --> E[AMM 计算输出]
    
    F[手续费分配] --> G[留在流动性池]
    G --> H[增加储备量]
    H --> I[LP提供者受益]
    
    C --> F
```

## 8. 错误处理机制

```mermaid
graph TD
    A[用户操作] --> B{输入验证}
    B -->|无效| C[显示输入错误]
    B -->|有效| D{钱包连接检查}
    D -->|未连接| E[提示连接钱包]
    D -->|已连接| F{余额检查}
    F -->|余额不足| G[显示余额不足]
    F -->|余额充足| H{滑点检查}
    H -->|滑点过大| I[显示滑点警告]
    H -->|滑点正常| J{合约调用}
    J -->|成功| K[更新UI状态]
    J -->|失败| L{错误类型判断}
    L -->|授权失败| M[提示重新授权]
    L -->|流动性不足| N[显示流动性不足]
    L -->|其他错误| O[显示通用错误]
    
    C --> P[用户重新输入]
    E --> Q[用户连接钱包]
    G --> R[用户充值或减少金额]
    I --> S[用户调整滑点或金额]
    M --> T[用户重新授权]
    N --> U[等待流动性增加]
    O --> V[用户重试操作]
```

## 9. 安全机制

### 9.1 智能合约安全

```mermaid
graph LR
    subgraph "安全机制"
        A[ReentrancyGuard] --> B[防重入攻击]
        C[SafeERC20] --> D[安全代币转移]
        E[Ownable] --> F[权限控制]
        G[滑点保护] --> H[防MEV攻击]
    end
    
    subgraph "验证机制"
        I[输入验证]
        J[余额检查]
        K[授权验证]
        L[储备量检查]
    end
    
    B --> I
    D --> J
    F --> K
    H --> L
```

### 9.2 前端安全

```typescript
// 安全检查示例
const safeSwap = async (amount: string, fromToken: string) => {
  try {
    // 1. 输入验证
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('无效的输入金额');
    }
    
    // 2. 钱包连接检查
    if (!account || !signer) {
      throw new Error('钱包未连接');
    }
    
    // 3. 余额检查
    const balance = await getTokenBalance(fromToken);
    if (parseFloat(balance) < numericAmount) {
      throw new Error('余额不足');
    }
    
    // 4. 滑点保护
    const expectedOutput = await calculateExpectedOutput(amount, fromToken);
    const minOutput = expectedOutput * 0.99; // 1% 滑点保护
    
    // 5. 执行交换
    await executeSwap(amount, fromToken, minOutput);
  } catch (error) {
    handleError(error);
  }
};
```

## 10. 用户体验优化

### 10.1 实时数据更新

```mermaid
graph TD
    A[用户操作] --> B[显示加载状态]
    B --> C[执行合约调用]
    C --> D{操作结果}
    D -->|成功| E[隐藏加载状态]
    D -->|失败| F[隐藏加载状态]
    E --> G[显示成功消息]
    F --> H[显示错误消息]
    G --> I[自动刷新数据]
    H --> J[保持当前状态]
    I --> K[更新余额显示]
    I --> L[更新储备量显示]
    I --> M[更新价格显示]
```

### 10.2 预期输出计算

```typescript
// 实时计算预期输出
const calculateExpectedOutput = async () => {
  if (!swapAmount || !provider) return;
  
  try {
    const liquidityContract = new Contract(
      CONTRACTS.LiquidityPool,
      LIQUIDITY_POOL_ABI,
      provider
    );
    
    const amount = parseEther(swapAmount);
    const [reserveA, reserveB] = await liquidityContract.getReserves();
    
    let output;
    if (swapFromToken === 'token') {
      output = await liquidityContract.getAmountOut(amount, reserveA, reserveB);
    } else {
      output = await liquidityContract.getAmountOut(amount, reserveB, reserveA);
    }
    
    setExpectedOutput(formatEther(output));
  } catch (error) {
    console.error('计算预期输出失败:', error);
    setExpectedOutput('0');
  }
};
```

## 11. 扩展性设计

### 11.1 多交易对支持

```mermaid
graph TB
    subgraph "当前架构"
        A[单一交易对 MDT/USDC]
        B[固定手续费 0.3%]
        C[简单AMM模型]
    end
    
    subgraph "扩展架构"
        D[多交易对支持]
        E[动态手续费]
        F[高级AMM模型]
        G[路由优化]
    end
    
    A --> D
    B --> E
    C --> F
    D --> G
```

### 11.2 功能扩展点

```typescript
// 扩展接口设计
interface ExtendedDEX {
  // 多交易对支持
  supportedPairs: TradingPair[];
  
  // 路由功能
  findBestRoute(tokenIn: string, tokenOut: string, amountIn: string): Route;
  
  // 聚合流动性
  aggregateLiquidity(pairs: TradingPair[]): LiquidityInfo;
  
  // 高级订单类型
  limitOrder(params: LimitOrderParams): Promise<void>;
  stopLoss(params: StopLossParams): Promise<void>;
}
```

## 12. 性能优化

### 12.1 数据缓存

```typescript
// 缓存机制
const useDataCache = () => {
  const [cache, setCache] = useState<Map<string, any>>(new Map());
  
  const getCachedData = (key: string, fetcher: () => Promise<any>) => {
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    return fetcher().then(data => {
      setCache(prev => new Map(prev).set(key, data));
      return data;
    });
  };
  
  return { getCachedData };
};
```

### 12.2 批量操作

```typescript
// 批量数据获取
const fetchAllDEXData = async () => {
  const [tokenBal, usdcBal, lpBal, reserves, price] = await Promise.all([
    tokenContract.balanceOf(account),
    usdcContract.balanceOf(account),
    liquidityContract.balanceOf(account),
    liquidityContract.getReserves(),
    liquidityContract.getPrice()
  ]);
  
  return { tokenBal, usdcBal, lpBal, reserves, price };
};
```

---

## 总结

DEX交易功能通过以下核心组件实现：

1. **智能合约层**：LiquidityPool.sol 实现AMM机制
2. **前端组件**：DEXInterface.tsx 提供用户交互界面
3. **AMM算法**：基于恒定乘积公式 x*y=k
4. **安全机制**：重入保护、滑点保护、权限控制
5. **用户体验**：实时数据更新、预期输出计算

该系统支持添加/移除流动性、代币交换等完整的DEX功能，具有良好的安全性和用户体验。