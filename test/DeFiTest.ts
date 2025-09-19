import { expect } from "chai";
import { ethers } from "hardhat";
import { MyDeFiToken, LendingPool, LiquidityPool, YieldFarm } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("DeFi System", function () {
  let token: MyDeFiToken;
  let usdc: MyDeFiToken;
  let lendingPool: LendingPool;
  let liquidityPool: LiquidityPool;
  let yieldFarm: YieldFarm;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 部署 MyDeFiToken
    const MyDeFiToken = await ethers.getContractFactory("MyDeFiToken");
    token = await MyDeFiToken.deploy();
    await token.deployed();

    // 部署模拟 USDC
    usdc = await MyDeFiToken.deploy();
    await usdc.deployed();

    // 部署 LendingPool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPool.deploy(token.address);
    await lendingPool.deployed();

    // 部署 LiquidityPool
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy(
      token.address,
      usdc.address,
      "MD-USDC LP",
      "MD-USDC"
    );
    await liquidityPool.deployed();

    // 部署 YieldFarm
    const YieldFarm = await ethers.getContractFactory("YieldFarm");
    const rewardPerSecond = ethers.utils.parseEther("1");
    const startTime = Math.floor(Date.now() / 1000);
    yieldFarm = await YieldFarm.deploy(token.address, rewardPerSecond, startTime);
    await yieldFarm.deployed();

    // 给用户分发代币
    await token.transfer(user1.address, ethers.utils.parseEther("10000"));
    await token.transfer(user2.address, ethers.utils.parseEther("10000"));
    await usdc.transfer(user1.address, ethers.utils.parseEther("10000"));
    await usdc.transfer(user2.address, ethers.utils.parseEther("10000"));
  });

  describe("MyDeFiToken", function () {
    it("应该有正确的初始供应量", async function () {
      expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("10000000"));
    });

    it("应该允许 owner mint 代币", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      await token.mint(user1.address, mintAmount);
      expect(await token.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("11000"));
    });

    it("应该允许用户销毁自己的代币", async function () {
      const burnAmount = ethers.utils.parseEther("1000");
      await token.connect(user1).burn(burnAmount);
      expect(await token.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("9000"));
    });
  });

  describe("LendingPool", function () {
    beforeEach(async function () {
      // 用户1授权并存入代币
      await token.connect(user1).approve(lendingPool.address, ethers.utils.parseEther("5000"));
    });

    it("应该允许用户存入代币", async function () {
      const supplyAmount = ethers.utils.parseEther("1000");
      await lendingPool.connect(user1).supply(supplyAmount);
      
      const userInfo = await lendingPool.getUserInfo(user1.address);
      expect(userInfo.supplied).to.equal(supplyAmount);
    });

    it("应该允许用户借款", async function () {
      const supplyAmount = ethers.utils.parseEther("1000");
      const borrowAmount = ethers.utils.parseEther("500"); // 50% 抵押率
      
      await lendingPool.connect(user1).supply(supplyAmount);
      await lendingPool.connect(user1).borrow(borrowAmount);
      
      const userInfo = await lendingPool.getUserInfo(user1.address);
      expect(userInfo.borrowed).to.equal(borrowAmount);
    });

    it("应该防止过度借款", async function () {
      const supplyAmount = ethers.utils.parseEther("1000");
      const borrowAmount = ethers.utils.parseEther("800"); // 80% 抵押率，超过限制
      
      await lendingPool.connect(user1).supply(supplyAmount);
      await expect(lendingPool.connect(user1).borrow(borrowAmount))
        .to.be.revertedWith("Exceeds borrowing capacity");
    });
  });

  describe("LiquidityPool", function () {
    beforeEach(async function () {
      // 授权代币
      await token.connect(user1).approve(liquidityPool.address, ethers.utils.parseEther("5000"));
      await usdc.connect(user1).approve(liquidityPool.address, ethers.utils.parseEther("5000"));
    });

    it("应该允许添加流动性", async function () {
      const amountA = ethers.utils.parseEther("1000");
      const amountB = ethers.utils.parseEther("1000");
      
      await liquidityPool.connect(user1).addLiquidity(amountA, amountB, amountA, amountB);
      
      expect(await liquidityPool.reserveA()).to.equal(amountA);
      expect(await liquidityPool.reserveB()).to.equal(amountB);
      expect(await liquidityPool.balanceOf(user1.address)).to.be.gt(0);
    });

    it("应该允许代币交换", async function () {
      // 先添加流动性
      const amountA = ethers.utils.parseEther("1000");
      const amountB = ethers.utils.parseEther("1000");
      await liquidityPool.connect(user1).addLiquidity(amountA, amountB, amountA, amountB);
      
      // 用户2进行交换
      await token.connect(user2).approve(liquidityPool.address, ethers.utils.parseEther("100"));
      const swapAmount = ethers.utils.parseEther("100");
      const expectedOut = await liquidityPool.getAmountOut(swapAmount, amountA, amountB);
      
      await liquidityPool.connect(user2).swapAForB(swapAmount, expectedOut);
      
      expect(await usdc.balanceOf(user2.address)).to.be.gt(ethers.utils.parseEther("10000"));
    });
  });

  describe("YieldFarm", function () {
    beforeEach(async function () {
      // 设置流动性池
      await token.connect(user1).approve(liquidityPool.address, ethers.utils.parseEther("1000"));
      await usdc.connect(user1).approve(liquidityPool.address, ethers.utils.parseEther("1000"));
      await liquidityPool.connect(user1).addLiquidity(
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("1000")
      );
      
      // 添加池子到 YieldFarm
      await yieldFarm.addPool(100, liquidityPool.address);
      
      // 为 YieldFarm 提供奖励代币
      await token.transfer(yieldFarm.address, ethers.utils.parseEther("10000"));
    });

    it("应该允许质押 LP 代币", async function () {
      const lpBalance = await liquidityPool.balanceOf(user1.address);
      await liquidityPool.connect(user1).approve(yieldFarm.address, lpBalance);
      
      await yieldFarm.connect(user1).deposit(0, lpBalance);
      
      const userInfo = await yieldFarm.userInfo(0, user1.address);
      expect(userInfo.amount).to.equal(lpBalance);
    });

    it("应该计算待领取奖励", async function () {
      const lpBalance = await liquidityPool.balanceOf(user1.address);
      await liquidityPool.connect(user1).approve(yieldFarm.address, lpBalance);
      await yieldFarm.connect(user1).deposit(0, lpBalance);
      
      // 等待一些时间
      await ethers.provider.send("evm_increaseTime", [3600]); // 1小时
      await ethers.provider.send("evm_mine", []);
      
      const pendingReward = await yieldFarm.pendingReward(0, user1.address);
      expect(pendingReward).to.be.gt(0);
    });
  });

  describe("集成测试", function () {
    it("应该支持完整的 DeFi 流程", async function () {
      // 1. 用户添加流动性
      await token.connect(user1).approve(liquidityPool.address, ethers.utils.parseEther("1000"));
      await usdc.connect(user1).approve(liquidityPool.address, ethers.utils.parseEther("1000"));
      await liquidityPool.connect(user1).addLiquidity(
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("1000"),
        ethers.utils.parseEther("1000")
      );
      
      // 2. 设置 YieldFarm
      await yieldFarm.addPool(100, liquidityPool.address);
      await token.transfer(yieldFarm.address, ethers.utils.parseEther("10000"));
      
      // 3. 质押 LP 代币到 YieldFarm
      const lpBalance = await liquidityPool.balanceOf(user1.address);
      await liquidityPool.connect(user1).approve(yieldFarm.address, lpBalance);
      await yieldFarm.connect(user1).deposit(0, lpBalance);
      
      // 4. 用户2在借贷池存款
      await token.connect(user2).approve(lendingPool.address, ethers.utils.parseEther("2000"));
      await lendingPool.connect(user2).supply(ethers.utils.parseEther("2000"));
      
      // 5. 用户2借款
      await lendingPool.connect(user2).borrow(ethers.utils.parseEther("1000"));
      
      // 验证所有操作都成功
      expect(await yieldFarm.userInfo(0, user1.address).then(info => info.amount)).to.equal(lpBalance);
      expect(await lendingPool.getUserInfo(user2.address).then(info => info.supplied)).to.equal(ethers.utils.parseEther("2000"));
      expect(await lendingPool.getUserInfo(user2.address).then(info => info.borrowed)).to.equal(ethers.utils.parseEther("1000"));
    });
  });
});