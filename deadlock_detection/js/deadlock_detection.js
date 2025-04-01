// Global variables
let numProcesses = 0;
let numResources = 0;
let resources = [];
let rag = [];
let wfg = [];
let bfg = [];
let visited = [];
let cycle = 0;
let cycleNodes = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('createProcess').addEventListener('click', createProcess);
    document.getElementById('createResource').addEventListener('click', createResource);
    document.getElementById('createRequestEdge').addEventListener('click', createRequestEdge);
    document.getElementById('createAllocationEdge').addEventListener('click', createAllocationEdge);
    document.getElementById('detectDeadlock').addEventListener('click', detectDeadlock);
    
    // Set default result message
    updateResultMessage('Ready to detect deadlocks', 'neutral');
});

/**
 * Create a new process node
 */
function createProcess() {
    const processesContainer = document.querySelector('.processes-container');
    
    // Generate circle
    const circle = document.createElement('div');
    circle.className = 'circle';
    circle.id = 'P' + (numProcesses + 1);
    circle.draggable = true;
    circle.innerText = 'P' + (numProcesses + 1);
    processesContainer.appendChild(circle);
    numProcesses++;

    // Update RAG matrix
    rag.push(new Array(numResources).fill(0));
    
    // Add animation
    circle.style.opacity = '0';
    circle.style.transform = 'scale(0.5)';
    setTimeout(() => {
        circle.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        circle.style.opacity = '1';
        circle.style.transform = 'scale(1)';
    }, 50);
    
    // Update UI
    updateInputRanges();
}

/**
 * Create a new resource node
 */
function createResource() {
    const resourcesContainer = document.querySelector('.resources-container');
    const numInstances = parseInt(document.getElementById('numInstances').value) || 1;
    
    // Generate rectangle
    const rect = document.createElement('div');
    rect.className = 'rect';
    rect.id = 'R' + (numResources + 1);
    rect.draggable = true;
    
    const resourceContainer = document.createElement('div');
    resourceContainer.className = 'resource-container';

    // Generate dots
    const dotRow = document.createElement('div');
    dotRow.className = 'dot-row';

    resources.push(numInstances);
    
    // Add dots based on number of instances
    for (let i = 0; i < numInstances; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dotRow.appendChild(dot);
    }

    // Add resource label
    const resourceLabel = document.createElement('div');
    resourceLabel.className = 'resource-label';
    resourceLabel.textContent = 'R' + (numResources + 1);

    resourceContainer.appendChild(dotRow);
    resourceContainer.appendChild(resourceLabel);
    rect.appendChild(resourceContainer);
    resourcesContainer.appendChild(rect);
    
    // Update RAG matrix
    for (let i = 0; i < numProcesses; i++) {
        rag[i].push(0);
    }
    
    numResources++;
    
    // Add animation
    rect.style.opacity = '0';
    rect.style.transform = 'scale(0.5)';
    setTimeout(() => {
        rect.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        rect.style.opacity = '1';
        rect.style.transform = 'scale(1)';
    }, 50);
    
    // Update UI
    updateInputRanges();
}

/**
 * Create a request edge from process to resource
 */
function createRequestEdge() {
    const process = parseInt(document.getElementById('requestProcess').value) || 1;
    const resource = parseInt(document.getElementById('requestResource').value) || 1;
    
    // Validate inputs
    if (process > numProcesses || resource > numResources) {
        showToast('Invalid process or resource number');
        return;
    }
    
    // Update RAG matrix
    rag[process - 1][resource - 1]++;
    
    // Draw the edge
    drawLine('P' + process, 'R' + resource, 1);
    
    // Show feedback toast
    showToast(`Added request: P${process} → R${resource}`);
}

/**
 * Create an allocation edge from resource to process
 */
function createAllocationEdge() {
    const process = parseInt(document.getElementById('allocProcess').value) || 1;
    const resource = parseInt(document.getElementById('allocResource').value) || 1;
    
    // Validate inputs
    if (process > numProcesses || resource > numResources) {
        showToast('Invalid process or resource number');
        return;
    }
    
    // Check if there are enough resource instances
    let allocations = 0;
    for (let j = 0; j < numProcesses; j++) {
        if (rag[j][resource - 1] < 0) {
            allocations -= rag[j][resource - 1];
        }
    }
    
    if (allocations >= resources[resource - 1]) {
        showToast(`Resource R${resource} has no more instances available`);
        return;
    }
    
    // Update RAG matrix
    rag[process - 1][resource - 1]--;
    
    // Draw the edge
    drawLine('R' + resource, 'P' + process, 0);
    
    // Show feedback toast
    showToast(`Added allocation: R${resource} → P${process}`);
}

/**
 * Detect deadlocks in the system
 */
function detectDeadlock() {
    // Disable UI during detection
    setUIEnabled(false);
    
    // Reset previous detection results
    resetDeadlockHighlights();
    
    // If no processes or resources, no deadlock possible
    if (numProcesses === 0 || numResources === 0) {
        updateResultMessage('Add processes and resources first', 'warning');
        setUIEnabled(true);
        return;
    }
    
    // Create Wait-For Graph from Resource Allocation Graph
    constructWaitForGraph();
    
    // Detect cycles in Wait-For Graph
    detectCycle();
    
    if (cycle === 1) {
        // Check if cycle causes a deadlock
        const deadlockExists = analyzeResourcesInCycle();
        
        if (!deadlockExists) {
            updateResultMessage('Potential deadlock detected (cycle exists but resources are sufficient)', 'warning');
        } else {
            highlightDeadlockCycle();
            updateResultMessage('Deadlock detected!', 'error');
        }
    } else {
        updateResultMessage('No deadlock detected - system is safe', 'success');
    }
    
    // Enable UI
    setUIEnabled(true);
}

/**
 * Construct Wait-For Graph from RAG
 */
function constructWaitForGraph() {
    // Initialize WFG and BFG (Blocking Graph)
    wfg = Array(numProcesses).fill().map(() => Array(numProcesses).fill(0));
    bfg = Array(numProcesses).fill().map(() => Array(numProcesses).fill(-1));
    
    // Analyze each process-resource relationship
    for (let i = 0; i < numProcesses; i++) {
        for (let j = 0; j < numResources; j++) {
            // If process i is requesting resource j
            if (rag[i][j] > 0) {
                // Check if any other process has allocation to this resource
                for (let k = 0; k < numProcesses; k++) {
                    if (i !== k && rag[k][j] < 0) {
                        // Process i is waiting for process k to release resource j
                        bfg[i][k] = j;
                        wfg[i][k] = 1;
                    }
                }
            }
        }
    }
}

/**
 * Detect cycles in the Wait-For Graph
 */
function detectCycle() {
    visited = Array(numProcesses).fill(0);
    const parents = Array(numProcesses).fill(-1);
    cycle = 0;
    cycleNodes = [];
    
    // Start DFS from each unvisited node
    for (let i = 0; i < numProcesses; i++) {
        if (visited[i] === 0) {
            recursiveDFS(i, -1, parents);
            if (cycle === 1) break;
        }
    }
}

/**
 * Depth-First Search to find cycles
 */
function recursiveDFS(node, parent, parents) {
    node = parseInt(node);
    
    // If already fully explored, return
    if (visited[node] === -1) {
        return;
    }
    
    // If node is currently being visited, we found a cycle
    if (visited[node] === 1) {
        let cur = parseInt(parent);
        cycleNodes.push(cur);
        
        // Reconstruct the cycle path
        while (cur !== node) {
            cur = parents[cur];
            cycleNodes.push(cur);
        }
        cycleNodes.reverse();
        
        cycle = 1;
        return;
    }
    
    // Mark node as being visited
    parents[node] = parent;
    visited[node] = 1;
    
    // Visit all neighbors
    for (let i = 0; i < numProcesses; i++) {
        if (wfg[node][i] === 1) {
            recursiveDFS(i, node, parents);
        }
        
        // If cycle found, break
        if (cycle === 1) break;
    }
    
    // Mark node as fully explored
    visited[node] = -1;
}

/**
 * Analyze resources in the detected cycle
 */
function analyzeResourcesInCycle() {
    const resourcesInCycle = [];
    
    // Get resources involved in the cycle
    for (let i = 0; i < cycleNodes.length; i++) {
        const j = (i + 1) % cycleNodes.length;
        const a = cycleNodes[i];
        const b = cycleNodes[j];
        resourcesInCycle.push(parseInt(bfg[a][b]));
    }
    
    // Check if resources are insufficient (causing deadlock)
    for (let m = 0; m < resourcesInCycle.length; m++) {
        const resourceIndex = resourcesInCycle[m];
        let requests = 0;
        let allocations = 0;
        
        // Count total requests and allocations for this resource
        for (let j = 0; j < numProcesses; j++) {
            if (parseInt(rag[j][resourceIndex]) >= 1) {
                requests += parseInt(rag[j][resourceIndex]);
            } else if (parseInt(rag[j][resourceIndex]) <= -1) {
                allocations -= parseInt(rag[j][resourceIndex]);
            }
        }
        
        // If available resources are less than requests, deadlock exists
        if (parseInt(resources[resourceIndex]) - allocations < requests) {
            return true;
        }
    }
    
    return false;
}

/**
 * Highlight the deadlock cycle in UI
 */
function highlightDeadlockCycle() {
    for (let i = 0; i < cycleNodes.length; i++) {
        const j = (i + 1) % cycleNodes.length;
        const a = cycleNodes[i];
        const b = cycleNodes[j];
        const k = parseInt(bfg[a][b]);

        // Highlight request edges
        const requestLine = document.getElementById(`LP${a + 1}ReqR${k + 1}`);
        const requestMarker = document.getElementById(`MP${a + 1}ReqR${k + 1}`);
        
        if (requestLine) {
            requestLine.style.backgroundColor = 'red';
            requestLine.style.boxShadow = '0 0 8px red';
            requestLine.style.height = '3px';
        }
        
        if (requestMarker) {
            requestMarker.style.borderBottomColor = 'red';
            requestMarker.style.filter = 'drop-shadow(0 0 5px red)';
        }
        
        // Highlight allocation edges
        const allocLine = document.getElementById(`LR${k + 1}AlocP${b + 1}`);
        const allocMarker = document.getElementById(`MR${k + 1}AlocP${b + 1}`);
        
        if (allocLine) {
            allocLine.style.backgroundColor = 'red';
            allocLine.style.boxShadow = '0 0 8px red';
            allocLine.style.height = '3px';
        }
        
        if (allocMarker) {
            allocMarker.style.borderBottomColor = 'red';
            allocMarker.style.filter = 'drop-shadow(0 0 5px red)';
        }
        
        // Highlight involved processes
        const process1 = document.getElementById(`P${a + 1}`);
        const process2 = document.getElementById(`P${b + 1}`);
        
        if (process1) {
            process1.style.boxShadow = '0 0 15px red';
        }
        
        if (process2 && !process2.style.boxShadow) {
            process2.style.boxShadow = '0 0 15px red';
        }
        
        // Highlight involved resources
        const resource = document.getElementById(`R${k + 1}`);
        if (resource) {
            resource.style.boxShadow = '0 0 15px red';
        }
    }
}

/**
 * Draw a line between two nodes
 */
function drawLine(sourceId, targetId, isRequest) {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    
    if (!source || !target) return;
    
    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const container = document.querySelector('.visualization-area').getBoundingClientRect();
    
    // Calculate center points
    const x1 = sourceRect.left + sourceRect.width / 2 - container.left;
    const y1 = sourceRect.top + sourceRect.height / 2 - container.top;
    const x2 = targetRect.left + targetRect.width / 2 - container.left;
    const y2 = targetRect.top + targetRect.height / 2 - container.top;
    
    // Calculate length and angle
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    // Create line element
    const line = document.createElement('div');
    line.className = 'line';
    
    // Set ID based on type of edge
    if (isRequest) {
        line.id = `L${sourceId}Req${targetId}`;
    } else {
        line.id = `L${sourceId}Aloc${targetId}`;
    }
    
    // Set line position and rotation
    line.style.width = length + 'px';
    line.style.top = y1 + 'px';
    line.style.left = x1 + 'px';
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = '0 0';
    
    // Set line color based on type
    if (!isRequest) {
        line.style.backgroundColor = 'var(--resource-color)';
    }
    
    // Add marker (arrow)
    const marker = document.createElement('div');
    marker.className = 'triangle-marker';
    
    // Set marker ID
    if (isRequest) {
        marker.id = `M${sourceId}Req${targetId}`;
    } else {
        marker.id = `M${sourceId}Aloc${targetId}`;
    }
    
    // Position marker at end of line
    marker.style.top = y2 + 'px';
    marker.style.left = x2 + 'px';
    marker.style.transform = `rotate(${angle + 90}deg)`;
    
    // Set marker color for allocation edges
    if (!isRequest) {
        marker.style.borderBottomColor = 'var(--resource-color)';
    }
    
    // Add elements to DOM
    document.querySelector('.visualization-area').appendChild(line);
    document.querySelector('.visualization-area').appendChild(marker);
}

/**
 * Reset highlighting from any previous deadlock detection
 */
function resetDeadlockHighlights() {
    // Reset all process nodes
    const processes = document.querySelectorAll('.circle');
    processes.forEach(process => {
        process.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    });
    
    // Reset all resource nodes
    const resources = document.querySelectorAll('.rect');
    resources.forEach(resource => {
        resource.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    });
    
    // Reset all lines
    const lines = document.querySelectorAll('.line');
    lines.forEach(line => {
        if (line.id && line.id.includes('Aloc')) {
            line.style.backgroundColor = 'var(--resource-color)';
        } else {
            line.style.backgroundColor = 'white';
        }
        line.style.boxShadow = 'none';
        line.style.height = '2px';
    });
    
    // Reset all markers
    const markers = document.querySelectorAll('.triangle-marker');
    markers.forEach(marker => {
        if (marker.id && marker.id.includes('Aloc')) {
            marker.style.borderBottomColor = 'var(--resource-color)';
        } else {
            marker.style.borderBottomColor = 'white';
        }
        marker.style.filter = 'none';
    });
}

/**
 * Update input ranges based on number of processes and resources
 */
function updateInputRanges() {
    // Update process input ranges
    const requestProcess = document.getElementById('requestProcess');
    const allocProcess = document.getElementById('allocProcess');
    
    if (requestProcess) {
        requestProcess.max = numProcesses;
        requestProcess.value = Math.min(requestProcess.value, numProcesses || 1);
    }
    
    if (allocProcess) {
        allocProcess.max = numProcesses;
        allocProcess.value = Math.min(allocProcess.value, numProcesses || 1);
    }
    
    // Update resource input ranges
    const requestResource = document.getElementById('requestResource');
    const allocResource = document.getElementById('allocResource');
    
    if (requestResource) {
        requestResource.max = numResources;
        requestResource.value = Math.min(requestResource.value, numResources || 1);
    }
    
    if (allocResource) {
        allocResource.max = numResources;
        allocResource.value = Math.min(allocResource.value, numResources || 1);
    }
}

/**
 * Update the result message
 */
function updateResultMessage(message, status) {
    const resultElement = document.getElementById('result');
    if (!resultElement) return;
    
    // Clear previous classes
    resultElement.classList.remove('status-success', 'status-warning', 'status-error');
    
    // Set message
    resultElement.textContent = message;
    
    // Add status class
    if (status === 'success') {
        resultElement.classList.add('status-success');
    } else if (status === 'warning') {
        resultElement.classList.add('status-warning');
    } else if (status === 'error') {
        resultElement.classList.add('status-error');
    }
}

/**
 * Show a toast notification
 */
function showToast(message) {
    // Check if a toast already exists
    let toast = document.querySelector('.toast');
    
    if (!toast) {
        // Create new toast
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
        
        // Add styles
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.zIndex = '1000';
        toast.style.transition = 'opacity 0.3s ease';
    }
    
    // Update message
    toast.textContent = message;
    toast.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

/**
 * Enable or disable UI elements during processing
 */
function setUIEnabled(enabled) {
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input');
    
    // Enable/disable buttons
    buttons.forEach(button => {
        button.disabled = !enabled;
        if (!enabled) {
            button.style.opacity = '0.6';
            button.style.cursor = 'wait';
        } else {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        }
    });
    
    // Enable/disable inputs
    inputs.forEach(input => {
        input.disabled = !enabled;
        if (!enabled) {
            input.style.opacity = '0.6';
        } else {
            input.style.opacity = '1';
        }
    });
}