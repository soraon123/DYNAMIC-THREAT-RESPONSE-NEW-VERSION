document.addEventListener('DOMContentLoaded', function () {
    const cpuChartCtx = document.getElementById('cpu-chart').getContext('2d');
    const memoryChartCtx = document.getElementById('memory-chart').getContext('2d');

    let cpuThreshold = 70;
    let refreshInterval = 1000; // Default to 1 second
    let intervalId;

    const warningBox = document.getElementById("cpu-warning");
    const warningMessage = document.getElementById("warning-message");
    const cpuRating = document.getElementById("cpu-rating");

    const totalMemory = 8000;

    // Define CPU rating levels
    function getCpuRating(cpuUsage) {
        if (cpuUsage < 50) return { text: "Normal", color: "green" };
        if (cpuUsage < 80) return { text: "High", color: "orange" };
        return { text: "Critical", color: "red" };
    }

    const cpuChart = new Chart(cpuChartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU Usage (%)',
                data: [],
                borderColor: 'red',
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                borderWidth: 3,
                fill: true 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    const memoryChart = new Chart(memoryChartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Memory Usage (%)',
                data: [],
                borderColor: 'blue',
                backgroundColor: 'rgba(0, 0, 255, 0.2)',
                borderWidth: 3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    function updateSystemStats() {
        const cpuUsage = Math.random() * 100;
        const usedMemory = Math.random() * totalMemory;
        const memoryUsagePercentage = (usedMemory / totalMemory) * 100;

        // Update CPU Rating
        const rating = getCpuRating(cpuUsage);
        cpuRating.textContent = rating.text;
        cpuRating.style.color = rating.color;

        document.getElementById('cpu-usage').textContent = cpuUsage.toFixed(2) + '%';
        document.getElementById('memory-usage').textContent = memoryUsagePercentage.toFixed(2) + '%';

        cpuChart.data.labels.push(new Date().toLocaleTimeString());
        cpuChart.data.datasets[0].data.push(cpuUsage);

        memoryChart.data.labels.push(new Date().toLocaleTimeString());
        memoryChart.data.datasets[0].data.push(memoryUsagePercentage);

        if (cpuChart.data.datasets[0].data.length > 10) {
            cpuChart.data.labels.shift();
            cpuChart.data.datasets[0].data.shift();
        }
        if (memoryChart.data.datasets[0].data.length > 10) {
            memoryChart.data.labels.shift();
            memoryChart.data.datasets[0].data.shift();
        }

        cpuChart.update();
        memoryChart.update();
    }

    function updateRunningProcesses() {
        let runningProcesses = [
            { name: "chrome", pid: 1234, cpu: Math.random() * 50, memory: Math.random() * 2000 + 100 },
            { name: "node", pid: 5678, cpu: Math.random() * 50, memory: Math.random() * 1500 + 50 },
            { name: "discord", pid: 7890, cpu: Math.random() * 50, memory: Math.random() * 1000 + 30 }
        ];

        runningProcesses.sort((a, b) => b.cpu - a.cpu);

        const tbody = document.querySelector("#process-table tbody");
        tbody.innerHTML = "";

        let highCpuProcesses = [];

        runningProcesses.forEach(process => {
            const memoryPercentage = (process.memory / totalMemory) * 100;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${process.name}</td>
                <td>${process.pid}</td>
                <td>${process.cpu.toFixed(2)}%</td>
                <td>${memoryPercentage.toFixed(2)}%</td>
                <td><button class="terminate-btn" data-pid="${process.pid}">Terminate</button></td>
            `;

            if (process.cpu > cpuThreshold) {
                tr.style.color = "red"; 
                highCpuProcesses.push(process.name);
            }

            tbody.appendChild(tr);
        });

        if (highCpuProcesses.length > 0) {
            warningBox.style.display = "block";
            warningMessage.innerHTML = `⚠️ High CPU Usage: ${highCpuProcesses.join(", ")}`;
        } else {
            warningBox.style.display = "none";
        }

        document.querySelectorAll(".terminate-btn").forEach(button => {
            button.addEventListener("click", function () {
                const pid = this.getAttribute("data-pid");
                terminateProcess(pid);
            });
        });
    }

    function updateRecentEvents() {
        const historyData = [
            { time: new Date().toLocaleTimeString(), process: "chrome", pid: 1234, cpu: "15%", action: "Normal" },
            { time: new Date().toLocaleTimeString(), process: "node", pid: 5678, cpu: "30%", action: "High CPU" },
        ];

        const tbody = document.querySelector("#history-table tbody");
        tbody.innerHTML = "";

        historyData.forEach(event => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${event.time}</td>
                <td>${event.process}</td>
                <td>${event.pid}</td>
                <td>${event.cpu}</td>
                <td>${event.action}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function terminateProcess(pid) {
        alert(`Process with PID ${pid} has been terminated.`);

        // Remove the process from the table (simulated)
        const rows = document.querySelectorAll("#process-table tbody tr");
        rows.forEach(row => {
            if (row.children[1].textContent == pid) {
                row.remove();
            }
        });
    }

    function startUpdating() {
        clearInterval(intervalId);
        intervalId = setInterval(() => {
            updateSystemStats();
            updateRunningProcesses();
            updateRecentEvents();
        }, refreshInterval);
    }

    document.getElementById("refresh-rate").addEventListener("change", function () {
        refreshInterval = parseInt(this.value);
        startUpdating();
    });

    document.getElementById('update-threshold').addEventListener('click', function () {
        cpuThreshold = parseInt(document.getElementById('cpu-threshold').value) || 70;
        alert('New CPU threshold set to: ' + cpuThreshold + '%');
    });

    startUpdating();
});
