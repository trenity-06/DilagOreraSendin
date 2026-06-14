import { useNavigate } from "react-router-dom";

import { useHeader } from "../contexts/HeaderContext";
import { useSidebar } from "../contexts/SidebarContext";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState, type FormEvent } from "react";
import GroupLogo from "../assets/img/GroupLogo.png";

const AppHeader = () => {
    const { isOpen, toggleUserMenu } = useHeader();
    const { toggleSidebar } = useSidebar();
    const { user, logout } = useAuth()

    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async (e: FormEvent) => {
        try {
            e.preventDefault();
            setIsLoading(true);

            await logout();
            navigate("/");
        } catch (error) {
            console.error(
                "Unexpected server error occurred during logging user out: ",
                error
            );
        }
        finally {
            setIsLoading(false);
        }
    };


    const handleUserFullNameFormat = () => {
        if (!user) return "";

        let fullName = `${user.last_name}, ${user.first_name}`;

        if (user.middle_name) {
            fullName += ` ${user.middle_name.charAt(0)}`;
        }

        if (user.suffix_name) {
            fullName += ` ${user.suffix_name}`;
        }

        return fullName;
    };

    useEffect(() => {
        if (user) {
            handleUserFullNameFormat();
        }
    }, [user]);


    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={toggleUserMenu} />
            )}
            <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-green-900 dark:border-gray-700">
                <div className="px-3 py-3 lg:px-5 lg:pl-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start rtl:justify-end">
                            <button data-drawer-target="top-bar-sidebar"
                                data-drawer-toggle="top-bar-sidebar"
                                aria-controls="top-bar-sidebar"
                                type="button"
                                onClick={toggleSidebar}
                                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden    hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                                <span className="sr-only">Open sidebar</span>
                                <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h10" />
                                </svg>
                            </button>
                            <a href="/dashboard" className="flex ms-2 md:me-24">
                                <img src={GroupLogo}
                                    className="h-6 me-3" alt="Group Logo" />
                                <span className="self-center text-lg font-semibold whitespace-nowrap dark:text-white">Nene's Store</span>
                            </a>
                        </div>
                        <div className="flex items-center">
                            <div className="flex items-center ms-3">
                                <div>
                                    <button type="button"
                                        onClick={toggleUserMenu}
                                        className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                                        aria-expanded="false"
                                        data-dropdown-toggle="dropdown-user">
                                        <span className="sr-only">Open user menu</span>
                                        {user?.profile_picture ? (
                                            <img className="w-8 h-8 rounded-full object-cover" src={user.profile_picture} alt={handleUserFullNameFormat()} />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                                                {user ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` : "U"}
                                            </div>
                                        )}
                                    </button>
                                </div>
                                <div className={`
                                    absolute right-8 top-9 min-w-50 z-50 ${isOpen ? 'block' : 'hidden'} my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-sm dark:bg-gray-700 dark:divide-gray-600`} id="dropdown-user">
                                    <div className="px-4 py-3 border-b border-default-medium" role="none">
                                        <p className="text-sm text-gray-900 truncate dark:text-white" role="none">
                                            {handleUserFullNameFormat()}
                                        </p>
                                    </div>
                                    <ul className="p-2 text-sm text-body font-medium" role="none">
                                        <li>
                                            <button
                                                type="submit"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300
                                                dark:hover:bg-gray-600 dark:hover:text-white w-full text-start
                                                cursor-pointer disabled:cursor-not-allowed"
                                                role="menuitem"
                                                onClick={handleLogout}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Signing Out...' : 'Sign Out'}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

        </>
    )
}

export default AppHeader;