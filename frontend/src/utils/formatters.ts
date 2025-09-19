// 格式化工具函数

/**
 * 格式化钱包地址显示
 * @param address 完整地址
 * @param startLength 开头显示长度
 * @param endLength 结尾显示长度
 * @returns 格式化后的地址
 */
export const formatAddress = (
  address: string, 
  startLength: number = 6, 
  endLength: number = 4
): string => {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * 格式化数字显示
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的数字字符串
 */
export const formatNumber = (value: string | number, decimals: number = 4): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
};

/**
 * 格式化百分比显示
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export const formatPercentage = (value: string | number, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
};

/**
 * 格式化货币显示
 * @param value 数值
 * @param symbol 货币符号
 * @param decimals 小数位数
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (
  value: string | number, 
  symbol: string = 'USD', 
  decimals: number = 2
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return `0 ${symbol}`;
  return `${num.toFixed(decimals)} ${symbol}`;
};

/**
 * 格式化大数字显示（K, M, B）
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的数字字符串
 */
export const formatLargeNumber = (value: string | number, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(decimals)}K`;
  }
  
  return num.toFixed(decimals);
};