import pandas as pd
import numpy as np
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

class TechnicalIndicators:
    """技术指标计算类"""
    
    @staticmethod
    def simple_moving_average(data, window):
        """简单移动平均线"""
        return data.rolling(window=window).mean()
    
    @staticmethod
    def exponential_moving_average(data, window):
        """指数移动平均线"""
        return data.ewm(span=window).mean()
    
    @staticmethod
    def bollinger_bands(data, window=20, num_std=2):
        """布林带"""
        ma = data.rolling(window=window).mean()
        std = data.rolling(window=window).std()
        upper = ma + (std * num_std)
        lower = ma - (std * num_std)
        return pd.DataFrame({
            'upper': upper,
            'middle': ma,
            'lower': lower
        })
    
    @staticmethod
    def rsi(data, window=14):
        """相对强弱指数RSI"""
        delta = data.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    @staticmethod
    def macd(data, fast_period=12, slow_period=26, signal_period=9):
        """MACD指标"""
        ema_fast = data.ewm(span=fast_period).mean()
        ema_slow = data.ewm(span=slow_period).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal_period).mean()
        histogram = macd_line - signal_line
        
        return pd.DataFrame({
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        })
    
    @staticmethod
    def stochastic_oscillator(high, low, close, k_window=14, d_window=3):
        """随机震荡指标"""
        lowest_low = low.rolling(window=k_window).min()
        highest_high = high.rolling(window=k_window).max()
        k_percent = 100 * ((close - lowest_low) / (highest_high - lowest_low))
        d_percent = k_percent.rolling(window=d_window).mean()
        
        return pd.DataFrame({
            'k_percent': k_percent,
            'd_percent': d_percent
        })
    
    @staticmethod
    def atr(high, low, close, window=14):
        """平均真实波幅ATR"""
        tr1 = high - low
        tr2 = abs(high - close.shift())
        tr3 = abs(low - close.shift())
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=window).mean()
        return atr
    
    @staticmethod
    def volume_indicators(price, volume):
        """成交量指标"""
        # 成交量加权平均价格 VWAP
        typical_price = price
        vwap = (typical_price * volume).cumsum() / volume.cumsum()
        
        # 能量潮流 OBV
        obv = (np.sign(price.diff()) * volume).cumsum()
        
        return pd.DataFrame({
            'vwap': vwap,
            'obv': obv
        })

class QuantitativeAnalysis:
    """量化分析类"""
    
    @staticmethod
    def calculate_returns(data, method='simple'):
        """计算收益率"""
        if method == 'simple':
            return data.pct_change()
        elif method == 'log':
            return np.log(data / data.shift(1))
        else:
            raise ValueError("method must be 'simple' or 'log'")
    
    @staticmethod
    def risk_metrics(returns):
        """风险指标计算"""
        # 去除NaN值
        clean_returns = returns.dropna()
        
        if len(clean_returns) == 0:
            return {
                'annual_return': 0,
                'annual_volatility': 0,
                'sharpe_ratio': 0,
                'max_drawdown': 0,
                'var_95': 0,
                'skewness': 0,
                'kurtosis': 0
            }
        
        # 年化收益率
        annual_return = clean_returns.mean() * 252
        
        # 年化波动率
        annual_volatility = clean_returns.std() * np.sqrt(252)
        
        # 夏普比率（假设无风险利率为0）
        sharpe_ratio = annual_return / annual_volatility if annual_volatility != 0 else 0
        
        # 最大回撤
        cumulative_returns = (1 + clean_returns).cumprod()
        rolling_max = cumulative_returns.expanding().max()
        drawdown = (cumulative_returns - rolling_max) / rolling_max
        max_drawdown = drawdown.min()
        
        # VaR (95%)
        var_95 = np.percentile(clean_returns, 5)
        
        # 偏度和峰度
        skewness = stats.skew(clean_returns)
        kurtosis = stats.kurtosis(clean_returns)
        
        return {
            'annual_return': round(float(annual_return), 4),
            'annual_volatility': round(float(annual_volatility), 4),
            'sharpe_ratio': round(float(sharpe_ratio), 4),
            'max_drawdown': round(float(max_drawdown), 4),
            'var_95': round(float(var_95), 4),
            'skewness': round(float(skewness), 4),
            'kurtosis': round(float(kurtosis), 4)
        }
    
    @staticmethod
    def correlation_analysis(data):
        """相关性分析"""
        correlation_matrix = data.corr()
        return correlation_matrix
    
    @staticmethod
    def backtest_simple_strategy(data, short_window=5, long_window=20):
        """简单移动平均策略回测"""
        # 计算移动平均线
        short_ma = data.rolling(window=short_window).mean()
        long_ma = data.rolling(window=long_window).mean()
        
        # 生成交易信号
        signals = pd.DataFrame(index=data.index)
        signals['price'] = data
        signals['short_ma'] = short_ma
        signals['long_ma'] = long_ma
        signals['signal'] = 0.0
        
        # 当短期均线上穿长期均线时买入(1)，下穿时卖出(-1)
        signals['signal'][short_window:] = np.where(
            signals['short_ma'][short_window:] > signals['long_ma'][short_window:], 1.0, 0.0
        )
        signals['positions'] = signals['signal'].diff()
        
        # 计算策略收益
        signals['returns'] = data.pct_change()
        signals['strategy_returns'] = signals['signal'].shift(1) * signals['returns']
        
        # 计算累积收益
        signals['cumulative_returns'] = (1 + signals['returns']).cumprod()
        signals['cumulative_strategy_returns'] = (1 + signals['strategy_returns']).cumprod()
        
        return signals
    
    @staticmethod
    def backtest_rsi_strategy(data, rsi_period=14, oversold=30, overbought=70):
        """RSI策略回测"""
        # 计算RSI
        rsi = TechnicalIndicators.rsi(data, window=rsi_period)
        
        # 生成交易信号
        signals = pd.DataFrame(index=data.index)
        signals['price'] = data
        signals['rsi'] = rsi
        signals['signal'] = 0.0
        
        # RSI策略：RSI < oversold时买入，RSI > overbought时卖出
        signals['signal'] = np.where(rsi < oversold, 1.0, 
                                   np.where(rsi > overbought, 0.0, np.nan))
        
        # 前向填充信号（保持当前持仓状态）
        signals['signal'] = signals['signal'].fillna(method='ffill').fillna(0.0)
        signals['positions'] = signals['signal'].diff()
        
        # 计算策略收益
        signals['returns'] = data.pct_change()
        signals['strategy_returns'] = signals['signal'].shift(1) * signals['returns']
        
        # 计算累积收益
        signals['cumulative_returns'] = (1 + signals['returns']).cumprod()
        signals['cumulative_strategy_returns'] = (1 + signals['strategy_returns']).cumprod()
        
        return signals
    
    @staticmethod
    def backtest_buy_and_hold(data):
        """买入持有策略回测"""
        # 生成交易信号（始终持有）
        signals = pd.DataFrame(index=data.index)
        signals['price'] = data
        signals['signal'] = 1.0  # 始终持有
        signals['positions'] = 0.0  # 没有交易
        signals['positions'].iloc[0] = 1.0  # 初始买入
        
        # 计算策略收益
        signals['returns'] = data.pct_change()
        signals['strategy_returns'] = signals['returns']  # 买入持有的收益就是市场收益
        
        # 计算累积收益
        signals['cumulative_returns'] = (1 + signals['returns']).cumprod()
        signals['cumulative_strategy_returns'] = (1 + signals['strategy_returns']).cumprod()
        
        return signals
    
    @staticmethod
    def portfolio_optimization(returns_data, method='equal_weight'):
        """投资组合优化"""
        if method == 'equal_weight':
            # 等权重组合
            n_assets = len(returns_data.columns)
            weights = np.array([1/n_assets] * n_assets)
            
        elif method == 'risk_parity':
            # 风险平价组合（简化版）
            volatilities = returns_data.std()
            inv_vol = 1 / volatilities
            weights = inv_vol / inv_vol.sum()
            weights = weights.values
            
        elif method == 'minimum_variance':
            # 最小方差组合
            cov_matrix = returns_data.cov()
            inv_cov = np.linalg.pinv(cov_matrix)
            ones = np.ones((len(returns_data.columns), 1))
            weights = inv_cov @ ones
            weights = weights / weights.sum()
            weights = weights.flatten()
            
        else:
            raise ValueError("method must be 'equal_weight', 'risk_parity', or 'minimum_variance'")
        
        # 计算组合收益和风险
        portfolio_returns = (returns_data * weights).sum(axis=1)
        portfolio_risk = QuantitativeAnalysis.risk_metrics(portfolio_returns)
        
        return {
            'weights': dict(zip(returns_data.columns, weights)),
            'metrics': portfolio_risk,
            'returns': portfolio_returns
        } 