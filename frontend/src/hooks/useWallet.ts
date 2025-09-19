import { useState, useEffect, useCallback } from 'react';
import { ethers, formatEther, parseEther, BrowserProvider } from 'ethers';
import { NETWORK_CONFIG } from '../config/contracts';

interface WalletState {
  account: string | null;
  provider: BrowserProvider | null;
  signer: ethers.Signer | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    account: null,
    provider: null,
    signer: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
  });

  // 检查是否已连接钱包
  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          
          setWalletState({
            account: accounts[0].address,
            provider,
            signer,
            isConnected: true,
            isConnecting: false,
            chainId: Number(network.chainId),
          });
        }
      } catch (error) {
        console.error('检查钱包连接失败:', error);
      }
    }
  }, []);

  // 连接钱包
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('请安装 MetaMask!');
      return;
    }

    try {
      setWalletState(prev => ({ ...prev, isConnecting: true }));

      // 请求账户访问
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('没有可用的账户');
      }

      const account = accounts[0];
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      console.log('当前网络 chainId:', network.chainId);
      console.log('期望网络 chainId:', NETWORK_CONFIG.chainId);

      // 检查网络是否正确
      if (Number(network.chainId) !== NETWORK_CONFIG.chainId) {
        console.log('网络不匹配，尝试切换到本地网络...');
        
        try {
          // 尝试切换到本地网络
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
          });
          console.log('网络切换成功');
        } catch (switchError: any) {
          console.log('切换网络失败:', switchError);
          
          // 如果网络不存在，添加网络
          if (switchError.code === 4902) {
            console.log('网络不存在，尝试添加网络...');
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
                  chainName: NETWORK_CONFIG.name,
                  rpcUrls: [NETWORK_CONFIG.rpcUrl],
                  nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                  blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls,
                }],
              });
              console.log('网络添加成功');
            } catch (addError) {
              console.error('添加网络失败:', addError);
              throw addError;
            }
          } else {
            throw switchError;
          }
        }
        
        // 重新获取网络信息
        const updatedNetwork = await provider.getNetwork();
        console.log('更新后的网络 chainId:', updatedNetwork.chainId);
      }

      setWalletState({
        account,
        provider,
        signer,
        isConnected: true,
        isConnecting: false,
        chainId: Number(network.chainId),
      });

    } catch (error) {
      console.error('连接钱包失败:', error);
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  }, []);

  // 断开钱包连接
  const disconnectWallet = useCallback(() => {
    setWalletState({
      account: null,
      provider: null,
      signer: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
    });
  }, []);

  // 监听账户和网络变化
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkConnection();
        }
      };

      const handleChainChanged = () => {
        checkConnection();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // 初始检查连接状态
      checkConnection();

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [checkConnection, disconnectWallet]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
};

// 扩展 Window 接口以包含 ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}