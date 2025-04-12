document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const memorySize = document.getElementById('memory-size');
    const blockSize = document.getElementById('block-size');
    const setupMemory = document.getElementById('setup-memory');
    const setupError = document.getElementById('setup-error');
    
    const processId = document.getElementById('process-id');
    const processSize = document.getElementById('process-size');
    const allocateProcess = document.getElementById('allocate-process');
    const deallocateProcess = document.getElementById('deallocate-process');
    const resetMemory = document.getElementById('reset-memory');
    const allocationError = document.getElementById('allocation-error');
    
    const memoryContainer = document.getElementById('memory-container');
    
    const totalMemoryEl = document.getElementById('total-memory');
    const usedMemoryEl = document.getElementById('used-memory');
    const freeMemoryEl = document.getElementById('free-memory');
    const internalFragmentationEl = document.getElementById('internal-fragmentation');
    const externalFragmentationEl = document.getElementById('external-fragmentation');
    
    // Memory state
    let memory = {
        totalSize: 0,
        blockSize: 0,
        blocks: [],
        isSetup: false
    };
    
    // Setup memory
    setupMemory.addEventListener('click', function() {
        const totalSize = parseInt(memorySize.value);
        const bSize = parseInt(blockSize.value);
        
        // Validation
        if (isNaN(totalSize) || totalSize <= 0) {
            setupError.textContent = 'Total memory size must be a positive number';
            return;
        }
        
        if (isNaN(bSize) || bSize <= 0) {
            setupError.textContent = 'Block size must be a positive number';
            return;
        }
        
        if (totalSize % bSize !== 0) {
            setupError.textContent = 'Block size must be a factor of total memory size';
            return;
        }
        
        setupError.textContent = '';
        
        // Initialize memory
        memory.totalSize = totalSize;
        memory.blockSize = bSize;
        memory.blocks = [];
        memory.isSetup = true;
        
        const numBlocks = totalSize / bSize;
        
        for (let i = 0; i < numBlocks; i++) {
            memory.blocks.push({
                id: i,
                size: bSize,
                free: true,
                process: null,
                internalFragmentation: 0
            });
        }
        
        renderMemory();
        updateStats();
    });
    
    // Allocate process
    allocateProcess.addEventListener('click', function() {
        if (!memory.isSetup) {
            allocationError.textContent = 'Please set up memory first';
            return;
        }
        
        const id = processId.value.trim();
        const size = parseInt(processSize.value);
        
        // Validation
        if (!id) {
            allocationError.textContent = 'Process ID is required';
            return;
        }
        
        if (isNaN(size) || size <= 0) {
            allocationError.textContent = 'Process size must be a positive number';
            return;
        }
        
        if (size > memory.blockSize) {
            allocationError.textContent = `Process size cannot exceed block size (${memory.blockSize} KB)`;
            return;
        }
        
        // Check if process ID already exists
        const processExists = memory.blocks.some(block => block.process && block.process.id === id);
        if (processExists) {
            allocationError.textContent = `Process with ID ${id} already exists`;
            return;
        }
        
        // Find first free block
        const freeBlockIndex = memory.blocks.findIndex(block => block.free);
        
        if (freeBlockIndex === -1) {
            allocationError.textContent = 'No free blocks available for allocation';
            return;
        }
        
        allocationError.textContent = '';
        
        // Allocate process
        memory.blocks[freeBlockIndex].free = false;
        memory.blocks[freeBlockIndex].process = {
            id: id,
            size: size
        };
        memory.blocks[freeBlockIndex].internalFragmentation = memory.blockSize - size;
        
        renderMemory();
        updateStats();
        
        // Clear input fields
        processId.value = '';
        processSize.value = '';
    });
    
    // Deallocate process
    deallocateProcess.addEventListener('click', function() {
        if (!memory.isSetup) {
            allocationError.textContent = 'Please set up memory first';
            return;
        }
        
        const id = processId.value.trim();
        
        if (!id) {
            allocationError.textContent = 'Process ID is required for deallocation';
            return;
        }
        
        const blockIndex = memory.blocks.findIndex(block => block.process && block.process.id === id);
        
        if (blockIndex === -1) {
            allocationError.textContent = `Process with ID ${id} not found`;
            return;
        }
        
        allocationError.textContent = '';
        
        // Deallocate process
        memory.blocks[blockIndex].free = true;
        memory.blocks[blockIndex].process = null;
        memory.blocks[blockIndex].internalFragmentation = 0;
        
        renderMemory();
        updateStats();
        
        // Clear input field
        processId.value = '';
    });
    
    // Reset memory
    resetMemory.addEventListener('click', function() {
        if (!memory.isSetup) {
            allocationError.textContent = 'Please set up memory first';
            return;
        }
        
        // Reset all blocks
        memory.blocks.forEach(block => {
            block.free = true;
            block.process = null;
            block.internalFragmentation = 0;
        });
        
        allocationError.textContent = '';
        renderMemory();
        updateStats();
    });
    
    // Render memory visualization
    function renderMemory() {
        memoryContainer.innerHTML = '';
        
        if (!memory.isSetup) {
            const placeholder = document.createElement('div');
            placeholder.className = 'memory-placeholder';
            placeholder.textContent = 'Set up memory to start visualization';
            memoryContainer.appendChild(placeholder);
            return;
        }
        
        // Calculate block height - fixed size per block
        const blockHeight = 40; // Fixed height for each memory block
        
        // Set the container height based on the number of blocks
        memoryContainer.style.height = `${memory.blocks.length * blockHeight}px`;
        
        // Render memory blocks
        memory.blocks.forEach((block, index) => {
            const blockElement = document.createElement('div');
            blockElement.className = 'memory-block';
            blockElement.style.height = `${blockHeight}px`;
            
            // Block label
            const blockLabel = document.createElement('div');
            blockLabel.className = 'block-label';
            blockLabel.textContent = `Block ${block.id}`;
            blockElement.appendChild(blockLabel);
            
            // Block content
            const blockContent = document.createElement('div');
            blockContent.className = 'block-content';
            
            if (block.free) {
                blockContent.classList.add('free-block');
                
                const freeText = document.createElement('div');
                freeText.className = 'process-info';
                freeText.textContent = 'Free';
                blockContent.appendChild(freeText);
            } else {
                blockContent.classList.add('allocated-block');
                
                const processInfo = document.createElement('div');
                processInfo.className = 'process-info';
                processInfo.innerHTML = `
                    Process: ${block.process.id}
                    <div class="process-details">Size: ${block.process.size} KB</div>
                `;
                blockContent.appendChild(processInfo);
                
                // Show internal fragmentation if any
                if (block.internalFragmentation > 0) {
                    const fragWidth = (block.internalFragmentation / block.size) * 100;
                    const fragDiv = document.createElement('div');
                    fragDiv.className = 'frag-indicator internal-frag';
                    fragDiv.style.width = `${fragWidth}%`;
                    fragDiv.textContent = `${block.internalFragmentation} KB`;
                    blockContent.appendChild(fragDiv);
                }
            }
            
            blockElement.appendChild(blockContent);
            memoryContainer.appendChild(blockElement);
        });
    }
    
    // Update memory statistics
    function updateStats() {
        if (!memory.isSetup) {
            totalMemoryEl.textContent = '0 KB';
            usedMemoryEl.textContent = '0 KB';
            freeMemoryEl.textContent = '0 KB';
            internalFragmentationEl.textContent = '0 KB';
            externalFragmentationEl.textContent = '0 KB';
            return;
        }
        
        const totalMemory = memory.totalSize;
        
        let usedMemory = 0;
        let internalFragmentation = 0;
        
        memory.blocks.forEach(block => {
            if (!block.free) {
                usedMemory += block.process.size;
                internalFragmentation += block.internalFragmentation;
            }
        });
        
        const freeMemory = totalMemory - usedMemory - internalFragmentation;
        
        // Calculate external fragmentation
        // External fragmentation is the sum of free blocks that are too small for the largest process
        let largestProcessSize = 0;
        memory.blocks.forEach(block => {
            if (!block.free && block.process.size > largestProcessSize) {
                largestProcessSize = block.process.size;
            }
        });
        
        let externalFragmentation = 0;
        memory.blocks.forEach(block => {
            if (block.free && block.size < largestProcessSize) {
                externalFragmentation += block.size;
            }
        });
        
        totalMemoryEl.textContent = `${totalMemory} KB`;
        usedMemoryEl.textContent = `${usedMemory} KB`;
        freeMemoryEl.textContent = `${freeMemory} KB`;
        internalFragmentationEl.textContent = `${internalFragmentation} KB`;
        externalFragmentationEl.textContent = `${externalFragmentation} KB`;
    }
    
    // Initialize
    renderMemory();
});