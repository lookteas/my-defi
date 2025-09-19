// 主要类型定义

// 钱包相关类型
export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  balance: string;
}

// 代币信息类型
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
}

// 交易类型
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

// DEX 相关类型
export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  to: string;
  deadline: number;
}

export interface LiquidityParams {
  tokenA: string;
  tokenB: string;
  amountADesired: string;
  amountBDesired: string;
  amountAMin: string;
  amountBMin: string;
  to: string;
  deadline: number;
}

// 借贷相关类型
export interface LendingPool {
  asset: string;
  totalSupply: string;
  totalBorrow: string;
  supplyAPY: string;
  borrowAPY: string;
  utilizationRate: string;
}

export interface UserLendingInfo {
  supplied: string;
  borrowed: string;
  collateral: string;
  healthFactor: string;
}

// 流动性挖矿相关类型
export interface FarmPool {
  id: number;
  lpToken: string;
  rewardToken: string;
  totalStaked: string;
  rewardRate: string;
  apy: string;
  userStaked: string;
  pendingRewards: string;
}

// 网络配置类型
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// 合约配置类型
export interface ContractConfig {
  address: string;
  abi: any[];
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 表单状态类型
export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// 通用组件 Props 类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 模态框 Props 类型
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

// 按钮 Props 类型
export interface ButtonProps extends BaseComponentProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

// 输入框 Props 类型
export interface InputProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  type?: 'text' | 'number' | 'password';
}