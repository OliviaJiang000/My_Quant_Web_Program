import React, { useState, useEffect } from 'react';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Analytics
} from '@mui/icons-material';
import axios from 'axios';
import Plot from 'react-plotly.js';

interface PortfolioOptimizationResult {
  portfolio: {
    metrics: {
      annual_return: number;
      annual_volatility: number;
      sharpe_ratio: number;
      max_drawdown: number;
      kurtosis: number;
      skewness: number;
      var_95: number;
    };
    weights: { [key: string]: number };
    symbols: string[];
    optimization_method: string;
    period: string;
  };
  correlation_matrix: { [key: string]: { [key: string]: number } };
  individual_metrics: { 
    [key: string]: {
      annual_return: number;
      annual_volatility: number;
      sharpe_ratio: number;
      max_drawdown: number;
      kurtosis: number;
      skewness: number;
      var_95: number;
    };
  };
}

const Portfolio: React.FC = () => {
  const [symbols, setSymbols] = useState('AAPL,GOOGL,MSFT,TSLA,AMZN');
  const [days, setDays] = useState(252);
  const [optimizationType, setOptimizationType] = useState('max_sharpe');
  const [result, setResult] = useState<PortfolioOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:5001/api';

  const handleOptimize = async () => {
    if (!symbols.trim()) {
      setError('请输入股票代码');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE_URL}/portfolio/analysis`, {
        symbols: symbols.split(',').map(s => s.trim()),
        days: days,
        optimization_type: optimizationType
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '优化失败');
    } finally {
      setLoading(false);
    }
  };

  const renderWeights = () => {
    if (!result) return null;

    const weights = Object.entries(result.portfolio.weights).map(([symbol, weight]) => ({
      symbol,
      weight: weight * 100
    }));

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            优化投资组合权重
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>股票代码</TableCell>
                  <TableCell align="right">权重 (%)</TableCell>
                  <TableCell align="right">状态</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {weights.map((item) => (
                  <TableRow key={item.symbol}>
                    <TableCell component="th" scope="row">
                      <Typography variant="subtitle2" fontWeight="bold">
                        {item.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {item.weight.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={item.weight > 20 ? "重配" : item.weight > 10 ? "标配" : "轻配"}
                        color={item.weight > 20 ? "error" : item.weight > 10 ? "primary" : "default"}
                        size="small"
                      />
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

  const renderMetrics = () => {
    if (!result) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          组合优化结果
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      预期年化收益率
                    </Typography>
                    <Typography variant="h4" component="div" color="success.main">
                      {(result.portfolio.metrics.annual_return * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box sx={{ color: '#4caf50' }}>
                    <TrendingUp sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      年化波动率
                    </Typography>
                    <Typography variant="h4" component="div" color="warning.main">
                      {(result.portfolio.metrics.annual_volatility * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box sx={{ color: '#ff9800' }}>
                    <TrendingDown sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      夏普比率
                    </Typography>
                    <Typography variant="h4" component="div" color="primary.main">
                      {result.portfolio.metrics.sharpe_ratio.toFixed(3)}
                    </Typography>
                  </Box>
                  <Box sx={{ color: '#1976d2' }}>
                    <Analytics sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      最大回撤
                    </Typography>
                    <Typography variant="h4" component="div" 
                      color={result.portfolio.metrics.max_drawdown < -0.15 ? "error.main" : "warning.main"}>
                      {(result.portfolio.metrics.max_drawdown * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box sx={{ color: '#f44336' }}>
                    <TrendingDown sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      VaR (95%)
                    </Typography>
                    <Typography variant="h4" component="div" color="error.main">
                      {(result.portfolio.metrics.var_95 * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box sx={{ color: '#d32f2f' }}>
                    <Analytics sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      股票数量
                    </Typography>
                    <Typography variant="h4" component="div">
                      {Object.keys(result.portfolio.weights).length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {result.portfolio.optimization_method}
                    </Typography>
                  </Box>
                  <Box sx={{ color: '#9c27b0' }}>
                    <AccountBalanceWallet sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderCorrelationMatrix = () => {
    if (!result || !result.correlation_matrix || !result.portfolio.symbols) return null;

    const symbols = Object.keys(result.correlation_matrix);
    const matrix = symbols.map(row => symbols.map(col => result.correlation_matrix[row][col]));

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            相关性矩阵
          </Typography>
          <Plot
            data={[
              {
                z: matrix,
                x: symbols,
                y: symbols,
                type: 'heatmap',
                colorscale: 'RdBu',
                zmid: 0,
                colorbar: {
                  title: '相关系数'
                }
              }
            ]}
            layout={{
              title: '股票间相关性分析',
              xaxis: { title: '股票代码' },
              yaxis: { title: '股票代码' },
              height: 400,
              autosize: true
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '400px' }}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        投资组合优化
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="股票代码 (逗号分隔)"
                value={symbols}
                onChange={(e) => setSymbols(e.target.value)}
                placeholder="AAPL,GOOGL,MSFT,TSLA,AMZN"
                helperText="输入要优化的股票代码，用逗号分隔"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="历史天数"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                inputProps={{ min: 30, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>优化类型</InputLabel>
                <Select
                  value={optimizationType}
                  label="优化类型"
                  onChange={(e) => setOptimizationType(e.target.value)}
                >
                  <MenuItem value="max_sharpe">最大夏普比率</MenuItem>
                  <MenuItem value="min_volatility">最小波动率</MenuItem>
                  <MenuItem value="max_return">最大收益率</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleOptimize}
                disabled={loading}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : '开始优化'}
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
              <Grid item xs={12} md={6}>
                {renderWeights()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderCorrelationMatrix()}
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Portfolio; 