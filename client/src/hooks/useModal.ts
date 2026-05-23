import { useCallback, useState } from "react";
import type { userColumns } from "../interfaces/UserInterface";

export const useModal = (initialState: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [selectedUser, setSelectedUser] = useState<userColumns | null>(null);


  const openModal = useCallback((user?: userColumns | null) => {
    setSelectedUser(user || null);
    setIsOpen(true)
  }, []);

  const closeModal = useCallback(() => {
    setSelectedUser(null);
    setIsOpen(false);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return { isOpen, selectedUser, openModal, closeModal, toggleModal };
};