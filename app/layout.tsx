/* eslint-disable @next/next/no-page-custom-font */
import "./styles/globals.scss";
import "./styles/markdown.scss";
import "./styles/highlight.scss";
import { getClientConfig } from "./config/client";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "灵格若 | 个性化AI助手",
  description: "上传文档、音视频使用人工智能技术打造专属知识库，智能网络引擎搜索最新信息，用数据驱动人工智能，让你的AI对话伙伴精准且有创意的回复，做您最佳的生活、学习、工作效率搭子。开始对话，探索个性化AI助手！",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
  appleWebApp: {
    title: "灵格若",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
    <head>
      <meta name="config" content={JSON.stringify(getClientConfig())}/>
      <meta name="google-site-verification" content="BNJzpXR7xJdj-8AT0nUjbIIHeXWBxBtBF3xYPqGl81E"/>
      <meta name="keywords" content="个性化AI助手，构建专属知识库驱动人工智能，网络引擎搜索驱动人工智能，RAG，多种大语言模型基座，最佳的生活、学习、工作效率搭子"/>
      <link rel="manifest" href="/site.webmanifest"></link>
      <script src="/serviceWorkerRegister.js" defer></script>
    </head>
    <body>{children}</body>
    </html>
  );
}
