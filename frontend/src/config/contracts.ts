// 合约地址配置
export const CONTRACT_ADDRESSES = {
  MyDeFiToken: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
  MockUSDC: "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8",
  LendingPool: "0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9",
  LiquidityPool: "0x851356ae760d987E095750cCeb3bC6014560891C",
  YieldFarm: "0xf5059a5D33d5853360D16C683c16e67980206f36"
};

// 新的合约地址配置（与CONTRACT_ADDRESSES相同，为了兼容性）
export const CONTRACTS = CONTRACT_ADDRESSES;

// 网络配置
export const NETWORK_CONFIG = {
  chainId: 31337,
  name: "Hardhat Local",
  rpcUrl: "http://127.0.0.1:8545",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18
  },
  blockExplorerUrls: null
};

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
  "function addLiquidity(uint256 tokenAmount, uint256 usdcAmount)",
  "function removeLiquidity(uint256 liquidity)",
  "function swapTokenForUSDC(uint256 tokenAmount)",
  "function swapUSDCForToken(uint256 usdcAmount)",
  "function getReserves() view returns (uint256, uint256)",
  "function getPrice() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "event AddLiquidity(address indexed provider, uint256 tokenAmount, uint256 usdcAmount)",
  "event RemoveLiquidity(address indexed provider, uint256 liquidity)",
  "event Swap(address indexed user, uint256 amountIn, uint256 amountOut)"
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