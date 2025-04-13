// This JavaScript file contains functionality for the Process Synchronization page

document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects for the method cards
    const methodCards = document.querySelectorAll('.method-card');
    methodCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add functionality for the simulation button
    const simulationButton = document.querySelector('button[onclick="location.href=\'sync_simulation.html\';"]');
    if (simulationButton) {
        simulationButton.addEventListener('mouseover', function() {
            this.innerHTML = "Explore Interactive Simulations";
        });
        
        simulationButton.addEventListener('mouseout', function() {
            this.innerHTML = "Try Simulation";
        });
    }

    // Add additional information on card click
    methodCards.forEach(card => {
        card.addEventListener('click', function() {
            const heading = this.querySelector('h3').textContent;
            
            // Define additional information for each problem
            const additionalInfo = {
                'Producer-Consumer Problem': 'The producer-consumer problem demonstrates the coordination between processes that produce data items and those that consume them. Bounded-buffer implementations require careful synchronization to prevent race conditions.',
                'Readers-Writers Problem': 'The readers-writers problem showcases the balance between allowing concurrent read access while ensuring exclusive write access. First/second/third variants prioritize readers, writers, or neither respectively.',
                'Dining Philosophers Problem': 'The dining philosophers problem, introduced by Dijkstra, illustrates deadlock and resource allocation challenges. Solutions include resource hierarchy, arbitrator, or changing the problem constraints.',
                'Sleeping Barber Problem': 'The sleeping barber problem, created by Dijkstra, demonstrates process coordination and signaling. It models real-world scenarios like customer service systems and thread pools.'
            };
            
            // Create or update info div
            let infoDiv = this.querySelector('.additional-info');
            if (!infoDiv) {
                infoDiv = document.createElement('div');
                infoDiv.className = 'additional-info';
                infoDiv.style.marginTop = '15px';
                infoDiv.style.padding = '10px';
                infoDiv.style.backgroundColor = 'rgba(128, 203, 196, 0.2)';
                infoDiv.style.borderRadius = '8px';
                infoDiv.style.fontSize = '0.9em';
                this.appendChild(infoDiv);
                
                // Add close button
                const closeButton = document.createElement('button');
                closeButton.textContent = 'Close';
                closeButton.className = 'button';
                closeButton.style.fontSize = '0.8em';
                closeButton.style.padding = '5px 10px';
                closeButton.style.marginTop = '10px';
                
                closeButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    infoDiv.remove();
                });
                
                // Add content
                const content = document.createElement('p');
                content.textContent = additionalInfo[heading] || 'No additional information available.';
                
                infoDiv.appendChild(content);
                infoDiv.appendChild(closeButton);
            } else {
                infoDiv.remove();
            }
        });
    });
});