import BlackBotIcon from "@/app/icons/chat-black-bot.svg";
import {Image} from "antd";

export function UserAvatar(props: { isModel?: boolean; avatar?: string; spin?: boolean }) {
    return (
        <div className="user-avatar">
            <Image src={props.avatar}
                   style={{borderRadius: '25%'}}
                   preview={false}
                    // width={48} height={48}
            />
        </div>
    );
}

export function AssistantAvatar(props: {avatar?: string; spin?: boolean }) {
    return (
        <div className="user-avatar no-dark">
            {
                props.spin
                    ? <BlackBotIcon className="spin-avatar" />
                    : <BlackBotIcon/>
            }
        </div>
    );
}