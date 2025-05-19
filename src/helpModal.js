export function setupHelpModal() {
    const helpToggle = document.getElementById('help-toggle');
    const helpModal = document.getElementById('help-modal');
    const helpModalHeader = document.getElementById('help-modal-header');
    const closeHelpButton = document.getElementById('close-help');

    if (helpToggle && helpModal) {
        // Toggle help modal visibility
        helpToggle.addEventListener('click', () => {
            helpModal.classList.toggle('open');
        });

        // Close button functionality
        if (closeHelpButton) {
            closeHelpButton.addEventListener('click', () => {
                helpModal.classList.remove('open');
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === helpModal) {
                helpModal.classList.remove('open');
            }
        });

        // Make modal draggable
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        if (helpModalHeader) {
            helpModalHeader.addEventListener('mousedown', (e) => {
                isDragging = true;
                offsetX = e.clientX - helpModal.offsetLeft;
                offsetY = e.clientY - helpModal.offsetTop;
                helpModal.style.transition = 'none'; // Disable transition during drag
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    helpModal.style.left = `${e.clientX - offsetX}px`;
                    helpModal.style.top = `${e.clientY - offsetY}px`;
                    helpModal.style.transform = 'none'; // Remove centering transform
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
                helpModal.style.transition = ''; // Re-enable transition
            });
        }
    }
}
