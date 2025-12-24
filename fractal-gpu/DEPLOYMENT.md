# 部署指南

## 方法1: 直接部署静态文件（推荐）

### 步骤1: 准备文件
所有需要的文件都在当前目录中：
- `index.html` - 主页面
- `main.js` - WebGL主程序
- `parser.js` - 多项式解析器
- `index.js` - 入口文件
- `shaders/fractal.frag` - GLSL着色器

### 步骤2: 上传到GitHub Pages

#### 选项A: 使用GitHub Desktop
1. 在GitHub上创建新仓库
2. 使用GitHub Desktop克隆仓库到本地
3. 将所有文件复制到仓库目录
4. 提交并推送到GitHub
5. 在GitHub仓库设置中启用GitHub Pages
6. 选择分支和根目录作为源

#### 选项B: 使用命令行
```bash
# 初始化git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: GPU Newton Fractal"

# 添加远程仓库（替换为你的仓库URL）
git remote add origin https://github.com/yourusername/fractal-gpu.git

# 推送
git push -u origin main
```

### 步骤3: 启用GitHub Pages
1. 进入GitHub仓库的Settings页面
2. 找到Pages部分
3. 选择Source为Deploy from a branch
4. 选择main分支和/(root)目录
5. 点击Save
6. 等待几分钟，你的站点将在 `https://yourusername.github.io/fractal-gpu/` 可用

## 方法2: 使用Vite构建（高级）

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问 `http://localhost:3000`

### 构建生产版本
```bash
npm run build
```
输出文件在 `dist/` 目录中

### 部署到GitHub Pages
```bash
npm run deploy
```

## 方法3: 本地测试

### 使用Python服务器
```bash
python3 simple-server.py
```
访问 `http://localhost:8080`

### 使用Node.js服务器
```bash
npx serve .
```

## 验证部署

1. 打开浏览器访问部署的URL
2. 应该看到左侧控制面板和右侧黑色画布
3. 点击"重新渲染"按钮，应该看到分形图案
4. 尝试拖拽和缩放，应该能交互
5. 尝试不同的预设分形

## 常见问题

### 1. WebGL2不支持
- 确保使用现代浏览器（Chrome 80+, Firefox 75+, Safari 14+）
- 检查浏览器设置中WebGL是否启用

### 2. 着色器编译失败
- 检查浏览器控制台错误信息
- 确保所有文件路径正确
- 检查WebGL上下文创建是否成功

### 3. 跨域问题
- 使用HTTP服务器，不要直接打开HTML文件
- 确保所有资源通过HTTP/HTTPS加载

### 4. 性能问题
- 降低迭代次数
- 使用较小的浏览器窗口
- 检查GPU驱动是否更新

## 浏览器兼容性

| 浏览器 | 最低版本 | 状态 |
|--------|----------|------|
| Chrome | 80+ | ✅ 完全支持 |
| Firefox | 75+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Edge | 80+ | ✅ 完全支持 |

## 性能优化建议

1. **GPU加速**: 确保浏览器启用硬件加速
2. **迭代次数**: 根据设备性能调整
3. **分辨率**: 在移动设备上降低分辨率
4. **颜色方案**: 简单方案性能更好

## 监控和分析

### 使用浏览器开发者工具
1. **Performance面板**: 分析渲染性能
2. **Console面板**: 查看错误和警告
3. **Network面板**: 检查资源加载

### 性能指标
- 渲染时间应 < 100ms
- FPS应 > 30
- GPU使用率应明显高于CPU

## 故障排除

### 检查清单
- [ ] 所有文件已上传
- [ ] 文件路径正确
- [ ] GitHub Pages已启用
- [ ] 浏览器支持WebGL2
- [ ] 没有跨域错误
- [ ] 控制台无错误信息

### 获取帮助
1. 检查浏览器控制台错误
2. 查看网络请求状态
3. 对比本地和线上版本
4. 检查GitHub Pages部署状态

## 成功部署的标志

✅ 页面正确加载，显示控制面板  
✅ 点击"重新渲染"显示分形图案  
✅ 可以拖拽平移视图  
✅ 滚轮可以缩放  
✅ 预设按钮工作正常  
✅ 可以导出PNG图像  
✅ 性能信息显示渲染时间 < 100ms