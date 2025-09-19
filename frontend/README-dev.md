# 开发指南

## 编译错误检测工具

为了解决"Compiled with problems"报错检测不到的问题，我们创建了以下工具：

### 1. 编译检查脚本
- **文件**: `check-compile.ps1`
- **用途**: 手动检查TypeScript编译错误
- **使用方法**: 
  ```bash
  .\check-compile.ps1
  # 或者
  npm run check-compile
  ```

### 2. NPM脚本命令
- `npm run check`: 快速TypeScript编译检查
- `npm run check-compile`: 完整的编译检查（使用PowerShell脚本）

### 3. VSCode设置
- **文件**: `.vscode/settings.json`
- **功能**: 启用实时TypeScript检查和自动修复

## 预防变量/函数未定义错误的最佳实践

1. **在修改代码前先查看文件结构**
   ```bash
   # 查看变量定义
   npm run check
   ```

2. **使用VSCode的智能提示**
   - 确保VSCode显示类型错误
   - 使用Ctrl+Space查看可用变量

3. **定期运行编译检查**
   ```bash
   npm run check-compile
   ```

## 常见问题解决

### "Compiled with problems"检测不到的原因
1. npm start的输出缓冲机制
2. 终端输出获取限制
3. 异步编译过程

### 解决方案
- 使用 `npm run check-compile` 主动检查
- 配置VSCode实时错误检测
- 在修改代码后立即运行检查

## 工作流程建议

1. 修改代码前：运行 `npm run check`
2. 修改代码后：运行 `npm run check-compile`
3. 提交代码前：确保所有检查通过