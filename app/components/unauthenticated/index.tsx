import React, {useState} from "react";
import styles from "./index.module.scss";
import {UnauthScreen} from "./unauth-screen";
import { Helmet } from 'react-helmet';

export const UnauthenticatedApp = () => {
    return (
        <>
            <Helmet>
                <script src="https://turing.captcha.qcloud.com/TCaptcha.js" />
            </Helmet>
            <div className={styles["unauthenticated-app-background"]}/>
            <UnauthScreen/>
            {/*<Routes>*/}
            {/*    <Route path={"/signin"} element={<UnauthScreen/>}/>*/}
            {/*    /!*<Route path={"/forget-pwd"} element={<ForgetPwdScreen/>}/>*!/*/}
            {/*    <Navigate to={"/signin"} replace={true}/>   /!*Navigate当没有匹配的时候默认指向当前这个地址*!/*/}
            {/*</Routes>*/}
        </>
    )
}