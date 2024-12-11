import { store } from "../store.js";
import { router } from '../router.js';

export const authenticateUser = async (endpoint, nickname, password) => {
    await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password }),
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            // Handle login and registration responses differently
            if (router.currentRoute === '/login') {
                if (data.authenticated) {
                    store.setUser(data.user);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    router.navigate('/home');
                } else {
                    alert('Login failed: ' + (data.message || 'Invalid credentials'));
                }
            } else if (router.currentRoute === '/register') {
                if (data.success) {
                    alert('Registration successful! You can now log in.');
                    router.navigate('/login');
                } else {
                    alert('Registration failed: ' + (data.message || 'Please try again'));
                }
            }
        })
        .catch(error => console.error('Error:', error));
}

export const initUserFromSession = () => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
        const user = JSON.parse(userData);
        store.setUser(user);
    } else {
        router.navigate('/');
    }
};
