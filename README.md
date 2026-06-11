# 军工软件文档智能编制与审查平台

基于 `Electron + Vue 3 + Ant Design Vue + FastAPI` 的本地化文档平台示例，实现了文档生成、GJB 规则审查、知识底座展示、模型接入配置和截图手册编制的最小闭环。

## 目录结构

- `client/`: Electron 客户端与 Vue 前端
- `server/`: FastAPI 后端、规则引擎与服务编排
- `deploy/`: 本地部署和初始化脚本
- `docs/`: 产品说明、架构说明、验收清单
- `.trae/documents/`: 已批准的实施计划

## 快速启动

### 1. 启动后端

```bash
cd server
python -m pip install fastapi pydantic python-multipart uvicorn
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. 启动前端 Web 预览

```bash
cd client
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install
npm run dev
```

### 3. 启动 Electron 桌面端开发模式

```bash
cd client
npm run dev:desktop
```

## 已实现能力

- 文档生成：模板化参数输入、章节草稿生成、自动审查摘要
- 文档审查：规则命中、术语校验、问题分级、整改状态更新
- 知识底座：规则、模板、历史文档和术语热词概览
- 模型配置：展示本地 32B 主模型、Ollama、兼容接口等供应方
- 手册编制：Electron 截图桥接、截图序列展示、手册段落草稿生成

## 当前约束

- 大模型调用使用本地桩实现，方便后续接入真实模型网关
- 规则库与知识底座采用示例数据，便于演示 MVP 能力
- Electron 在当前沙箱中通过跳过二进制下载完成依赖解析，真实桌面运行需具备 Electron 可执行文件
