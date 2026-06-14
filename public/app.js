document.addEventListener('DOMContentLoaded', () => {
    const lockScreen = document.getElementById('lock-screen');
    const dashboard = document.getElementById('dashboard');
    const unlockBtn = document.getElementById('unlock-btn');
    const unlockPassword = document.getElementById('unlock-password');
    const unlockError = document.getElementById('unlock-error');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const uploadStatus = document.getElementById('upload-status');
    const ctx = document.getElementById('historyChart').getContext('2d');

    let historyChart;

    // Check Status
    fetch('/status')
        .then(res => res.json())
        .then(data => {
            if (data.locked) {
                lockScreen.classList.remove('hidden');
            } else {
                dashboard.classList.remove('hidden');
                loadHistory();
            }
        });

    unlockBtn.addEventListener('click', () => {
        const password = unlockPassword.value;
        fetch('/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(res => {
            if (res.status === 200) {
                lockScreen.classList.add('hidden');
                dashboard.classList.remove('hidden');
                loadHistory();
            } else {
                unlockError.textContent = res.body.error || 'Unlock failed';
            }
        });
    });

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            uploadFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            uploadFile(fileInput.files[0]);
        }
    });

    function uploadFile(file) {
        uploadStatus.textContent = 'Uploading and processing...';
        const formData = new FormData();
        formData.append('file', file);

        fetch('/import-csv', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(res => {
            if (res.status === 200) {
                uploadStatus.textContent = `Successfully processed: ${res.body.record.date} (Score: ${res.body.record.sleep_score})`;
                loadHistory();
            } else {
                uploadStatus.textContent = `Error: ${res.body.error}`;
            }
        })
        .catch(err => {
            uploadStatus.textContent = `Upload failed: ${err.message}`;
        });
    }

    function loadHistory() {
        fetch('/history')
            .then(res => res.json())
            .then(data => renderChart(data));
    }

    function renderChart(data) {
        if (historyChart) historyChart.destroy();
        
        const labels = data.map(d => d.date);
        const scores = data.map(d => d.sleep_score);
        const hrvs = data.map(d => d.hrv_avg);

        historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Sleep Score',
                        data: scores,
                        borderColor: '#bb86fc',
                        backgroundColor: 'rgba(187, 134, 252, 0.2)',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Avg HRV',
                        data: hrvs,
                        borderColor: '#03dac6',
                        backgroundColor: 'rgba(3, 218, 198, 0.2)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Sleep Score' },
                        min: 0,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'HRV' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }
});
