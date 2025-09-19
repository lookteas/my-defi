// 应用常量定义

// 网络相关常量
export const NETWORK_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  3: 'Ropsten Testnet',
  4: 'Rinkeby Testnet',
  5: 'Goerli Testnet',
  42: 'Kovan Testnet',
  31337: 'Localhost',
  1337: 'Ganache',
};

// 支持的网络ID
export const SUPPORTED_CHAIN_IDS = [1, 31337, 1337];

// 默认网络配置
export const DEFAULT_CHAIN_ID = 31337;

// 代币符号
export const TOKEN_SYMBOLS = {
  MDT: 'MDT',
  USDC: 'USDC',
  ETH: 'ETH',
  LP: 'LP',
} as const;

// 交易状态
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

// 默认小数位数
export const DEFAULT_DECIMALS = {
  TOKEN: 4,
  PERCENTAGE: 2,
  CURRENCY: 2,
} as const;

// 刷新间隔（毫秒）
export const REFRESH_INTERVALS = {
  BALANCE: 30000, // 30秒
  FARM_INFO: 60000, // 1分钟
  LENDING_INFO: 45000, // 45秒
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: '请先连接钱包',
  INSUFFICIENT_BALANCE: '余额不足',
  INVALID_AMOUNT: '请输入有效金额',
  TRANSACTION_FAILED: '交易失败',
  NETWORK_ERROR: '网络错误',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  TRANSACTION_SUCCESS: '交易成功',
  WALLET_CONNECTED: '钱包连接成功',
  WALLET_DISCONNECTED: '钱包已断开连接',
} as const;