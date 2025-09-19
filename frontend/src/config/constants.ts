// 网络配置常量
export const NETWORK_CONFIG = {
  // 本地开发网络
  LOCAL_RPC_URL: 'http://127.0.0.1:8545',
  LOCAL_CHAIN_ID: 31337,
  
  // 网络重试配置
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 毫秒
  
  // 交易配置
  DEFAULT_GAS_LIMIT: '300000',
  DEFAULT_GAS_PRICE: '20000000000', // 20 gwei
} as const;

// UI配置常量
export const UI_CONFIG = {
  // 默认显示值
  DEFAULT_BALANCE: '0',
  DEFAULT_APY: '12.50', // 设置更合理的默认APY
  DEFAULT_INTEREST_RATE: '5.0',
  
  // 数值格式化
  DECIMAL_PLACES: 4,
  PERCENTAGE_DECIMAL_PLACES: 2,
  
  // 刷新间隔
  DATA_REFRESH_INTERVAL: 10000, // 10秒
} as const;

// 合约交互配置
export const CONTRACT_CONFIG = {
  // 默认池ID
  DEFAULT_POOL_ID: 0,
  
  // 时间常量（用于APY计算）
  SECONDS_PER_YEAR: 365 * 24 * 3600,
  
  // 最小交易金额
  MIN_TRANSACTION_AMOUNT: '0.001',
} as const;

// 错误消息常量
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: '请先连接钱包',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TRANSACTION_FAILED: '交易失败，请重试',
  INSUFFICIENT_BALANCE: '余额不足',
  INVALID_AMOUNT: '请输入有效金额',
  CONTRACT_INTERACTION_FAILED: '合约交互失败',
} as const;

// 成功消息常量
export const SUCCESS_MESSAGES = {
  TRANSACTION_SUCCESS: '交易成功！',
  APPROVAL_SUCCESS: '授权成功！',
  STAKE_SUCCESS: '质押成功！',
  UNSTAKE_SUCCESS: '取消质押成功！',
  DEPOSIT_SUCCESS: '存款成功！',
  WITHDRAW_SUCCESS: '提取成功！',
  SWAP_SUCCESS: '交换成功！',
} as const;