

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
    const contentType = ['audio/mp3', 'audio/mp4', 'audio/wav'];
    return contentType.indexOf(fileMimeType) > -1;
}

export const isVideoFileType = (fileMimeType: string) => {
    const contentType = ['video/mpeg4', 'video/mp4', 'video/webm', 'video/x-flv', 'video/avi'];
    return contentType.indexOf(fileMimeType) > -1
}

export const isAVFileType = (fileMimeType: string) => {
    return isAudioFileType(fileMimeType) || isVideoFileType(fileMimeType);
}