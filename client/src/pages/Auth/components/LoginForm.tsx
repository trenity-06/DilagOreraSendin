import { useState, type FC, type FormEvent } from "react"
import SubmitButton from "../../../components/Button/SubmitButton"
import FloatingLabelInput from "../../../components/Inputs/FloatingLabelInput"
import type { LoginCredentialsErrorFields } from "../../../interfaces/AuthInterface"
import { useAuth } from "../../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

interface LoginFormProps {
    message: (message: string, isFailed: boolean) => void
}


const LoginForm: FC<LoginFormProps> = ({ message }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<LoginCredentialsErrorFields>({})

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async (e: FormEvent) => {
        try {
            e.preventDefault()

            setIsLoading(true)

            await login(username, password)
            navigate('/genders')
        } catch (error: any) {
            if (error.response && error.response.status === 401) {
                setErrors({})
                message(error.response.data.message, true)
            } else if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors)
            } else if (!error.response) {
                setErrors({})
                message('Unable to connect to the server. Check your backend URL or start the server.', true)
            } else {
                console.error('Unexpected server error occurred during logging in the user: ',
                    error
                )
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <form onSubmit={handleLogin}>
                <div className="mb-4">
                    <FloatingLabelInput
                        label="Username"
                        type="text"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                        errors={errors.username}
                    />
                </div>
                <div className="mb-4">
                    <FloatingLabelInput
                        label="Password"
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        errors={errors.password}
                    />
                </div>
                <SubmitButton
                    className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold cursor-pointer py-3 rounded-2xl shadow-lg shadow-emerald-200/40 transition duration-200 ease-in-out transform hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
                    label="Sign In"
                    loading={isLoading}
                    loadingLabel="Signing In..."
                />
            </form>
        </>
    )
}

export default LoginForm