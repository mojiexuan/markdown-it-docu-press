type PluginSimple = ((md: MarkdownItAsync) => void);

declare module "markdown-it-ins" {
  const markdownItPlugin: PluginSimple;
  export = markdownItPlugin;
}

declare module "markdown-it-mark" {
  const markdownItPlugin: PluginSimple;
  export = markdownItPlugin;
}

declare module "markdown-it-sub" {
  const markdownItPlugin: PluginSimple;
  export = markdownItPlugin;
}

declare module "markdown-it-sup" {
  const markdownItPlugin: PluginSimple;
  export = markdownItPlugin;
}

declare module "markdown-it-footnote" {
  const markdownItPlugin: PluginSimple;
  export = markdownItPlugin;
}

declare module "markdown-it-deflist" {
  const markdownItPlugin: PluginSimple;
  export = markdownItPlugin;
}

declare module "markdown-it-abbr" {
  const markdownItPlugin: PluginSimple;
  export = markdownItPlugin;
}

declare module "markdown-it-emoji" {
  const markdownItPlugin = {
    full: PluginSimple,
  };
  export = markdownItPlugin;
}

declare module "markdown-it-container" {
  const markdownItPlugin: PluginSimple;
  export = markdownItPlugin;
}