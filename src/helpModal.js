import { requireElement } from 'iemjs/domUtils';

export function setupHelpModal() {
    const helpToggle = requireElement('help-toggle');
    const helpModal = requireElement('help-modal');
    const helpModalHeader = requireElement('help-modal-header');
    const closeHelpButton = requireElement('close-help');

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

    helpModalHeader.addEventListener('mousedown', (evt) => {
        isDragging = true;
        offsetX = evt.clientX - helpModal.offsetLeft;
        offsetY = evt.clientY - helpModal.offsetTop;
        helpModal.style.transition = 'none'; // Disable transition during drag
    });

    document.addEventListener('mousemove', (evt) => {
        if (isDragging) {
            helpModal.style.left = `${evt.clientX - offsetX}px`;
            helpModal.style.top = `${evt.clientY - offsetY}px`;
            helpModal.style.transform = 'none'; // Remove centering transform
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        helpModal.style.transition = ''; // Re-enable transition
    });
}
