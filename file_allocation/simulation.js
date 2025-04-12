
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const fileGrowthInput = document.getElementById('fileGrowthSize');
    const growFileBtn = document.getElementById('growFileBtn');
    const diskSizeInput = document.getElementById('diskSize');
    const initDiskBtn = document.getElementById('initDisk');
    const allocationMethodSelect = document.getElementById('allocationMethod');
    const sequentialControls = document.getElementById('sequential-controls');
    const indexedControls = document.getElementById('indexed-controls');
    const linkedControls = document.getElementById('linked-controls');
    const seqFileSizeInput = document.getElementById('seqFileSize');
    const indexBlockInput = document.getElementById('indexBlock');
    const indexSchemeSelect = document.getElementById('indexScheme');
    const pointersPerBlockInput = document.getElementById('pointersPerBlock');
    const indexedFileSizeInput = document.getElementById('indexedFileSize');
    const linkedFileSizeInput = document.getElementById('linkedFileSize');
    const allocateSeqBtn = document.getElementById('allocateSeq');
    const allocateIndexedBtn = document.getElementById('allocateIndexed');
    const allocateLinkedBtn = document.getElementById('allocateLinked');
    const removeFileBtn = document.getElementById('removeFile');
    const resetSimulationBtn = document.getElementById('resetSimulation');
    const diskContainer = document.getElementById('diskContainer');
    const statusMessage = document.getElementById('statusMessage');
    const fileList = document.getElementById('fileList');

    // Simulation state
    let diskSize = 10;
    let diskBlocks = [];
    let files = [];
    let selectedFileId = null;
    let fileIdCounter = 1;
    
    // Color palette for different files
    const colorPalette = [
        '#FF6B6B', '#4ECDC4', '#FFD166', '#6A0572', '#1A535C',
        '#F78C6B', '#8367C7', '#2C7873', '#F2668B', '#59A5D8',
        '#84DCC6', '#FF7E5F', '#8FB9A8', '#FFC857', '#9C89B8'
    ];

    // Initialize disk with given size
    function initializeDisk() {
        diskSize = parseInt(diskSizeInput.value) || 10;
        
        if (diskSize < 5) {
            diskSize = 5;
            diskSizeInput.value = 5;
        } else if (diskSize > 100) {
            diskSize = 100;
            diskSizeInput.value = 100;
        }
        
        diskBlocks = Array(diskSize).fill(null);
        files = [];
        selectedFileId = null;
        fileIdCounter = 1;
        
        renderDisk();
        renderFileList();
        updateStatusMessage('Disk initialized with ' + diskSize + ' blocks.', 'info');
    }

    // Get color for a file based on ID
    function getFileColor(fileId) {
        return colorPalette[(fileId - 1) % colorPalette.length];
    }

    // Render disk blocks visualization
    function renderDisk() {
        diskContainer.innerHTML = '';
        
        for (let i = 0; i < diskSize; i++) {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'disk-block';
            
            if (diskBlocks[i] !== null) {
                const fileInfo = diskBlocks[i];
                const fileColor = getFileColor(fileInfo.fileId);
                
                if (fileInfo.type === 'index') {
                    blockDiv.classList.add('index');
                    blockDiv.style.backgroundColor = fileColor;
                    blockDiv.style.borderColor = fileColor;
                    
                    let title = `Index block for File ${fileInfo.fileId}`;
                    if (fileInfo.pointers) {
                        title += `\nPointers: ${fileInfo.pointers.join(', ')}`;
                    }
                    if (fileInfo.nextIndexBlock !== undefined) {
                        title += `\nNext index: ${fileInfo.nextIndexBlock || 'none'}`;
                    }
                    blockDiv.title = title;
                    
                    // Create block number with black color for index blocks
                    const blockNumber = document.createElement('span');
                    blockNumber.className = 'block-number';
                    blockNumber.textContent = i;
                    blockNumber.style.color = 'black';
                    blockDiv.appendChild(blockNumber);
                    
                    // Add type indicator
                    const typeIndicator = document.createElement('div');
                    typeIndicator.className = 'internal-pointer';
                    typeIndicator.textContent = 'INDEX';
                    typeIndicator.style.fontSize = '8px';
                    typeIndicator.style.marginTop = '2px';
                    blockDiv.appendChild(typeIndicator);
                    
                    // Add next pointer if exists
                    if (fileInfo.nextIndexBlock !== undefined && fileInfo.nextIndexBlock !== null) {
                        const nextPointer = document.createElement('div');
                        nextPointer.className = 'internal-pointer';
                        nextPointer.textContent = '→' + fileInfo.nextIndexBlock;
                        nextPointer.style.fontSize = '8px';
                        nextPointer.style.marginTop = '2px';
                        blockDiv.appendChild(nextPointer);
                    }
                } else {
                    blockDiv.classList.add('allocated');
                    blockDiv.style.backgroundColor = fileColor;
                    blockDiv.style.borderColor = fileColor;
                    blockDiv.title = `Block ${i}: File ${fileInfo.fileId}`;
                    
                    // Add block number in white
                    const blockNumber = document.createElement('span');
                    blockNumber.textContent = i;
                    blockNumber.style.color = 'white';
                    blockDiv.appendChild(blockNumber);
                    
                    // Add visual pointer for linked allocation inside the block
                    if (fileInfo.nextBlock !== undefined && fileInfo.nextBlock !== null) {
                        const pointerDiv = document.createElement('div');
                        pointerDiv.className = 'internal-pointer';
                        pointerDiv.textContent = '→' + fileInfo.nextBlock;
                        pointerDiv.style.color = 'white';
                        pointerDiv.style.fontSize = '10px';
                        pointerDiv.style.marginTop = '2px';
                        blockDiv.appendChild(pointerDiv);
                    }
                }
            } else {
                // Empty block - just add the block number
                const blockNumber = document.createElement('span');
                blockNumber.textContent = i;
                blockDiv.appendChild(blockNumber);
                blockDiv.title = `Block ${i}: Free`;
            }
            
            // Highlight selected file's blocks
            if (selectedFileId !== null && diskBlocks[i] !== null && diskBlocks[i].fileId === selectedFileId) {
                blockDiv.style.boxShadow = '0 0 0 2px white, 0 0 0 4px var(--color-amber)';
            }
            
            blockDiv.addEventListener('click', () => selectBlock(i));
            diskContainer.appendChild(blockDiv);
        }
    }

    // Render file list
    function renderFileList() {
        fileList.innerHTML = '';
        
        // Add file operations to the top of the file list
        const fileOperationsDiv = document.createElement('div');
        fileOperationsDiv.className = 'file-operations';
        fileOperationsDiv.style.display = 'flex';
        fileOperationsDiv.style.justifyContent = 'flex-end';
        fileOperationsDiv.style.marginBottom = '10px';
        fileOperationsDiv.style.gap = '8px';
        
        // Style the reset simulation button
        resetSimulationBtn.style.fontSize = '12px';
        resetSimulationBtn.style.padding = '6px 10px';
        resetSimulationBtn.style.backgroundColor = 'var(--color-dark)';
        
        // Style the remove file button
        removeFileBtn.style.fontSize = '12px';
        removeFileBtn.style.padding = '6px 10px';
        
        fileOperationsDiv.appendChild(resetSimulationBtn);
        fileOperationsDiv.appendChild(removeFileBtn);
        
        fileList.appendChild(fileOperationsDiv);
        
        if (files.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.textContent = 'No files allocated yet.';
            fileList.appendChild(emptyMessage);
            return;
        }
        
        files.forEach(file => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-item';
            const fileColor = getFileColor(file.id);
            
            // Style with file's color
            fileDiv.style.borderLeft = `5px solid ${fileColor}`;
            
            if (selectedFileId === file.id) {
                fileDiv.style.border = `2px solid var(--color-amber)`;
                fileDiv.style.borderLeft = `5px solid ${fileColor}`;
            }
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileTitle = document.createElement('strong');
            fileTitle.textContent = `File ${file.id} (${file.allocationMethod})`;
            if (file.allocationMethod === 'Indexed') {
                fileTitle.textContent += ` - ${file.indexScheme}`;
            }
            fileTitle.style.color = fileColor;
            fileInfo.appendChild(fileTitle);
            
            const fileDetails = document.createElement('div');
            if (file.allocationMethod === 'Sequential') {
                fileDetails.textContent = `Blocks: ${file.startBlock}-${file.startBlock + file.size - 1} (${file.size} blocks)`;
            } else if (file.allocationMethod === 'Indexed') {
                if (file.indexScheme === 'single') {
                    fileDetails.textContent = `Index: ${file.indexBlock}, Data blocks: ${file.dataBlocks.join(', ')} (${file.size} blocks)`;
                } else if (file.indexScheme === 'linked') {
                    let indexChain = file.indexBlocks[0].toString();
                    for (let i = 1; i < file.indexBlocks.length; i++) {
                        indexChain += ` → ${file.indexBlocks[i]}`;
                    }
                    fileDetails.textContent = `Index chain: ${indexChain}, Data blocks: ${file.dataBlocks.join(', ')} (${file.size} blocks)`;
                } else if (file.indexScheme === 'multilevel') {
                    fileDetails.textContent = `1st level: ${file.indexBlock}, ${file.secondLevelIndexBlocks.length} 2nd level blocks, Data blocks: ${file.dataBlocks.join(', ')} (${file.size} blocks)`;
                }
            } else if (file.allocationMethod === 'Linked') {
                let blockChain = file.startBlock.toString();
                let currentBlock = file.startBlock;
                
                while (diskBlocks[currentBlock] && diskBlocks[currentBlock].nextBlock !== null) {
                    blockChain += ' → ' + diskBlocks[currentBlock].nextBlock;
                    currentBlock = diskBlocks[currentBlock].nextBlock;
                }
                fileDetails.textContent = `Chain: ${blockChain} (${file.size} blocks)`;
            }
            fileInfo.appendChild(fileDetails);
            
            fileDiv.appendChild(fileInfo);
            
            const selectBtn = document.createElement('button');
            selectBtn.className = 'button';
            selectBtn.textContent = 'Select';
            selectBtn.style.backgroundColor = fileColor;
            selectBtn.style.fontSize = '12px';
            selectBtn.style.padding = '6px 10px';
            selectBtn.addEventListener('click', () => selectFile(file.id));
            fileDiv.appendChild(selectBtn);
            
            fileList.appendChild(fileDiv);
        });
    }

    // Select a file
    function selectFile(fileId) {
        selectedFileId = fileId;
        renderDisk();
        renderFileList();
    }

    // Select a block
    function selectBlock(blockIndex) {
        const blockInfo = diskBlocks[blockIndex];
        if (blockInfo !== null) {
            selectFile(blockInfo.fileId);
        }
    }

    // Update status message
    function updateStatusMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
    }

    // Find contiguous free blocks
    function findContiguousFreeBlocks(size) {
        for (let i = 0; i <= diskSize - size; i++) {
            let contiguous = true;
            for (let j = 0; j < size; j++) {
                if (diskBlocks[i + j] !== null) {
                    contiguous = false;
                    break;
                }
            }
            if (contiguous) {
                return i;
            }
        }
        return -1;
    }

    // Find any free blocks (returns array of free block indices)
    function findFreeBlocks(size) {
        const freeBlocks = [];
        for (let i = 0; i < diskSize; i++) {
            if (diskBlocks[i] === null) {
                freeBlocks.push(i);
                if (freeBlocks.length === size) {
                    return freeBlocks;
                }
            }
        }
        return freeBlocks.length >= size ? freeBlocks : [];
    }

    // Sequential allocation implementation
    function allocateSequential() {
        const fileSize = parseInt(seqFileSizeInput.value) || 1;
        if (fileSize < 1) {
            updateStatusMessage('File size must be at least 1 block', 'error');
            return;
        }
        
        const startBlock = findContiguousFreeBlocks(fileSize);
        if (startBlock === -1) {
            updateStatusMessage('Allocation Failed: Not enough contiguous space available', 'error');
            return;
        }
        
        const fileId = fileIdCounter++;
        const file = {
            id: fileId,
            allocationMethod: 'Sequential',
            startBlock: startBlock,
            size: fileSize
        };
        
        files.push(file);
        
        // Mark blocks as allocated
        for (let i = 0; i < fileSize; i++) {
            diskBlocks[startBlock + i] = {
                fileId: fileId,
                type: 'data'
            };
        }
        
        renderDisk();
        renderFileList();
        selectFile(fileId);
        
        updateStatusMessage(`Allocation Success: File ${fileId} occupies blocks ${startBlock}-${startBlock + fileSize - 1}`, 'success');
    }

    // Enhanced Indexed allocation implementation with corrected single index block logic
    function allocateIndexed() {
        const fileSize = parseInt(indexedFileSizeInput.value) || 1;
        const indexBlock = parseInt(indexBlockInput.value) || 0;
        const scheme = indexSchemeSelect.value;
        const pointersPerBlock = parseInt(pointersPerBlockInput.value) || 4;
        
        if (fileSize < 1) {
            updateStatusMessage('File size must be at least 1 block', 'error');
            return;
        }
        
        if (indexBlock < 0 || indexBlock >= diskSize) {
            updateStatusMessage('Invalid index block', 'error');
            return;
        }
        
        if (diskBlocks[indexBlock] !== null) {
            updateStatusMessage('Index block is already allocated', 'error');
            return;
        }
        
        // Find all free blocks (excluding the initially selected index block)
        const allFreeBlocks = [];
        for (let i = 0; i < diskSize; i++) {
            if (diskBlocks[i] === null && i !== indexBlock) {
                allFreeBlocks.push(i);
            }
        }
        
        // Calculate required blocks based on scheme
        let requiredIndexBlocks = 1;
        let requiredDataBlocks = fileSize;
        let totalBlocksNeeded = fileSize + 1; // At least 1 index block + data blocks
        
        if (scheme === 'single') {
            // For single index block, file size can't exceed pointers per block
            if (fileSize > pointersPerBlock) {
                updateStatusMessage(`Allocation Failed: File too large for single index block (max ${pointersPerBlock} blocks)`, 'error');
                return;
            }
        } else if (scheme === 'linked') {
            // Each index block can hold 'pointersPerBlock' data pointers
            requiredIndexBlocks = Math.ceil(fileSize / pointersPerBlock);
            totalBlocksNeeded = fileSize + requiredIndexBlocks;
        } else if (scheme === 'multilevel') {
            // Two-level index: first level points to second level blocks
            requiredIndexBlocks = 1 + Math.ceil(fileSize / pointersPerBlock);
            totalBlocksNeeded = fileSize + requiredIndexBlocks;
        }
        
        // Check if we have enough free blocks
        if (allFreeBlocks.length < totalBlocksNeeded - 1) { // -1 because indexBlock is already counted
            updateStatusMessage(`Allocation Failed: Need ${totalBlocksNeeded} total blocks (${fileSize} data + ${requiredIndexBlocks} index)`, 'error');
            return;
        }
        
        // Allocate data blocks first (first 'fileSize' free blocks)
        const dataBlocks = allFreeBlocks.slice(0, fileSize);
        
        // For linked and multilevel schemes: allocate additional index blocks
        const indexBlocks = [indexBlock];
        if ((scheme === 'linked' || scheme === 'multilevel') && requiredIndexBlocks > 1) {
            // Take blocks after the data blocks for additional index blocks
            for (let i = 0; i < requiredIndexBlocks - 1; i++) {
                const nextIndexBlock = allFreeBlocks[fileSize + i];
                if (nextIndexBlock === undefined) {
                    updateStatusMessage('Allocation Failed: Not enough space for index blocks', 'error');
                    return;
                }
                indexBlocks.push(nextIndexBlock);
            }
        }
        
        const fileId = fileIdCounter++;
        const file = {
            id: fileId,
            allocationMethod: 'Indexed',
            indexScheme: scheme,
            indexBlock: indexBlock,
            dataBlocks: dataBlocks,
            size: fileSize,
            pointersPerBlock: pointersPerBlock
        };
        
        if (scheme === 'linked') {
            file.indexBlocks = indexBlocks;
        } else if (scheme === 'multilevel') {
            file.secondLevelIndexBlocks = indexBlocks.slice(1);
        }
        
        files.push(file);
        
        // Mark index blocks based on scheme
        if (scheme === 'single') {
            // Single index block contains all pointers
            diskBlocks[indexBlock] = {
                fileId: fileId,
                type: 'index',
                pointers: dataBlocks
            };
        } else if (scheme === 'linked') {
            // Linked index blocks - each contains pointersPerBlock data pointers
            for (let i = 0; i < indexBlocks.length; i++) {
                const start = i * pointersPerBlock;
                const end = Math.min((i + 1) * pointersPerBlock, dataBlocks.length);
                const blockPointers = dataBlocks.slice(start, end);
                
                // Determine next index block (null for last one)
                const nextIndexBlock = i < indexBlocks.length - 1 ? indexBlocks[i + 1] : null;
                
                diskBlocks[indexBlocks[i]] = {
                    fileId: fileId,
                    type: 'index',
                    pointers: blockPointers,
                    nextIndexBlock: nextIndexBlock
                };
            }
        } else if (scheme === 'multilevel') {
            // First level index points to second level index blocks
            const secondLevelBlocks = indexBlocks.slice(1);
            diskBlocks[indexBlock] = {
                fileId: fileId,
                type: 'index',
                pointers: secondLevelBlocks
            };
            
            // Second level index blocks point to data
            for (let i = 0; i < secondLevelBlocks.length; i++) {
                const start = i * pointersPerBlock;
                const end = Math.min((i + 1) * pointersPerBlock, dataBlocks.length);
                const blockPointers = dataBlocks.slice(start, end);
                
                diskBlocks[secondLevelBlocks[i]] = {
                    fileId: fileId,
                    type: 'index',
                    pointers: blockPointers
                };
            }
        }
        
        // Mark data blocks as allocated
        dataBlocks.forEach(blockIndex => {
            diskBlocks[blockIndex] = {
                fileId: fileId,
                type: 'data'
            };
        });
        
        renderDisk();
        renderFileList();
        selectFile(fileId);
        
        let message = `Allocation Success: File ${fileId} (${scheme} scheme)`;
        if (scheme === 'single') {
            message += `, index at block ${indexBlock}, data blocks: ${dataBlocks.join(', ')}`;
        } else if (scheme === 'linked') {
            message += `, ${indexBlocks.length} index blocks (${indexBlocks.join(' → ')}), data blocks: ${dataBlocks.join(', ')}`;
        } else if (scheme === 'multilevel') {
            message += `, 1st level at ${indexBlock}, ${indexBlocks.length-1} 2nd level blocks, data blocks: ${dataBlocks.join(', ')}`;
        }
        
        updateStatusMessage(message, 'success');
    }

    // Linked allocation implementation
    function allocateLinked() {
        const fileSize = parseInt(linkedFileSizeInput.value) || 1;
        
        if (fileSize < 1) {
            updateStatusMessage('File size must be at least 1 block', 'error');
            return;
        }
        
        // We need fileSize free blocks for data
        const freeBlocks = findFreeBlocks(fileSize);
        if (freeBlocks.length < fileSize) {
            updateStatusMessage('Allocation Failed: Not enough free blocks available', 'error');
            return;
        }
        
        const fileId = fileIdCounter++;
        const startBlock = freeBlocks[0];
        
        const file = {
            id: fileId,
            allocationMethod: 'Linked',
            startBlock: startBlock,
            size: fileSize
        };
        
        files.push(file);
        
        // Setup linked list chain
        for (let i = 0; i < fileSize; i++) {
            const blockIndex = freeBlocks[i];
            const nextBlock = i < fileSize - 1 ? freeBlocks[i + 1] : null;
            
            diskBlocks[blockIndex] = {
                fileId: fileId,
                type: 'data',
                nextBlock: nextBlock
            };
        }
        
        renderDisk();
        renderFileList();
        selectFile(fileId);
        
        updateStatusMessage(`Allocation Success: File ${fileId} starts at block ${startBlock}`, 'success');
    }

    // Remove selected file
    function removeSelectedFile() {
        if (selectedFileId === null) {
            updateStatusMessage('Please select a file to remove', 'error');
            return;
        }
        
        const fileIndex = files.findIndex(file => file.id === selectedFileId);
        if (fileIndex === -1) {
            updateStatusMessage('Selected file not found', 'error');
            return;
        }
        
        const file = files[fileIndex];
        
        // Free blocks based on allocation method
        if (file.allocationMethod === 'Sequential') {
            for (let i = 0; i < file.size; i++) {
                diskBlocks[file.startBlock + i] = null;
            }
        } else if (file.allocationMethod === 'Indexed') {
            // Free all index blocks and data blocks
            if (file.indexScheme === 'single') {
                diskBlocks[file.indexBlock] = null;
            } else if (file.indexScheme === 'linked') {
                file.indexBlocks.forEach(blockIndex => {
                    diskBlocks[blockIndex] = null;
                });
            } else if (file.indexScheme === 'multilevel') {
                diskBlocks[file.indexBlock] = null;
                file.secondLevelIndexBlocks.forEach(blockIndex => {
                    diskBlocks[blockIndex] = null;
                });
            }
            
            // Free data blocks
            file.dataBlocks.forEach(blockIndex => {
                diskBlocks[blockIndex] = null;
            });
        } else if (file.allocationMethod === 'Linked') {
            let currentBlock = file.startBlock;
            while (currentBlock !== null) {
                const nextBlock = diskBlocks[currentBlock].nextBlock;
                diskBlocks[currentBlock] = null;
                currentBlock = nextBlock;
            }
        }
        
        files.splice(fileIndex, 1);
        selectedFileId = null;
        
        renderDisk();
        renderFileList();
        
        updateStatusMessage(`File ${file.id} removed successfully`, 'success');
    }

    // Add this code to simulation.js, right after the removeSelectedFile function

// Grow selected file
    function growSelectedFile() {
        if (selectedFileId === null) {
            updateStatusMessage('Please select a file to grow', 'error');
            return;
        }
        
        const growthSize = parseInt(fileGrowthInput.value) || 0;
        if (growthSize <= 0) {
            updateStatusMessage('Growth size must be at least 1 block', 'error');
            return;
        }
        
        const fileIndex = files.findIndex(file => file.id === selectedFileId);
        if (fileIndex === -1) {
            updateStatusMessage('Selected file not found', 'error');
            return;
        }
        
        const file = files[fileIndex];
        
        // Handle growth based on allocation method
        if (file.allocationMethod === 'Sequential') {
            // For sequential allocation, we need contiguous space after the file
            const lastBlock = file.startBlock + file.size - 1;
            let contiguousFree = true;
            
            // Check if there's enough contiguous space after the file
            for (let i = 1; i <= growthSize; i++) {
                const blockToCheck = lastBlock + i;
                if (blockToCheck >= diskSize || diskBlocks[blockToCheck] !== null) {
                    contiguousFree = false;
                    break;
                }
            }
            
            if (!contiguousFree) {
                updateStatusMessage('Cannot grow file: No contiguous space available after the file', 'error');
                return;
            }
            
            // Allocate new blocks
            for (let i = 1; i <= growthSize; i++) {
                diskBlocks[lastBlock + i] = {
                    fileId: file.id,
                    type: 'data'
                };
            }
            
            // Update file size
            file.size += growthSize;
            
            updateStatusMessage(`File ${file.id} grown by ${growthSize} blocks (new size: ${file.size} blocks)`, 'success');
        } 
        else if (file.allocationMethod === 'Indexed') {
            // For indexed allocation, we need free blocks for data and possibly for index blocks
            const scheme = file.indexScheme;
            
            // Find all available free blocks
            const freeBlocks = [];
            for (let i = 0; i < diskSize; i++) {
                if (diskBlocks[i] === null) {
                    freeBlocks.push(i);
                }
            }
            
            if (freeBlocks.length < growthSize) {
                updateStatusMessage('Cannot grow file: Not enough free blocks available', 'error');
                return;
            }
            
            if (scheme === 'single') {
                // Single index scheme: check if index block has enough space for pointers
                const totalFileSize = file.size + growthSize;
                if (totalFileSize > file.pointersPerBlock) {
                    updateStatusMessage(`Cannot grow file: Single index block can only address ${file.pointersPerBlock} blocks`, 'error');
                    return;
                }
                
                // Allocate new data blocks
                const newDataBlocks = freeBlocks.slice(0, growthSize);
                
                // Update index block pointers
                const indexBlock = diskBlocks[file.indexBlock];
                indexBlock.pointers = [...file.dataBlocks, ...newDataBlocks];
                
                // Allocate new blocks
                newDataBlocks.forEach(blockIndex => {
                    diskBlocks[blockIndex] = {
                        fileId: file.id,
                        type: 'data'
                    };
                });
                
                // Update file data
                file.dataBlocks = [...file.dataBlocks, ...newDataBlocks];
                file.size += growthSize;
                
                updateStatusMessage(`File ${file.id} grown by ${growthSize} blocks (new size: ${file.size} blocks)`, 'success');
            } 
            else if (scheme === 'linked') {
                // Linked index scheme: may need to add more index blocks
                const pointersPerBlock = file.pointersPerBlock;
                const currentIndexBlocks = file.indexBlocks.length;
                const currentCapacity = currentIndexBlocks * pointersPerBlock;
                const totalFileSize = file.size + growthSize;
                
                // Calculate if we need more index blocks
                const totalIndexBlocksNeeded = Math.ceil(totalFileSize / pointersPerBlock);
                const newIndexBlocksNeeded = totalIndexBlocksNeeded - currentIndexBlocks;
                
                if (freeBlocks.length < growthSize + newIndexBlocksNeeded) {
                    updateStatusMessage('Cannot grow file: Not enough free blocks for data and index blocks', 'error');
                    return;
                }
                
                // Allocate new blocks: first for indices (if needed), then for data
                let allocatedBlocks = 0;
                const newIndexBlocks = [];
                const newDataBlocks = [];
                
                // First, allocate new index blocks if needed
                for (let i = 0; i < newIndexBlocksNeeded; i++) {
                    newIndexBlocks.push(freeBlocks[allocatedBlocks++]);
                }
                
                // Then, allocate data blocks
                for (let i = 0; i < growthSize; i++) {
                    newDataBlocks.push(freeBlocks[allocatedBlocks++]);
                }
                
                // Update the last existing index block to point to the first new index block (if any)
                if (newIndexBlocksNeeded > 0 && currentIndexBlocks > 0) {
                    diskBlocks[file.indexBlocks[currentIndexBlocks - 1]].nextIndexBlock = newIndexBlocks[0];
                }
                
                // Setup new index blocks
                for (let i = 0; i < newIndexBlocks.length; i++) {
                    const start = file.dataBlocks.length + i * pointersPerBlock;
                    const end = Math.min(file.dataBlocks.length + (i + 1) * pointersPerBlock, file.dataBlocks.length + newDataBlocks.length);
                    const blockPointers = newDataBlocks.slice(start - file.dataBlocks.length, end - file.dataBlocks.length);
                    
                    // Determine next index block (null for last one)
                    const nextIndexBlock = i < newIndexBlocks.length - 1 ? newIndexBlocks[i + 1] : null;
                    
                    diskBlocks[newIndexBlocks[i]] = {
                        fileId: file.id,
                        type: 'index',
                        pointers: blockPointers,
                        nextIndexBlock: nextIndexBlock
                    };
                }
                
                // Update existing index blocks' pointers if they're not full
                const lastExistingIndexBlock = file.indexBlocks[currentIndexBlocks - 1];
                const existingPointers = diskBlocks[lastExistingIndexBlock].pointers;
                
                if (existingPointers.length < pointersPerBlock) {
                    // Add as many new data blocks as will fit in this index block
                    const spaceLeft = pointersPerBlock - existingPointers.length;
                    const blocksToAdd = Math.min(spaceLeft, newDataBlocks.length);
                    
                    for (let i = 0; i < blocksToAdd; i++) {
                        diskBlocks[lastExistingIndexBlock].pointers.push(newDataBlocks[i]);
                    }
                    
                    // Remove these blocks from the ones we still need to assign to new index blocks
                    if (blocksToAdd > 0 && newIndexBlocksNeeded > 0) {
                        const newPointersArray = newDataBlocks.slice(blocksToAdd);
                        
                        // Reassign pointers in new index blocks
                        for (let i = 0; i < newIndexBlocks.length; i++) {
                            const start = i * pointersPerBlock;
                            const end = Math.min((i + 1) * pointersPerBlock, newPointersArray.length);
                            diskBlocks[newIndexBlocks[i]].pointers = newPointersArray.slice(start, end);
                        }
                    }
                }
                
                // Allocate new data blocks
                newDataBlocks.forEach(blockIndex => {
                    diskBlocks[blockIndex] = {
                        fileId: file.id,
                        type: 'data'
                    };
                });
                
                // Update file data
                file.indexBlocks = [...file.indexBlocks, ...newIndexBlocks];
                file.dataBlocks = [...file.dataBlocks, ...newDataBlocks];
                file.size += growthSize;
                
                updateStatusMessage(`File ${file.id} grown by ${growthSize} blocks (new size: ${file.size} blocks)`, 'success');
            } 
            else if (scheme === 'multilevel') {
                // Multilevel index scheme: may need to add more second-level index blocks
                const pointersPerBlock = file.pointersPerBlock;
                const currentSecondLevelBlocks = file.secondLevelIndexBlocks.length;
                const currentCapacity = currentSecondLevelBlocks * pointersPerBlock;
                const totalFileSize = file.size + growthSize;
                
                // Calculate if we need more second-level index blocks
                const totalSecondLevelBlocksNeeded = Math.ceil(totalFileSize / pointersPerBlock);
                const newSecondLevelBlocksNeeded = totalSecondLevelBlocksNeeded - currentSecondLevelBlocks;
                
                // First level index block can hold pointersPerBlock second-level blocks
                if (totalSecondLevelBlocksNeeded > pointersPerBlock) {
                    updateStatusMessage(`Cannot grow file: First level index can only address ${pointersPerBlock} second-level blocks`, 'error');
                    return;
                }
                
                if (freeBlocks.length < growthSize + newSecondLevelBlocksNeeded) {
                    updateStatusMessage('Cannot grow file: Not enough free blocks for data and index blocks', 'error');
                    return;
                }
                
                // Allocate new blocks: first for second-level indices, then for data
                let allocatedBlocks = 0;
                const newSecondLevelBlocks = [];
                const newDataBlocks = [];
                
                // Allocate new second-level index blocks if needed
                for (let i = 0; i < newSecondLevelBlocksNeeded; i++) {
                    newSecondLevelBlocks.push(freeBlocks[allocatedBlocks++]);
                }
                
                // Allocate data blocks
                for (let i = 0; i < growthSize; i++) {
                    newDataBlocks.push(freeBlocks[allocatedBlocks++]);
                }
                
                // Update first level index block to point to new second-level blocks
                if (newSecondLevelBlocksNeeded > 0) {
                    diskBlocks[file.indexBlock].pointers = [
                        ...file.secondLevelIndexBlocks, 
                        ...newSecondLevelBlocks
                    ];
                }
                
                // Setup new second-level index blocks
                for (let i = 0; i < newSecondLevelBlocks.length; i++) {
                    const start = file.dataBlocks.length + i * pointersPerBlock;
                    const end = Math.min(file.dataBlocks.length + (i + 1) * pointersPerBlock, file.dataBlocks.length + newDataBlocks.length);
                    const blockPointers = newDataBlocks.slice(start - file.dataBlocks.length, end - file.dataBlocks.length);
                    
                    diskBlocks[newSecondLevelBlocks[i]] = {
                        fileId: file.id,
                        type: 'index',
                        pointers: blockPointers
                    };
                }
                
                // Update existing second-level blocks' pointers if they're not full
                if (currentSecondLevelBlocks > 0) {
                    const lastExistingSecondLevel = file.secondLevelIndexBlocks[currentSecondLevelBlocks - 1];
                    const existingPointers = diskBlocks[lastExistingSecondLevel].pointers;
                    
                    if (existingPointers.length < pointersPerBlock) {
                        // Add as many new data blocks as will fit in this index block
                        const spaceLeft = pointersPerBlock - existingPointers.length;
                        const blocksToAdd = Math.min(spaceLeft, newDataBlocks.length);
                        
                        for (let i = 0; i < blocksToAdd; i++) {
                            diskBlocks[lastExistingSecondLevel].pointers.push(newDataBlocks[i]);
                        }
                        
                        // Remove these blocks from the ones we still need to assign to new index blocks
                        if (blocksToAdd > 0 && newSecondLevelBlocksNeeded > 0) {
                            const newPointersArray = newDataBlocks.slice(blocksToAdd);
                            
                            // Reassign pointers in new index blocks
                            for (let i = 0; i < newSecondLevelBlocks.length; i++) {
                                const start = i * pointersPerBlock;
                                const end = Math.min((i + 1) * pointersPerBlock, newPointersArray.length);
                                diskBlocks[newSecondLevelBlocks[i]].pointers = newPointersArray.slice(start, end);
                            }
                        }
                    }
                }
                
                // Allocate new data blocks
                newDataBlocks.forEach(blockIndex => {
                    diskBlocks[blockIndex] = {
                        fileId: file.id,
                        type: 'data'
                    };
                });
                
                // Update file data
                file.secondLevelIndexBlocks = [...file.secondLevelIndexBlocks, ...newSecondLevelBlocks];
                file.dataBlocks = [...file.dataBlocks, ...newDataBlocks];
                file.size += growthSize;
                
                updateStatusMessage(`File ${file.id} grown by ${growthSize} blocks (new size: ${file.size} blocks)`, 'success');
            }
        } 
        else if (file.allocationMethod === 'Linked') {
            // For linked allocation, we just need free blocks (they don't need to be contiguous)
            
            // Find free blocks
            const freeBlocks = [];
            for (let i = 0; i < diskSize; i++) {
                if (diskBlocks[i] === null) {
                    freeBlocks.push(i);
                }
            }
            
            if (freeBlocks.length < growthSize) {
                updateStatusMessage('Cannot grow file: Not enough free blocks available', 'error');
                return;
            }
            
            // Find the last block of the file
            let lastBlock = file.startBlock;
            while (diskBlocks[lastBlock].nextBlock !== null) {
                lastBlock = diskBlocks[lastBlock].nextBlock;
            }
            
            // Connect the last block to the first new block
            diskBlocks[lastBlock].nextBlock = freeBlocks[0];
            
            // Allocate new blocks and connect them in a linked list
            for (let i = 0; i < growthSize; i++) {
                const blockIndex = freeBlocks[i];
                const nextBlock = i < growthSize - 1 ? freeBlocks[i + 1] : null;
                
                diskBlocks[blockIndex] = {
                    fileId: file.id,
                    type: 'data',
                    nextBlock: nextBlock
                };
            }
            
            // Update file size
            file.size += growthSize;
            
            updateStatusMessage(`File ${file.id} grown by ${growthSize} blocks (new size: ${file.size} blocks)`, 'success');
        }
        
        renderDisk();
        renderFileList();
    }

    // Reset simulation
    function resetSimulation() {
        initializeDisk();
        updateStatusMessage('Simulation reset', 'info');
    }

    // Toggle allocation method controls
    function toggleAllocationControls() {
        const method = allocationMethodSelect.value;
        
        sequentialControls.style.display = method === 'sequential' ? 'flex' : 'none';
        indexedControls.style.display = method === 'indexed' ? 'flex' : 'none';
        linkedControls.style.display = method === 'linked' ? 'flex' : 'none';
    }

    // Event listeners
    initDiskBtn.addEventListener('click', initializeDisk);
    allocationMethodSelect.addEventListener('change', toggleAllocationControls);
    allocateSeqBtn.addEventListener('click', allocateSequential);
    allocateIndexedBtn.addEventListener('click', allocateIndexed);
    allocateLinkedBtn.addEventListener('click', allocateLinked);
    removeFileBtn.addEventListener('click', removeSelectedFile);
    resetSimulationBtn.addEventListener('click', resetSimulation);
    growFileBtn.addEventListener('click', growSelectedFile);
    
    // Initialize the simulator
    toggleAllocationControls();
    initializeDisk();
});