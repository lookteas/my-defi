// 验证工具函数

/**
 * 验证以太坊地址格式
 * @param address 地址字符串
 * @returns 是否为有效地址
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * 验证数字输入
 * @param value 输入值
 * @param min 最小值
 * @param max 最大值
 * @returns 是否为有效数字
 */
export const isValidNumber = (
  value: string | number, 
  min: number = 0, 
  max?: number
): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};

/**
 * 验证金额输入
 * @param amount 金额字符串
 * @param balance 可用余额
 * @returns 验证结果
 */
export const validateAmount = (
  amount: string, 
  balance: string
): { isValid: boolean; error?: string } => {
  if (!amount || amount === '0') {
    return { isValid: false, error: '请输入有效金额' };
  }

  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(balance);

  if (isNaN(amountNum) || amountNum <= 0) {
    return { isValid: false, error: '金额必须大于0' };
  }

  if (amountNum > balanceNum) {
    return { isValid: false, error: '余额不足' };
  }

  return { isValid: true };
};

/**
 * 验证百分比输入
 * @param percentage 百分比字符串
 * @returns 是否为有效百分比
 */
export const isValidPercentage = (percentage: string | number): boolean => {
  const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  return !isNaN(num) && num >= 0 && num <= 100;
};

/**
 * 验证交易哈希格式
 * @param hash 交易哈希
 * @returns 是否为有效交易哈希
 */
export const isValidTransactionHash = (hash: string): boolean => {
  if (!hash) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * 验证私钥格式
 * @param privateKey 私钥字符串
 * @returns 是否为有效私钥
 */
export const isValidPrivateKey = (privateKey: string): boolean => {
  if (!privateKey) return false;
  // 移除0x前缀（如果有）
  const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  return /^[a-fA-F0-9]{64}$/.test(key);
};

/**
 * 验证网络ID
 * @param chainId 网络ID
 * @param supportedChainIds 支持的网络ID列表
 * @returns 是否为支持的网络
 */
export const isValidChainId = (
  chainId: number, 
  supportedChainIds: number[]
): boolean => {
  return supportedChainIds.includes(chainId);
};