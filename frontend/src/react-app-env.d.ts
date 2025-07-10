/// <reference types="react-scripts" />

// TypeScript 类型声明 - 禁用特定的类型检查
declare module '@mui/material/Grid' {
  const Grid: any;
  export default Grid;
}

declare module 'react-plotly.js' {
  const Plot: any;
  export default Plot;
}
