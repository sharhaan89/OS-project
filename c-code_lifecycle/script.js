// Data for compilation stages
const stageData = {
    'source': {
        title: 'Source Code (.c)',
        description: 'This is where it all begins - you write human-readable C code in a text editor.',
        code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!");\n    return 0;\n}'
    },
    'preprocessor': {
        title: 'Preprocessor',
        description: 'The preprocessor handles directives like #include, #define, and macro expansions. It replaces all macros and expands include files.',
        code: '# 1 "hello.c"\n# 1 "<built-in>"\n# 1 "<command-line>"\n# 1 "hello.c"\n# 1 "/usr/include/stdio.h" 1 3\n/* stdio.h definitions */\n...\nint main() {\n    printf("Hello, World!");\n    return 0;\n}'
    },
    'compiler': {
        title: 'Compiler (.o)',
        description: 'The compiler translates the preprocessed code into assembly and then into object code (machine code with placeholders for external references).',
        code: '0000000 cf fa ed fe 07 00 00 01 03 00 00 00 01 00 00 00\n0000010 02 00 00 00 06 00 00 00 08 00 00 00 00 00 00 00\n...\n\n/* Assembly Intermediate Step:\n.section __TEXT,__text\n.globl _main\n_main:\n    pushq %rbp\n    movq %rsp, %rbp\n    leaq L_.str(%rip), %rdi\n    callq _printf\n    xorl %eax, %eax\n    popq %rbp\n    retq\n*/'
    },
    'linker': {
        title: 'Linker & Loader',
        description: 'The linker resolves external references (like printf), combines multiple object files, and links with libraries to create an executable. The loader loads this executable into memory.',
        code: '/* Linking Process */\nResolving external references...\n- Found: _printf in libc.so.6\nCombining object code with library functions...\nCreating executable format with proper headers...\n\n/* Loading Process */\nAllocating memory segments: text, data, BSS, stack, heap\nCopying program sections to allocated memory\nInitializing registers and stack pointer\nJumping to program entry point (_main)'
    },
    'executable': {
        title: 'Executable',
        description: 'The final product - a binary executable file that can be run by the operating system. When launched, it becomes a process in memory.',
        code: '$ ./hello\nHello, World!\n\n/* Executable file structure: */\n- ELF/PE/Mach-O Header\n- Program Headers\n- .text (code) section\n- .data (initialized data) section\n- .bss (uninitialized data) section\n- Symbol tables\n- Relocation information\n- Dynamic linking information'
    }
};

// Data for process creation steps
const processStepData = {
    '1': {
        title: 'OS loads executable into memory',
        description: 'The operating system reads the executable file from disk and loads it into RAM. It identifies the sections (text, data, BSS) and prepares them for execution.'
    },
    '2': {
        title: 'Memory space allocation',
        description: 'Memory is allocated for different segments: stack (for function calls and local variables), heap (for dynamic memory allocation), data (for global/static variables), and text (for code).'
    },
    '3': {
        title: 'PCB (Process Control Block) creation',
        description: 'The OS creates a PCB to track process information including process ID (PID), state, program counter, CPU registers, memory limits, list of open files, and scheduling information.'
    },
    '4': {
        title: 'Resource allocation',
        description: 'The OS allocates resources needed by the process: CPU time, memory, file descriptors, network sockets, and other I/O resources. These are tracked and managed by the OS.'
    },
    '5': {
        title: 'Process execution begins',
        description: 'The OS sets the program counter to the entry point of the program (usually the main function) and transfers control to this location. The process begins executing instructions.'
    }
};

// Initialize the visualization
document.addEventListener('DOMContentLoaded', function() {
    // Set up compilation stage clicks
    document.querySelectorAll('.stage').forEach(stage => {
        stage.addEventListener('click', function() {
            const stageId = this.getAttribute('data-stage');
            
            // Update active state
            document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            
            // Update details panel
            const detailsPanel = document.getElementById('details-panel');
            detailsPanel.querySelector('.details-title').textContent = stageData[stageId].title;
            detailsPanel.querySelector('.details-description').textContent = stageData[stageId].description;
            document.getElementById('stage-code').textContent = stageData[stageId].code;
            
            // Show details panel
            detailsPanel.classList.add('active');
            
            // Update progress arrow
            updateProgressArrow(stageId);
        });
    });

    // Set up process step clicks
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', function() {
            const stepId = this.getAttribute('data-step');
            
            // Update active state
            document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            
            // Update process details panel
            const processDetailsPanel = document.querySelector('.process-details-panel');
            processDetailsPanel.querySelector('.process-details-title').textContent = processStepData[stepId].title;
            processDetailsPanel.querySelector('.process-details-description').textContent = processStepData[stepId].description;
            
            // Trigger animation based on step
            animateProcessStep(stepId);
        });
    });

    // Initialize with first stage and step active
    document.querySelector('.stage').click();
    document.querySelector('.step').click();
    
    // Start resource animations
    animateResources();
});

// Function to update the progress arrow
function updateProgressArrow(stageId) {
    const stages = ['source', 'preprocessor', 'compiler', 'linker', 'executable'];
    const index = stages.indexOf(stageId);
    const percentage = index / (stages.length - 1) * 100;
    
    document.getElementById('progress-arrow').style.width = percentage + '%';
}

// Function to animate resources
function animateResources() {
    const resources = document.querySelectorAll('.resource-level');
    
    // Animate each resource with a random level and delay
    resources.forEach((resource, index) => {
        // Set random initial level
        const initialLevel = 20 + Math.random() * 30;
        resource.style.width = initialLevel + '%';
        
        // Set up continuous animation
        setInterval(() => {
            const newLevel = 20 + Math.random() * 60;
            resource.style.width = newLevel + '%';
        }, 3000 + index * 500);
    });
}

// Function to animate process based on selected step
function animateProcessStep(stepId) {
    const memorySections = document.querySelectorAll('.memory-section');
    
    // Reset animations
    memorySections.forEach(section => {
        section.classList.remove('animate-memory');
    });
    
    // Trigger specific animations based on step
    switch(stepId) {
        case '1':
            // Animate text section filling up
            setTimeout(() => {
                document.querySelector('.memory-section.text-section').classList.add('animate-memory');
            }, 200);
            break;
            
        case '2':
            // Animate all memory sections filling up in sequence
            document.querySelectorAll('.memory-section').forEach((section, index) => {
                setTimeout(() => {
                    section.classList.add('animate-memory');
                }, 200 * index);
            });
            break;
            
        case '3':
            // Highlight process control block (simulated by pulsing the process box)
            const processBox = document.querySelector('.process-box');
            processBox.classList.add('animate-resource');
            setTimeout(() => {
                processBox.classList.remove('animate-resource');
            }, 2000);
            break;
            
        case '4':
            // Animate resource meters filling up
            document.querySelectorAll('.resource-level').forEach((resource, index) => {
                setTimeout(() => {
                    resource.style.width = '70%';
                    resource.parentElement.parentElement.classList.add('animate-resource');
                    setTimeout(() => {
                        resource.parentElement.parentElement.classList.remove('animate-resource');
                    }, 2000);
                }, 200 * index);
            });
            break;
            
        case '5':
            // Simulate CPU utilization and program running
            const cpuResource = document.querySelector('.resource.cpu .resource-level');
            cpuResource.style.width = '90%';
            document.querySelector('.resource.cpu').classList.add('animate-resource');
            
            // Animate text section to simulate code execution
            document.querySelector('.memory-section.text-section').classList.add('animate-resource');
            break;
    }
}