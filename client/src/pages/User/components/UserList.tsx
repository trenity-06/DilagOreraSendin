import { useCallback, useEffect, useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../../components/table";
import UserService from "../../../services/UserService";
import Spinner from "../../../components/Spinner/Spinner";
import type { userColumns } from "../../../interfaces/UserInterface";
import FloatingLabelInput from "../../../components/Inputs/FloatingLabelInput";

interface UserListProps {
    onAddUser: () => void;
    onEditUser: (user: userColumns | null) => void;
    onDeleteUser: (user: userColumns | null) => void;
    refreshKey: boolean;
}

const UserList: React.FC<UserListProps> = ({ onAddUser, onEditUser, onDeleteUser, refreshKey }) => {
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [users, setUsers] = useState<userColumns[]>([]);
    const [usersTableCurrentPage, setUsersTableCurrentPage] = useState(1);
    const [usersTableLastPage, setUsersTableLastPage] = useState(1);
    const [hasMore, setHasmore] = useState(true);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const tableRef = useRef<HTMLDivElement>(null)

    const handleLoadUsers = async (page: number, append = false, search: string) => {
        try {
            setLoadingUsers(true);

            const res = await UserService.loadUsers(page, search);

            if (res.status === 200) {
                const userData = res.data.users.data || res.data.users || [];
                const lastPage = res.data.users.last_page || res.data.last_page || usersTableLastPage || 1;

                setUsers(append ? [...users, ...userData] : userData);
                setUsersTableCurrentPage(page);
                setUsersTableLastPage(lastPage);
                setHasmore(page < lastPage);
            } else {
                setUsers(append ? users : []);
                setHasmore(false);
            }
        } catch (error) {
            console.error('Unexpected server error occured during loading users: ', error)
        } finally {
            setLoadingUsers(false)
        }
    };

    const handleScroll = useCallback(() => {
        const ref = tableRef.current;

        if (ref && ref.scrollTop + ref.clientHeight >= ref.scrollHeight - 10 && hasMore && !loadingUsers) {
            handleLoadUsers(usersTableCurrentPage + 1, true, debouncedSearch);
        }
    }, [hasMore, loadingUsers, usersTableCurrentPage]);

    const handleUserFullNameFormat = (user: userColumns) => {
        let fullName = ''

        if (user.middle_name) {
            fullName = `${user.last_name}, ${user.first_name} ${user.middle_name.charAt(0)}.`
        } else {
            fullName = `${user.last_name}, ${user.first_name}`
        }
        // Doe, John

        if (user.suffix_name) {
            fullName += ` ${user.suffix_name}`
        }

        // Doe, John Jr.

        return fullName;
    }

    useEffect(() => {
        const ref = tableRef.current;

        if (ref) {
            ref.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (ref) {
                ref.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 800);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setUsers([])
        setUsersTableCurrentPage(1)
        setHasmore(true)

        handleLoadUsers(1, false, debouncedSearch);
    }, [refreshKey, debouncedSearch]);


    return (
        <div className="overflow-hidden round-lg border border-gray-200 bg-white">
            <div
                ref={tableRef}
                className="relative max-w-full max-h-[calc(100vh-8.5rem)] overflow-x-auto">
                <Table>
                    <caption className="mb-4">
                        <div className="border-b border-gray-100">
                            <div className="p-4 flex items-center justify-between gap-4">
                                <div className="w-full max-w-xs">
                                    <FloatingLabelInput
                                        label="Search"
                                        type="text"
                                        name="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-emerald-700 transition-colors cursor-pointer"
                                    onClick={onAddUser}
                                >
                                    Add User
                                </button>
                            </div>
                        </div>
                    </caption>
                    <TableHeader className="border-b border-gray-200 bg-emerald-600 sticky top-0 text-white text-xs z-10">
                        <TableRow>
                            <TableCell isHeader className="px-5 py-3 font-medium text-center">
                                No.
                            </TableCell>
                            <TableCell
                                isHeader
                                colSpan={2}
                                className="px-5 py-3 font-medium text-center"
                            >
                                Full Name
                            </TableCell>


                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-center"
                            >
                                Gender
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-center"
                            >
                                Birth Date
                            </TableCell>

                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-center"
                            >
                                Age
                            </TableCell>

                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-center"
                            >
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 text-gray-500 text-small">
                        {users.length ?? 0 > 0 ? (
                            users.map((user, index) => (
                                <TableRow className="hover:bg-gray-100" key={index}>
                                    <TableCell className="px-4 py-3 text-center">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 flex items-center justify-center">
                                        {user.profile_picture ? (
                                            <img src={user.profile_picture}
                                                alt={handleUserFullNameFormat(user)}
                                                className="object-cover w-10 h-10 rounded-full"
                                            />
                                        ) : (
                                            <div className="relative inline-flex items-center justify-center w-10 h-10 text-center text-sm overflow-hidden bg-gray-300 rounded-full">
                                                <span className="text-gray-600">
                                                    {`${user.last_name.charAt(
                                                        0
                                                    )}${user.first_name.charAt(0)}`}
                                                </span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                        {handleUserFullNameFormat(user)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                        {user.gender.gender}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                        {user.birth_date}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                        {user.age}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                        <div className="flex justify-center items-center gap-4">
                                            <button
                                                type="button"
                                                className="text-green-600 font-medium cursor-pointer hover:underline"
                                                onClick={() => onEditUser(user)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="text-red-600 font-medium cursor-pointer hover:underline"
                                                onClick={() => onDeleteUser(user)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : !loadingUsers && (users.length ?? 0) <= 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="px-4 py-3 text-center font-medium"
                                >
                                    No Records Found
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="px-4 py-3 text-center">
                                    <Spinner size="md" />
                                </TableCell>
                            </TableRow>
                        )}
                        {loadingUsers && (users.length ?? 0) > 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="px-4 py-3 text-center">
                                    <Spinner size="md" />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default UserList