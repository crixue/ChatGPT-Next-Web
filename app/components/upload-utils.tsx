import {RcFile} from "antd/es/upload";

export const checkIfIsSupportedUploadFileType = (file: RcFile) => {
    const fileType = file.type;
    if (fileType === 'text/x-c' ||
        fileType === 'text/x-c++' ||
        fileType === 'text/css' ||
        fileType === 'text/csv' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'text/html' ||
        fileType === 'text/x-java' ||
        fileType === 'text/javascript' ||
        fileType === 'application/json' ||
        fileType === 'text/markdown' ||
        fileType === 'application/pdf' ||
        fileType === 'text/x-php' ||
        fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        fileType === 'text/x-python' ||
        fileType === 'text/x-script.python' ||
        fileType === 'text/x-ruby' ||
        fileType === 'text/x-tex' ||
        fileType === 'application/typescript' ||
        fileType === 'text/plain' ||
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'text/xml') {
        return true;
    }
    return false;
}