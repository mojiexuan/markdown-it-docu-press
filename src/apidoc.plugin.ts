import StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import {
  MarkdownItAsync as MarkdownIt,
} from "markdown-it-async";
import hljs from "highlight.js";

interface MarkdownItPluginOptions {
  className?: string;
}

interface DataType {
  name: string;
  type: string;
  value: string;
  description: string;
  required: boolean;
}

class DataTypeImpl implements DataType {
  name = "";
  type = "String";
  value = "";
  description = "";
  required = false;

  constructor(
    name: string,
    type: string,
    value: string,
    description: string,
    required: boolean
  ) {
    this.name = name;
    this.type = type;
    this.value = value;
    this.description = description;
    this.required = required;
  }
}

interface ApiBlock {
  name?: string;
  method?:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "OPTIONS"
    | "HEAD"
    | "CONNECT"
    | "TRACE"
    | "ALL";
  path?: string;
  description?: string;
  header?: DataType[];
  body?: DataType[];
  param?: DataType[];
  success?: DataType[];
  successExample?: string;
  error?: DataType[];
  errorExample?: string;
  version?: string;
  [key: string]: any;
}

/**
 * 提取内容
 */
function container(state: StateBlock, startLine: number, endLine: number) {
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const endPos = state.eMarks[startLine];
  const lineText = state.src.slice(startPos, endPos).trim();

  // 非@apiStart开头
  if (lineText !== "@apiStart") return false;

  // 找到 @apiEnd 的位置
  let nextLine = startLine + 1;
  while (nextLine < endLine) {
    const nextLineText = state.src
      .slice(
        state.bMarks[nextLine] + state.tShift[nextLine],
        state.eMarks[nextLine]
      )
      .trim();
    if (nextLineText === "@apiEnd") break;
    nextLine++;
  }

  // 提取 @apiStart 到 @apiEnd 之间的内容
  const content = state.src
    .slice(state.bMarks[startLine + 1], state.eMarks[nextLine - 1])
    .trim();

  // 解析 apidoc 语法
  const apiData = parseApidocContent(content);

  // 创建 token
  const token = state.push("apidoc", "", 0);
  token.meta = apiData;
  token.map = [startLine, nextLine];

  // 更新 state
  state.line = nextLine + 1;

  return true;
}

/**
 * 解析文档内容
 * @param content apidoc 内容
 */
function parseApidocContent(content: string): ApiBlock {
  const lines = content.split("\n");
  const apiData: ApiBlock = {};
  let currentExample: string[] = [];
  let currentExampleType: "successExample" | "errorExample" | null = null;
  let currentExampleLang = "text";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 处理示例开始标记
    if (line.trim().startsWith("@apiSuccessExample")) {
      currentExample = [];
      currentExampleType = "successExample";
      const typeMatch = line.match(/^.*?\{([^{}]*)\}/);
      if (typeMatch){
        currentExampleLang = typeMatch[1].trim();
      }
      continue;
    }
    if (line.trim().startsWith("@apiErrorExample")) {
      currentExample = [];
      currentExampleType = "errorExample";
      const typeMatch = line.match(/^.*?\{([^{}]*)\}/);
      if (typeMatch){
        currentExampleLang = typeMatch[1].trim();
      }
      continue;
    }

    if (currentExampleType) {
      if(!line.trimStart().startsWith("@api")){
        currentExample.push(line);
      }
      if(i === lines.length - 1 || line.trimStart().startsWith("@api")){
        apiData[currentExampleType] = hljs.highlight(currentExample.join("\n"), {language: currentExampleLang}).value;
        currentExample = [];
        currentExampleType = null;
      }
    }
    //================
    if (!line) continue;
    if (!line.startsWith("@api")) continue;

    const [directive, ...rest] = line.split(/\s+/);
    const value = rest.join(" ").trim();

    switch (directive) {
      case "@apiName":
        apiData.name = value;
        break;
      case "@apiMethod":
        switch (value.toLocaleUpperCase()) {
          case "GET":
            apiData.method = "GET";
            break;
          case "POST":
            apiData.method = "POST";
            break;
          case "PUT":
            apiData.method = "PUT";
            break;
          case "DELETE":
            apiData.method = "DELETE";
            break;
          case "PATCH":
            apiData.method = "PATCH";
            break;
          case "HEAD":
            apiData.method = "HEAD";
            break;
          case "OPTIONS":
            apiData.method = "OPTIONS";
            break;
          case "TRACE":
            apiData.method = "TRACE";
            break;
          case "CONNECT":
            apiData.method = "CONNECT";
            break;
          case "HEAD":
            apiData.method = "HEAD";
            break;
          default:
            apiData.method = "ALL";
        }
        break;
      case "@apiPath":
        apiData.path = value;
        break;
      case "@apiDescription":
        apiData.description = value;
        break;
      case "@apiHeader":
      case "@apiParam":
      case "@apiBody":
      case "@apiSuccess":
      case "@apiError":
        // @apiParam {number} [id=8] [required] 用户ID
        // @apiParam {string} [name] 用户名
        const data = parseData(line);
        if (data) {
          const field = directive
            .replace("@api", "")
            .toLowerCase() as keyof ApiBlock;
          if (!apiData[field]) apiData[field] = [];
          (apiData[field] as DataType[]).push(data);
        }
        break;
      case "@apiVersion":
        apiData.version = value;
        break;
    }
  }

  return apiData;
}

/**
 * 解析对象数据
 */
function parseData(line: string): DataType | null {
  // 提取类型
  const typeMatch = line.match(/@api\w+\s+\{([^}]+)\}/);
  if (!typeMatch) return null;
  const type = typeMatch[1].trim();

  // 提取名称和值
  const bracketMatch = line.match(/^[^\[]*\[([^\]]+)\]/);
  if (!bracketMatch) return null;
  const bracketContent = bracketMatch[1].trim();
  let [name, defaultValue = ""] = bracketContent
    .split("=")
    .map((s) => s.trim());

  // 检查必填标记
  const isRequired = /<required>/.test(line);

  // 提取描述文本（移除已处理的部分）
  const description = line
    .replace(/@api\w+\s+\{[^}]+\}\s*/, "")
    .replace(/\[.*?\]/g, "")
    .replace(/<required>\s*/, "")
    .trim();

  return new DataTypeImpl(
    name || "",
    type || "string",
    defaultValue,
    description || "",
    isRequired
  );
}

// 渲染为 HTML
function renderApidoc(apiData: ApiBlock):string {
  return `
  <section class="apidoc ${
    apiData.method
      ? `apidoc-${apiData.method.toLocaleLowerCase()}`
      : "apidoc-all"
  }">
    ${
      apiData.name
        ? `<h4 class="apidoc-name">${apiData.name}${
            apiData.version
              ? `<sup class="apidoc-version">${apiData.version}</sup>`
              : ""
          }</h4>`
        : ""
    }
    <div class="apidoc-api">
      ${
        apiData.method
          ? `<div class="apidoc-api-method apidoc-api-method-${apiData.method.toLocaleLowerCase()}">${
              apiData.method
            }</div>`
          : `<div class="apidoc-api-method apidoc-api-method-all">ALL</div>`
      }
      ${
        apiData.path
          ? `<div class="apidoc-api-path ${
              apiData.method
                ? `apidoc-api-path-${apiData.method.toLocaleLowerCase()}`
                : ""
            }">${apiData.path}</div>`
          : ""
      }
    </div>
    ${
      apiData.description
        ? `<div class="apidoc-tab">接口描述</div><div class="apidoc-description">${apiData.description}</div>`
        : ""
    }
    ${renderTable("请求头", apiData.header)}
    ${renderTable("请求参数", apiData.param)}
    ${renderTable("请求体", apiData.body)}
    ${renderTable("响应成功", apiData.success)}
    ${apiData.successExample ? `<div class="apidoc-tab">响应成功示例</div><pre class="hljs"><code>${apiData.successExample}</code></pre>` : ""}
    ${renderTable("响应失败", apiData.error)}
    ${apiData.errorExample ? `<div class="apidoc-tab">响应失败示例</div><pre class="hljs"><code>${apiData.errorExample}</code></pre>` : ""}
  </section>
  `;
}

/**
 * 渲染表格
 */
function renderTable(title: string, data?: DataType[]) {
  if (!data?.length) return "";

  return `
  <div class="apidoc-tab">${title}</div>
  <table class="apidoc-table-content">
  <thead>
    <tr>
      <th>参数名称</th>
      <th>数据类型</th>
      <th>是否必填</th>
      <th>参数说明</th>
    </tr>
  </thead>
  <tbody>
    ${data
      .map((item) => {
        return `
      <tr>
        <td>${item.name}</td>
        <td>${item.type}</td>
        ${item.required ? `<td class="yes">是</td>` : `<td class="no">否</td>`}
        <td>${item.description}</td>
      </tr>
      `;
      })
      .join("")}
  </tbody>
  </table>
  `;
}

/**
 * 渲染示例内容
 * @param data 示例内容
 */
function renderExample(data: string,lang = "text"): string {
  return `
  <pre class="lang-${lang}"><code>${
    typeof data === "string" ? data : JSON.stringify(data, null, 2)
  }</code></pre>
  `;
}

/**
 * 处理接口文档插件
 */
const apiDocuPlugin = (md: MarkdownIt, options?: MarkdownItPluginOptions) => {
  options = options || {};

  md.block.ruler.before("fence", "apidoc", container, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  md.renderer.rules.apidoc = (tokens, idx) => {
    const apiData = tokens[idx].meta as ApiBlock;
    return renderApidoc(apiData);
  };
};

export default apiDocuPlugin;
