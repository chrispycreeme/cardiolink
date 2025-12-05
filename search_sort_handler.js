document.addEventListener('DOMContentLoaded', () => {

    const searchInput = document.getElementById('searchPatient');
    const sortBySelect = document.getElementById('sortBy');

    let currentSearchTerm = '';
    let currentSortOrder = sortBySelect.value;

    const applySearch = (patients, searchTerm) => {
        if (!searchTerm) {
            return patients;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return patients.filter(patient =>
            patient.patient_name.toLowerCase().includes(lowerCaseSearchTerm)
        );
    };
    const applySort = (patients, sortOrder) => {
        const sorted = [...patients];

        sorted.sort((a, b) => {
            if (sortOrder === 'nameAsc') {
                return a.patient_name.localeCompare(b.patient_name);
            } else if (sortOrder === 'nameDesc') {
                return b.patient_name.localeCompare(a.patient_name);
            } else if (sortOrder === 'ageAsc') {
                const ageA = getAgeValue(a.age_category);
                const ageB = getAgeValue(b.age_category);
                return ageA - ageB;
            } else if (sortOrder === 'ageDesc') {
                const ageA = getAgeValue(a.age_category);
                const ageB = getAgeValue(b.age_category);
                return ageB - ageA;
            }
            return 0;
        });
        return sorted;
    };

    const getAgeValue = (category) => {
        if (!category) return 0; // Handle undefined/null categories
        const lowerCaseCategory = category.toLowerCase();
        if (lowerCaseCategory.includes('senior')) return 3;
        if (lowerCaseCategory.includes('adult')) return 2;
        if (lowerCaseCategory.includes('child')) return 1;
        return 0;
    };
    const updatePatientList = () => {
        let processedPatients = [...allPatients];

        processedPatients = applySearch(processedPatients, currentSearchTerm);

        processedPatients = applySort(processedPatients, currentSortOrder);

        window.updatePatientDisplay(processedPatients);
    };

    searchInput.addEventListener('input', (event) => {
        currentSearchTerm = event.target.value;
        updatePatientList();
    });

    sortBySelect.addEventListener('change', (event) => {
        currentSortOrder = event.target.value;
        updatePatientList();
    });

    updatePatientList();
});
