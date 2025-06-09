/// <reference path="./types/global.d.ts" />

import defaultConfig from "./config";
import matter from "gray-matter";
import MarkdownItAsync, {
  MarkdownItAsync as MarkdownIt,
} from "markdown-it-async";
import markdownitsub from "markdown-it-sub";
import markdownitsup from "markdown-it-sup";
import markdownitfootnote from "markdown-it-footnote";
import markdownitdeflist from "markdown-it-deflist";
import markdownitabbr from "markdown-it-abbr";
import { full as markdownitemoji } from "markdown-it-emoji";
import markdownitcontainer from "markdown-it-container";
import markdownitins from "markdown-it-ins";
import markdownitmark from "markdown-it-mark";
import markdownitanchor from "markdown-it-anchor";
import markdownittocdoneright from "markdown-it-toc-done-right";
import markdownitattrs from "markdown-it-attrs";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  transformerNotationFocus,
  transformerNotationErrorLevel,
  transformerMetaHighlight,
  transformerRenderWhitespace,
  transformerMetaWordHighlight,
  transformerRemoveNotationEscape,
} from "@shikijs/transformers";
import { codeToHtml, ShikiTransformer } from "shiki";
import { alert as markdownitalert } from "@mdit/plugin-alert";
import { figure as markdownitfigure } from "@mdit/plugin-figure";
import { imgLazyload as markdownitImgLazyload } from "@mdit/plugin-img-lazyload";
import { imgSize, obsidianImgSize } from "@mdit/plugin-img-size";
import { katex as markdownitkatex } from "@mdit/plugin-katex";
import { plantuml as markdownitplantuml } from "@mdit/plugin-plantuml";
import { ruby as markdownitruby } from "@mdit/plugin-ruby";
import { spoiler as markdownitspoiler } from "@mdit/plugin-spoiler";
import { tasklist as markdownittasklist } from "@mdit/plugin-tasklist";
import apiDocuPlugin from "./apidoc.plugin";
import chartPlugin from "./chart.plugin";
import type { ConfigPage,MarkdownItContainerTokenType } from "./types";

/**
 * DocuPress静态站点生成器
 */
class DocuPress {
  static instance: DocuPress | null = null;
  #config: ConfigPage = defaultConfig;
  #md: MarkdownIt | null = null;

  constructor(config?: ConfigPage) {
    this.#config = { ...this.#config, ...config };
    this.#initMarkdownIt();
  }

  /**
   * 初始化MarkdownIt
   */
  #initMarkdownIt() {
    const alertTitleMap: Record<string, string> = {
      info: "信息",
      note: "注",
      warning: "警告",
      tip: "提示",
      danger: "危险",
      details: "详情",
      caution: "危险",
      important: "重要",
    };
    /**
     * 添加自定义容器
     */
    const addCustomContainer = (
      md: MarkdownIt,
      container: { name: string; title: string }[]
    ) => {
      container.forEach((item) => {
        md.use(markdownitcontainer, item.name, {
          render: function (
            tokens: MarkdownItContainerTokenType[],
            idx: number
          ) {
            const m = tokens[idx].info.split(" ");
            if (tokens[idx].nesting === 1) {
              return `<div class="custom-container custom-container-${
                item.name
              }"><div class="custom-container-title">${
                m.length > 2 ? md.utils.escapeHtml(m[2]) : item.title
              }</div>\n`;
            } else {
              return "</div>\n";
            }
          },
        });
      });
    };
    // 代码行高亮
    const codeHighlightedTransformer: ShikiTransformer = {
      name: "codeHighlightedTransformer",
      code(node) {
        if (node.children.length > 0) {
          if (
            (
              node.children[node.children.length - 1] as {
                children: { type: string; value: string }[];
              }
            ).children.length === 0
          ) {
            node.children.pop();
          }
        }
      },
    };
    this.#md = MarkdownItAsync({
      html: true, // 可以识别html
      xhtmlOut: true,
      breaks: true, // 回车换行
      langPrefix: "language-",
      linkify: true, // 自动检测链接文本
      typographer: true, // 优化排版，标点
      quotes: "“”‘’",
      async highlight(code, lang) {
        const html = await codeToHtml(code, {
          lang: lang,
          themes: {
            dark: "min-dark",
            light: "min-light",
          },
          defaultColor: false,
          transformers: [
            codeHighlightedTransformer,
            transformerNotationDiff(),
            transformerNotationHighlight(),
            transformerNotationWordHighlight(),
            transformerNotationFocus(),
            transformerNotationErrorLevel(),
            transformerMetaHighlight(),
            transformerRenderWhitespace(),
            transformerMetaWordHighlight(),
            transformerRemoveNotationEscape(),
          ],
        });
        return html;
      },
    })
      .use(markdownitsub) // 下标
      .use(markdownitalert, {
        deep: true,
        titleRender: (tokens, idx) => {
          const token = tokens[idx];
          const content = token.content.trim();
          return `<div class="markdown-alert-title">${
            alertTitleMap[content] || content
          }</div>`;
        },
      }) // GFM 风格的警告
      .use(markdownitsup) // 上标
      .use(markdownitfootnote) // 脚注
      .use(markdownitdeflist) // 定义列表
      .use(markdownitabbr) // 缩写
      .use(markdownitemoji) // 表情
      .use(markdownitins) // 插入
      .use(markdownitmark) // 标记
      .use(markdownitfigure) // 标题图片
      .use(markdownitanchor, {
        permalink: markdownitanchor.permalink.headerLink({
          safariReaderFix: true,
          class: "header-anchor",
        }),
      }) // 标题锚点
      .use(markdownitImgLazyload) // 图片懒加载
      .use(imgSize) // 新格式 图片尺寸
      .use(obsidianImgSize) // Obsidian 格式 图片尺寸
      .use(markdownitkatex) // 公式
      .use(markdownitplantuml) // uml
      .use(markdownitruby) // ruby拼音
      .use(markdownitspoiler) // 隐藏内容
      .use(markdownittasklist) // 任务列表
      .use(markdownittocdoneright, {
        containerClass: "article-outline-of-contents",
        linkClass: "article-outline-link",
      }) // 目录
      .use(markdownitattrs, {
        leftDelimiter: "{",
        rightDelimiter: "}",
        allowedAttributes: [
          "id",
          "class",
          "style",
          "data-*",
          "title",
          "target",
        ], // 为空数组时支持所有属性，当然这是不安全的
      }) // 属性{}
      .use(apiDocuPlugin) // 接口文档
      .use(chartPlugin); // 图表

    // 添加自定义容器
    addCustomContainer(this.#md, [
      {
        name: "info",
        title: "信息",
      },
      {
        name: "tip",
        title: "提示",
      },
      {
        name: "warning",
        title: "警告",
      },
      {
        name: "danger",
        title: "危险",
      },
    ]);

    this.#md.use(markdownitcontainer, "details", {
      render: function (tokens: MarkdownItContainerTokenType[], idx: number) {
        const m = tokens[idx].info.split(" ");
        if (tokens[idx].nesting === 1) {
          return `<details class="custom-container custom-container-details"><summary class="custom-container-title">${
            m.length > 2 ? this.#md.utils.escapeHtml(m[2]) : "详情"
          }</summary>\n`;
        } else {
          return "</details>\n";
        }
      },
    });

    // 禁止将电子邮件转换为链接
    this.#md.linkify.set({ fuzzyEmail: false });
  }

  /**
   * 设置配置
   * @param config 全局配置项
   */
  setConfig(config: ConfigPage) {
    this.#config = { ...this.#config, ...config };
  }

  /**
   * 解析Markdown文本顶部的yaml数据
   * @param text Markdown文本
   */
  parseYaml(text: string): { data: any; content: string } | null {
    return matter(text);
  }

  /**
   * 解析Markdown文本
   * @param config 页面配置,优先级高于全局配置
   * @param text Markdown文本
   * @returns
   */
  parseMd(text: string, config?: ConfigPage) {
    if (config) {
      config = { ...this.#config, ...config };
    } else {
      config = this.#config;
    }
    text = `<article class="article-content"><h1>${
      config.title || ""
    }</h1>\n\n${text}\n\n<footer class="article-footer"><div class="article-info"></div><nav></nav></footer></article><div class="article-outline-content"><div class="article-outline-title">${
      config.outline?.label
    }</div>\n\n[toc]\n\n</div>`;
    return this.#md?.renderAsync(text);
  }

  static getInstance(config?: ConfigPage) {
    if (!DocuPress.instance) {
      DocuPress.instance = new DocuPress(config);
    }
    return DocuPress.instance;
  }
}

export default DocuPress;
export type * from "./types";
