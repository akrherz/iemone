export function setupWarningsModal() {
    const warningsToggle = document.getElementById('warnings-toggle');
    const warningsModal = document.getElementById('warnings-modal');
    const warningsModalContent = document.getElementById('warnings-modal-content');
    const closeWarningsButton = document.getElementById('close-warnings');
    const collapseWarningsButton = document.getElementById('collapse-warnings');
    const searchInput = document.getElementById('warnings-search');

    if (warningsToggle && warningsModal) {
        // Toggle warnings modal visibility
        warningsToggle.addEventListener('click', () => {
            warningsModal.classList.toggle('open');
        });

        // Collapse button functionality
        if (collapseWarningsButton) {
            collapseWarningsButton.style.display = window.innerWidth <= 768 ? 'block' : 'none';
            collapseWarningsButton.addEventListener('click', () => {
                warningsModal.classList.remove('open');
            });
        }

        // Close button functionality
        if (closeWarningsButton) {
            closeWarningsButton.addEventListener('click', () => {
                warningsModal.classList.remove('open');
            });
        }
    } else {
        console.error('Warnings toggle or warnings modal element not found.');
    }

    // Make modal draggable
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    if (warningsModalContent) {
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
    }

    // Add search functionality for warnings table
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            const filter = event.target.value.toLowerCase();
            const rows = document.querySelectorAll('#warnings-table tbody tr');
            rows.forEach((row) => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            });
        });
    }
}
