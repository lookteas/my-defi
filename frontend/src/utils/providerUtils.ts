import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/constants';

/**
 * 获取可用的Provider
 * 优先使用当前连接的provider，失败时回退到本地provider
 */
export const getAvailableProvider = async (
  currentProvider?: ethers.BrowserProvider
): Promise<ethers.BrowserProvider | ethers.JsonRpcProvider> => {
  // 如果没有提供currentProvider，直接返回本地provider
  if (!currentProvider) {
    return new ethers.JsonRpcProvider(NETWORK_CONFIG.LOCAL_RPC_URL);
  }

  try {
    // 测试当前provider是否可用
    await currentProvider.getNetwork();
    return currentProvider;
  } catch (error) {
    console.log('当前provider连接失败，使用本地provider');
    return new ethers.JsonRpcProvider(NETWORK_CONFIG.LOCAL_RPC_URL);
  }
};

/**
 * 安全地执行合约调用，带有重试机制
 */
export const safeContractCall = async <T>(
  contractCall: () => Promise<T>,
  defaultValue: T,
  retries: number = NETWORK_CONFIG.MAX_RETRIES
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await contractCall();
    } catch (error) {
      console.warn(`合约调用失败 (尝试 ${i + 1}/${retries}):`, error);
      
      if (i === retries - 1) {
        // 最后一次尝试失败，返回默认值
        console.error('所有重试都失败，返回默认值');
        return defaultValue;
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, NETWORK_CONFIG.RETRY_DELAY));
    }
  }
  
  return defaultValue;
};

/**
 * 格式化以太坊地址显示
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * 示例合约调用函数
 */
export const getPoolInfo = async (farmContract: any, poolId: number) => {
  return await safeContractCall(() => farmContract.poolInfo(poolId), [ethers.ZeroAddress, BigInt(0), BigInt(0), BigInt(0), BigInt(0)]);
};

/**
 * 格式化数值显示
 */
export const formatNumber = (
  value: string | number, 
  decimals: number = 4
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
};