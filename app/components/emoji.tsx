import EmojiPicker, {
  Emoji,
  EmojiStyle,
  Theme as EmojiTheme,
} from "emoji-picker-react";

import BotIcon from "../icons/bot.svg";
import BlackBotIcon from "../icons/black-bot.svg";
import {getClientConfig} from "@/app/config/client";


export function getEmojiUrl(unified: string, style: EmojiStyle) {
  return `${getClientConfig()?.emojiPrefixUrl}/img/${style}/64/${unified}.png`;
  // return `https://cdn.staticfile.org/emoji-datasource-apple/14.0.0/img/${style}/64/${unified}.png`;
}

export function AvatarPicker(props: {
  onEmojiClick: (emojiId: string) => void;
}) {
  return (
    <EmojiPicker
      lazyLoadEmojis
      theme={EmojiTheme.AUTO}
      getEmojiUrl={getEmojiUrl}
      onEmojiClick={(e) => {
        props.onEmojiClick(e.unified);
      }}
    />
  );
}

export function Avatar(props: { isModel?: boolean; avatar?: string; spin?: boolean }) {
  if (props.isModel) {
    return (
      <div className="no-dark">
        {
            props.spin ? <BlackBotIcon className="user-avatar spin-avatar" /> : <BlackBotIcon className="user-avatar" />
        }
      </div>
    );
  }

  return (
    <div className="user-avatar">
      {props.avatar && <EmojiAvatar avatar={props.avatar} />}
    </div>
  );
}

export function EmojiAvatar(props: { avatar: string; size?: number }) {
  return (
    <Emoji
      unified={props.avatar}
      size={props.size ?? 18}
      getEmojiUrl={getEmojiUrl}
    />
  );
}
