# Fake Komga Web Reader

这是一个为 `fake-komga-115` 后端量身定制的**纯前端**漫画阅读器客户端。

本项目旨在提供极速、流畅的阅读体验，支持移动端自适应、暗色模式、并且可以通过 PWA 随时“安装”到您的手机上作为独立应用使用。

## 🌟 核心特性

- **纯静态前端**：没有复杂的后端依赖，任何静态托管服务都能跑起来。
- **PWA 支持**：可添加至移动设备主屏幕，全屏沉浸体验。
- **智能阅读模式**：支持“点击翻页 (Paged)”和“长图连续滚动 (Webtoon)”，在设置页或阅读时一键切换。
- **自定义书库排序**：在设置页预设你最爱的漫画排序方式。
- **自适应系统主题**：完美的日夜间（暗色模式）自适应 UI。
- **懒加载与进度同步**：绝不一次性加载整卷图片，保护局域网后端，支持精确的跨端进度同步。

## 🚀 部署指南 (推荐使用 Cloudflare Pages)

由于本应用只需托管静态文件，使用 Cloudflare Pages 部署是免费且最简单的“方案 A”。

### 步骤 1：Fork 或推送代码到您的 GitHub
如果您已经 Fork 或创建了本仓库，可以直接前往 Cloudflare 仪表盘。

### 步骤 2：在 Cloudflare Pages 部署
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 在左侧菜单中找到 **Workers & Pages** -> **Pages**，点击 **Connect to Git**。
3. 授权连接您的 GitHub 账号，并选择本项目的仓库。
4. 在构建配置（Build settings）中：
   - **Framework preset**: `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. 点击 **Save and Deploy**，大约等待 1 分钟即可完成上线。

### 步骤 3：配置后端的跨域 (CORS) 允许
**【非常重要】**
由于您的前端是在公网（如 `https://your-app.pages.dev`）上，而去请求内网的 `http://192.168.x.x:25600`，这会产生跨域问题。
您必须在本地的 `fake-komga-115` 的设置页面中，将您的 Cloudflare Pages 网址（如 `https://your-app.pages.dev`）加入到 **允许的前端 Origin (CORS)** 列表中。

## ⚠️ 关于 Firefox (火狐) 与 Safari 浏览器的连接问题

如果您的前端部署在 `https://` 的网址上（比如 Cloudflare），而您的后端是本地的 `http://192.168...`：
- **Chrome / Edge**：支持最新的“私有网络访问 (PNA)”协议，可以顺利通信。
- **Firefox / Safari**：会由于严格的“Mixed Content（混合内容）”策略直接拦截请求。
  
**火狐用户的解决方案**：
当火狐浏览器阻挡了连接时，其地址栏左侧的“小锁”图标会带有警告标志（⚠️）。请点击该小锁，并在弹出的面板中选择 **“暂时禁用保护 (Disable protection for now)”**，即可解除限制，正常连接局域网后端。

## 💻 本地开发

```bash
npm install
npm run dev
```

## 🔗 相关链接

- [fake-komga-115 后端项目](https://github.com/xJogger/fake-komga-115)
- [fake-komga-web-reader 前端项目](https://github.com/xJogger/fake-komga-web-reader)
