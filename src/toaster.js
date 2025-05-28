import { requireElement } from './domUtils.js';

/**
 * Show a toaster
 * @param {string} message 
 */
export function showToaster(message) {
    const toaster = requireElement('toaster');
    toaster.textContent = message;
    toaster.style.display = 'block';
    setTimeout(() => {
        toaster.style.display = 'none';
    }, 3000); // Hide after 3 seconds
}
