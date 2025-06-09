import { MarkdownItAsync as MarkdownIt } from "markdown-it-async";
import StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import JSON5 from "json5";
import * as echarts from "echarts";

interface MarkdownItPluginOptions {
  className?: string;
}

function container(
  state: StateBlock,
  startLine: number,
  endLine: number
): boolean {
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const endPos = state.eMarks[startLine];
  const lineText = state.src.slice(startPos, endPos).trim();

  // 非@chartStart
  if (lineText !== "@chartStart") return false;

  // 找到 @chartEnd 的位置
  let nextLine = startLine + 1;
  while (nextLine < endLine) {
    const nextLineText = state.src
      .slice(
        state.bMarks[nextLine] + state.tShift[nextLine],
        state.eMarks[nextLine]
      )
      .trim();
    if (nextLineText === "@chartEnd") break;
    nextLine++;
  }

  // 提取 @chartStart 到 @chartEnd 之间的内容
  const content = state.src
    .slice(state.bMarks[startLine + 1], state.eMarks[nextLine - 1])
    .trim();

  const chartData = JSON5.parse(content);

  // 创建 token
  const token = state.push("chart", "", 0);
  token.meta = chartData;
  token.map = [startLine, nextLine];

  // 更新 state
  state.line = nextLine + 1;

  return true;
}

/**
 * 渲染图表
 * @param chartData 绘制图表的options
 */
function renderChart(chartData: any): string {
  return `
  <div class="chart chart-pc chart-pc-light">${createSvgString(800,500,chartData)}</div>
  <div class="chart chart-mobile chart-mobile-light">${createSvgString(500,800,chartData)}</div>
  `;
}

/**
 * 创建SVG字符串
 * @param width 宽
 * @param height 高
 * @param theme 主题，默认null为亮
 */
function createSvgString(width: number,height:number,chartData: any, theme: "dark" | null = null):  string { 
  let chart:echarts.EChartsType | null = echarts.init(null,theme,{
    renderer: 'svg',
    ssr:true,
    width: width,
    height: height,
  });
  chart.setOption(chartData);
  const svgString = chart.renderToSVGString();
  chart.dispose();
  chart  = null;
  return svgString;
}

/**
 * 处理图表插件
 */
const chartPlugin = (md: MarkdownIt, options?: MarkdownItPluginOptions) => {
  options = options || {};

  md.block.ruler.before("fence", "chart", container, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  md.renderer.rules.chart = (tokens, idx) => {
    const chartData = tokens[idx].meta;
    return renderChart(chartData);
  };
};

export default chartPlugin;
