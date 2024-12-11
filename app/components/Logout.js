import { store } from '../store.js';
import { router } from '../router.js';

export const handleLogout = async () => {
    const nickname = store.state.user.details?.nickname;

    if (!nickname) {
        console.error("No user nickname found in store; cannot log out.");
        return;
    }

    await fetch('http://localhost:8080/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nickname }),
    })
        .then(response => {
            if (response.ok) {
                store.logoutUser();
                router.navigate('/');
            } else {
                console.error('Failed to log out');
            }
        })
        .catch(error => console.error('Error during logout:', error));
    window.location.replace('/');
}

