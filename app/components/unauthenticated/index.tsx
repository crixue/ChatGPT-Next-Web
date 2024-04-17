import React, {useState} from "react";
import styles from "./index.module.scss";
import {UnauthScreen} from "./unauth-screen";

export const UnauthenticatedApp = () => {
    return (
        <>
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