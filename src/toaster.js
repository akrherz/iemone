export function showToaster(message) {
    const toaster = document.getElementById('toaster');
    if (toaster) {
        toaster.textContent = message;
        toaster.style.display = 'block';
        setTimeout(() => {
            toaster.style.display = 'none';
        }, 3000); // Hide after 3 seconds
    }
}
