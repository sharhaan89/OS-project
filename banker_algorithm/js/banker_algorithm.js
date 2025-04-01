// Banker's Algorithm Visualization
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const resetBtn = document.getElementById('reset');
    const nextStepBtn = document.getElementById('next-step');
    const autoRunBtn = document.getElementById('auto-run');
    const speedSelect = document.getElementById('speed');
    const availableResourcesEl = document.getElementById('available-resources');
    const totalResourcesEl = document.getElementById('total-resources');
    const processContainerEl = document.getElementById('process-container');
    const sequenceTrackEl = document.querySelector('.sequence-track');
    const currentStepDisplayEl = document.getElementById('current-step-display');

    // Variables
    let currentStep = 0;
    let autoRunInterval = null;
    let safeSequence = [];
    let isRunning = false;
    let animationInProgress = false;

    // Sample data for the algorithm
    const initialState = {
        processes: 5,
        resources: 3,
        available: [3, 3, 2],
        max: [
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3]
        ],
        allocation: [
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2]
        ],
        need: [
            [7, 4, 3],
            [1, 2, 2],
            [6, 0, 0],
            [0, 1, 1],
            [4, 3, 1]
        ],
        processState: Array(5).fill('waiting'), // 'waiting', 'active', 'completed'
        totalResources: [10, 5, 7]
    };

    // Deep copy of the initial state
    let state = JSON.parse(JSON.stringify(initialState));

    // Helper functions
    const createResourceElements = (resources, container) => {
        container.innerHTML = '';
        resources.forEach((count, index) => {
            const resourceType = String.fromCharCode(65 + index); // A, B, C, etc.
            const resourceElement = document.createElement('div');
            resourceElement.className = `resource resource-${resourceType}`;
            resourceElement.setAttribute('data-type', resourceType);
            resourceElement.textContent = count;
            container.appendChild(resourceElement);
        });
    };

    const updateResourceElements = (resources, container, previousResources) => {
        const resourceElements = container.querySelectorAll('.resource');
        
        resources.forEach((count, index) => {
            const resourceElement = resourceElements[index];
            if (previousResources && count !== previousResources[index]) {
                resourceElement.classList.add('updated');
                setTimeout(() => {
                    resourceElement.classList.remove('updated');
                }, 1000);
            }
            resourceElement.textContent = count;
        });
    };

    const createProcessElements = () => {
        processContainerEl.innerHTML = '';
        
        for (let i = 0; i < state.processes; i++) {
            const processElement = document.createElement('div');
            processElement.className = `process-card ${state.processState[i]}`;
            processElement.id = `process-${i}`;
            
            const processHTML = `
                <div class="process-header">
                    <div class="process-id">P${i}</div>
                    <div class="process-status ${state.processState[i]}">${state.processState[i].toUpperCase()}</div>
                </div>
                <div class="process-matrices">
                    <div class="matrix-row">
                        <div class="matrix-label">Allocation:</div>
                        <div class="matrix-values">
                            ${state.allocation[i].map(val => `<div class="matrix-cell">${val}</div>`).join('')}
                        </div>
                    </div>
                    <div class="matrix-row">
                        <div class="matrix-label">Need:</div>
                        <div class="matrix-values">
                            ${state.need[i].map(val => `<div class="matrix-cell">${val}</div>`).join('')}
                        </div>
                    </div>
                    <div class="matrix-row">
                        <div class="matrix-label">Max:</div>
                        <div class="matrix-values">
                            ${state.max[i].map(val => `<div class="matrix-cell">${val}</div>`).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            processElement.innerHTML = processHTML;
            processContainerEl.appendChild(processElement);
        }
    };

    const updateProcessElements = () => {
        for (let i = 0; i < state.processes; i++) {
            const processElement = document.getElementById(`process-${i}`);
            if (processElement) {
                // Update class
                processElement.className = `process-card ${state.processState[i]}`;
                
                // Update status
                const statusElement = processElement.querySelector('.process-status');
                statusElement.className = `process-status ${state.processState[i]}`;
                statusElement.textContent = state.processState[i].toUpperCase();
            }
        }
    };

    const updateSequence = () => {
        sequenceTrackEl.innerHTML = '';
        
        if (safeSequence.length === 0) return;
        
        const trackWidth = sequenceTrackEl.offsetWidth;
        const stepWidth = trackWidth / (safeSequence.length + 1);
        
        // Create nodes and paths
        safeSequence.forEach((processId, index) => {
            // Create node
            const node = document.createElement('div');
            node.className = 'sequence-node';
            node.textContent = `P${processId}`;
            node.style.left = `${stepWidth * (index + 1) - 25}px`;
            
            if (index < currentStep - algorithmSteps.length + safeSequence.length) {
                node.classList.add('active');
            }
            
            sequenceTrackEl.appendChild(node);
            
            // Create path to next node
            if (index < safeSequence.length - 1) {
                const path = document.createElement('div');
                path.className = 'sequence-path';
                path.style.left = `${stepWidth * (index + 1)}px`;
                path.style.width = `${stepWidth - 50}px`;
                
                if (index < currentStep - algorithmSteps.length + safeSequence.length - 1) {
                    path.classList.add('active');
                }
                
                sequenceTrackEl.appendChild(path);
            }
        });
    };

    const highlightProcessNeed = (processId) => {
        const processElement = document.getElementById(`process-${processId}`);
        if (processElement) {
            const needCells = processElement.querySelectorAll('.matrix-row:nth-child(2) .matrix-cell');
            needCells.forEach(cell => {
                cell.classList.add('highlight');
                setTimeout(() => {
                    cell.classList.remove('highlight');
                }, 1000);
            });
        }
    };

    const highlightProcessAllocation = (processId) => {
        const processElement = document.getElementById(`process-${processId}`);
        if (processElement) {
            const allocationCells = processElement.querySelectorAll('.matrix-row:nth-child(1) .matrix-cell');
            allocationCells.forEach(cell => {
                cell.classList.add('highlight');
                setTimeout(() => {
                    cell.classList.remove('highlight');
                }, 1000);
            });
        }
    };

    // Algorithm steps
    const algorithmSteps = [
        // Step 0: Introduction
        () => {
            currentStepDisplayEl.innerHTML = `
                <h3>Introduction to Banker's Algorithm</h3>
                <p>The Banker's Algorithm is a deadlock avoidance algorithm used in operating systems.</p>
                <p>In this simulation, we have:</p>
                <ul>
                    <li>5 processes (P0 to P4)</li>
                    <li>3 resource types (A, B, C)</li>
                </ul>
                <p>Let's go through the algorithm step by step to determine if the system is in a safe state.</p>
            `;
        },
        
        // Step 1: Explanation of the state
        () => {
            currentStepDisplayEl.innerHTML = `
                <h3>System State</h3>
                <p>Before we start, let's understand the state of our system:</p>
                <ul>
                    <li><strong>Available Resources:</strong> Resources that are currently available for allocation</li>
                    <li><strong>Max:</strong> Maximum resources each process might need</li>
                    <li><strong>Allocation:</strong> Resources currently allocated to each process</li>
                    <li><strong>Need:</strong> Additional resources each process might request (Max - Allocation)</li>
                </ul>
                <p>Our goal is to find a safe sequence of process execution that avoids deadlock.</p>
            `;
        },
        
        // Step 2: Initialize algorithm
        () => {
            currentStepDisplayEl.innerHTML = `
                <h3>Algorithm Initialization</h3>
                <p>Let's initialize the algorithm:</p>
                <ol>
                    <li>Work = Available = [${state.available.join(', ')}]</li>
                    <li>Finish = [false, false, false, false, false]</li>
                </ol>
                <p>We will now search for a process that can be executed safely.</p>
            `;
            
            // Initialize work array
            state.work = [...state.available];
            state.finish = Array(state.processes).fill(false);
        },
        
        // Start of the main algorithm loop - find safe sequence
        () => {
            // Calculate a safe sequence
            calculateSafeSequence();
            
            currentStepDisplayEl.innerHTML = `
                <h3>Finding Safe Sequence</h3>
                <p>We'll now look for a safe sequence by finding processes whose resource needs can be satisfied with currently available resources.</p>
                <p>A process can be selected if:</p>
                <ul>
                    <li>It hasn't finished execution yet (Finish[i] = false)</li>
                    <li>Its Need is less than or equal to Work (available resources)</li>
                </ul>
                <p>Let's try to find such a process...</p>
            `;
        }
    ];

    // Calculate a safe sequence for the current state
    const calculateSafeSequence = () => {
        safeSequence = [];
        const work = [...state.available];
        const finish = Array(state.processes).fill(false);
        
        let count = 0;
        while (count < state.processes) {
            let found = false;
            for (let i = 0; i < state.processes; i++) {
                if (!finish[i]) {
                    // Check if process i's needs can be met
                    let canExecute = true;
                    for (let j = 0; j < state.resources; j++) {
                        if (state.need[i][j] > work[j]) {
                            canExecute = false;
                            break;
                        }
                    }
                    
                    if (canExecute) {
                        // Add resources back when process completes
                        for (let j = 0; j < state.resources; j++) {
                            work[j] += state.allocation[i][j];
                        }
                        
                        finish[i] = true;
                        safeSequence.push(i);
                        found = true;
                        count++;
                        break;
                    }
                }
            }
            
            if (!found) {
                // If no process can be found, there's no safe sequence
                safeSequence = []; // Clear the sequence
                break;
            }
        }
        
        // Add process execution steps to algorithm steps
        addProcessExecutionSteps();
    };

    // Add process execution steps to algorithm steps
    const addProcessExecutionSteps = () => {
        if (safeSequence.length === 0) {
            // No safe sequence found
            algorithmSteps.push(() => {
                currentStepDisplayEl.innerHTML = `
                    <h3>No Safe Sequence Found</h3>
                    <p>The system is not in a safe state. There is a risk of deadlock.</p>
                    <p>No sequence of processes can be executed safely.</p>
                `;
            });
            return;
        }
        
        // Add a step for each process in the safe sequence
        safeSequence.forEach((processId, index) => {
            // Check process needs
            algorithmSteps.push(() => {
                // Calculate current work
                let workText = '';
                if (index === 0) {
                    workText = `[${state.available.join(', ')}]`;
                } else {
                    const prevProcess = safeSequence[index - 1];
                    const updatedWork = [...state.available];
                    
                    for (let i = 0; i <= index - 1; i++) {
                        const proc = safeSequence[i];
                        for (let j = 0; j < state.resources; j++) {
                            updatedWork[j] += state.allocation[proc][j];
                        }
                    }
                    
                    workText = `[${updatedWork.join(', ')}]`;
                }
                
                currentStepDisplayEl.innerHTML = `
                    <h3>Checking Process P${processId}</h3>
                    <p>Current Work (available resources): ${workText}</p>
                    <p>Need of P${processId}: [${state.need[processId].join(', ')}]</p>
                    <p>Checking if Need ≤ Work...</p>
                `;
                
                highlightProcessNeed(processId);
                
                // Update process state to 'active'
                const updatedProcessState = [...state.processState];
                updatedProcessState[processId] = 'active';
                state.processState = updatedProcessState;
                updateProcessElements();
            });
            
            // Execute process and release resources
            algorithmSteps.push(() => {
                // Calculate work before and after this process
                const workBefore = [...state.available];
                const workAfter = [...state.available];
                
                for (let i = 0; i < index; i++) {
                    const proc = safeSequence[i];
                    for (let j = 0; j < state.resources; j++) {
                        workBefore[j] += state.allocation[proc][j];
                        workAfter[j] += state.allocation[proc][j];
                    }
                }
                
                for (let j = 0; j < state.resources; j++) {
                    workAfter[j] += state.allocation[processId][j];
                }
                
                currentStepDisplayEl.innerHTML = `
                    <h3>Executing Process P${processId}</h3>
                    <p>P${processId} can execute safely because its Need ≤ Work.</p>
                    <p>After P${processId} completes, it releases its allocated resources:</p>
                    <p>Allocation of P${processId}: [${state.allocation[processId].join(', ')}]</p>
                    <p>Work before: [${workBefore.join(', ')}]</p>
                    <p>Work after: [${workAfter.join(', ')}]</p>
                `;
                
                highlightProcessAllocation(processId);
                
                // Update current available resources display
                const updatedAvailable = [...workBefore];
                updateResourceElements(updatedAvailable, availableResourcesEl, state.available);
                
                // Update process state to 'completed'
                const updatedProcessState = [...state.processState];
                updatedProcessState[processId] = 'completed';
                state.processState = updatedProcessState;
                updateProcessElements();
            });
        });
        
        // Final step - conclusion
        algorithmSteps.push(() => {
            currentStepDisplayEl.innerHTML = `
                <h3>Safe Sequence Found</h3>
                <p>The system is in a safe state.</p>
                <p>Safe Sequence: ${safeSequence.map(id => `P${id}`).join(' → ')}</p>
                <p>This sequence guarantees that all processes can complete execution without deadlock.</p>
            `;
        });
    };

    // Step execution function
    const executeStep = () => {
        if (animationInProgress) return;
        
        if (currentStep < algorithmSteps.length) {
            animationInProgress = true;
            algorithmSteps[currentStep]();
            currentStep++;
            
            // Update the sequence visualization if we've already calculated the sequence
            if (safeSequence.length > 0 && currentStep >= 4) {
                updateSequence();
            }
            
            setTimeout(() => {
                animationInProgress = false;
            }, 500);
        } else {
            stopAutoRun();
        }
    };

    // Auto-run function
    const toggleAutoRun = () => {
        if (isRunning) {
            stopAutoRun();
        } else {
            startAutoRun();
        }
    };

    const startAutoRun = () => {
        if (!isRunning && currentStep < algorithmSteps.length) {
            isRunning = true;
            autoRunBtn.textContent = 'Stop';
            autoRunBtn.classList.add('active');
            
            executeStep(); // Execute first step immediately
            
            autoRunInterval = setInterval(() => {
                if (currentStep >= algorithmSteps.length) {
                    stopAutoRun();
                    return;
                }
                executeStep();
            }, parseInt(speedSelect.value));
        }
    };

    const stopAutoRun = () => {
        if (isRunning) {
            isRunning = false;
            clearInterval(autoRunInterval);
            autoRunBtn.textContent = 'Auto Run';
            autoRunBtn.classList.remove('active');
        }
    };

    // Reset function
    const resetSimulation = () => {
        stopAutoRun();
        currentStep = 0;
        safeSequence = [];
        state = JSON.parse(JSON.stringify(initialState));
        
        // Reset UI
        createResourceElements(state.available, availableResourcesEl);
        createResourceElements(state.totalResources, totalResourcesEl);
        createProcessElements();
        sequenceTrackEl.innerHTML = '';
        
        // Show intro step
        algorithmSteps[0]();
    };

    // Event listeners
    resetBtn.addEventListener('click', resetSimulation);
    nextStepBtn.addEventListener('click', executeStep);
    autoRunBtn.addEventListener('click', toggleAutoRun);
    speedSelect.addEventListener('change', () => {
        if (isRunning) {
            stopAutoRun();
            startAutoRun();
        }
    });

    // Initialize the simulation
    resetSimulation();
});