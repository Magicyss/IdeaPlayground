# 健身跟练视频编辑器 / Fitness Workout Video Editor

一个功能完整的前端应用，用于创建自定义健身跟练视频。支持导入本地视频，选择片段，配置训练参数，生成完整的训练计划。

A comprehensive frontend application for creating custom follow-along workout videos. Import local videos, select clips, configure workout parameters, and generate complete training plans.

## 快速开始 / Quick Start

### 安装依赖 / Install Dependencies

```bash
npm install
```

### 启动开发服务器 / Start Development Server

```bash
npm run dev
```

服务器启动后，在浏览器中打开显示的本地地址（通常是 `http://localhost:5173`）。

After the server starts, open the displayed local address in your browser (usually `http://localhost:5173`).

### 构建生产版本 / Build for Production

```bash
npm run build
```

构建完成后，生成的文件将在 `dist` 目录中。

After building, the generated files will be in the `dist` directory.

### 预览生产构建 / Preview Production Build

```bash
npm run preview
```

## 主要功能 / Key Features

### 核心功能 / Core Features
- **视频导入** / **Video Import**: 支持本地视频文件上传（MP4, MOV, AVI, WebM，最大500MB）
- **片段选择** / **Clip Selection**: 可视化时间轴界面，精确选择开始/结束时间
- **动作编辑器** / **Exercise Editor**: 支持两种动作类型
  - 计次动作（深蹲、弓箭步）：可配置次数、组数、休息间隔
  - 持续动作（靠墙深蹲、高抬腿）：可配置时长、组数、休息间隔
- **训练构建器** / **Workout Builder**: 可视化动作列表，支持编辑和删除
- **休息计时器** / **Rest Timers**: 倒计时带Web Audio API提示音（最后5秒，最后3秒更高音）
- **训练播放器** / **Workout Player**: 完整播放界面，自动进度跟踪
- **数据持久化** / **Data Persistence**: LocalStorage自动保存草稿
- **多语言支持** / **Internationalization**: 自动检测系统语言（中文/英文）
  - 右上角语言切换下拉菜单
  - 语言选择保存在LocalStorage

### 技术实现 / Technical Implementation
- **框架** / **Framework**: React 18 + Vite
- **状态管理** / **State Management**: React Context + useReducer
- **音频** / **Audio**: Web Audio API（无需外部音频文件）
- **存储** / **Storage**: LocalStorage（训练计划和语言偏好）
- **国际化** / **i18n**: React Context基础的i18n系统
- **响应式设计** / **Responsive Design**: 桌面优先，兼容平板和手机
- **纯前端** / **Pure Frontend**: 无需后端，可部署为静态网站

## 使用指南 / User Guide

### 1. 创建新训练计划 / Create New Workout Plan
1. 点击主页的"新建训练计划"按钮
2. Click "New Workout Plan" button on home page

### 2. 导入视频 / Import Videos
1. 点击"导入视频"按钮
2. 选择本地视频文件（支持多选）
3. Click "Import Videos" button
4. Select local video files (multiple selection supported)

### 3. 添加动作 / Add Exercises
1. 导入视频后，点击"+ 添加动作"
2. 选择视频片段（使用时间轴滑块）
3. 选择动作类型（计次或持续）
4. 配置参数（次数/时长、组数、休息时间）
5. After importing videos, click "+ Add Exercise"
6. Select video clip (use timeline sliders)
7. Choose exercise type (count-based or duration-based)
8. Configure parameters (reps/duration, sets, rest intervals)

### 4. 开始训练 / Start Workout
1. 添加完所有动作后，点击"开始训练"
2. 跟随视频和倒计时进行训练
3. After adding all exercises, click "Start Workout"
4. Follow the videos and countdown timers

### 5. 导出/导入 / Export/Import
- **导出JSON**: 保存训练计划为JSON文件
- **导入JSON**: 加载之前保存的训练计划
- **Export JSON**: Save workout plan as JSON file
- **Import JSON**: Load previously saved workout plan

## 项目结构 / Project Structure

```
FitnessWorkoutEditor/
├── src/
│   ├── components/          # 组件目录 / Components directory
│   │   ├── VideoImporter/   # 视频导入器 / Video importer
│   │   ├── ClipSelector/    # 片段选择器 / Clip selector
│   │   ├── ExerciseEditor/  # 动作编辑器 / Exercise editor
│   │   ├── WorkoutBuilder/  # 训练构建器 / Workout builder
│   │   ├── RestTimer/       # 休息计时器 / Rest timer
│   │   ├── WorkoutPlayer/   # 训练播放器 / Workout player
│   │   └── LanguageSwitcher/ # 语言切换器 / Language switcher
│   ├── contexts/            # Context状态管理 / Context state management
│   ├── i18n/                # 国际化翻译 / i18n translations
│   ├── App.jsx              # 主应用组件 / Main app component
│   └── main.jsx             # 应用入口 / App entry point
├── public/                  # 静态资源 / Static assets
├── package.json             # 依赖配置 / Dependencies
└── vite.config.js          # Vite配置 / Vite config
```

## 数据格式 / Data Format

训练计划以JSON格式存储：

Workout plans are stored in JSON format:

```json
{
  "workoutPlanId": "uuid",
  "workoutName": "我的训练计划 / My Workout Plan",
  "createdAt": "2024-01-17T10:00:00Z",
  "exercises": [
    {
      "exerciseId": "ex-1",
      "exerciseName": "深蹲 / Squats",
      "exerciseType": "count",
      "videoSource": {
        "fileName": "squat-tutorial.mp4",
        "startTime": 135,
        "endTime": 150
      },
      "parameters": {
        "repsPerSet": 15,
        "sets": 3,
        "restBetweenSets": 30
      },
      "restAfterExercise": 15
    }
  ]
}
```

## 未来功能 / Future Features

### V1.5 - 音频增强 / Audio Enhancements
- 自定义背景音乐上传（MP3）
- 视频原声开关（每个片段独立控制）
- 音量控制（背景音乐和视频原声）
- Custom background music upload (MP3)
- Video original audio toggle (per clip control)
- Volume controls (background music and video audio)

### V2 - 在线视频支持 / Online Video Support
- 支持在线视频平台（Bilibili、YouTube、Twitter、Weibo、小红书）
- 社区分享功能
- 训练模板库
- Support for online video platforms (Bilibili, YouTube, Twitter, Weibo, Xiaohongshu)
- Community sharing
- Workout template library

### 未来 - 视频导出 / Future - Video Export
- FFmpeg.js浏览器端视频合成
- 导出完整训练视频文件
- 离线播放功能
- FFmpeg.js browser-based video composition
- Export complete workout video files
- Offline playback capability

## 部署 / Deployment

该应用可以部署到任何静态托管服务：

This application can be deployed to any static hosting service:

- **GitHub Pages**
- **Vercel**
- **Netlify**
- **CloudFlare Pages**

构建后，将 `dist` 目录的内容上传即可。

After building, upload the contents of the `dist` directory.

### 转换为其他平台 / Convert to Other Platforms
- **PWA**: 渐进式Web应用 / Progressive Web App
- **移动应用** / **Mobile App**: 使用 Capacitor
- **小程序** / **Mini-program**: 使用 Taro 或 uni-app

## 技术栈 / Tech Stack

- React 18
- Vite 7
- Web Audio API
- LocalStorage API
- HTML5 Video API

## 许可证 / License

MIT

## 贡献 / Contributing

欢迎提交Issue和Pull Request！

Issues and Pull Requests are welcome!

---

如有问题，请查看 [plan-zh.md](./plan-zh.md) 了解详细的功能规划。

For detailed feature planning, please refer to [plan-zh.md](./plan-zh.md).
