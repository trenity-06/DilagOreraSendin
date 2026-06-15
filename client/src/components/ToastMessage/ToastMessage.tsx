import { useEffect, type FC } from "react";

interface ToastMessageProps {
    id: string;
    message: string;
    isFailed?: boolean;
    isVisible: boolean;
    onClose: (id: string) => void;
    index?: number;
}

const ToastMessage: FC<ToastMessageProps> = ({
    id,
    message,
    isFailed,
    isVisible,
    onClose,
    index = 0
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose(id);
            }, 5000); // Increased to 5s to allow reading multiple toasts
            return () => clearTimeout(timer);
        }
    }, [isVisible, id, onClose]);

    if (!isVisible) return null;

    // Calculate vertical offset: top-40 (approx 160px) + index * (toast height + gap)
    const topOffset = 160 + index * 80;

    return (
        <div 
            className={`fixed right-0 md:right-4 z-[999999] flex items-center w-full max-w-xs p-4 text-black 
            ${isFailed ? 'bg-red-100 border-l-4 border-red-500' : 'bg-green-100 border-l-4 border-green-500'
            } rounded-lg shadow-xl transition-all duration-300 ease-in-out`}
            style={{ top: `${topOffset}px` }}
            role="alert"
        >
            <div className={`inline-flex items-center justify-center shrink-0 w-8 h-8 
                ${isFailed ? 'text-red-500 bg-red-200' : 'text-green-500 bg-green-200'
                } rounded-lg`}
            >
                {isFailed ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879A1 1 0 006.293 10.293l3 3a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
            <div className="ms-3 text-sm font-semibold">{message}</div>
            <button 
                onClick={() => onClose(id)}
                className="ms-auto -mx-1.5 -my-1.5 bg-transparent text-slate-400 hover:text-slate-900 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 inline-flex h-8 w-8 items-center justify-center"
            >
                <span className="sr-only">Close</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
            </button>
        </div>
    );
};

export default ToastMessage;