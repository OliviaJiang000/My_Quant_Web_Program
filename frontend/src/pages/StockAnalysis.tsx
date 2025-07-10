import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import axios from 'axios';
import Plot from 'react-plotly.js';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StockAnalysis: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [days, setDays] = useState(90);
  const [tabValue, setTabValue] = useState(0);
  const [chartData, setChartData] = useState<any>(null);
  const [indicators, setIndicators] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:5001/api';

  const handleAnalyze = async () => {
    if (!symbol) {
      setError('请输入股票代码');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 获取图表数据
      const chartResponse = await axios.get(
        `${API_BASE_URL}/stock/${symbol}/chart?days=${days}&type=candlestick`
      );
      setChartData(chartResponse.data);

      // 获取技术指标
      const indicatorsResponse = await axios.get(
        `${API_BASE_URL}/stock/${symbol}/indicators?days=${days}&indicators=all`
      );
      setIndicators(indicatorsResponse.data);

      // 获取分析数据
      const analysisResponse = await axios.get(
        `${API_BASE_URL}/stock/${symbol}/analysis?days=${days}`
      );
      setAnalysis(analysisResponse.data);

    } catch (err: any) {
      setError(err.response?.data?.error || '分析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderChart = () => {
    if (!chartData) return null;

    return (
      <Plot
        data={chartData.chart.data}
        layout={{
          ...chartData.chart.layout,
          autosize: true,
          responsive: true,
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '500px' }}
      />
    );
  };

  const renderIndicators = () => {
    if (!indicators || !indicators.indicators) return null;

    const { moving_averages, rsi, macd, bollinger_bands } = indicators.indicators;
    const dates = indicators.dates;

    return (
      <Grid container spacing={3}>
        {/* RSI 图表 */}
        {rsi && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>RSI 指标</Typography>
                <Plot
                  data={[
                    {
                      x: dates,
                      y: rsi,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'RSI',
                      line: { color: '#ff9800' }
                    }
                  ]}
                  layout={{
                    title: 'RSI (相对强弱指数)',
                    yaxis: { range: [0, 100] },
                    height: 300,
                    autosize: true
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '300px' }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* MACD 图表 */}
        {macd && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>MACD 指标</Typography>
                <Plot
                  data={[
                    {
                      x: dates,
                      y: macd.macd,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'MACD',
                      line: { color: '#2196f3' }
                    },
                    {
                      x: dates,
                      y: macd.signal,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Signal',
                      line: { color: '#f44336' }
                    }
                  ]}
                  layout={{
                    title: 'MACD',
                    height: 300,
                    autosize: true
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '300px' }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderAnalysis = () => {
    if (!analysis) return null;

    const { risk_metrics, price_statistics, performance } = analysis;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                风险指标
              </Typography>
              <Box>
                <Typography variant="body2">年化收益率: {(risk_metrics.annual_return * 100).toFixed(2)}%</Typography>
                <Typography variant="body2">年化波动率: {(risk_metrics.annual_volatility * 100).toFixed(2)}%</Typography>
                <Typography variant="body2">夏普比率: {risk_metrics.sharpe_ratio}</Typography>
                <Typography variant="body2">最大回撤: {(risk_metrics.max_drawdown * 100).toFixed(2)}%</Typography>
                <Typography variant="body2">VaR (95%): {(risk_metrics.var_95 * 100).toFixed(2)}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                价格统计
              </Typography>
              <Box>
                <Typography variant="body2">当前价格: ${price_statistics.current_price}</Typography>
                <Typography variant="body2">期间最高: ${price_statistics.period_high}</Typography>
                <Typography variant="body2">期间最低: ${price_statistics.period_low}</Typography>
                <Typography variant="body2">平均价格: ${price_statistics.average_price}</Typography>
                <Typography variant="body2">平均成交量: {price_statistics.average_volume.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                表现统计
              </Typography>
              <Box>
                <Typography variant="body2">总收益率: {performance.total_return}%</Typography>
                <Typography variant="body2">最佳单日: {performance.best_day}%</Typography>
                <Typography variant="body2">最差单日: {performance.worst_day}%</Typography>
                <Typography variant="body2">上涨天数: {performance.positive_days}</Typography>
                <Typography variant="body2">下跌天数: {performance.negative_days}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        股票分析
      </Typography>

      {/* 输入控件 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                label="股票代码"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                fullWidth
                placeholder="输入股票代码，如 AAPL"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>时间周期</InputLabel>
                <Select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  label="时间周期"
                >
                  <MenuItem value={30}>30天</MenuItem>
                  <MenuItem value={60}>60天</MenuItem>
                  <MenuItem value={90}>90天</MenuItem>
                  <MenuItem value={180}>180天</MenuItem>
                  <MenuItem value={252}>252天 (1年)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={handleAnalyze}
                disabled={loading}
                fullWidth
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : '分析'}
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

      {/* 结果显示 */}
      {(chartData || indicators || analysis) && (
        <Paper sx={{ width: '100%', mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="价格图表" />
              <Tab label="技术指标" />
              <Tab label="量化分析" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {renderChart()}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {renderIndicators()}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {renderAnalysis()}
          </TabPanel>
        </Paper>
      )}
    </Box>
  );
};

export default StockAnalysis; 