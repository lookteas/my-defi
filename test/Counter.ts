import { expect } from "chai";
import { ethers } from "hardhat";
import { MyDeFiToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("MyDeFiToken Basic Tests", function () {
  let token: MyDeFiToken;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 部署 MyDeFiToken
    const MyDeFiToken = await ethers.getContractFactory("MyDeFiToken");
    token = await MyDeFiToken.deploy();
    await token.deployed();
  });

  describe("基础功能测试", function () {
    it("应该有正确的代币名称和符号", async function () {
      expect(await token.name()).to.equal("My DeFi Token");
      expect(await token.symbol()).to.equal("MD");
    });

    it("应该有正确的小数位数", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("应该有正确的初始供应量", async function () {
      const expectedSupply = ethers.utils.parseEther("10000000"); // 1000万
      expect(await token.totalSupply()).to.equal(expectedSupply);
    });

    it("部署者应该拥有所有初始代币", async function () {
      const totalSupply = await token.totalSupply();
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("应该能够转账代币", async function () {
      const transferAmount = ethers.utils.parseEther("1000");
      
      await token.transfer(user1.address, transferAmount);
      
      expect(await token.balanceOf(user1.address)).to.equal(transferAmount);
      expect(await token.balanceOf(owner.address)).to.equal(
        ethers.utils.parseEther("9999000") // 1000万 - 1000
      );
    });

    it("应该能够授权和转账", async function () {
      const approveAmount = ethers.utils.parseEther("500");
      const transferAmount = ethers.utils.parseEther("300");
      
      // 授权
      await token.approve(user1.address, approveAmount);
      expect(await token.allowance(owner.address, user1.address)).to.equal(approveAmount);
      
      // 代理转账
      await token.connect(user1).transferFrom(owner.address, user2.address, transferAmount);
      
      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
      expect(await token.allowance(owner.address, user1.address)).to.equal(
        approveAmount.sub(transferAmount)
      );
    });
  });

  describe("Mint 功能测试", function () {
    it("只有 owner 可以 mint 代币", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      
      await token.mint(user1.address, mintAmount);
      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
      
      const newTotalSupply = ethers.utils.parseEther("10001000"); // 1000万 + 1000
      expect(await token.totalSupply()).to.equal(newTotalSupply);
    });

    it("非 owner 不能 mint 代币", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      
      await expect(
        token.connect(user1).mint(user2.address, mintAmount)
      ).to.be.reverted;
    });
  });

  describe("Burn 功能测试", function () {
    it("用户可以销毁自己的代币", async function () {
      // 先给用户一些代币
      const transferAmount = ethers.utils.parseEther("1000");
      await token.transfer(user1.address, transferAmount);
      
      // 用户销毁代币
      const burnAmount = ethers.utils.parseEther("500");
      await token.connect(user1).burn(burnAmount);
      
      expect(await token.balanceOf(user1.address)).to.equal(
        transferAmount.sub(burnAmount)
      );
      
      const expectedTotalSupply = ethers.utils.parseEther("9999500"); // 1000万 - 500
      expect(await token.totalSupply()).to.equal(expectedTotalSupply);
    });

    it("不能销毁超过余额的代币", async function () {
      const burnAmount = ethers.utils.parseEther("1000");
      
      await expect(
        token.connect(user1).burn(burnAmount)
      ).to.be.reverted;
    });
  });

  describe("事件测试", function () {
    it("转账应该触发 Transfer 事件", async function () {
      const transferAmount = ethers.utils.parseEther("1000");
      
      await expect(token.transfer(user1.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, user1.address, transferAmount);
    });

    it("授权应该触发 Approval 事件", async function () {
      const approveAmount = ethers.utils.parseEther("500");
      
      await expect(token.approve(user1.address, approveAmount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, user1.address, approveAmount);
    });
  });

  describe("边界条件测试", function () {
    it("转账金额为 0 应该成功", async function () {
      await expect(token.transfer(user1.address, 0)).to.not.be.reverted;
    });

    it("授权金额为 0 应该成功", async function () {
      await expect(token.approve(user1.address, 0)).to.not.be.reverted;
    });

    it("不能转账超过余额的代币", async function () {
      const balance = await token.balanceOf(owner.address);
      const overAmount = balance.add(1);
      
      await expect(
        token.transfer(user1.address, overAmount)
      ).to.be.reverted;
    });
  });
});