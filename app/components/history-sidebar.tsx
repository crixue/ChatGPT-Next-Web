import {useEffect} from "react";

import styles from "./history-sidebar.module.scss";

import {IconButton} from "./button";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import HistoryMsgIcon from "../icons/history-messages.svg";

import Locale from "../locales";

import {useAppConfig, useChatStore} from "../store";

import {Path,} from "../constant";

import {useNavigate} from "react-router-dom";
import dynamic from "next/dynamic";
import {showConfirm} from "./ui-lib";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

export function HistorySidebar(props: { className?: string }) {
  const chatStore = useChatStore();

  // drag side bar
  // const { onDragMouseDown, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();

  useHotKey();

  return (
    <div
      className={styles["history-sidebar"]}
    >
      <div className={styles["sidebar-header"]}>
        <HistoryMsgIcon/>
        <span className={styles["sidebar-sub-title"]}>历史消息记录</span>
      </div>
      <div
        className={styles["sidebar-body"]}
      >
        <ChatList narrow={false} />
      </div>

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
        </div>
        <div>
          <IconButton
            icon={<AddIcon />}
            text={Locale.Home.NewChat}
            onClick={() => {
              if (config.dontShowMaskSplashScreen) {
                chatStore.newSession();
                navigate(Path.Chat);
              } else {
                navigate(Path.NewChat);
              }
            }}
            shadow
          />
        </div>
      </div>

    </div>
  );
}
