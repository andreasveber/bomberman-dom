import { Framework } from '../framework.js';
import { handleEvent } from '../events.js';
import { router } from '../router.js';
import { authenticateUser } from './AuthUser.js';

const framework = new Framework();

export function renderAuth() {
  // Create input fields for nickname and password with Tailwind classes
  const nickInput = framework.createElement('input', {
    type: 'text',
    name: 'nick',
    placeholder: 'Nickname',
    required: true,
    class: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400'
  });

  const passwordInput = framework.createElement('input', {
    type: 'password',
    name: 'password',
    placeholder: 'Password',
    required: true,
    class: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400'
  });

  const submitButton = framework.createElement('button', {
    type: 'submit',
    class: 'w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400'
  }, getSubmitButtonText());

  // Create the form element with an onSubmit handler
  const form = framework.createElement(
    'form',
    { id: 'authForm', class: 'max-w-md mx-auto bg-white p-6 rounded shadow-md space-y-4' },
    [nickInput, passwordInput, submitButton]
  );

  // Append the form to the root
  const root = document.getElementById('app');
  framework.updateDOM(form, root);

  // Attach the submit event handler after the form is created
  handleEvent('auth', '#authForm', 'submit', (e) => {
    e.preventDefault();
    handleSubmit(e, nickInput.value, passwordInput.value);
  });
}
// Function to determine the submit button text based on the route
const getSubmitButtonText = () => router.currentRoute === '/login' ? 'Login' : 'Register';

// Function to handle form submission
function handleSubmit(e, nickname, password) {
  e.preventDefault();
  const endpoint = router.currentRoute === '/login' ? 'http://localhost:8080/login' : 'http://localhost:8080/register';
  authenticateUser(endpoint, nickname, password);
}


