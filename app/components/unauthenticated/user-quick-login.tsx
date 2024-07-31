// import {useWebsocket} from "../data/webscoket";
// import {v4 as uuidv4} from "uuid";
import {useEffect, useRef} from "react";
// import {Avatar, Card, message} from "antd";
// import WechatRegisterIcon from "@assets/icons/wechat-register.svg";
// import "./index.less"
// import {useAuth} from "../../context/auth-context";
// import {SimpleUserVO} from "../../types/user";
// import {handleUserResponse} from "../../auth-provider";
//
// export const __WX_LOGIN_USER_SID_KEY__ = "wxLoginUserSid";
//
// export const WxQuickLoginCard = () => {
//     const userSid = useRef<string|undefined>();
//     const storage = window.localStorage;
//     const {setAloneUser} = useAuth();
//
//     let item = storage.getItem(__WX_LOGIN_USER_SID_KEY__);
//     if (item && item !== "") {
//         userSid.current = item;
//     } else {
//         const uid = uuidv4().split('-')[0];
//         userSid.current = uid;
//         storage.setItem(__WX_LOGIN_USER_SID_KEY__, uid);
//     }
//
//     //TODO prod 环境的时候配置后端的网关地址
//     const REACT_APP_LOGIN_WEBSOCKET_URL = process.env.REACT_APP_LOGIN_WEBSOCKET_URL + "/" + userSid.current;
//     //TODO prod 环境的时候配置真实的微信授权地址
//     const WX_QUICK_LOGIN_AUTH_URL = process.env.REACT_APP_WX_QUICK_LOGIN_AUTH_URL + "&state=" + userSid.current + "&forcePopup=true#wechat_redirect";
//
//     const {wsData, closeWebSocket} = useWebsocket<SimpleUserVO>(REACT_APP_LOGIN_WEBSOCKET_URL ? REACT_APP_LOGIN_WEBSOCKET_URL: "");
//     useEffect(() => {
//         if (!wsData) {
//             return;
//         }
//         // console.log(wsData);
//         if (wsData.code === 0) {
//             let simpleUserVOResp: SimpleUserVO = wsData.data;
//             // console.log(simpleUserVOResp);
//             storage.removeItem(__WX_LOGIN_USER_SID_KEY__);
//             setAloneUser(simpleUserVOResp);
//             handleUserResponse(wsData);
//             window.location.href = "/"
//             closeWebSocket();
//         }
//     }, [wsData]);
//
//     return (
//         <div>
//             <Card title={<div><Avatar style={{marginRight: "8px"}} src={WechatRegisterIcon} size={34}/><span>使用微信扫一扫登录</span></div>}>
//                 <div>
//                     <QRCodeCanvas
//                         value={WX_QUICK_LOGIN_AUTH_URL ? WX_QUICK_LOGIN_AUTH_URL: ""}
//                         size={200}
//                         fgColor="#000000"
//                     />
//                 </div>
//             </Card>
//         </div>
//     );
// }
//
//
// export const WxBindingCard = ({userId}: {userId: string}) => {
//     //TODO prod 环境的时候配置后端的网关地址
//     const REACT_APP_LOGIN_WEBSOCKET_URL = process.env.REACT_APP_LOGIN_WEBSOCKET_URL + "/" + userId;
//     //TODO prod 环境的时候配置真实的微信授权地址
//     const WX_BINGDING_AUTH_URL = process.env.REACT_APP_WX_BINDING_AUTH_URL + "&state=" + userId + "&forcePopup=true#wechat_redirect";
//
//     const {wsData, closeWebSocket} = useWebsocket(REACT_APP_LOGIN_WEBSOCKET_URL ? REACT_APP_LOGIN_WEBSOCKET_URL: "");
//     useEffect(() => {
//         if (!wsData) {
//             return;
//         }
//         console.log(wsData);
//         if (wsData.code === 0) {
//             let jwtToken = wsData.data;
//             console.log(jwtToken);
//             //TODO 跳转到新页面
//         } else if (wsData.code === 60012) {
//             message.error("每个微信仅可绑定一个用户!");
//         } else if (wsData.code === 60002) {
//             message.error("用户未能绑定成功，请稍后重试");
//         }
//         closeWebSocket();
//     }, [wsData]);
//
//     return (
//         <div>
//             <Card title={"微信扫码绑定"}>
//                 <div>
//                     <QRCodeCanvas
//                         value={WX_BINGDING_AUTH_URL ? WX_BINGDING_AUTH_URL: ""}
//                         size={200}
//                         fgColor="#000000"
//                     />
//                 </div>
//             </Card>
//         </div>
//     );
// }
