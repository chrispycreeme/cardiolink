document.addEventListener('DOMContentLoaded', function() {
    if (typeof Chart === 'undefined') {
        console.error("Chart.js library not loaded. Please ensure 'https://cdn.jsdelivr.net/npm/chart.js' is included before this script.");
        return;
    }

    if (typeof chartLabels === 'undefined' || typeof heartRateData === 'undefined' ||
        typeof oxygenLevelData === 'undefined' || typeof bodyTemperatureData === 'undefined') {
        console.error("Chart data not available. Please ensure PHP is passing chartLabels, heartRateData, oxygenLevelData, and bodyTemperatureData.");
        return; 
    }

    const ctx = document.getElementById('vitalsChart');
    let vitalsChartInstance = null; 

    if (ctx) {
        function createGradient(chart, color) {
            const chartArea = chart.chartArea;
            if (!chartArea) {
                return null;
            }

            const ctx = chart.canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

            gradient.addColorStop(0, color + 'E0');
            gradient.addColorStop(0.6, color + '30');
            gradient.addColorStop(1, color + '00');

            return gradient;
        }

        if (vitalsChartInstance) {
            vitalsChartInstance.destroy();
        }

        vitalsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Heart Rate (bpm)',
                        data: heartRateData,
                        borderColor: '#C8435D',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#C8435D',
                        pointBorderColor: '#C8435D',
                        backgroundColor: (context) => createGradient(context.chart, '#C8435D')
                    },
                    {
                        label: 'Oxygen Level (%)',
                        data: oxygenLevelData,
                        borderColor: '#43C85D',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#43C85D',
                        pointBorderColor: '#43C85D',
                        backgroundColor: (context) => createGradient(context.chart, '#43C85D')
                    },
                    {
                        label: 'Body Temperature (°C)',
                        data: bodyTemperatureData,
                        borderColor: '#435DC8',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#435DC8',
                        pointBorderColor: '#435DC8',
                        backgroundColor: (context) => createGradient(context.chart, '#435DC8')
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#A5A5A5'
                        },
                        ticks: {
                            color: '#A5A5A5'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: '#35324B'
                        },
                        title: {
                            display: true,
                            text: 'Value',
                            color: '#A5A5A5'
                        },
                        ticks: {
                            color: '#A5A5A5'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#1E1B32',
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF',
                        borderColor: '#C8435D',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y;
                                    if (context.dataset.label.includes('Heart Rate')) {
                                        label += ' bpm';
                                    } else if (context.dataset.label.includes('Oxygen Level')) {
                                        label += ' %';
                                    } else if (context.dataset.label.includes('Body Temperature')) {
                                        label += ' °C';
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });

    } else {
        console.error("Canvas element with ID 'vitalsChart' not found.");
    }
});
