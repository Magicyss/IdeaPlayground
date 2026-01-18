# 如何将 FitnessWorkoutEditor 部署到 GitHub Pages

本文档详细介绍如何将健身跟练视频编辑器部署到 GitHub Pages，让你的应用可以通过 `https://<username>.github.io/<repository>/` 访问。

## 目录

1. [部署前准备](#部署前准备)
2. [方法一：使用 GitHub Actions 自动部署（推荐）](#方法一使用-github-actions-自动部署推荐)
3. [方法二：手动构建和部署](#方法二手动构建和部署)
4. [验证部署](#验证部署)
5. [常见问题](#常见问题)

## 部署前准备

### 1. 确保项目可以正常构建

首先在本地测试构建是否成功：

```bash
cd FitnessWorkoutEditor
npm install
npm run build
```

构建成功后，会在 `dist` 目录生成静态文件。

### 2. 配置 Vite 的 base 路径

由于 GitHub Pages 的项目会部署在子路径下（例如 `https://username.github.io/IdeaPlayground/`），需要配置 Vite 的 `base` 选项。

编辑 `vite.config.js`：

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/IdeaPlayground/', // 改为你的仓库名
})
```

**重要说明：**
- 如果你的仓库名是 `IdeaPlayground`，则 `base` 应该设置为 `'/IdeaPlayground/'`
- 如果你要部署到用户或组织页面（`username.github.io`），则 `base` 设置为 `'/'`
- 记得 base 路径前后都要有斜杠 `/`

## 方法一：使用 GitHub Actions 自动部署（推荐）

这种方法会在你每次推送代码到主分支时自动构建并部署到 GitHub Pages。

### 步骤 1：创建 GitHub Actions 工作流文件

在项目根目录创建 `.github/workflows/deploy-fitness-editor.yml` 文件（文件名可以自定义）：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main  # 或者你的主分支名称（如 master）
    paths:
      - 'FitnessWorkoutEditor/**'  # 只有 FitnessWorkoutEditor 目录变化时才触发
  workflow_dispatch:  # 允许手动触发部署

# 设置 GITHUB_TOKEN 的权限
permissions:
  contents: read
  pages: write
  id-token: write

# 只允许一个并发部署
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # 构建任务
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: FitnessWorkoutEditor/package-lock.json

      - name: Install dependencies
        working-directory: ./FitnessWorkoutEditor
        run: npm ci

      - name: Build
        working-directory: ./FitnessWorkoutEditor
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./FitnessWorkoutEditor/dist

  # 部署任务
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 步骤 2：启用 GitHub Pages

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings**（设置）
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 下拉菜单中选择 **GitHub Actions**
5. 保存设置

### 步骤 3：推送代码触发部署

```bash
git add .
git commit -m "Add GitHub Actions workflow for deployment"
git push
```

### 步骤 4：查看部署状态

1. 进入仓库的 **Actions** 标签页
2. 你会看到 "Deploy to GitHub Pages" 工作流正在运行
3. 等待工作流完成（通常需要 1-3 分钟）
4. 部署成功后，你可以通过 `https://<username>.github.io/<repository>/` 访问你的应用

## 方法二：手动构建和部署

如果你不想使用 GitHub Actions，可以手动构建并部署。

### 步骤 1：安装依赖并构建

```bash
cd FitnessWorkoutEditor
npm install
npm run build
```

### 步骤 2：使用 gh-pages 工具部署

首先安装 `gh-pages` 工具：

```bash
npm install -D gh-pages
```

在 `package.json` 中添加部署脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "deploy": "gh-pages -d dist"
  }
}
```

运行部署命令：

```bash
npm run deploy
```

这会将 `dist` 目录的内容推送到 `gh-pages` 分支。

### 步骤 3：配置 GitHub Pages 使用 gh-pages 分支

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings**（设置）
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 下拉菜单中选择 **Deploy from a branch**
5. 在 **Branch** 下拉菜单中选择 **gh-pages** 分支，目录选择 **/ (root)**
6. 点击 **Save**

等待几分钟后，你的应用就会部署到 `https://<username>.github.io/<repository>/`

## 验证部署

部署完成后，访问你的 GitHub Pages 地址：

```
https://<username>.github.io/<repository>/
```

例如，如果你的 GitHub 用户名是 `Magicyss`，仓库名是 `IdeaPlayground`，那么访问地址应该是：

```
https://magicyss.github.io/IdeaPlayground/
```

### 检查清单

- [ ] 页面能正常加载，没有 404 错误
- [ ] CSS 样式正常显示
- [ ] 可以导入视频文件
- [ ] 视频可以正常播放
- [ ] 所有功能正常工作

## 常见问题

### Q1: 页面显示 404 或者资源加载失败

**原因：** `vite.config.js` 中的 `base` 路径配置不正确。

**解决方法：**
- 检查 `base` 是否设置为你的仓库名，例如 `'/IdeaPlayground/'`
- 确保 base 路径前后都有斜杠
- 修改后重新构建并部署

### Q2: GitHub Actions 工作流失败

**常见原因和解决方法：**

1. **权限不足**
   - 进入 Settings → Actions → General
   - 在 "Workflow permissions" 中选择 "Read and write permissions"

2. **Node.js 版本不兼容**
   - 检查 `.github/workflows/deploy.yml` 中的 `node-version`
   - 确保使用的 Node.js 版本与本地开发版本一致（推荐 18 或 20）

3. **依赖安装失败**
   - 检查 `package-lock.json` 是否提交到仓库
   - 尝试删除 `node_modules` 和 `package-lock.json`，重新运行 `npm install`

### Q3: 视频文件无法导入或播放

**原因：** GitHub Pages 只能托管静态文件，本地视频导入功能不受影响，但需要用户每次手动选择视频。

**说明：**
- FitnessWorkoutEditor 使用浏览器的 File API 读取本地视频
- 视频文件不会上传到服务器，完全在浏览器中处理
- 这是正常行为，不是部署问题

### Q4: 页面样式错乱或功能异常

**解决方法：**

1. 清除浏览器缓存：
   - Chrome: Ctrl+Shift+Delete（Windows）或 Cmd+Shift+Delete（Mac）
   - 勾选 "缓存的图片和文件"
   - 点击 "清除数据"

2. 使用隐身/无痕模式测试

3. 检查浏览器控制台（F12）是否有错误信息

### Q5: 想要自定义域名

如果你想使用自己的域名（如 `fitness.example.com`）：

1. 在仓库根目录创建 `public/CNAME` 文件（对于 FitnessWorkoutEditor，应该在 `FitnessWorkoutEditor/public/CNAME`）
2. 文件内容写入你的域名：`fitness.example.com`
3. 在域名提供商处添加 CNAME 记录指向 `<username>.github.io`
4. 在 GitHub Pages 设置中填入自定义域名

更多信息参考：[GitHub Pages 自定义域名文档](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## 更新和维护

### 更新应用

**使用 GitHub Actions：**
- 直接修改代码并推送到主分支
- GitHub Actions 会自动触发构建和部署

**手动部署：**
- 修改代码后运行 `npm run build`
- 运行 `npm run deploy` 推送更新

### 回滚到之前的版本

如果需要回滚：

1. 查看 GitHub Actions 的历史记录
2. 找到想要恢复的版本的提交 SHA
3. 使用 `git revert` 或 `git reset` 回退代码
4. 重新触发部署

## 其他部署选项

除了 GitHub Pages，FitnessWorkoutEditor 还可以部署到：

- **Vercel**：零配置，自动检测 Vite 项目
- **Netlify**：拖拽 `dist` 文件夹即可部署
- **Cloudflare Pages**：高性能 CDN 加速
- **自己的服务器**：使用 Nginx 或 Apache 托管 `dist` 目录

这些平台通常提供更快的构建速度和更好的性能，但 GitHub Pages 的优势是完全免费且与 GitHub 仓库集成。

## 参考资料

- [Vite 部署文档](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## 需要帮助？

如果遇到问题，可以：

1. 查看 [Issues](https://github.com/<username>/<repository>/issues) 寻找类似问题
2. 创建新的 Issue 描述你的问题
3. 参考本文档的常见问题章节

---

祝你部署顺利！🎉
