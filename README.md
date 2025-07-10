# 🚀 Quantitative Investment Platform

一个完整的量化投资分析平台，提供股票数据分析、技术指标计算、投资组合优化和策略回测功能。

![Platform Preview](https://img.shields.io/badge/Status-Production%20Ready-green)
![Backend](https://img.shields.io/badge/Backend-Flask-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20TypeScript-blue)
![Data](https://img.shields.io/badge/Data-100%20Stocks-orange)

## ✨ 核心功能

### 📊 仪表板 (Dashboard)
- 实时股票市场数据概览
- 涨跌股票统计
- 平均股价和成交量分析
- 完整的OHLCV数据展示

### 📈 股票分析 (Stock Analysis)
- 交互式K线图和时间序列图表
- 技术指标计算：
  - RSI (相对强弱指数)
  - MACD (移动平均收敛发散)
  - Bollinger Bands (布林带)
  - Moving Averages (移动平均线)
- 多时间周期分析

### 💰 投资组合优化 (Portfolio Optimization)
- 现代投资组合理论(MPT)实现
- 三种优化策略：
  - 最大夏普比率
  - 最小波动率
  - 最大收益率
- 风险收益分析
- 相关性矩阵可视化

### 🔄 策略回测 (Strategy Backtesting)
- 三种交易策略：
  - 移动平均策略
  - RSI策略
  - 买入持有策略
- 实时策略性能分析
- 风险指标计算 (VaR, 最大回撤, 夏普比率)

## 🛠️ 技术架构

### 后端 (Backend)
- **框架**: Flask + Flask-CORS
- **数据处理**: pandas, numpy
- **金融分析**: yfinance, scikit-learn, statsmodels
- **API设计**: RESTful API

### 前端 (Frontend) 
- **框架**: React 18 + TypeScript
- **UI库**: Material-UI (MUI)
- **图表**: Plotly.js
- **路由**: React Router
- **状态管理**: React Hooks

### 数据
- **100支热门股票**历史数据 (2018-2023)
- **OHLCV完整数据**：开盘价、最高价、最低价、收盘价、成交量
- **6年历史数据**，支持多时间周期分析

## 🚀 快速开始

### 前置要求
- Python 3.11+
- Node.js 16+
- Git

### 安装步骤

1. **克隆仓库**
```bash
git clone git@github.com:OliviaJiang000/My_Quant_Web_Program.git
cd My_Quant_Web_Program
```

2. **设置后端环境**
```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 安装依赖
cd backend
pip install -r requirements.txt
```

3. **启动后端服务**
```bash
python app.py
```
后端服务将在 `http://localhost:5001` 启动

4. **设置前端环境**
```bash
cd ../frontend
npm install
```

5. **启动前端服务**
```bash
npm start
```
前端应用将在 `http://localhost:3000` 启动

## 📱 使用指南

### 1. 访问仪表板
- 打开 `http://localhost:3000`
- 查看市场概览和股票统计

### 2. 股票分析
- 进入"股票分析"页面
- 输入股票代码 (如: AAPL, GOOGL, MSFT)
- 选择时间周期和图表类型
- 查看技术指标分析

### 3. 投资组合优化
- 进入"投资组合"页面
- 输入多只股票代码 (逗号分隔)
- 选择优化方法
- 获得最优权重配置

### 4. 策略回测
- 进入"策略回测"页面
- 选择策略类型和参数
- 设置回测时间周期
- 查看回测结果和性能指标

## 📊 API接口

### 核心端点
```
GET  /api/health                     # 健康检查
GET  /api/stocks                     # 股票列表
GET  /api/stock/{symbol}/chart       # 股票图表数据
GET  /api/stock/{symbol}/indicators  # 技术指标
GET  /api/stock/{symbol}/backtest    # 策略回测
POST /api/portfolio/analysis         # 投资组合分析
```

### 示例请求
```bash
# 获取苹果股票技术指标
curl "http://localhost:5001/api/stock/AAPL/indicators?days=90&indicators=all"

# RSI策略回测
curl "http://localhost:5001/api/stock/AAPL/backtest?strategy=rsi&rsi_period=14"
```

## 📁 项目结构

```
My_Quant_Web_Program/
├── backend/                 # Flask后端
│   ├── app.py              # 主应用文件
│   ├── indicators.py       # 量化分析模块
│   └── requirements.txt    # Python依赖
├── frontend/               # React前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   └── App.tsx        # 主应用组件
│   └── package.json       # Node.js依赖
├── data/                   # 数据文件
│   └── stock_prices.csv   # 股票历史数据
└── README.md              # 项目说明
```

## 🔧 配置说明

### 环境变量
- `FLASK_ENV`: 开发环境设置
- `API_BASE_URL`: API基础URL (默认: http://localhost:5001)

### 数据更新
股票数据文件位于 `data/stock_prices.csv`，包含100支股票的6年历史数据。

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- GitHub: [@OliviaJiang000](https://github.com/OliviaJiang000)
- 项目链接: [https://github.com/OliviaJiang000/My_Quant_Web_Program](https://github.com/OliviaJiang000/My_Quant_Web_Program)

---

⭐ 如果这个项目对您有帮助，请给它一个星标！ 