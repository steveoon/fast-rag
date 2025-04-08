import { useState } from 'react';

export function useDialogManager() {
  const [dialogs, setDialogs] = useState({
    create: false,
    edit: false,
    delete: false,
  });

  const openDialog = (name: keyof typeof dialogs) => {
    setDialogs(prev => ({ ...prev, [name]: true }));
  };

  const closeDialog = (name: keyof typeof dialogs) => {
    setDialogs(prev => ({ ...prev, [name]: false }));
  };

  return { dialogs, openDialog, closeDialog };
}
