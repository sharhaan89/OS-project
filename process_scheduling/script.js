class Process {
    constructor(id, arrivalTime, burstTime, priority, deadline = 1) {
        this.id = id;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.priority = priority;
        this.deadline = deadline;
    }
}


class ProcessResult extends Process {
    constructor(process, startTime, completionTime) {
        super(process.id, process.arrivalTime, process.burstTime, process.priority);
        this.startTime = startTime;
        this.completionTime = completionTime;
        this.turnaroundTime = completionTime - process.arrivalTime;
        this.waitingTime = this.turnaroundTime - process.burstTime;
    }
}


const algorithmSelect = document.getElementById('algorithm');
const processTableBody = document.getElementById('processTableBody');
const priorityHeader = document.getElementById('priorityHeader');
const EDFHeader = document.getElementById('EDFHeader');
const decreaseProcessesBtn = document.getElementById('decreaseProcesses');
const increaseProcessesBtn = document.getElementById('increaseProcesses');
const processCountDisplay = document.getElementById('processCount');
const runButton = document.getElementById('runButton');
const resetButton = document.getElementById('resetButton');
const resultsSection = document.getElementById('resultsSection');
const resultsTableBody = document.getElementById('resultsTableBody');
const ganttChartCanvas = document.getElementById('ganttChart');
const avgWaitingTimeElement = document.getElementById('avgWaitingTime');
const avgTurnaroundTimeElement = document.getElementById('avgTurnaroundTime');
const algorithmTitleElement = document.getElementById('algorithmTitle');
const advantagesList = document.getElementById('advantagesList');
const disadvantagesList = document.getElementById('disadvantagesList');
const descriptionList = document.getElementById('descriptionList');
const backButton = document.getElementById('backButton');
const osConceptsButton = document.getElementById('osConceptsButton');

let processes = [
    new Process('P1', 0, 5, 3),
    new Process('P2', 0, 2, 1),
    new Process('P3', 0, 4, 2)
];
let numberOfProcesses = 3;
let results = [];
let ganttChart = [];
let hasRun = false;


function init() {
    updateProcessTableUI();
    attachEventListeners();
}


function attachEventListeners() {

    algorithmSelect.addEventListener('change', function() {
        const algorithm = this.value;
        priorityHeader.style.display = algorithm === 'Priority' ? 'table-cell' : 'none';
        updateProcessTableUI();
    });

    algorithmSelect.addEventListener('change', function() {
        const algorithm = this.value;
        EDFHeader.style.display = algorithm === 'EDF' ? 'table-cell' : 'none';
        updateProcessTableUI();
    });


    decreaseProcessesBtn.addEventListener('click', function() {
        if (numberOfProcesses > 1) {
            numberOfProcesses--;
            processCountDisplay.textContent = numberOfProcesses;
            updateProcessesArray();
            updateProcessTableUI();
        }
    });

    increaseProcessesBtn.addEventListener('click', function() {
        numberOfProcesses++;
        processCountDisplay.textContent = numberOfProcesses;
        updateProcessesArray();
        updateProcessTableUI();
    });


    runButton.addEventListener('click', runSchedulingAlgorithm);


    resetButton.addEventListener('click', resetApplication);


    backButton.addEventListener('click', function() {
        alert('This would navigate back to the home page in a multi-page application.');
    });


    osConceptsButton.addEventListener('click', function() {
        alert('This would open the OS Concepts menu in a full application.');
    });
}


function updateProcessesArray() {
    if (numberOfProcesses > processes.length) {
        for (let i = processes.length + 1; i <= numberOfProcesses; i++) {
            processes.push(new Process(
                `P${i}`, 
                0, 
                Math.floor(Math.random() * 5) + 1,
                Math.floor(Math.random() * 5) + 1
            ));
        }
    } else if (numberOfProcesses < processes.length) {
        processes = processes.slice(0, numberOfProcesses);
    }
}


function updateProcessTableUI() {
    processTableBody.innerHTML = '';
    const showPriority = algorithmSelect.value === 'Priority';
    const showEDF = algorithmSelect.value === 'EDF';
   
    processes.forEach((process, index) => {
        const row = document.createElement('tr');
        

        const idCell = document.createElement('td');
        idCell.textContent = process.id;
        idCell.style.color = '#2A9D8F'; // teal color for process id
        row.appendChild(idCell);
        

        const arrivalCell = document.createElement('td');
        const arrivalInput = document.createElement('input');
        arrivalInput.type = 'number';
        arrivalInput.min = '0';
        arrivalInput.value = process.arrivalTime;
        arrivalInput.addEventListener('change', function() {
            processes[index].arrivalTime = parseInt(this.value) || 0;
        });
        arrivalCell.appendChild(arrivalInput);
        row.appendChild(arrivalCell);
        

        const burstCell = document.createElement('td');
        const burstInput = document.createElement('input');
        burstInput.type = 'number';
        burstInput.min = '1';
        burstInput.value = process.burstTime;
        burstInput.addEventListener('change', function() {
            processes[index].burstTime = parseInt(this.value) || 1;
        });
        burstCell.appendChild(burstInput);
        row.appendChild(burstCell);
        

        if (showPriority) {
            const priorityCell = document.createElement('td');
            const priorityInput = document.createElement('input');
            priorityInput.type = 'number';
            priorityInput.min = '1';
            priorityInput.value = process.priority;
            priorityInput.addEventListener('change', function() {
                processes[index].priority = parseInt(this.value) || 1;
            });
            priorityCell.appendChild(priorityInput);
            row.appendChild(priorityCell);
        }

        if (showEDF) {
            const EDFCell = document.createElement('td');
            const EDFInput = document.createElement('input');
            EDFInput.type = 'number';
            EDFInput.min = '1';
            EDFInput.value = process.priority;
            EDFInput.addEventListener('change', function() {
                processes[index].deadline = parseInt(this.value) || 1;
            });
            EDFCell.appendChild(EDFInput);
            row.appendChild(EDFCell);
        }
        
        processTableBody.appendChild(row);
    });
}


function runSchedulingAlgorithm() {
    const algorithm = algorithmSelect.value;
    let calculationResult;
    
    switch (algorithm) {
        case 'FCFS':
            calculationResult = calculateFCFS(processes);
            break;
        case 'SJF':
            calculationResult = calculateSJF(processes);
            break;
        case 'SRTF':
            calculationResult = calculateSRTF(processes);
            break;
        case 'RoundRobin':
            calculationResult = calculateRoundRobin(processes);
            break;
        case 'Priority':
            calculationResult = calculatePriority(processes);
            break;
        case 'EDF':
            calculationResult = calculateEDF(processes);
            break;
        default:
            calculationResult = calculateFCFS(processes);
    }
    
    results = calculationResult.results;
    ganttChart = calculationResult.ganttChart;
    

    updateResultsUI(calculationResult);
    drawGanttChart();
    updateAlgorithmInfo(algorithm);
    

    resultsSection.style.display = 'block';
    hasRun = true;
}


function updateResultsUI(calculationResult) {

    resultsTableBody.innerHTML = '';
    

    calculationResult.results.forEach(process => {
        const row = document.createElement('tr');
        
        const cells = [
            { value: process.id, isProcessId: true },
            { value: process.arrivalTime, isProcessId: false },
            { value: process.burstTime, isProcessId: false },
            { value: process.startTime, isProcessId: false },
            { value: process.completionTime, isProcessId: false },
            { value: process.turnaroundTime, isProcessId: false },
            { value: process.waitingTime, isProcessId: false }
        ];
        
        cells.forEach(cellData => {
            const cell = document.createElement('td');
            cell.textContent = cellData.value;
            if (cellData.isProcessId) {
                cell.style.color = '#2A9D8F';
            }
            row.appendChild(cell);
        });
        
        resultsTableBody.appendChild(row);
    });
    

    avgWaitingTimeElement.textContent = calculationResult.averageWaitingTime.toFixed(2);
    avgTurnaroundTimeElement.textContent = calculationResult.averageTurnaroundTime.toFixed(2);
}

function drawGanttChart() {
    const canvas = ganttChartCanvas;
    const ctx = canvas.getContext('2d');
    const height = canvas.height;


    ctx.clearRect(0, 0, canvas.width, canvas.height);


    const endTime = Math.max(...ganttChart.map(item => item.end));
    const startTime = Math.min(...ganttChart.map(item => item.start));
    const timeRange = endTime - startTime || 1;


    const scaleX = canvas.width / timeRange;


    const colors = [
        "#e67e22", "#3498db", "#e74c3c", "#2ecc71", "#9b59b6",
        "#1abc9c", "#d35400", "#34495e", "#27ae60", "#f39c12"
    ];


    ganttChart.forEach((item, index) => {
        const x = (item.start - startTime) * scaleX;
        const width = (item.end - item.start) * scaleX;

        const processNumber = parseInt(item.id.substring(1)) - 1;
        const color = colors[processNumber % colors.length];


        ctx.fillStyle = color;
        ctx.fillRect(x, 10, width, height - 30);


        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 10, width, height - 30);


        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(item.id, x + width / 2, height / 2 - 5);


        ctx.font = "11px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`${item.start}`, x, height);


        if (index === ganttChart.length - 1 || ganttChart[index + 1].start > item.end) {
            ctx.textAlign = "right";
            ctx.fillText(`${item.end}`, x + width, height);
        }
    });


    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 10);
    ctx.lineTo(canvas.width, height - 10);
    ctx.stroke();
}




function updateAlgorithmInfo(algorithm) {
    algorithmTitleElement.textContent = algorithm + ' Algorithm';
    
    const info = getAlgorithmInfo(algorithm);
    

    descriptionList.innerHTML = '';
    advantagesList.innerHTML = '';
    disadvantagesList.innerHTML = '';

    info.description.forEach(description => {
        const li = document.createElement('li');
        li.textContent = description;
        descriptionList.appendChild(li);
    });
    

    info.advantages.forEach(advantage => {
        const li = document.createElement('li');
        li.textContent = advantage;
        advantagesList.appendChild(li);
    });
    

    info.disadvantages.forEach(disadvantage => {
        const li = document.createElement('li');
        li.textContent = disadvantage;
        disadvantagesList.appendChild(li);
    });
}


function resetApplication() {
    processes = [
        new Process('P1', 0, 5, 3),
        new Process('P2', 0, 2, 1),
        new Process('P3', 0, 4, 2)
    ];
    numberOfProcesses = 3;
    processCountDisplay.textContent = numberOfProcesses;
    
    results = [];
    ganttChart = [];
    
    updateProcessTableUI();
    resultsSection.style.display = 'none';
    hasRun = false;
}


function calculateFCFS(processes) {

    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    const results = [];
    const ganttChart = [];
    
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    
    for (const process of sortedProcesses) {

        currentTime = Math.max(currentTime, process.arrivalTime);
        
        const startTime = currentTime;
        const completionTime = startTime + process.burstTime;
        
        const result = new ProcessResult(process, startTime, completionTime);
        results.push(result);
        
        ganttChart.push({
            id: process.id,
            start: startTime,
            end: completionTime,
        });
        
        totalWaitingTime += result.waitingTime;
        totalTurnaroundTime += result.turnaroundTime;
        currentTime = completionTime;
    }
    
    return {
        results,
        ganttChart,
        averageWaitingTime: totalWaitingTime / processes.length,
        averageTurnaroundTime: totalTurnaroundTime / processes.length,
    };
}

function calculateRoundRobin(processes, timeQuantum = 2) {

    const processesCopy = processes.map(p => ({
        ...p,
        remainingTime: p.burstTime
    }));
    
    const results = processes.map(p => ({
        ...p,
        startTime: -1, 
        completionTime: 0,
        turnaroundTime: 0,
        waitingTime: 0,
    }));
    
    const ganttChart = [];
    
    let currentTime = 0;
    const queue = [];
    
    for (let i = 0; i < processesCopy.length; i++) {
        if (processesCopy[i].arrivalTime === 0) {
            queue.push(i);
        }
    }
    
    while (queue.length > 0) {
        const index = queue.shift();
        
        if (results[index].startTime === -1) {
            results[index].startTime = currentTime;
        }
        
        const executeTime = Math.min(timeQuantum, processesCopy[index].remainingTime);
        
        ganttChart.push({
            id: processesCopy[index].id,
            start: currentTime,
            end: currentTime + executeTime,
        });
        
        currentTime += executeTime;
        processesCopy[index].remainingTime -= executeTime;
        
        for (let i = 0; i < processesCopy.length; i++) {
            if (
                !queue.includes(i) && 
                processesCopy[i].remainingTime > 0 && 
                processesCopy[i].arrivalTime <= currentTime &&
                i !== index
            ) {
                if (processesCopy[i].arrivalTime >= ganttChart[ganttChart.length - 1].start) {
                    queue.push(i);
                }
            }
        }
        
        if (processesCopy[index].remainingTime > 0) {
            queue.push(index);
        } else {

            results[index].completionTime = currentTime;
            results[index].turnaroundTime = results[index].completionTime - processesCopy[index].arrivalTime;
            results[index].waitingTime = results[index].turnaroundTime - processesCopy[index].burstTime;
        }
    }
    
    const totalWaitingTime = results.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalTurnaroundTime = results.reduce((sum, p) => sum + p.turnaroundTime, 0);
    
    return {
        results,
        ganttChart,
        averageWaitingTime: totalWaitingTime / processes.length,
        averageTurnaroundTime: totalTurnaroundTime / processes.length,
    };
}


function calculateSJF(processes) {

    const processesCopy = [...processes];
    
    const results = [];
    const ganttChart = [];
    
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let remainingProcesses = processesCopy.length;
    

    const completed = new Set();
    
    while (remainingProcesses > 0) {

        let shortestJobIndex = -1;
        let shortestBurstTime = Infinity;
        
        for (let i = 0; i < processesCopy.length; i++) {
            const process = processesCopy[i];
            if (!completed.has(process.id) && 
                process.arrivalTime <= currentTime && 
                process.burstTime < shortestBurstTime) {
                shortestBurstTime = process.burstTime;
                shortestJobIndex = i;
            }
        }
        

        if (shortestJobIndex === -1) {

            let nextArrival = Infinity;
            for (const process of processesCopy) {
                if (!completed.has(process.id) && process.arrivalTime > currentTime && process.arrivalTime < nextArrival) {
                    nextArrival = process.arrivalTime;
                }
            }
            currentTime = nextArrival;
            continue;
        }
        

        const process = processesCopy[shortestJobIndex];
        const startTime = currentTime;
        const completionTime = startTime + process.burstTime;
        
        const result = new ProcessResult(process, startTime, completionTime);
        results.push(result);
        
        ganttChart.push({
            id: process.id,
            start: startTime,
            end: completionTime,
        });
        
        totalWaitingTime += result.waitingTime;
        totalTurnaroundTime += result.turnaroundTime;
        
        currentTime = completionTime;
        completed.add(process.id);
        remainingProcesses--;
    }
    
    return {
        results,
        ganttChart,
        averageWaitingTime: totalWaitingTime / processesCopy.length,
        averageTurnaroundTime: totalTurnaroundTime / processesCopy.length,
    };
}


function calculateSRTF(processes) {

    const processesCopy = processes.map(p => ({ 
        ...p, 
        remainingTime: p.burstTime,
        startTime: -1,
        completionTime: 0
    }));
    
    const results = [];
    const ganttChart = [];
    
    let currentTime = 0;
    let completedProcesses = 0;
    const n = processesCopy.length;
    

    let currentProcessIndex = -1;
    let prevProcessIndex = -1;
    

    while (completedProcesses < n) {

        let shortestRemainingTime = Infinity;
        currentProcessIndex = -1;
        
        for (let i = 0; i < n; i++) {
            if (processesCopy[i].arrivalTime <= currentTime && 
                processesCopy[i].remainingTime > 0 && 
                processesCopy[i].remainingTime < shortestRemainingTime) {
                shortestRemainingTime = processesCopy[i].remainingTime;
                currentProcessIndex = i;
            }
        }
        

        if (currentProcessIndex === -1) {
            currentTime++;
            continue;
        }
        

        if (prevProcessIndex !== currentProcessIndex) {

            if (ganttChart.length > 0 && prevProcessIndex !== -1) {
                ganttChart[ganttChart.length - 1].end = currentTime;
            }
            

            ganttChart.push({
                id: processesCopy[currentProcessIndex].id,
                start: currentTime,
                end: -1 
            });
            
            if (processesCopy[currentProcessIndex].startTime === -1) {
                processesCopy[currentProcessIndex].startTime = currentTime;
            }
        }
        
        processesCopy[currentProcessIndex].remainingTime--;
        currentTime++;
        prevProcessIndex = currentProcessIndex;
        
        if (processesCopy[currentProcessIndex].remainingTime === 0) {
            completedProcesses++;
            
            processesCopy[currentProcessIndex].completionTime = currentTime;
            
            ganttChart[ganttChart.length - 1].end = currentTime;
            
            const process = processes[currentProcessIndex];
            const startTime = processesCopy[currentProcessIndex].startTime;
            const completionTime = processesCopy[currentProcessIndex].completionTime;
            
            const result = new ProcessResult(process, startTime, completionTime);
            results.push(result);
            
            prevProcessIndex = -1;
        }
    }
    
    const consolidatedGantt = [];
    
    for (let i = 0; i < ganttChart.length; i++) {
        const current = ganttChart[i];
        
        if (i === 0 || current.id !== consolidatedGantt[consolidatedGantt.length - 1].id) {
            consolidatedGantt.push({ ...current });
        } else {
            consolidatedGantt[consolidatedGantt.length - 1].end = current.end;
        }
    }
    

    const totalWaitingTime = results.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalTurnaroundTime = results.reduce((sum, p) => sum + p.turnaroundTime, 0);
    
    return {
        results,
        ganttChart: consolidatedGantt,
        averageWaitingTime: totalWaitingTime / n,
        averageTurnaroundTime: totalTurnaroundTime / n,
    };
}

function calculateEDF(processes) {
    const processesCopy = processes.map(p => ({
        ...p,
        remainingTime: p.burstTime,
        startTime: -1,
        completionTime: 0,
        completed: false
    }));
    
    const results = [];
    const ganttChart = [];
    
    let currentTime = 0;
    let completedCount = 0;
    

    while (completedCount < processesCopy.length) {

        const readyQueue = processesCopy.filter(p => 
            !p.completed && p.arrivalTime <= currentTime
        );
        
        if (readyQueue.length === 0) {

            const nextArrival = processesCopy
                .filter(p => !p.completed)
                .reduce((min, p) => Math.min(min, p.arrivalTime), Infinity);
            

                if (currentTime < nextArrival) {
                ganttChart.push({
                    id: "idle",
                    start: currentTime,
                    end: nextArrival
                });
            }
            
            currentTime = nextArrival;
            continue;
        }
        

        readyQueue.sort((a, b) => a.deadline - b.deadline);
        

        const currentProcess = readyQueue[0];
        

        if (currentProcess.startTime === -1) {
            currentProcess.startTime = currentTime;
        }
        

        const processIndex = processesCopy.findIndex(p => p.id === currentProcess.id);
        

        if (ganttChart.length === 0 || ganttChart[ganttChart.length - 1].id !== currentProcess.id) {
            ganttChart.push({
                id: currentProcess.id,
                start: currentTime,
                end: currentTime + 1
            });
        } else {

            ganttChart[ganttChart.length - 1].end = currentTime + 1;
        }
        

        currentTime += 1;
        processesCopy[processIndex].remainingTime -= 1;
        

        if (processesCopy[processIndex].remainingTime === 0) {
            processesCopy[processIndex].completed = true;
            processesCopy[processIndex].completionTime = currentTime;
            completedCount++;
            

            const originalProcess = processes.find(p => p.id === currentProcess.id);
            results.push(new ProcessResult(
                originalProcess,
                processesCopy[processIndex].startTime,
                processesCopy[processIndex].completionTime
            ));
        }
    }
    

    const consolidatedGantt = [];
    for (let i = 0; i < ganttChart.length; i++) {
        if (i === 0 || ganttChart[i].id !== ganttChart[i-1].id) {
            consolidatedGantt.push({...ganttChart[i]});
        } else {
            consolidatedGantt[consolidatedGantt.length - 1].end = ganttChart[i].end;
        }
    }
    
    const totalWaitingTime = results.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalTurnaroundTime = results.reduce((sum, p) => sum + p.turnaroundTime, 0);
    
    return {
        results,
        ganttChart: consolidatedGantt,
        averageWaitingTime: totalWaitingTime / processes.length,
        averageTurnaroundTime: totalTurnaroundTime / processes.length,
    };
}



function calculatePriority(processes) {

    const processesCopy = processes.map(p => ({ 
        ...p, 

        priority: p.priority !== undefined ? p.priority : 99
    }));
    

    const sortedProcesses = [...processesCopy].sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    const results = [];
    const ganttChart = [];
    
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let remainingProcesses = sortedProcesses.length;


    const completed = new Set();
    
    while (remainingProcesses > 0) {

        let highestPriorityIndex = -1;
        let highestPriority = Infinity;
        
        for (let i = 0; i < sortedProcesses.length; i++) {
            const process = sortedProcesses[i];
            if (!completed.has(process.id) && 
                process.arrivalTime <= currentTime && 
                process.priority < highestPriority) {
                highestPriority = process.priority;
                highestPriorityIndex = i;
            }
        }
        
        if (highestPriorityIndex === -1) {

            let nextArrival = Infinity;
            for (const process of sortedProcesses) {
                if (!completed.has(process.id) && process.arrivalTime > currentTime && process.arrivalTime < nextArrival) {
                    nextArrival = process.arrivalTime;
                }
            }
            currentTime = nextArrival;
            continue;
        }
        
        const process = sortedProcesses[highestPriorityIndex];
        const startTime = currentTime;
        const completionTime = startTime + process.burstTime;
        
        const result = new ProcessResult(process, startTime, completionTime);
        results.push(result);
        
        ganttChart.push({
            id: process.id,
            start: startTime,
            end: completionTime,
        });
        
        totalWaitingTime += result.waitingTime;
        totalTurnaroundTime += result.turnaroundTime;
        
        currentTime = completionTime;
        completed.add(process.id);
        remainingProcesses--;
    }
    
    return {
        results,
        ganttChart,
        averageWaitingTime: totalWaitingTime / sortedProcesses.length,
        averageTurnaroundTime: totalTurnaroundTime / sortedProcesses.length,
    };
}


function getAlgorithmInfo(algorithm) {
    switch (algorithm) {
        case 'FCFS':
            return {
                description:[
                    "Processes are scheduled in the order they arrive in the ready queue",
                    "It is a non-preemptive scheduling algorithm",
                    "The first process that arrives gets the CPU first.",
                    "Each process runs to completion before the next one starts.",
                    "Simple queue-based approach, like FIFO"
                ],
                advantages: [
                    "Simple to implement and understand",
                    "First job gets served first without any overhead",
                    "No starvation since every process gets chance to execute"
                ],
                disadvantages: [
                    "Convoy effect: short processes wait for long processes to finish",
                    "Not optimal for interactive systems where quick response is needed",
                    "Average waiting time can be high if process order is suboptimal"
                ]
            };
        case 'SJF':
            return {
                description:[
                    "Selects the process with the shortest burst time first.",
                    "It is non-preemptive (preemptive variant is SRTF).",
                    "When the CPU becomes free, the shortest ready job is selected.",
                    "Reduces average waiting time if burst times are known.",
                    "Does not consider arrival time during execution."
                ],
                advantages: [
                    "Provides minimum average waiting time among all scheduling algorithms",
                    "Good for batch systems where run times are known in advance",
                    "Simple to understand and implement",
                    "Prioritizes quick jobs, improving system throughput"
                ],
                disadvantages: [
                    "Difficult to predict burst time in advance in real systems",
                    "May cause starvation for long processes if short jobs keep arriving",
                    "Not responsive for interactive processes with unpredictable burst times",
                    "Not suitable for time-sharing systems"
                ]
            };
        case 'SRTF':
            return {
                description:[
                    "Preemptive version of SJF.",
                    "CPU always assigned to the process with the shortest remaining burst time.",
                    "If a new process arrives with less burst time than the current one, preemption occurs.",
                    "Continuously checks for shorter jobs in the ready queue.",
                    "Minimizes average waiting and turnaround time."
                ],
                advantages: [
                    "Optimal - guarantees minimum average waiting time",
                    "Responsive to short processes that arrive in the system",
                    "Good for time-critical applications",
                    "Adapts to changing system loads"
                ],
                disadvantages: [
                    "High overhead due to frequent context switching",
                    "Difficult to predict CPU burst time in advance",
                    "May cause starvation of processes with long burst times",
                    "More complex to implement than non-preemptive algorithms"
                ]
            };
        case 'RoundRobin':
            return {
                description:[
                    "Each process is assigned a fixed time quantum = 4 units.",
                    "Processes are executed in a cyclic order.",
                    "If a process doesn't finish in its time slice, it is moved to the end of the queue.",
                    "Preemptive by design.",
                    "Ensures fairness among all processes."
                ],
                advantages: [
                    "Fair allocation of CPU among processes",
                    "Good for time-sharing systems",
                    "Lower average waiting time for processes with smaller burst times",
                    "Responsive to interactive processes"
                ],
                disadvantages: [
                    "Higher overhead due to frequent context switching",
                    "Performance depends on time quantum selection",
                    "If time quantum too large, degenerates to FCFS",
                    "If time quantum too small, too many context switches"
                ]
            };
        case 'EDF':
            return {
                description:[
                    "Primarily used in real-time systems.",
                    "CPU is assigned to the process with the earliest deadline.",
                    "It is a dynamic priority scheduling algorithm.",
                    "Deadlines can be absolute or relative to arrival time.",
                    "Preemptive: if a process with an earlier deadline arrives, it can preempt the current one."
                ],
                advantages: [
                    "Optimal for meeting deadlines when system is not overloaded",
                    "Dynamic priority assignment based on urgency",
                    "Good utilization of CPU time",
                    "Minimizes deadline misses"
                ],
                disadvantages: [
                    "Can cause starvation of processes with longer deadlines",
                    "Requires knowledge of deadlines in advance",
                    "Performance degrades under high load",
                    "More complex to implement than static priority algorithms"
                ]
            };
        case 'Priority':
            return {
                description:[
                    "Each process is assigned a priority value.",
                    "CPU is allocated to the process with the highest priority (lowest number or highest depending on convention).",
                    "Can be preemptive or non-preemptive.",
                    "If a higher-priority process arrives.",
                    "Ties are usually broken using FCFS."
                ],
                advantages: [
                    "Prioritizes important processes",
                    "Ensures critical tasks complete first",
                    "Flexible priority assignment based on business needs",
                    "Good for mixed workloads with varying importance"
                ],
                disadvantages: [
                    "Can lead to starvation of lower priority processes",
                    "Requires priority assignment mechanism",
                    "Overhead in managing priority values",
                    "Priority inversion problems may occur without mitigation"
                ]
            };
        default:
            return {
                description: [],
                advantages: [],
                disadvantages: []
            };
    }
}

document.addEventListener('DOMContentLoaded', init);
