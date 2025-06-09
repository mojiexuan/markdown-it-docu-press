import { getNowDate } from "./utils/time.utils";
import type { ConfigPage } from "./types";

const defaultConfig: ConfigPage = {
  app: {
    name: "DocuPress",
    favicon: "/favicon.ico",
    description: "一个SEO友好的博客、文档及知识库管理工具",
    tagline: "代码󠇗笔󠆐墨󠅱 心若󠇗星󠆅河󠅼 创意󠇘通󠆭灵󠆙",
    keywords:
      "DocuPress、码界轩、博客、文档、SEO、博客系统、文档系统、博客框架、文档框架、博客系统框架、文档系统框架",
    author: "陈佳宝, mail@chenjiabao.com",
    host: "0.0.0.0",
    port: 3000,
    public: "/public",
    docs: "/docs",
    operates: [
      {
        name: "首页",
        link: "/",
      },
      {
        name: "lang",
        list: [
          {
            name: "zh-CN",
            value: "中文",
          },
          {
            name: "en-US",
            value: "English",
          },
        ],
      },
      {
        name: "theme",
      },
      {
        name: "github",
        link: "https://github.com/majiexuan",
        blank: true,
      },
    ],
    menu: {
      label: "菜单",
    },
    outline: {
      label: "页面导航",
    },
    time: getNowDate(),
  },
};

export default defaultConfig;
