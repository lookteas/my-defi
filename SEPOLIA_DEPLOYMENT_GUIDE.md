# Sepolia 测试网部署指南

## 📋 概述

项目部署到 Sepolia 测试网络。请按照以下步骤逐步操作。

---

## 🔧 1. 环境准备

### 1.1 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件，填入以下信息：

```bash
# Sepolia Network Configuration
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY

# Etherscan API Key for contract verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Gas Reporter
REPORT_GAS=true
```

### 1.2 获取必要的API密钥

#### Infura项目ID
1. 访问 [Infura官网](https://infura.io/)
2. 注册并创建新项目
3. 选择 "Web3 API"
4. 复制项目ID替换 `YOUR_INFURA_PROJECT_ID`

#### 钱包私钥
1. 打开MetaMask钱包
2. 点击账户详情 → 导出私钥
3. 输入密码获取私钥
4. 复制私钥替换 `YOUR_WALLET_PRIVATE_KEY`

⚠️ **安全提醒**: 私钥非常重要，请妥善保管，不要泄露给他人！

#### Etherscan API密钥（用于合约验证）
1. 访问 [Etherscan官网](https://etherscan.io/)
2. 注册账户并登录
3. 进入 API Keys 页面创建新的API密钥
4. 复制API密钥替换 `YOUR_ETHERSCAN_API_KEY`

### 1.3 获取测试ETH

访问以下任一水龙头获取Sepolia测试ETH：
- [Sepolia水龙头](https://sepoliafaucet.com/)
- [Alchemy水龙头](https://sepoliafaucet.com/)
- [Chainlink水龙头](https://faucets.chain.link/)

**建议获取至少 0.1 ETH 用于部署和测试**

---

## 🚀 2. 部署合约

### 2.1 编译合约

```bash
npx hardhat compile
```

预期输出：
```
Compiled 5 Solidity files successfully
```

### 2.2 部署到Sepolia网络

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

部署过程中会看到类似输出：
```
开始部署 DeFi 合约...
部署账户: 0x...
账户余额: 0.1 ETH

1. 部署 MyDeFiToken...
MyDeFiToken 部署地址: 0x...

2. 部署 LendingPool...
LendingPool 部署地址: 0x...

3. 部署模拟 USDC 代币...
Mock USDC 部署地址: 0x...

4. 部署 LiquidityPool (MD/USDC)...
LiquidityPool 部署地址: 0x...

5. 部署 YieldFarm...
YieldFarm 部署地址: 0x...

=== 部署完成 ===
合约地址已保存到 deployed-addresses.json
```

### 2.3 验证部署结果

检查 `deployed-addresses.json` 文件，确认包含所有合约地址：
```json
{
  "MyDeFiToken": "0x...",
  "MockUSDC": "0x...",
  "LendingPool": "0x...",
  "LiquidityPool": "0x...",
  "YieldFarm": "0x...",
  "deployer": "0x...",
  "network": {
    "chainId": 11155111,
    "name": "sepolia"
  },
  "timestamp": "2025-01-XX..."
}
```

---

## ✅ 3. 合约验证（推荐）

合约验证可以让用户在Etherscan上查看合约源代码，增加透明度和信任度。

### 3.1 验证MyDeFiToken合约

```bash
npx hardhat verify --network sepolia <MyDeFiToken_ADDRESS>
```

### 3.2 验证LendingPool合约

```bash
npx hardhat verify --network sepolia <LendingPool_ADDRESS> <MyDeFiToken_ADDRESS>
```

### 3.3 验证LiquidityPool合约

```bash
npx hardhat verify --network sepolia <LiquidityPool_ADDRESS> <MyDeFiToken_ADDRESS> <MockUSDC_ADDRESS> "MD-USDC LP Token" "MD-USDC-LP"
```

### 3.4 验证YieldFarm合约

```bash
npx hardhat verify --network sepolia <YieldFarm_ADDRESS> <MyDeFiToken_ADDRESS> <REWARD_PER_SECOND> <START_TIME>
```

**注意**: 将 `<ADDRESS>` 替换为实际的合约地址，可以从 `deployed-addresses.json` 文件中获取。

---

## 🔧 4. 更新前端配置

### 4.1 更新合约地址配置

编辑 `frontend/src/config/contracts.ts` 文件：

```typescript
// 合约地址配置
export const CONTRACT_ADDRESSES = {
  MyDeFiToken: "0x新的Sepolia地址",
  MockUSDC: "0x新的Sepolia地址",
  LendingPool: "0x新的Sepolia地址",
  LiquidityPool: "0x新的Sepolia地址",
  YieldFarm: "0x新的Sepolia地址"
};
```

### 4.2 更新网络配置

在同一文件中更新网络配置：

```typescript
// 网络配置
export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia Chain ID
  name: "Sepolia Test Network",
  rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18
  },
  blockExplorerUrls: ["https://sepolia.etherscan.io"]
};
```

---

## 🧪 5. 测试部署

### 5.1 启动前端应用

```bash
cd frontend
npm start
```

前端应用将在 `http://localhost:3000` 启动。

### 5.2 配置MetaMask

1. 打开MetaMask扩展
2. 点击网络下拉菜单
3. 选择 "Sepolia test network"
4. 如果没有Sepolia网络，点击"添加网络"手动添加：
   - 网络名称: Sepolia Test Network
   - RPC URL: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   - 链ID: 11155111
   - 货币符号: ETH
   - 区块浏览器: https://sepolia.etherscan.io

### 5.3 测试应用功能

按以下顺序测试各项功能：

1. **钱包连接**
   - 点击"连接钱包"按钮
   - 确认MetaMask连接请求
   - 验证钱包地址显示正确

2. **代币管理**
   - 查看代币余额
   - 测试代币转账功能
   - 测试代币铸造功能（如果有权限）

3. **借贷功能**
   - 测试存款操作
   - 测试提取操作
   - 查看借贷信息

4. **DEX交易**
   - 测试添加流动性
   - 测试代币交换
   - 查看流动性池信息

5. **流动性挖矿**
   - 测试质押LP代币
   - 测试收获奖励
   - 查看挖矿收益

---

## 💰 6. 为用户提供测试代币（可选）

如果需要为其他用户提供测试代币进行测试：

### 6.1 修改资金脚本

编辑 `scripts/fund-wallet.ts` 文件，将第12行的钱包地址替换为目标地址：

```typescript
const newWalletAddress = "0x目标钱包地址";
```

### 6.2 执行资金转移

```bash
npx hardhat run scripts/fund-wallet.ts --network sepolia
```

这将向目标钱包转移：
- 10 ETH（用于Gas费）
- 1000 MD代币
- 1000 模拟USDC代币

---

## 🔍 7. 验证部署状态

### 7.1 在Etherscan上检查合约

1. 访问 [Sepolia Etherscan](https://sepolia.etherscan.io)
2. 搜索各个合约地址
3. 验证合约代码已验证（显示绿色✅）
4. 检查合约余额和交易历史

### 7.2 检查前端连接状态

1. 确认前端能正确连接到Sepolia网络
2. 验证合约地址配置正确
3. 测试所有功能模块正常工作
4. 检查交易能正常执行并在Etherscan上可见

---

## ⚠️ 8. 注意事项和最佳实践

### 8.1 安全注意事项

- **私钥安全**: 不要将私钥提交到代码仓库或分享给他人
- **环境变量**: 确保 `.env` 文件在 `.gitignore` 中
- **测试网络**: 仅在测试网络使用测试私钥，不要使用主网私钥
- **权限管理**: 确认合约权限设置正确

### 8.2 性能和成本

- **Gas费用**: Sepolia网络Gas费用较低，但仍需准备足够ETH
- **网络延迟**: Sepolia出块时间约12秒，交易确认需要等待
- **并发限制**: 避免同时发送大量交易

### 8.3 测试建议

- **功能测试**: 在主网部署前务必在测试网充分测试
- **边界测试**: 测试极端情况和错误处理
- **用户体验**: 从用户角度测试完整流程
- **性能测试**: 测试高负载情况下的表现

---

## 🛠️ 9. 故障排除

### 9.1 常见问题

#### 部署失败
```bash
Error: insufficient funds for gas * price + value
```
**解决方案**: 确保钱包中有足够的ETH

#### 网络连接问题
```bash
Error: could not detect network
```
**解决方案**: 检查RPC URL和网络配置

#### 合约验证失败
```bash
Error: Contract source code already verified
```
**解决方案**: 合约已经验证过，可以忽略此错误

### 9.2 调试步骤

1. **检查环境变量**: 确认 `.env` 文件配置正确
2. **验证网络连接**: 测试RPC端点是否可访问
3. **检查余额**: 确认钱包有足够的ETH
4. **查看日志**: 检查Hardhat和前端控制台输出
5. **验证配置**: 确认合约地址和网络配置正确

### 9.3 获取帮助

如果遇到问题，可以：
- 查看Hardhat官方文档
- 搜索相关错误信息
- 在项目GitHub仓库提交Issue
- 联系技术支持团队

---

## 🎉 10. 部署完成检查清单

完成部署后，请确认以下项目：

- [ ] 所有合约成功部署到Sepolia网络
- [ ] 合约地址已保存到 `deployed-addresses.json`
- [ ] 合约在Etherscan上已验证
- [ ] 前端配置已更新为Sepolia网络
- [ ] 前端应用能正常连接和交互
- [ ] 所有功能模块测试通过
- [ ] 用户可以正常使用所有DeFi功能
- [ ] 交易记录在Etherscan上可见
- [ ] 项目文档已更新部署信息

---

## 📚 相关资源

- [Sepolia测试网信息](https://sepolia.dev/)
- [Sepolia Etherscan](https://sepolia.etherscan.io)
- [MetaMask使用指南](https://metamask.io/faqs/)
- [Hardhat部署文档](https://hardhat.org/tutorial/deploying-to-a-live-network.html)
- [Etherscan合约验证](https://docs.etherscan.io/tutorials/verifying-contracts-programmatically)

---

