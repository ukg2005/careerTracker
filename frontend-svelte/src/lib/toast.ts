import { toast } from 'svelte-sonner';

export const notifications = {
    show: ({ title, message, color }: { title: string; message: string; color?: string }) => {
        // Map Mantine colors to Sonner styles or icons if needed
        if (color === 'red') {
            toast.error(title, { description: message });
        } else if (color === 'green' || color === 'teal') {
            toast.success(title, { description: message });
        } else if (color === 'yellow') {
            toast.warning(title, { description: message });
        } else {
            toast(title, { description: message });
        }
    }
};
