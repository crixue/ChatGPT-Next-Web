import React, {useState} from "react";
import styles from "./index.module.scss";
import {UnauthScreen} from "./unauth-screen";
import { Helmet } from 'react-helmet';

export const UnauthenticatedApp = () => {
    return (
        <>
            <Helmet>
                <script async={true} src="https://turing.captcha.qcloud.com/TCaptcha.js" />
            </Helmet>
            {/*<div className={styles["unauthenticated-app-background"]}/>*/}
            <UnauthScreen/>
        </>
    )
}