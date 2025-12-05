document.addEventListener('DOMContentLoaded', () => {
    const patientGrid = document.getElementById('patientGrid');
    const paginationControls = document.getElementById('paginationControls'); // Get the pagination controls container

    const patientsPerPage = 6; // Number of patients to display per page

    let currentPage = 1;
    let filteredAndSortedPatients = [...allPatients]; // allPatients is from patient-list.php

    const renderPaginationControls = (totalPatients) => {
        paginationControls.innerHTML = ''; // Clear existing controls
        const totalPages = Math.ceil(totalPatients / patientsPerPage);

        if (totalPages <= 1) {
            return;
        }

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.id = 'prevPage';
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayPatients(filteredAndSortedPatients);
                renderPaginationControls(filteredAndSortedPatients.length);
            }
        });
        paginationControls.appendChild(prevButton);

        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, currentPage + Math.floor(maxVisiblePages / 2));

        if (endPage - startPage + 1 < maxVisiblePages) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            } else if (endPage === totalPages) {
                startPage = Math.max(1, totalPages - maxVisiblePages + 1);
            }
        }

        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.textContent = '1';
            firstPageButton.classList.add('page-number');
            if (currentPage === 1) firstPageButton.classList.add('active');
            firstPageButton.addEventListener('click', () => {
                currentPage = 1;
                displayPatients(filteredAndSortedPatients);
                renderPaginationControls(filteredAndSortedPatients.length);
            });
            paginationControls.appendChild(firstPageButton);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.classList.add('ellipsis');
                paginationControls.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === 1 || i === totalPages || (i >= startPage && i <= endPage)) {
                const pageButton = document.createElement('button');
                pageButton.textContent = i;
                pageButton.classList.add('page-number');
                if (i === currentPage) {
                    pageButton.classList.add('active');
                }
                pageButton.addEventListener('click', () => {
                    currentPage = i;
                    displayPatients(filteredAndSortedPatients);
                    renderPaginationControls(filteredAndSortedPatients.length);
                });
                paginationControls.appendChild(pageButton);
            }
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.classList.add('ellipsis');
                paginationControls.appendChild(ellipsis);
            }
            const lastPageButton = document.createElement('button');
            lastPageButton.textContent = totalPages;
            lastPageButton.classList.add('page-number');
            if (currentPage === totalPages) lastPageButton.classList.add('active');
            lastPageButton.addEventListener('click', () => {
                currentPage = totalPages;
                displayPatients(filteredAndSortedPatients);
                renderPaginationControls(filteredAndSortedPatients.length);
            });
            paginationControls.appendChild(lastPageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.id = 'nextPage';
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayPatients(filteredAndSortedPatients);
                renderPaginationControls(filteredAndSortedPatients.length);
            }
        });
        paginationControls.appendChild(nextButton);
    };
    const displayPatients = (patientsToDisplay) => {
        patientGrid.innerHTML = '';

        const startIndex = (currentPage - 1) * patientsPerPage;
        const endIndex = startIndex + patientsPerPage;
        const paginatedPatients = patientsToDisplay.slice(startIndex, endIndex);

        if (paginatedPatients.length === 0) {
            patientGrid.innerHTML = '<p style="text-align: center; width: 100%;">No patients found for the current filter/sort.</p>';
            paginationControls.innerHTML = '';
            return;
        }

        paginatedPatients.forEach(patient => {
            patientGrid.innerHTML += renderPatientCard(patient);
        });

        renderPaginationControls(patientsToDisplay.length);
    };

    window.updatePatientDisplay = (updatedPatients) => {
        filteredAndSortedPatients = updatedPatients;
        currentPage = 1; // Reset to first page on new filter/sort
        displayPatients(filteredAndSortedPatients);
    };

    displayPatients(filteredAndSortedPatients);
});