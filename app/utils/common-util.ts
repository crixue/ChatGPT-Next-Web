export const extraPromptPlaceHolders = (input: string) => {
    const regex = /{([^}]+)}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(input))) {
        matches.push(match[1]);
    }
    return matches;
}

export const isAudioFileType = (fileMimeType: string) => {
    const contentType = ['audio/mp3', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/x-wav', 'audio/x-m4a', 'audio/x-mpeg-3'];
    return contentType.indexOf(fileMimeType) > -1;
}

export const isVideoFileType = (fileMimeType: string) => {
    const contentType = ['video/mpeg4', 'video/mp4', 'video/webm', 'video/x-flv', 'video/avi'];
    return contentType.indexOf(fileMimeType) > -1
}

export const isAVFileType = (fileMimeType: string) => {
    return isAudioFileType(fileMimeType) || isVideoFileType(fileMimeType);
}

export const collectUserDeviceInfo = () => {
    // 获取浏览器信息
    var browserInfo = navigator.userAgent;
    // 获取操作系统信息
    var platform = navigator.platform;
    // 获取浏览器语言
    var language = navigator.language;

    // 获取屏幕宽度和高度
    var screenWidth = window.screen.width;
    var screenHeight = window.screen.height;

    const deviceInfoCollector = {
        channel: 1,  //渠道：1：Web；2：App
        deviceName: browserInfo,
        deviceSystemName: platform + '| Screen:' + screenWidth.toString() + '*' + screenHeight.toString(),
        isPhysicalDevice: false,
    }
    return deviceInfoCollector;
}