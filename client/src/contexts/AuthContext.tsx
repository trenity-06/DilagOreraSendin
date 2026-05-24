import {
    createContext,
    useContext,
    useEffect,
    useState,
    type FC,
    type ReactNode
} from "react";
import type { UserDetails } from "../interfaces/AuthInterface";
import AuthService from "../services/AuthService";

interface AuthContextType {
    user: UserDetails | null
    loading: boolean
    login: (username: string, password: string) => void
    logout: () => void
    refreshUser: () => Promise<void>
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserDetails | null>(null)
    const [loading, setLoading] = useState(true)

    const normalizeUser = (payload: any) => payload?.user ?? payload

    const login = async (username: string, password: string) => {
        try {
            const res = await AuthService.login({ username, password })

            if (res.status === 200) {
                localStorage.setItem('token', res.data.token);
                setUser(normalizeUser(res.data))
            } else {
                console.error('Unexpected status error occurred during logging user in: ', res.status)
            }
        } catch (error) {
            console.error('Unexpected server error occurred during logging user in: ', error)
            throw error
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    }

    const refreshUser = async () => {
        try {
            const res = await AuthService.me();
            if (res.status === 200) {
                setUser(normalizeUser(res.data));
            }
        } catch (error) {
            console.error('Error refreshing user data: ', error);
        }
    }

    const checkAuth = async () => {
        setLoading(true);

        const token = localStorage.getItem("token");

        if (token) {
            try {
                const res = await AuthService.me();

                if (res.status === 200) {
                    setUser(normalizeUser(res.data));
                } else {
                    localStorage.removeItem("token");
                    setUser(null);

                    console.error(
                        "Unexpected status error occurred during checking authentication: ",
                        res.status
                    );
                }
            } catch (error) {
                localStorage.removeItem("token");
                setUser(null);

                console.error(
                    "Unexpected server error occurred during checking authentication: ",
                    error
                );
            }
            setLoading(false);
        } else {
            setUser(null);
            setLoading(false)
        }
    };

    useEffect(() => {
        checkAuth();
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context;
}