import { Link } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";

const AppSidebar = () => {
    const { isOpen, toggleSidebar } = useSidebar();

    const sidebarItems = [
        {
            path: '/dashboard',
            text: 'Dashboard',
        },
        {
            path: '/inventory',
            text: 'Inventory',
        },
        {
            path: '/pos',
            text: 'POS',
        },
        {
            path: '/genders',
            text: 'Genders',

        },
        {
            path: '/users',
            text: 'Users',
        }
    ]
    return (
        <>
            {!isOpen && (
                <div className="fixed inset-0 z-40 blur-lg sm:hidden"
                    onClick={toggleSidebar}
                />
            )}
            <aside id="top-bar-sidebar" className={`fixed top-0 left-0 z-40 w-64 h-full transition-transform ${isOpen ? '-translate-x-full' :
                'translate-x-0'
                } sm:translate-x-0`} aria-label="Sidebar">
                <div
                    className="h-full px-3 py-4 overflow-y-auto 
                bg-white dark:bg-gray-800">
                    <a
                        href="https://flowbite.com/"
                        className="flex items-center ps-2.5 mb-5">
                        <img
                            src="https://flowbite.com/docs/images/logo.svg"
                            className="h-6 me-3" alt="Flowbite Logo" />
                        <span
                            className="self-center text-lg text-heading font-semibold 
                        whitespace-nowrap">Flowbite</span>
                    </a>
                    <ul className="space-y-2 font-medium">
                        {sidebarItems.map((sidebarItem, index) => (
                            <li key={index}>
                                <Link to={sidebarItem.path}
                                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">

                                    <span className="ms-3">{sidebarItem.text}</span>
                                </Link>
                            </li>
                        ))}

                    </ul>
                </div>
            </aside>
        </>

    )
}

export default AppSidebar;