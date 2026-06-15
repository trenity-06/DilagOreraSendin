import ToastMessage from "../../components/ToastMessage/ToastMessage"
import { useToastMessage } from "../../hooks/useToastMessage"
import AuthPageLayout from "./AuthPageLayout"
import LoginForm from "./components/LoginForm"

const LoginPage = () => {
    const toast = useToastMessage()

    return (
        <>
            {toast.toasts.map((t, index) => (
                <ToastMessage
                    key={t.id}
                    id={t.id}
                    message={t.message}
                    isFailed={t.isFailed}
                    isVisible={true}
                    onClose={toast.closeToastMessage}
                    index={index}
                />
            ))}
            <AuthPageLayout>
                <LoginForm
                    message={toast.showToastMessage}
                />
            </AuthPageLayout>
        </>
    )
}

export default LoginPage
