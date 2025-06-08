import { requireElement } from 'iemjs/domUtils';

export function setupWarningsModal() {
    const warningsToggle = requireElement('warnings-toggle');
    const warningsModal = requireElement('warnings-modal');
    const warningsModalContent = requireElement('warnings-modal-content');
    const closeWarningsButton = requireElement('close-warnings');
    const collapseWarningsButton = requireElement('collapse-warnings');
    const searchInput = requireElement('warnings-search');

    // Toggle warnings modal visibility
    warningsToggle.addEventListener('click', () => {
        warningsModal.classList.toggle('open');
    });

    collapseWarningsButton.style.display =
        window.innerWidth <= 768 ? 'block' : 'none';
    collapseWarningsButton.addEventListener('click', () => {
        warningsModal.classList.remove('open');
    });

    closeWarningsButton.addEventListener('click', () => {
        warningsModal.classList.remove('open');
    });

    // Make modal draggable
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    warningsModalContent.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - warningsModal.offsetLeft;
        offsetY = e.clientY - warningsModal.offsetTop;
        warningsModal.style.transition = 'none'; // Disable transition during drag
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            warningsModal.style.left = `${e.clientX - offsetX}px`;
            warningsModal.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        warningsModal.style.transition = ''; // Re-enable transition
    });

    // Add search functionality for warnings table
    searchInput.addEventListener('input', (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            const filter = target.value.toLowerCase();
            const rows = document.querySelectorAll('#warnings-table tbody tr');
            rows.forEach((row) => {
                const text = row.textContent?.toLowerCase();
                if (text  && row instanceof HTMLTableRowElement) {
                    row.style.display = text.includes(filter) ? '' : 'none';
                }
        });

        }
    });
}
