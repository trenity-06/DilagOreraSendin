import { useEffect, type FC } from "react";

interface ToastMessageProps {
    message: string;
    isFailed?: boolean;
    isVisible: boolean;
    onClose: () => void;
}

const ToastMessage: FC<ToastMessageProps> = ({
    message,
    isFailed,
    isVisible,
    onClose
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <>
            <div className={`fixed top-40 right-0 md:right-4 z-999999 flex items-center w-full max-w-xs p-4 text-black 
            ${isFailed ? 'bg-red-100' : 'bg-green-200 '
                }  rounded-lg shadow-lg transition-opacity duration-300 
            ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                role="alert">
                <div className={`inline-flex items-center justify-center shrink-0 w-8 h-8 
                    ${isFailed ? 'text-red-500 bg-red-200' : 'text-green-500 bg-green-200'
                    } rounded-lg transition-transform duration-300 
                    ${isVisible ? 'translate-y-0' : '-translate-y-10'}
                    `}
                >
                    {isFailed ? (
                        <svg
                            className="w-5 h-5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-5 h-5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879A1 1 0 006.293 10.293l3 3a1 1 0 001.414 0l3-3z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </div>
                <div className="ms-3 text-sm font-normal">{message}</div>
            </div>
        </>
    )
}

export default ToastMessage