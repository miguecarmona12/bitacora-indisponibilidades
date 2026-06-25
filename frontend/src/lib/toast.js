import { toast } from 'sonner';

export const showSuccess = (msg) => toast.success(msg, { duration: 2500 });
export const showError = (msg) => toast.error(msg, { duration: 4000 });
export const showWarning = (msg) => toast.warning(msg, { duration: 3500 });
export const showInfo = (msg) => toast.info(msg, { duration: 2500 });
