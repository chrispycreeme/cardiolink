document.addEventListener("DOMContentLoaded", function () {

    const ctx = document.getElementById('vitalsChart').getContext('2d');

    const data = {
        labels: ['Jun', 'Jul', 'Aug', 'Sep'],
        datasets: [
            {
                label: 'Heart Rate',
                data: [80, 95, 90, 100], // Sample data
                borderColor: '#E83E8C', // Accent Pink
                backgroundColor: 'transparent',
                tension: 0.4, // For smooth curves
                borderWidth: 3,
                pointRadius: 0,
            },
            {
                label: 'Oxygen Level',
                data: [98, 96, 99, 97], // Sample data
                borderColor: '#00BFFF', // Accent Blue
                backgroundColor: 'transparent',
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 0,
            },
            {
                label: 'Body Temperature',
                data: [36.5, 37, 36.8, 37.2], // Sample data
                borderColor: '#FD7E14', // Accent Orange
                backgroundColor: 'transparent',
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 0,
            }
        ]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#1E1E2D',
                    titleFont: {
                        family: 'Quicksand',
                        weight: 'bold',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Quicksand',
                        size: 12
                    },
                    padding: 10,
                    cornerRadius: 10,
                    displayColors: true,
                    borderColor: '#32344A',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    // Styling for the x-axis labels (Jun, Jul, etc.)
                    ticks: {
                        color: '#A0A3B1', // Text Secondary
                        font: {
                            family: 'Quicksand',
                            weight: '600'
                        }
                    },
                    // Hide the grid lines for the x-axis
                    grid: {
                        display: false,
                        drawBorder: false,
                    }
                },
                y: {
                    // Hide the entire y-axis as it's not in the design
                    display: false,
                    beginAtZero: false,
                    // We can still define a suggested range for better data presentation
                    suggestedMin: 30,
                    suggestedMax: 110
                }
            },
            // Makes the lines look smoother on hover
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    };

    // Create the chart instance
    const vitalsChart = new Chart(ctx, config);

    console.log("Patient dashboard UI script loaded and chart initialized.");
});
