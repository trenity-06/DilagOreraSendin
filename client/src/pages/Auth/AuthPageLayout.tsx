import type { FC, ReactNode } from "react";
import GroupLogo from "../../assets/img/GroupLogo.png";

interface AuthPageLayoutProps {
    children: ReactNode;
}

const AuthPageLayout: FC<AuthPageLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex bg-[#0f172a] overflow-hidden">

            {/* LEFT SIDE */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-950">
                <div className="absolute inset-0 bg-black/20 z-0"></div>
                <div className="absolute top-[-120px] left-[-100px] w-[400px] h-[400px] bg-green-400/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-150px] right-[-120px] w-[500px] h-[500px] bg-lime-300/10 rounded-full blur-3xl"></div>

                <div className="absolute left-0 bottom-0 opacity-20">
                    <svg width="700" height="500" viewBox="0 0 700 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 300C100 250 200 350 300 300C400 250 500 150 700 250" stroke="white" strokeWidth="4" strokeDasharray="5 10" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full w-full p-14 text-white">
                    
                    <div className="flex items-center gap-3">
                        <img src={GroupLogo} alt="Logo" className="h-12" />
                        <h1 className="text-2xl font-bold">SariTrack</h1>
                    </div>

                    <div className="max-w-xl">
                        <h2 className="text-6xl font-bold leading-tight mb-6">
                            Smart Inventory Management for Erscanuela Sari-Sari Store
                        </h2>
                        <p className="text-lg text-green-100 leading-relaxed mb-10">
                            Track products, monitor sales, manage stock, and simplify daily store operations with a modern inventory management system.
                        </p>
                    </div>

                    <div className="text-sm text-green-100">© 2026 SariTrack Inventory System</div>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8fafc] px-6 py-10 relative">
                <div className="absolute top-0 right-0 w-72 h-72 bg-green-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-lime-200/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 w-full max-w-md bg-[#A0D585] rounded-[32px] shadow-2xl p-10 border border-white/10 text-center">
                    {/* Logo + Title */}
                    <div className="mb-8 flex flex-col items-center">
                        <img src={GroupLogo} alt="GroupLogo" className="h-14 mb-5" />
                        <h2 className="text-4xl font-bold text-black mb-2">Log In</h2>
                        <p className="text-black text-sm">Welcome back! Please sign in to continue.</p>
                    </div>

                    {/* Form passed in as children */}
                    <div className="space-y-5 text-left">
                        
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPageLayout;