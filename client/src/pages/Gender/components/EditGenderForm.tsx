import { useEffect, useState, type FC, type FormEvent } from "react"
import BackButton from "../../../components/Button/BackButton"
import SubmitButton from "../../../components/Button/SubmitButton"
import FloatingLabelInput from "../../../components/Inputs/FloatingLabelInput"
import type { GenderFieldErrors } from "../../../interfaces/GenderInterface"
import GenderService from "../../../services/GenderService"
import { useParams } from "react-router-dom"
import Spinner from "../../../components/Spinner/Spinner"

interface EditGenderFormProps {
    onGenderUpdated: (message: string) => void
}
const EditGenderForm: FC<EditGenderFormProps> = ({ onGenderUpdated }) => {
    const [loadingGet, setLoadingGet] = useState(false)
    const [loadingUpdate, setLoadingUpdate] = useState(false)
    const [gender, setGender] = useState("");
    const [errors, setErrors] = useState<GenderFieldErrors>({});

    const { gender_id } = useParams()

    const handleGetGender = async (genderId: string | number) => {
        try {
            setLoadingGet(true)

            const res = await GenderService.getGender(genderId)

            if (res.status === 200) {
                setGender(res.data.gender.gender)
            } else {
                console.error("Unexpected status error occured during getting gender: ", res.status)
            }

        } catch (error) {
            console.error("Unexpected server error occured during getting gender: ", error)
        } finally {
            setLoadingGet(false)
        }
    };

    const handleUpdateGender = async (e: FormEvent) => {
        try {
            e.preventDefault()
            setLoadingUpdate(true)

            const res = await GenderService.updateGender(gender_id!, { gender })

            if (res.status === 200) {
                setErrors({})
                setGender(res.data.gender.gender)
                onGenderUpdated(res.data.message)
            } else {
                console.error("Unexpected status error occured during updating gender: ", res.status)
            }
        } catch (error: any) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors)
            } else {
                console.error("Unexpected server error occured during updating gender: ", error)
            };
        } finally {
            setLoadingUpdate(false)
        }
    };

    useEffect(() => {
        if (gender_id) {
            const parsedGenderId = parseInt(gender_id)
            handleGetGender(parsedGenderId)
        } else {
            console.error("Unexpected parameter error occured during getting gender: ",
                gender_id
            );
        }
    }, [gender_id]);

    return (
        <>
            {loadingGet ? (
                <div className="flex justify-center items-center mt-52">
                    <Spinner size="lg">
                    </Spinner>
                </div>

            ) : (

                <form onSubmit={handleUpdateGender}>

                    <div className="mb-4">
                        <FloatingLabelInput
                            label="Gender"
                            type="text"
                            name="gender"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            errors={errors.gender}
                            required
                            autoFocus
                        >
                        </FloatingLabelInput>
                    </div>

                    <div className="flex justify-end gap-2">
                        {!loadingUpdate && (
                            <BackButton label="Back" path="/genders">
                            </BackButton>
                        )}
                        <SubmitButton
                            label="Update Gender"
                            loading={loadingUpdate}
                            loadingLabel="Updating Gender..."
                        >

                        </SubmitButton>
                    </div>

                </form>
            )}
        </>
    )
}

export default EditGenderForm