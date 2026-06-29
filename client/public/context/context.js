import { create } from "zustand";

const useContext = create((set) => ({
    toast: { message:'', success: null},



    setToast: (message, success) => set({ toast: { message, success } })
}))

export default useContext;