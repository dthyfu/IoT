// Render pagination.
function renderPagination(container, currentPage, totalPages, onPageChange) {
    container.innerHTML = "";

    const hasPages = totalPages > 0;
    const safePage = hasPages ? currentPage : 1;
    const safeTotalPages = hasPages ? totalPages : 1;

    const previous = document.createElement("button");
    previous.textContent = "Previous";
    previous.disabled = !hasPages || safePage === 1;

    if (hasPages) {
        previous.addEventListener("click", () => onPageChange(safePage - 1));
    }

    container.appendChild(previous);

    const visibleCount = 3;
    let pages = [];

    if (safeTotalPages <= visibleCount + 2) {
        for (let i = 1; i <= safeTotalPages; i++) {
            pages.push(i);
        }
    } else {
        let startPage;

        if (safePage <= 2) {
            startPage = 2;
        } else {
            const groupIndex = Math.floor((safePage - 3) / 2);
            startPage = 3 + groupIndex * 2;
        }

        if (startPage + visibleCount - 1 >= safeTotalPages) {
            startPage = safeTotalPages - visibleCount;
        }

        startPage = Math.max(2, startPage);

        pages.push(1);

        for (let i = startPage; i < startPage + visibleCount; i++) {
            if (i > 1 && i < safeTotalPages) {
                pages.push(i);
            }
        }

        pages.push(safeTotalPages);
    }

    pages = [...new Set(pages)].sort((a, b) => a - b);

    let previousPage = null;

    pages.forEach(page => {
        if (previousPage !== null && page - previousPage > 1) {
            addDots(container);
        }

        addPageButton(container, page, safePage, onPageChange, !hasPages);
        previousPage = page;
    });

    const next = document.createElement("button");
    next.textContent = "Next";
    next.disabled = !hasPages || safePage === safeTotalPages;

    if (hasPages) {
        next.addEventListener("click", () => onPageChange(safePage + 1));
    }

    container.appendChild(next);
}

// Add page button.
function addPageButton(container, page, currentPage, onPageChange, disabled = false) {
    const button = document.createElement("button");
    button.textContent = page;
    button.classList.toggle("active", page === currentPage);
    button.disabled = disabled;

    if (!disabled) {
        button.addEventListener("click", () => onPageChange(page));
    }

    container.appendChild(button);
}

// Add pagination dots.
function addDots(container) {
    const dots = document.createElement("span");
    dots.textContent = "...";
    dots.className = "pagination-dots";
    container.appendChild(dots);
}