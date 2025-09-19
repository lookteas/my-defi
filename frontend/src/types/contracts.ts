// 合约相关类型定义

import { Contract } from 'ethers';

// 合约实例类型
export interface ContractInstances {
  myDefiToken: Contract;
  dexRouter: Contract;
  lendingPool: Contract;
  yieldFarm: Contract;
}

// 合约地址配置
export interface ContractAddresses {
  MYDEFI_TOKEN: string;
  DEX_ROUTER: string;
  LENDING_POOL: string;
  YIELD_FARM: string;
  USDC_TOKEN: string;
}

// DEX Router 合约方法类型
export interface DEXRouterMethods {
  swapExactTokensForTokens: (
    amountIn: string,
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: number
  ) => Promise<any>;
  
  addLiquidity: (
    tokenA: string,
    tokenB: string,
    amountADesired: string,
    amountBDesired: string,
    amountAMin: string,
    amountBMin: string,
    to: string,
    deadline: number
  ) => Promise<any>;
  
  removeLiquidity: (
    tokenA: string,
    tokenB: string,
    liquidity: string,
    amountAMin: string,
    amountBMin: string,
    to: string,
    deadline: number
  ) => Promise<any>;
  
  getAmountsOut: (amountIn: string, path: string[]) => Promise<string[]>;
}

// Lending Pool 合约方法类型
export interface LendingPoolMethods {
  supply: (asset: string, amount: string, onBehalfOf: string) => Promise<any>;
  withdraw: (asset: string, amount: string, to: string) => Promise<any>;
  borrow: (asset: string, amount: string, onBehalfOf: string) => Promise<any>;
  repay: (asset: string, amount: string, onBehalfOf: string) => Promise<any>;
  getUserAccountData: (user: string) => Promise<{
    totalCollateralETH: string;
    totalDebtETH: string;
    availableBorrowsETH: string;
    currentLiquidationThreshold: string;
    ltv: string;
    healthFactor: string;
  }>;
  getReserveData: (asset: string) => Promise<{
    liquidityRate: string;
    variableBorrowRate: string;
    utilizationRate: string;
  }>;
}

// Yield Farm 合约方法类型
export interface YieldFarmMethods {
  stake: (poolId: number, amount: string) => Promise<any>;
  unstake: (poolId: number, amount: string) => Promise<any>;
  harvest: (poolId: number) => Promise<any>;
  getPoolInfo: (poolId: number) => Promise<{
    lpToken: string;
    allocPoint: string;
    lastRewardBlock: string;
    accRewardPerShare: string;
  }>;
  getUserInfo: (poolId: number, user: string) => Promise<{
    amount: string;
    rewardDebt: string;
  }>;
  pendingReward: (poolId: number, user: string) => Promise<string>;
}

// ERC20 代币合约方法类型
export interface ERC20Methods {
  balanceOf: (account: string) => Promise<string>;
  allowance: (owner: string, spender: string) => Promise<string>;
  approve: (spender: string, amount: string) => Promise<any>;
  transfer: (to: string, amount: string) => Promise<any>;
  transferFrom: (from: string, to: string, amount: string) => Promise<any>;
  totalSupply: () => Promise<string>;
  decimals: () => Promise<number>;
  symbol: () => Promise<string>;
  name: () => Promise<string>;
}

// 合约事件类型
export interface ContractEvents {
  Transfer: {
    from: string;
    to: string;
    value: string;
  };
  
  Approval: {
    owner: string;
    spender: string;
    value: string;
  };
  
  Swap: {
    sender: string;
    amount0In: string;
    amount1In: string;
    amount0Out: string;
    amount1Out: string;
    to: string;
  };
  
  Supply: {
    user: string;
    asset: string;
    amount: string;
  };
  
  Withdraw: {
    user: string;
    asset: string;
    amount: string;
  };
  
  Stake: {
    user: string;
    poolId: number;
    amount: string;
  };
  
  Unstake: {
    user: string;
    poolId: number;
    amount: string;
  };
  
  Harvest: {
    user: string;
    poolId: number;
    amount: string;
  };
}

// 合约调用选项类型
export interface ContractCallOptions {
  gasLimit?: string;
  gasPrice?: string;
  value?: string;
  from?: string;
}