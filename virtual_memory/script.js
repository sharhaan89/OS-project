// Configuration
const config = {
    pageCount: 16,           // Number of virtual pages
    frameCount: 8,           // Number of physical frames
    tlbSize: 4,              // Number of TLB entries
    referenceSequenceLength: 25,  // Length of memory reference sequence
    maxVirtualAddress: 16,   // Maximum virtual address (0-15)
};

// State
let state = {
    memoryReferenceSequence: [],
    currentReferenceIndex: -1,
    tlb: [],
    pageTable: [],
    physicalMemory: [],
    referenceCount: 0,
    pageFaultCount: 0,
    tlbHitCount: 0,
    autoRunInterval: null,
    executionLog: []
};

// Initialize the application
function initialize() {
    // Generate a memory reference sequence
    state.memoryReferenceSequence = generateMemoryReferenceSequence();
    
    // Initialize TLB (empty)
    state.tlb = new Array(config.tlbSize).fill(null).map(() => ({
        valid: false,
        virtualPage: null,
        physicalFrame: null,
        lastUsed: 0
    }));
    
    // Initialize page table
    state.pageTable = new Array(config.pageCount).fill(null).map((_, i) => ({
        pageNumber: i,
        valid: false,
        physicalFrame: null,
        referenced: false,
        lastUsed: 0
    }));
    
    // Initialize physical memory (all frames empty)
    state.physicalMemory = new Array(config.frameCount).fill(null).map((_, i) => ({
        frameNumber: i,
        pageNumber: null,
        content: null,
        loading: false
    }));
    
    // Reset stats
    state.currentReferenceIndex = -1;
    state.referenceCount = 0;
    state.pageFaultCount = 0;
    state.tlbHitCount = 0;
    state.executionLog = [];
    
    // Render UI
    renderMemoryAccessSequence();
    renderTLB();
    renderPageTable();
    renderPhysicalMemory();
    updateStats();
    renderExecutionLog();
}

// Generate a sequence of memory references with locality of reference
function generateMemoryReferenceSequence() {
    const sequence = [];
    let lastReference = Math.floor(Math.random() * config.maxVirtualAddress);
    
    for (let i = 0; i < config.referenceSequenceLength; i++) {
        // 70% chance to reference something close to the last reference
        if (Math.random() < 0.7 && i > 0) {
            // Generate reference close to previous one (locality of reference)
            let offset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            lastReference = Math.max(0, Math.min(config.maxVirtualAddress - 1, lastReference + offset));
        } else {
            // Generate a random reference
            lastReference = Math.floor(Math.random() * config.maxVirtualAddress);
        }
        sequence.push(lastReference);
    }
    
    return sequence;
}

// Process the next memory reference
function processNextReference() {
    if (state.currentReferenceIndex >= state.memoryReferenceSequence.length - 1) {
        clearInterval(state.autoRunInterval);
        state.autoRunInterval = null;
        document.getElementById('autoRun').textContent = 'Auto Run';
        return;
    }
    
    state.currentReferenceIndex++;
    state.referenceCount++;
    
    const virtualAddress = state.memoryReferenceSequence[state.currentReferenceIndex];
    const virtualPage = Math.floor(virtualAddress / 2); // Simple page mapping: 2 addresses per page
    
    // Update UI for current reference
    document.getElementById('currentReferenceValue').textContent = virtualAddress;
    
    // Check TLB first
    const tlbResult = checkTLB(virtualPage);
    
    if (tlbResult.hit) {
        // TLB hit
        state.tlbHitCount++;
        addLog(`TLB Hit: Virtual page ${virtualPage} found in TLB entry ${tlbResult.entryIndex}, maps to physical frame ${tlbResult.frame}`, 'tlb');
        updateTLBEntry(tlbResult.entryIndex);
    } else {
        // TLB miss, check page table
        addLog(`TLB Miss: Virtual page ${virtualPage} not found in TLB`, 'info');
        const pageTableResult = checkPageTable(virtualPage);
        
        if (pageTableResult.valid) {
            // Page table hit (page is in memory)
            addLog(`Page Table Hit: Virtual page ${virtualPage} is in physical frame ${pageTableResult.frame}`, 'info');
            updatePageTableEntry(virtualPage);
            
            // Update TLB
            updateTLB(virtualPage, pageTableResult.frame);
        } else {
            // Page fault (page not in memory)
            state.pageFaultCount++;
            addLog(`Page Fault: Virtual page ${virtualPage} is not in physical memory`, 'fault');
            
            // Handle page fault by loading page into memory
            handlePageFault(virtualPage);
        }
    }
    
    // Update stats and UI
    updateStats();
    renderMemoryAccessSequence();
    renderTLB();
    renderPageTable();
    renderPhysicalMemory();
    renderExecutionLog();
}

// Check if a virtual page is in the TLB
function checkTLB(virtualPage) {
    for (let i = 0; i < state.tlb.length; i++) {
        if (state.tlb[i].valid && state.tlb[i].virtualPage === virtualPage) {
            return {
                hit: true,
                entryIndex: i,
                frame: state.tlb[i].physicalFrame
            };
        }
    }
    return { hit: false };
}

// Update TLB entry last used time
function updateTLBEntry(index) {
    state.tlb[index].lastUsed = state.referenceCount;
}

// Check if a virtual page is in the page table
function checkPageTable(virtualPage) {
    if (virtualPage >= 0 && virtualPage < state.pageTable.length) {
        if (state.pageTable[virtualPage].valid) {
            return {
                valid: true,
                frame: state.pageTable[virtualPage].physicalFrame
            };
        }
    }
    return { valid: false };
}

// Update page table entry
function updatePageTableEntry(virtualPage) {
    state.pageTable[virtualPage].referenced = true;
    state.pageTable[virtualPage].lastUsed = state.referenceCount;
}

// Update TLB with new mapping
function updateTLB(virtualPage, physicalFrame) {
    // Find an invalid entry or use replacement algorithm
    let replacementIndex = -1;
    let oldestUsed = Infinity;
    
    for (let i = 0; i < state.tlb.length; i++) {
        if (!state.tlb[i].valid) {
            replacementIndex = i;
            break;
        }
        
        if (state.tlb[i].lastUsed < oldestUsed) {
            oldestUsed = state.tlb[i].lastUsed;
            replacementIndex = i;
        }
    }
    
    // Update TLB entry
    state.tlb[replacementIndex] = {
        valid: true,
        virtualPage: virtualPage,
        physicalFrame: physicalFrame,
        lastUsed: state.referenceCount
    };
    
    addLog(`TLB Update: Added mapping from virtual page ${virtualPage} to physical frame ${physicalFrame} in TLB entry ${replacementIndex}`, 'tlb');
}

// Handle a page fault
function handlePageFault(virtualPage) {
    // Find a free frame or use replacement algorithm
    let frameIndex = findFreeFrame();
    
    if (frameIndex === -1) {
        // No free frames, use page replacement algorithm
        frameIndex = replaceFrame();
    }
    
    // Simulate page loading (will be visually shown)
    state.physicalMemory[frameIndex].loading = true;
    state.physicalMemory[frameIndex].pageNumber = virtualPage;
    
    // Update page table
    state.pageTable[virtualPage].valid = true;
    state.pageTable[virtualPage].physicalFrame = frameIndex;
    state.pageTable[virtualPage].referenced = true;
    state.pageTable[virtualPage].lastUsed = state.referenceCount;
    
    // Update TLB
    updateTLB(virtualPage, frameIndex);
    
    addLog(`Page Loaded: Virtual page ${virtualPage} loaded into physical frame ${frameIndex}`, 'info');
    
    // After a short delay, mark the page as loaded
    setTimeout(() => {
        state.physicalMemory[frameIndex].loading = false;
        state.physicalMemory[frameIndex].content = `Data for page ${virtualPage}`;
        renderPhysicalMemory();
    }, 300);
}

// Find a free frame in physical memory
function findFreeFrame() {
    for (let i = 0; i < state.physicalMemory.length; i++) {
        if (state.physicalMemory[i].pageNumber === null) {
            return i;
        }
    }
    return -1; // No free frames
}

// Replace a frame using the selected page replacement algorithm
function replaceFrame() {
    const algorithm = document.getElementById('pageReplacement').value;
    
    if (algorithm === 'fifo') {
        return fifoReplacement();
    } else if (algorithm === 'lru') {
        return lruReplacement();
    }
    
    return 0; // Default to first frame if something goes wrong
}

// FIFO page replacement algorithm
function fifoReplacement() {
    // Find the page that has been in memory the longest
    let oldestPageIndex = 0;
    let oldestLastUsed = Infinity;
    
    for (let i = 0; i < state.pageTable.length; i++) {
        if (state.pageTable[i].valid && state.pageTable[i].lastUsed < oldestLastUsed) {
            oldestLastUsed = state.pageTable[i].lastUsed;
            oldestPageIndex = i;
        }
    }
    
    const frameToReplace = state.pageTable[oldestPageIndex].physicalFrame;
    
    // Mark the page as no longer in memory
    state.pageTable[oldestPageIndex].valid = false;
    state.pageTable[oldestPageIndex].physicalFrame = null;
    
    addLog(`Page Replacement (FIFO): Evicted virtual page ${oldestPageIndex} from physical frame ${frameToReplace}`, 'fault');
    
    return frameToReplace;
}

// LRU page replacement algorithm
function lruReplacement() {
    // Find the least recently used page
    let lruPageIndex = 0;
    let lruLastUsed = Infinity;
    
    for (let i = 0; i < state.pageTable.length; i++) {
        if (state.pageTable[i].valid && state.pageTable[i].lastUsed < lruLastUsed) {
            lruLastUsed = state.pageTable[i].lastUsed;
            lruPageIndex = i;
        }
    }
    
    const frameToReplace = state.pageTable[lruPageIndex].physicalFrame;
    
    // Mark the page as no longer in memory
    state.pageTable[lruPageIndex].valid = false;
    state.pageTable[lruPageIndex].physicalFrame = null;
    
    addLog(`Page Replacement (LRU): Evicted virtual page ${lruPageIndex} from physical frame ${frameToReplace}`, 'fault');
    
    return frameToReplace;
}

// Add an entry to the execution log
function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    state.executionLog.unshift({
        timestamp,
        message,
        type
    });
    
    // Keep log to a reasonable size
    if (state.executionLog.length > 50) {
        state.executionLog.pop();
    }
}

// Render the memory access sequence
function renderMemoryAccessSequence() {
    const container = document.getElementById('memoryAccess');
    container.innerHTML = '';
    
    for (let i = 0; i < state.memoryReferenceSequence.length; i++) {
        const item = document.createElement('div');
        item.className = 'memory-item';
        if (i === state.currentReferenceIndex) {
            item.className += ' active';
        }
        item.textContent = state.memoryReferenceSequence[i];
        container.appendChild(item);
    }
}

// Render TLB
function renderTLB() {
    const container = document.getElementById('tlb');
    container.innerHTML = '';
    
    for (let i = 0; i < state.tlb.length; i++) {
        const entry = state.tlb[i];
        const entryEl = document.createElement('div');
        entryEl.className = 'tlb-entry';
        
        const isHit = state.currentReferenceIndex >= 0 && 
                      entry.valid && 
                      entry.virtualPage === Math.floor(state.memoryReferenceSequence[state.currentReferenceIndex] / 2);
        
        if (isHit) {
            entryEl.className += ' hit';
        }
        
        entryEl.innerHTML = `
            <div class="entry-label">TLB Entry ${i}</div>
            <div class="entry-content">
                <div class="entry-row">
                    <span class="entry-property">Valid:</span>
                    <span class="entry-value">${entry.valid ? 'Yes' : 'No'}</span>
                </div>
                <div class="entry-row">
                    <span class="entry-property">Virtual Page:</span>
                    <span class="entry-value">${entry.virtualPage !== null ? entry.virtualPage : '-'}</span>
                </div>
                <div class="entry-row">
                    <span class="entry-property">Physical Frame:</span>
                    <span class="entry-value">${entry.physicalFrame !== null ? entry.physicalFrame : '-'}</span>
                </div>
            </div>
        `;
        
        container.appendChild(entryEl);
    }
}

// Render Page Table
function renderPageTable() {
    const container = document.getElementById('pageTable');
    container.innerHTML = '';
    
    for (let i = 0; i < state.pageTable.length; i++) {
        // Only display a subset of page table entries to save space
        if (i >= 8) continue;
        
        const entry = state.pageTable[i];
        const entryEl = document.createElement('div');
        entryEl.className = 'page-entry';
        
        const isFault = state.currentReferenceIndex >= 0 && 
                        Math.floor(state.memoryReferenceSequence[state.currentReferenceIndex] / 2) === i && 
                        !entry.valid;
        
        if (isFault) {
            entryEl.className += ' fault';
        }
        
        entryEl.innerHTML = `
            <div class="entry-label">Page ${i}</div>
            <div class="entry-content">
                <div class="entry-row">
                    <span class="entry-property">Valid:</span>
                    <span class="entry-value">${entry.valid ? 'Yes' : 'No'}</span>
                </div>
                <div class="entry-row">
                    <span class="entry-property">Frame:</span>
                    <span class="entry-value">${entry.physicalFrame !== null ? entry.physicalFrame : '-'}</span>
                </div>
                <div class="entry-row">
                    <span class="entry-property">Referenced:</span>
                    <span class="entry-value">${entry.referenced ? 'Yes' : 'No'}</span>
                </div>
            </div>
        `;
        
        container.appendChild(entryEl);
    }
}

// Render Physical Memory
function renderPhysicalMemory() {
    const container = document.getElementById('physicalMemory');
    container.innerHTML = '';
    
    for (let i = 0; i < state.physicalMemory.length; i++) {
        const frame = state.physicalMemory[i];
        const frameEl = document.createElement('div');
        frameEl.className = 'frame-entry';
        
        if (frame.loading) {
            frameEl.className += ' loading';
        } else if (frame.pageNumber !== null) {
            frameEl.className += ' loaded';
        }
        
        frameEl.innerHTML = `
            <div class="entry-label">Frame ${i}</div>
            <div class="entry-content">
                <div class="entry-row">
                    <span class="entry-property">Status:</span>
                    <span class="entry-value">${frame.loading ? 'Loading...' : (frame.pageNumber !== null ? 'Occupied' : 'Free')}</span>
                </div>
                <div class="entry-row">
                    <span class="entry-property">Page:</span>
                    <span class="entry-value">${frame.pageNumber !== null ? frame.pageNumber : '-'}</span>
                </div>
                <div class="entry-row">
                    <span class="entry-property">Content:</span>
                    <span class="entry-value">${frame.content !== null ? '✓' : '-'}</span>
                </div>
            </div>
        `;
        
        container.appendChild(frameEl);
    }
}

// Update statistics
function updateStats() {
    document.getElementById('referenceCount').textContent = state.referenceCount;
    document.getElementById('pageFaultCount').textContent = state.pageFaultCount;
    document.getElementById('tlbHitCount').textContent = state.tlbHitCount;
    
    const tlbHitRate = state.referenceCount > 0 ? 
        ((state.tlbHitCount / state.referenceCount) * 100).toFixed(1) + '%' : 
        '0%';
    
    document.getElementById('tlbHitRate').textContent = tlbHitRate;
}

// Render execution log
function renderExecutionLog() {
    const container = document.getElementById('executionLog');
    container.innerHTML = '';
    
    for (const log of state.executionLog) {
        const logEl = document.createElement('div');
        logEl.className = `log-entry log-type-${log.type}`;
        logEl.innerHTML = `<span class="log-timestamp">[${log.timestamp}]</span> ${log.message}`;
        container.appendChild(logEl);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initialize();
    
    // Set up event listeners
    document.getElementById('nextStep').addEventListener('click', processNextReference);
    
    document.getElementById('autoRun').addEventListener('click', () => {
        const button = document.getElementById('autoRun');
        
        if (state.autoRunInterval) {
            // Stop auto-run
            clearInterval(state.autoRunInterval);
            state.autoRunInterval = null;
            button.textContent = 'Auto Run';
        } else {
            // Start auto-run
            const speed = document.getElementById('referenceRate').value;
            state.autoRunInterval = setInterval(processNextReference, speed);
            button.textContent = 'Stop Auto Run';
        }
    });
    
    document.getElementById('reset').addEventListener('click', initialize);
    
    document.getElementById('referenceRate').addEventListener('input', (e) => {
        if (state.autoRunInterval) {
            clearInterval(state.autoRunInterval);
            state.autoRunInterval = setInterval(processNextReference, e.target.value);
        }
    });
});