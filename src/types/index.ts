type ConfigOutline = {
  label: string;
}

type ConfigPageOperations = {
  name: string;
  link?: string;
  blank?: boolean;
  list?: {
    name: string;
    value: string;
  }[];
}

type ConfigSidebarOptions = {
  text: string;
  items:{
    text: string;
    link: string;
  }[]
}

type ConfigPage = {
  name?: string; // 程序名称
  favicon?: string; // 网站图标
  description?: string; // 网站描述
  tagline?: string; // 网站标语
  keywords?: string; // 网站关键字
  author?: string; // 网站作者
  host?: string; // 网站域名
  port?: number; // 网站端口
  public?: string; // 公共资源路径
  docs?: string; // 文档路径
  operates?: ConfigPageOperations[]; // 右上角操作
  menu?: ConfigOutline; // 左侧边栏配置
  outline?: ConfigOutline;// 右侧边栏配置
  time?: string; // 网站创建时间
  title?: string; // 网站标题
  sidebar?: ConfigSidebarOptions[]; // 左侧目录内容
  [key: string]: any;
};

type MarkdownItContainerTokenType = {
  info: string;
  nesting: number;
}

export {
    ConfigPage,
    MarkdownItContainerTokenType,
    ConfigSidebarOptions,
    ConfigOutline,
    ConfigPageOperations
}