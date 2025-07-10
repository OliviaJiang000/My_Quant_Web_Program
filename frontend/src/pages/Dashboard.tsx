import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Analytics,
  Assessment
} from '@mui/icons-material';
import axios from 'axios';

interface StockInfo {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  latest_price: number;
  price_change: number;
}

interface ApiHealth {
  status: string;
  data_loaded: boolean;
  total_stocks: number;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 获取健康状态
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      setHealth(healthResponse.data);
      
      // 获取股票列表
      const stocksResponse = await axios.get(`${API_BASE_URL}/stocks`);
      console.log('Stocks response:', stocksResponse.data); // 调试日志
      console.log('Has stocks property:', !!stocksResponse.data.stocks);
      console.log('Is array:', Array.isArray(stocksResponse.data.stocks));
      
      // 验证数据结构
      if (stocksResponse.data && stocksResponse.data.stocks && Array.isArray(stocksResponse.data.stocks)) {
        // 过滤掉无效数据（NaN价格等）
        const validStocks = stocksResponse.data.stocks.filter((stock: StockInfo) => 
          stock && !isNaN(stock.latest_price) && typeof stock.symbol === 'string'
        );
        setStocks(validStocks.slice(0, 10)); // 只显示前10支股票
        console.log('Successfully loaded stocks:', validStocks.length);
      } else {
        console.error('Unexpected data structure:', stocksResponse.data);
        setError('API返回的数据格式不正确');
        return;
      }
      
      setError(null);
    } catch (err) {
      setError('无法连接到API服务器，请确保后端服务正在运行');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const positiveStocks = stocks.filter(s => s.price_change > 0).length;
  const negativeStocks = stocks.filter(s => s.price_change < 0).length;
  const totalVolume = stocks.reduce((sum, stock) => sum + stock.volume, 0);
  const avgPrice = stocks.length > 0 ? stocks.reduce((sum, stock) => sum + stock.close, 0) / stocks.length : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        量化研究仪表板
      </Typography>
      
      {health && (
        <Alert severity={health.data_loaded ? "success" : "warning"} sx={{ mb: 3 }}>
          API状态: {health.status} | 
          数据加载: {health.data_loaded ? "成功" : "失败"} | 
          总股票数: {health.total_stocks}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="总股票数"
            value={health?.total_stocks || 0}
            icon={<Analytics sx={{ fontSize: 40 }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="上涨股票"
            value={positiveStocks}
            icon={<TrendingUp sx={{ fontSize: 40 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="下跌股票"
            value={negativeStocks}
            icon={<TrendingDown sx={{ fontSize: 40 }} />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="平均股价"
            value={`$${avgPrice.toFixed(2)}`}
            icon={<Assessment sx={{ fontSize: 40 }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <StatCard
            title="总成交量"
            value={`${(totalVolume / 1000000).toFixed(1)}M`}
            icon={<Assessment sx={{ fontSize: 40 }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard
            title="数据日期"
            value={stocks.length > 0 ? stocks[0].date : '-'}
            icon={<Analytics sx={{ fontSize: 40 }} />}
            color="#00bcd4"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                热门股票 - OHLCV数据
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>股票代码</TableCell>
                      <TableCell align="right">日期</TableCell>
                      <TableCell align="right">开盘价</TableCell>
                      <TableCell align="right">最高价</TableCell>
                      <TableCell align="right">最低价</TableCell>
                      <TableCell align="right">收盘价</TableCell>
                      <TableCell align="right">涨跌幅 (%)</TableCell>
                      <TableCell align="right">成交量</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stocks.map((stock) => (
                      <TableRow key={stock.symbol}>
                        <TableCell component="th" scope="row">
                          <Typography variant="subtitle2" fontWeight="bold">
                            {stock.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="textSecondary">
                            {stock.date}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          ${stock.open.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: 'success.main', fontWeight: 'bold' }}>
                            ${stock.high.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            ${stock.low.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            ${stock.close.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{
                            color: stock.price_change >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {stock.price_change >= 0 ? '+' : ''}{stock.price_change.toFixed(2)}%
                        </TableCell>
                        <TableCell align="right">
                          {stock.volume.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 