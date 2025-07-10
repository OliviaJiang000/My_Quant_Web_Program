import os
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import plotly.graph_objects as go
import plotly.utils
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# 导入技术指标模块
from indicators import TechnicalIndicators, QuantitativeAnalysis

app = Flask(__name__)
CORS(app)

# 全局变量存储数据
stock_data = None
stock_symbols = []

def load_stock_data():
    """加载股票数据"""
    global stock_data, stock_symbols
    try:
        # 从data目录加载数据
        data_path = os.path.join('..', 'data', 'stock_prices.csv')
        stock_data = pd.read_csv(data_path, header=[0, 1], index_col=0, parse_dates=True)
        
        # 获取所有股票代码
        stock_symbols = list(stock_data.columns.levels[0])
        
        print(f"数据加载成功! 包含 {len(stock_symbols)} 支股票")
        print(f"数据时间范围: {stock_data.index.min()} 到 {stock_data.index.max()}")
        print(f"股票代码: {stock_symbols[:10]}{'...' if len(stock_symbols) > 10 else ''}")
        
        return True
    except Exception as e:
        print(f"数据加载失败: {e}")
        return False

@app.route('/', methods=['GET'])
def home():
    """主页"""
    return jsonify({
        'message': '量化研究API',
        'version': '1.0.0',
        'endpoints': [
            {
                'path': '/api/stocks',
                'methods': ['GET'],
                'description': '获取股票数据',
                'parameters': {
                    'detail': 'summary(默认) 或 full - 数据详细程度',
                    'days': '数字 - 返回最近N天数据 (默认30)',
                    'limit': '数字 - 限制返回股票数量 (默认10)'
                },
                'examples': [
                    '/api/stocks - 返回10只股票的最新OHLCV数据',
                    '/api/stocks?detail=full&days=7 - 返回10只股票最近7天的完整数据',
                    '/api/stocks?limit=5&days=14 - 返回5只股票最近14天的汇总数据'
                ]
            },
            '/api/stock/<symbol>',
            '/api/stock/<symbol>/chart',
            '/api/stock/<symbol>/indicators',
            '/api/stock/<symbol>/analysis',
            '/api/stock/<symbol>/backtest',
            '/api/portfolio/analysis',
            '/api/health'
        ]
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'data_loaded': stock_data is not None,
        'total_stocks': len(stock_symbols) if stock_symbols else 0,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    """获取所有股票的OHLCV数据"""
    if stock_data is None:
        return jsonify({'error': '数据未加载'}), 500
    
    try:
        # 获取查询参数
        days = request.args.get('days', default=30, type=int)  # 默认返回最近30天
        limit = request.args.get('limit', default=10, type=int)  # 默认返回前10只股票
        detail = request.args.get('detail', default='summary', type=str)  # summary 或 full
        
        if detail == 'full':
            # 返回完整的OHLCV历史数据
            stocks_data = []
            symbols_to_process = stock_symbols[:limit] if limit > 0 else stock_symbols
            
            for symbol in symbols_to_process:
                try:
                    stock_df = stock_data[symbol].copy()
                    
                    # 限制数据范围
                    if days > 0:
                        stock_df = stock_df.tail(days)
                    
                    # 构建该股票的完整数据
                    stock_records = []
                    for date, row in stock_df.iterrows():
                        stock_records.append({
                            'date': date.strftime('%Y-%m-%d'),
                            'symbol': symbol,
                            'open': round(float(row['Open']), 2),
                            'high': round(float(row['High']), 2),
                            'low': round(float(row['Low']), 2),
                            'close': round(float(row['Close']), 2),
                            'volume': int(row['Volume']) if not pd.isna(row['Volume']) else 0
                        })
                    
                    stocks_data.append({
                        'symbol': symbol,
                        'data': stock_records,
                        'total_records': len(stock_records)
                    })
                    
                except Exception as e:
                    print(f"处理股票 {symbol} 时出错: {e}")
                    continue
            
            return jsonify({
                'stocks': stocks_data,
                'total_symbols': len(stocks_data),
                'days': days,
                'data_type': 'full'
            })
        
        else:
            # 返回汇总统计信息（原有功能）
            stocks_info = []
            symbols_to_process = stock_symbols[:limit] if limit > 0 else stock_symbols
            
            for symbol in symbols_to_process:
                try:
                    stock_df = stock_data[symbol]
                    latest_price = stock_df['Close'].iloc[-1]
                    price_change = stock_df['Close'].pct_change().iloc[-1]
                    
                    # 获取最近一天的OHLCV数据
                    latest_data = stock_df.iloc[-1]
                    
                    stocks_info.append({
                        'symbol': symbol,
                        'date': stock_df.index[-1].strftime('%Y-%m-%d'),
                        'open': round(float(latest_data['Open']), 2),
                        'high': round(float(latest_data['High']), 2),
                        'low': round(float(latest_data['Low']), 2),
                        'close': round(float(latest_data['Close']), 2),
                        'volume': int(latest_data['Volume']) if not pd.isna(latest_data['Volume']) else 0,
                        'latest_price': round(float(latest_price), 2),
                        'price_change': round(float(price_change) * 100, 2) if not pd.isna(price_change) else 0
                    })
                except Exception as e:
                    print(f"处理股票 {symbol} 时出错: {e}")
                    continue
            
            return jsonify({
                'stocks': stocks_info,
                'total': len(stocks_info),
                'data_type': 'summary'
            })
    
    except Exception as e:
        return jsonify({'error': f'获取股票数据时出错: {str(e)}'}), 500

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    """获取特定股票的详细数据"""
    if stock_data is None:
        return jsonify({'error': '数据未加载'}), 500
    
    if symbol not in stock_symbols:
        return jsonify({'error': f'股票代码 {symbol} 不存在'}), 404
    
    try:
        # 获取查询参数
        days = request.args.get('days', default=30, type=int)
        
        # 获取股票数据
        stock_df = stock_data[symbol].copy()
        
        # 限制数据范围
        if days > 0:
            stock_df = stock_df.tail(days)
        
        # 计算技术指标
        stock_df['MA5'] = stock_df['Close'].rolling(window=5).mean()
        stock_df['MA20'] = stock_df['Close'].rolling(window=20).mean()
        stock_df['Returns'] = stock_df['Close'].pct_change()
        
        # 转换为JSON格式
        result = {
            'symbol': symbol,
            'data': [],
            'statistics': {
                'total_records': len(stock_df),
                'date_range': {
                    'start': stock_df.index.min().strftime('%Y-%m-%d'),
                    'end': stock_df.index.max().strftime('%Y-%m-%d')
                },
                'price_stats': {
                    'current': round(float(stock_df['Close'].iloc[-1]), 2),
                    'high': round(float(stock_df['High'].max()), 2),
                    'low': round(float(stock_df['Low'].min()), 2),
                    'avg_volume': int(stock_df['Volume'].mean())
                }
            }
        }
        
        # 转换数据为列表
        for date, row in stock_df.iterrows():
            result['data'].append({
                'date': date.strftime('%Y-%m-%d'),
                'open': round(float(row['Open']), 2),
                'high': round(float(row['High']), 2),
                'low': round(float(row['Low']), 2),
                'close': round(float(row['Close']), 2),
                'volume': int(row['Volume']) if not pd.isna(row['Volume']) else 0,
                'ma5': round(float(row['MA5']), 2) if not pd.isna(row['MA5']) else None,
                'ma20': round(float(row['MA20']), 2) if not pd.isna(row['MA20']) else None,
                'returns': round(float(row['Returns']) * 100, 2) if not pd.isna(row['Returns']) else None
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'处理股票数据时出错: {str(e)}'}), 500

@app.route('/api/stock/<symbol>/indicators', methods=['GET'])
def get_technical_indicators(symbol):
    """获取技术指标"""
    if stock_data is None:
        return jsonify({'error': '数据未加载'}), 500
    
    if symbol not in stock_symbols:
        return jsonify({'error': f'股票代码 {symbol} 不存在'}), 404
    
    try:
        # 获取查询参数
        days = request.args.get('days', default=90, type=int)
        indicators = request.args.get('indicators', default='all')
        
        # 获取股票数据
        stock_df = stock_data[symbol].copy()
        if days > 0:
            stock_df = stock_df.tail(days)
        
        result = {
            'symbol': symbol,
            'indicators': {}
        }
        
        # 计算各种技术指标
        if indicators == 'all' or 'ma' in indicators:
            result['indicators']['moving_averages'] = {
                'ma5': TechnicalIndicators.simple_moving_average(stock_df['Close'], 5).fillna(0).tolist(),
                'ma10': TechnicalIndicators.simple_moving_average(stock_df['Close'], 10).fillna(0).tolist(),
                'ma20': TechnicalIndicators.simple_moving_average(stock_df['Close'], 20).fillna(0).tolist(),
                'ema12': TechnicalIndicators.exponential_moving_average(stock_df['Close'], 12).fillna(0).tolist()
            }
        
        if indicators == 'all' or 'bollinger' in indicators:
            bb = TechnicalIndicators.bollinger_bands(stock_df['Close'])
            result['indicators']['bollinger_bands'] = {
                'upper': bb['upper'].fillna(0).tolist(),
                'middle': bb['middle'].fillna(0).tolist(),
                'lower': bb['lower'].fillna(0).tolist()
            }
        
        if indicators == 'all' or 'rsi' in indicators:
            rsi = TechnicalIndicators.rsi(stock_df['Close'])
            result['indicators']['rsi'] = rsi.fillna(50).tolist()
        
        if indicators == 'all' or 'macd' in indicators:
            macd = TechnicalIndicators.macd(stock_df['Close'])
            result['indicators']['macd'] = {
                'macd': macd['macd'].fillna(0).tolist(),
                'signal': macd['signal'].fillna(0).tolist(),
                'histogram': macd['histogram'].fillna(0).tolist()
            }
        
        if indicators == 'all' or 'stoch' in indicators:
            stoch = TechnicalIndicators.stochastic_oscillator(
                stock_df['High'], stock_df['Low'], stock_df['Close']
            )
            result['indicators']['stochastic'] = {
                'k_percent': stoch['k_percent'].fillna(50).tolist(),
                'd_percent': stoch['d_percent'].fillna(50).tolist()
            }
        
        if indicators == 'all' or 'volume' in indicators:
            vol_ind = TechnicalIndicators.volume_indicators(stock_df['Close'], stock_df['Volume'])
            result['indicators']['volume'] = {
                'vwap': vol_ind['vwap'].fillna(0).tolist(),
                'obv': vol_ind['obv'].fillna(0).tolist()
            }
        
        # 添加日期数组
        result['dates'] = [d.strftime('%Y-%m-%d') for d in stock_df.index]
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'计算技术指标时出错: {str(e)}'}), 500

@app.route('/api/stock/<symbol>/analysis', methods=['GET'])
def get_stock_analysis(symbol):
    """获取股票量化分析"""
    if stock_data is None:
        return jsonify({'error': '数据未加载'}), 500
    
    if symbol not in stock_symbols:
        return jsonify({'error': f'股票代码 {symbol} 不存在'}), 404
    
    try:
        # 获取查询参数
        days = request.args.get('days', default=252, type=int)  # 默认一年
        
        # 获取股票数据
        stock_df = stock_data[symbol].copy()
        if days > 0:
            stock_df = stock_df.tail(days)
        
        # 计算收益率
        returns = QuantitativeAnalysis.calculate_returns(stock_df['Close'])
        
        # 计算风险指标
        risk_metrics = QuantitativeAnalysis.risk_metrics(returns)
        
        result = {
            'symbol': symbol,
            'analysis_period': f'{days} days',
            'risk_metrics': risk_metrics,
            'price_statistics': {
                'current_price': round(float(stock_df['Close'].iloc[-1]), 2),
                'period_high': round(float(stock_df['High'].max()), 2),
                'period_low': round(float(stock_df['Low'].min()), 2),
                'average_price': round(float(stock_df['Close'].mean()), 2),
                'price_std': round(float(stock_df['Close'].std()), 2),
                'average_volume': int(stock_df['Volume'].mean())
            },
            'performance': {
                'total_return': round(float((stock_df['Close'].iloc[-1] / stock_df['Close'].iloc[0] - 1) * 100), 2),
                'best_day': round(float(returns.max() * 100), 2),
                'worst_day': round(float(returns.min() * 100), 2),
                'positive_days': int((returns > 0).sum()),
                'negative_days': int((returns < 0).sum())
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'进行股票分析时出错: {str(e)}'}), 500

@app.route('/api/stock/<symbol>/backtest', methods=['GET'])
def backtest_strategy(symbol):
    """回测交易策略"""
    if stock_data is None:
        return jsonify({'error': '数据未加载'}), 500
    
    if symbol not in stock_symbols:
        return jsonify({'error': f'股票代码 {symbol} 不存在'}), 404
    
    try:
        # 获取查询参数
        days = request.args.get('days', default=252, type=int)
        strategy = request.args.get('strategy', default='moving_average')
        
        # 获取股票数据
        stock_df = stock_data[symbol].copy()
        if days > 0:
            stock_df = stock_df.tail(days)
        
        # 根据策略类型运行不同的回测
        if strategy == 'moving_average':
            ma_short = request.args.get('ma_short', default=5, type=int)
            ma_long = request.args.get('ma_long', default=20, type=int)
            
            backtest_result = QuantitativeAnalysis.backtest_simple_strategy(
                stock_df['Close'], ma_short, ma_long
            )
            strategy_name = f'MA({ma_short},{ma_long})'
            
        elif strategy == 'rsi':
            rsi_period = request.args.get('rsi_period', default=14, type=int)
            rsi_oversold = request.args.get('rsi_oversold', default=30, type=int)
            rsi_overbought = request.args.get('rsi_overbought', default=70, type=int)
            
            backtest_result = QuantitativeAnalysis.backtest_rsi_strategy(
                stock_df['Close'], rsi_period, rsi_oversold, rsi_overbought
            )
            strategy_name = f'RSI({rsi_period},{rsi_oversold},{rsi_overbought})'
            
        elif strategy == 'buy_and_hold':
            backtest_result = QuantitativeAnalysis.backtest_buy_and_hold(
                stock_df['Close']
            )
            strategy_name = 'Buy and Hold'
            
        else:
            return jsonify({'error': f'不支持的策略类型: {strategy}'}), 400
        
        # 计算策略表现
        strategy_returns = backtest_result['strategy_returns'].dropna()
        benchmark_returns = backtest_result['returns'].dropna()
        
        strategy_metrics = QuantitativeAnalysis.risk_metrics(strategy_returns)
        benchmark_metrics = QuantitativeAnalysis.risk_metrics(benchmark_returns)
        
        # 计算交易次数
        trades = backtest_result['positions'].abs().sum()
        
        result = {
            'symbol': symbol,
            'strategy': strategy_name,
            'period': f'{days} days',
            'strategy_performance': strategy_metrics,
            'benchmark_performance': benchmark_metrics,
            'backtest_data': {
                'dates': [d.strftime('%Y-%m-%d') for d in backtest_result.index],
                'strategy_equity': backtest_result['cumulative_strategy_returns'].fillna(1).tolist(),
                'benchmark_equity': backtest_result['cumulative_returns'].fillna(1).tolist(),
                'signals': backtest_result['signal'].tolist()
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'回测时出错: {str(e)}'}), 500

@app.route('/api/portfolio/analysis', methods=['POST'])
def portfolio_analysis():
    """投资组合分析"""
    if stock_data is None:
        return jsonify({'error': '数据未加载'}), 500
    
    try:
        # 获取请求数据
        data = request.get_json()
        symbols = data.get('symbols', [])
        method = data.get('method', 'equal_weight')
        days = data.get('days', 252)
        
        if not symbols:
            return jsonify({'error': '请提供股票代码列表'}), 400
        
        # 验证股票代码
        invalid_symbols = [s for s in symbols if s not in stock_symbols]
        if invalid_symbols:
            return jsonify({'error': f'无效的股票代码: {invalid_symbols}'}), 400
        
        # 获取股票数据
        portfolio_data = []
        for symbol in symbols:
            stock_df = stock_data[symbol]['Close'].copy()
            if days > 0:
                stock_df = stock_df.tail(days)
            portfolio_data.append(stock_df)
        
        # 创建投资组合数据
        portfolio_df = pd.concat(portfolio_data, axis=1, keys=symbols)
        
        # 计算收益率
        returns_df = portfolio_df.pct_change().dropna()
        
        # 投资组合优化
        optimization_result = QuantitativeAnalysis.portfolio_optimization(returns_df, method)
        
        # 相关性分析
        correlation_matrix = QuantitativeAnalysis.correlation_analysis(returns_df)
        
        result = {
            'portfolio': {
                'symbols': symbols,
                'optimization_method': method,
                'period': f'{days} days',
                'weights': optimization_result['weights'],
                'metrics': optimization_result['metrics']
            },
            'correlation_matrix': correlation_matrix.round(4).to_dict(),
            'individual_metrics': {}
        }
        
        # 计算各个股票的指标
        for symbol in symbols:
            symbol_returns = returns_df[symbol]
            result['individual_metrics'][symbol] = QuantitativeAnalysis.risk_metrics(symbol_returns)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'投资组合分析时出错: {str(e)}'}), 500

@app.route('/api/stock/<symbol>/chart', methods=['GET'])
def get_stock_chart(symbol):
    """获取股票图表数据"""
    if stock_data is None:
        return jsonify({'error': '数据未加载'}), 500
    
    if symbol not in stock_symbols:
        return jsonify({'error': f'股票代码 {symbol} 不存在'}), 404
    
    try:
        # 获取查询参数
        days = request.args.get('days', default=90, type=int)
        chart_type = request.args.get('type', default='candlestick')
        
        # 获取股票数据
        stock_df = stock_data[symbol].copy()
        
        # 限制数据范围
        if days > 0:
            stock_df = stock_df.tail(days)
        
        # 创建图表
        fig = go.Figure()
        
        if chart_type == 'candlestick':
            # K线图
            fig.add_trace(go.Candlestick(
                x=stock_df.index,
                open=stock_df['Open'],
                high=stock_df['High'],
                low=stock_df['Low'],
                close=stock_df['Close'],
                name=symbol
            ))
        else:
            # 线图
            fig.add_trace(go.Scatter(
                x=stock_df.index,
                y=stock_df['Close'],
                mode='lines',
                name=f'{symbol} Close Price'
            ))
        
        # 添加移动平均线
        stock_df['MA5'] = stock_df['Close'].rolling(window=5).mean()
        stock_df['MA20'] = stock_df['Close'].rolling(window=20).mean()
        
        fig.add_trace(go.Scatter(
            x=stock_df.index,
            y=stock_df['MA5'],
            mode='lines',
            name='MA5',
            line=dict(color='orange', width=1)
        ))
        
        fig.add_trace(go.Scatter(
            x=stock_df.index,
            y=stock_df['MA20'],
            mode='lines',
            name='MA20',
            line=dict(color='blue', width=1)
        ))
        
        # 设置布局
        fig.update_layout(
            title=f'{symbol} Stock Price Chart',
            xaxis_title='Date',
            yaxis_title='Price',
            height=500,
            xaxis_rangeslider_visible=False
        )
        
        # 转换为JSON
        graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        return jsonify({
            'chart': json.loads(graphJSON),
            'symbol': symbol,
            'period': f'{days} days'
        })
        
    except Exception as e:
        return jsonify({'error': f'生成图表时出错: {str(e)}'}), 500

if __name__ == '__main__':
    print("正在启动量化研究API服务器...")
    
    # 加载数据
    if load_stock_data():
        print("启动成功! 访问 http://localhost:5001 查看API")
        app.run(debug=True, host='0.0.0.0', port=5001)
    else:
        print("数据加载失败，请检查数据文件路径") 