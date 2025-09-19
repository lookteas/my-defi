// ERC20 代币 ABI（简化版）
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// MyDeFiToken ABI（包含 mint/burn 功能）
export const MYDEFI_TOKEN_ABI = [
  ...ERC20_ABI,
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function owner() view returns (address)"
];

// LendingPool ABI
export const LENDING_POOL_ABI = [
  "function supply(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function borrow(uint256 amount)",
  "function repay(uint256 amount)",
  "function users(address user) view returns (uint256 supplied, uint256 borrowed, uint256 lastUpdateTime)",
  "function getUserInfo(address user) view returns (uint256 supplied, uint256 borrowed, uint256 availableToWithdraw)",
  "function getAvailableToWithdraw(address user) view returns (uint256)",
  "function totalSupplied() view returns (uint256)",
  "function totalBorrowed() view returns (uint256)",
  "event Supply(address indexed user, uint256 amount)",
  "event Withdraw(address indexed user, uint256 amount)",
  "event Borrow(address indexed user, uint256 amount)",
  "event Repay(address indexed user, uint256 amount)"
];

// LiquidityPool ABI
export const LIQUIDITY_POOL_ABI = [
  "function addLiquidity(uint256 amountADesired, uint256 amountBDesired) returns (uint256 amountA, uint256 amountB, uint256 liquidity)",
  "function removeLiquidity(uint256 liquidity, uint256 amountAMin, uint256 amountBMin) returns (uint256 amountA, uint256 amountB)",
  "function swapAForB(uint256 amountAIn, uint256 amountBOutMin)",
  "function swapBForA(uint256 amountBIn, uint256 amountAOutMin)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256)",
  "function getReserves() view returns (uint256, uint256)",
  "function getPrice() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function reserveA() view returns (uint256)",
  "function reserveB() view returns (uint256)",
  "event AddLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity)",
  "event RemoveLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity)",
  "event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut)"
];

// YieldFarm ABI
export const YIELD_FARM_ABI = [
  "function deposit(uint256 pid, uint256 amount)",
  "function withdraw(uint256 pid, uint256 amount)",
  "function harvest(uint256 pid)",
  "function pendingReward(uint256 pid, address user) view returns (uint256)",
  "function userInfo(uint256 pid, address user) view returns (uint256 amount, uint256 rewardDebt, uint256 pendingRewards, uint256 lastUpdateTime)",
  "function poolInfo(uint256 pid) view returns (address lpToken, uint256 allocPoint, uint256 lastRewardTime, uint256 accRewardPerShare, uint256 totalStaked)",
  "function poolLength() view returns (uint256)",
  "function rewardPerSecond() view returns (uint256)",
  "event Deposit(address indexed user, uint256 indexed pid, uint256 amount)",
  "event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)",
  "event Harvest(address indexed user, uint256 indexed pid, uint256 amount)"
];