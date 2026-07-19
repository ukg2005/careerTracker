import { redirect } from '@sveltejs/kit';

export const load = async () => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw redirect(302, '/login');
        }
    }
    return {};
};
