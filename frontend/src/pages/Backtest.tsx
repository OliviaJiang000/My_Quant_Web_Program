import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Assessment
} from '@mui/icons-material';
import axios from 'axios';
import Plot from 'react-plotly.js';

interface BacktestResult {
  symbol: string;
  strategy: string;
  period: string;
  benchmark_performance: {
    total_return: number;
    annual_return: number;
    annual_volatility: number;
    sharpe_ratio: number;
    max_drawdown: number;
  };
  strategy_performance: {
    annual_return: number;
    annual_volatility: number;
    sharpe_ratio: number;
    max_drawdown: number;
    kurtosis: number;
    skewness: number;
    var_95: number;
  };
  backtest_data: {
    dates: string[];
    benchmark_equity: number[];
    strategy_equity: number[];
    signals: number[];
  };
}

const Backtest: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [strategy, setStrategy] = useState('moving_average');
  const [days, setDays] = useState(252);
  const [maShort, setMaShort] = useState(20);
  const [maLong, setMaLong] = useState(50);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [rsiOverbought, setRsiOverbought] = useState(70);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:5001/api';

  const handleBacktest = async () => {
    if (!symbol.trim()) {
      setError('请输入股票代码');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: any = {
        days: days,
        strategy: strategy
      };

      if (strategy === 'moving_average') {
        params.ma_short = maShort;
        params.ma_long = maLong;
      } else if (strategy === 'rsi') {
        params.rsi_period = rsiPeriod;
        params.rsi_oversold = rsiOversold;
        params.rsi_overbought = rsiOverbought;
      }

      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}/backtest`, {
        params: params
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '回测失败');
    } finally {
      setLoading(false);
    }
  };

  const renderMetrics = () => {
    if (!result) return null;

    // 计算总收益率（最后一个净值 - 初始净值）
    const strategyEquity = result.backtest_data?.strategy_equity || [];
    const totalReturn = strategyEquity.length > 0 ? 
      (strategyEquity[strategyEquity.length - 1] - strategyEquity[0]) / strategyEquity[0] : 0;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    总收益率
                  </Typography>
                  <Typography variant="h4" component="div" 
                    color={totalReturn >= 0 ? "success.main" : "error.main"}>
                    {(totalReturn * 100).toFixed(2)}%
                  </Typography>
                </Box>
                <Box sx={{ color: totalReturn >= 0 ? '#4caf50' : '#f44336' }}>
                  {totalReturn >= 0 ? 
                    <TrendingUp sx={{ fontSize: 40 }} /> : 
                    <TrendingDown sx={{ fontSize: 40 }} />
                  }
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    年化收益率
                  </Typography>
                  <Typography variant="h4" component="div" 
                    color={(result.strategy_performance?.annual_return || 0) >= 0 ? "success.main" : "error.main"}>
                    {((result.strategy_performance?.annual_return || 0) * 100).toFixed(2)}%
                  </Typography>
                </Box>
                <Box sx={{ color: '#1976d2' }}>
                  <ShowChart sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    夏普比率
                  </Typography>
                  <Typography variant="h4" component="div" color="primary.main">
                    {(result.strategy_performance?.sharpe_ratio || 0).toFixed(3)}
                  </Typography>
                </Box>
                <Box sx={{ color: '#9c27b0' }}>
                  <Assessment sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    最大回撤
                  </Typography>
                  <Typography variant="h4" component="div" color="error.main">
                    {((result.strategy_performance?.max_drawdown || 0) * 100).toFixed(2)}%
                  </Typography>
                </Box>
                <Box sx={{ color: '#f44336' }}>
                  <TrendingDown sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderPerformanceChart = () => {
    if (!result || !result.backtest_data?.dates || !result.backtest_data?.strategy_equity) return null;

    const chartData = [
      {
        x: result.backtest_data.dates,
        y: result.backtest_data.strategy_equity,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: '策略净值',
        line: { color: '#1976d2', width: 2 }
      }
    ];

    // 如果有基准数据，也添加到图表中
    if (result.backtest_data.benchmark_equity) {
      chartData.push({
        x: result.backtest_data.dates,
        y: result.backtest_data.benchmark_equity,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: '基准净值',
        line: { color: '#ff9800', width: 2 }
      });
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            策略表现曲线
          </Typography>
          <Plot
            data={chartData}
            layout={{
              title: `${result.strategy} 策略回测结果`,
              xaxis: { title: '日期' },
              yaxis: { title: '组合净值' },
              height: 400,
              autosize: true,
              hovermode: 'x unified'
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '400px' }}
          />
        </CardContent>
      </Card>
    );
  };

  const renderTradesTable = () => {
    // 新的API暂时不返回交易记录，显示信号数据
    if (!result || !result.backtest_data?.signals || !result.backtest_data?.dates) return null;

    const signals = result.backtest_data.signals;
    const dates = result.backtest_data.dates;
    
    // 找到信号变化的点（买入/卖出信号）
    const signalChanges = [];
    for (let i = 1; i < signals.length; i++) {
      if (signals[i] !== signals[i - 1]) {
        signalChanges.push({
          date: dates[i],
          action: signals[i] === 1 ? 'buy' : 'sell',
          signal: signals[i]
        });
      }
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            交易信号 (最近10个)
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>日期</TableCell>
                  <TableCell>信号</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {signalChanges.slice(-10).reverse().map((signal, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(signal.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={signal.action === 'buy' ? '买入信号' : '卖出信号'}
                        color={signal.action === 'buy' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {signal.action === 'buy' ? '建仓' : '平仓'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderStrategyParams = () => {
    if (strategy === 'moving_average') {
      return (
        <>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label="短期均线"
              value={maShort}
              onChange={(e) => setMaShort(Number(e.target.value))}
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label="长期均线"
              value={maLong}
              onChange={(e) => setMaLong(Number(e.target.value))}
              inputProps={{ min: 1, max: 200 }}
            />
          </Grid>
        </>
      );
    } else if (strategy === 'rsi') {
      return (
        <>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label="RSI周期"
              value={rsiPeriod}
              onChange={(e) => setRsiPeriod(Number(e.target.value))}
              inputProps={{ min: 1, max: 50 }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label="超卖阈值"
              value={rsiOversold}
              onChange={(e) => setRsiOversold(Number(e.target.value))}
              inputProps={{ min: 1, max: 50 }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label="超买阈值"
              value={rsiOverbought}
              onChange={(e) => setRsiOverbought(Number(e.target.value))}
              inputProps={{ min: 50, max: 100 }}
            />
          </Grid>
        </>
      );
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        策略回测
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="股票代码"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                helperText="输入股票代码"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>策略类型</InputLabel>
                <Select
                  value={strategy}
                  label="策略类型"
                  onChange={(e) => setStrategy(e.target.value)}
                >
                  <MenuItem value="moving_average">移动平均线</MenuItem>
                  <MenuItem value="rsi">RSI策略</MenuItem>
                  <MenuItem value="buy_and_hold">买入持有</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="回测天数"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                inputProps={{ min: 30, max: 1000 }}
              />
            </Grid>
            {renderStrategyParams()}
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleBacktest}
                disabled={loading}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : '开始回测'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box>
          {renderMetrics()}
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderPerformanceChart()}
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderTradesTable()}
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      策略统计
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            策略名称:
                          </Typography>
                          <Typography variant="h6">
                            {result.strategy}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            年化波动率:
                          </Typography>
                          <Typography variant="h6" color="primary.main">
                            {((result.strategy_performance?.annual_volatility || 0) * 100).toFixed(2)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            偏度:
                          </Typography>
                          <Typography variant="h6">
                            {(result.strategy_performance?.skewness || 0).toFixed(3)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            回测周期:
                          </Typography>
                          <Typography variant="h6">
                            {result.period || `${days}天`}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            峰度:
                          </Typography>
                          <Typography variant="h6">
                            {(result.strategy_performance?.kurtosis || 0).toFixed(3)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            VaR (95%):
                          </Typography>
                          <Typography variant="h6" color="error.main">
                            {((result.strategy_performance?.var_95 || 0) * 100).toFixed(2)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Backtest; 