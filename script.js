
class BucketTossGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.bucket = document.getElementById('bucket');
        this.products = document.querySelectorAll('.product');
        this.trajectoryLine = document.getElementById('trajectoryLine');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        
        this.timeLeft = 30;
        this.productsRemaining = 4;
        this.gameActive = true;
        this.timer = null;
        
        this.dragData = {
            isDragging: false,
            element: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            originalX: 0,
            originalY: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startTimer();
        this.updateUI();
    }
    
    setupEventListeners() {
        this.products.forEach(product => {
            product.addEventListener('mousedown', this.startDrag.bind(this));
            product.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
        });
        
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this), { passive: false });
        
        document.addEventListener('mouseup', this.endDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));
    }
    
    startDrag(e) {
        if (!this.gameActive) return;
        
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const product = e.target;
        
        // Get the center of the product as the anchor point
        const rect = product.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        this.dragData.isDragging = true;
        this.dragData.element = product;
        this.dragData.startX = centerX;
        this.dragData.startY = centerY;
        this.dragData.currentX = touch.clientX;
        this.dragData.currentY = touch.clientY;
        this.dragData.originalX = rect.left;
        this.dragData.originalY = rect.top;
        
        product.classList.add('dragging');
        product.style.position = 'fixed';
        product.style.zIndex = '20';
        
        // Show initial trajectory
        this.showTrajectory();
    }
    
    drag(e) {
        if (!this.dragData.isDragging || !this.gameActive) return;
        
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        
        this.dragData.currentX = touch.clientX;
        this.dragData.currentY = touch.clientY;
        
        // Update trajectory line
        this.showTrajectory();
    }
    
    showTrajectory() {
        const deltaX = this.dragData.startX - this.dragData.currentX;
        const deltaY = this.dragData.startY - this.dragData.currentY;
        
        // Only show trajectory if dragging with some distance
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 20) {
            // Calculate trajectory line (from product center to opposite direction of drag)
            const trajectoryLength = Math.min(distance * 2, 200); // Limit max length
            const angle = Math.atan2(-deltaY, -deltaX) * 180 / Math.PI; // Opposite direction
            
            this.trajectoryLine.style.left = this.dragData.startX + 'px';
            this.trajectoryLine.style.top = this.dragData.startY + 'px';
            this.trajectoryLine.style.width = trajectoryLength + 'px';
            this.trajectoryLine.style.transform = `rotate(${angle}deg)`;
            this.trajectoryLine.classList.add('show');
            
            // Add power indicator by changing line thickness
            const power = Math.min(distance / 100, 1);
            this.trajectoryLine.style.height = (2 + power * 3) + 'px';
        } else {
            this.trajectoryLine.classList.remove('show');
        }
    }
    
    endDrag(e) {
        if (!this.dragData.isDragging || !this.gameActive) return;
        
        const product = this.dragData.element;
        
        // Calculate launch velocity based on drag distance and direction
        const deltaX = this.dragData.startX - this.dragData.currentX;
        const deltaY = this.dragData.startY - this.dragData.currentY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Hide trajectory line
        this.trajectoryLine.classList.remove('show');
        
        // Only launch if there's significant drag distance
        if (distance > 30) {
            const power = Math.min(distance / 50, 3); // Scale power
            const velocityX = deltaX * power * 0.3;
            const velocityY = deltaY * power * 0.3;
            
            this.throwProduct(product, velocityX, velocityY);
        } else {
            this.resetProductPosition(product);
        }
        
        product.classList.remove('dragging');
        this.dragData.isDragging = false;
        this.dragData.element = null;
    }
    
    throwProduct(product, velocityX, velocityY) {
        product.classList.add('thrown');
        product.style.position = 'fixed';
        
        let currentX = this.dragData.startX - 25; // Center the product
        let currentY = this.dragData.startY - 25;
        let currentVelocityX = velocityX;
        let currentVelocityY = velocityY;
        
        const gravity = 0.4;
        const friction = 0.995;
        
        const animate = () => {
            currentVelocityY += gravity;
            currentVelocityX *= friction;
            
            currentX += currentVelocityX;
            currentY += currentVelocityY;
            
            product.style.left = currentX + 'px';
            product.style.top = currentY + 'px';
            
            // Check collision with bucket
            if (this.checkBucketCollision(product, currentX, currentY)) {
                this.productInBucket(product);
                return;
            }
            
            // Check if product is off screen
            if (currentY > window.innerHeight + 100 || 
                currentX < -100 || 
                currentX > window.innerWidth + 100) {
                this.resetProductPosition(product);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    checkBucketCollision(product, x, y) {
        const bucketRect = this.bucket.getBoundingClientRect();
        const productSize = 50;
        
        return (x + productSize/2 >= bucketRect.left && 
                x + productSize/2 <= bucketRect.right &&
                y + productSize >= bucketRect.top && 
                y <= bucketRect.bottom);
    }
    
    productInBucket(product) {
        // Create particle effect
        this.createParticleEffect(product);
        
        // Remove product
        product.classList.add('in-bucket');
        setTimeout(() => {
            product.style.display = 'none';
        }, 500);
        
        // Update game state
        this.productsRemaining--;
        this.updateUI();
        
        // Check win condition
        if (this.productsRemaining === 0) {
            this.endGame(true);
        }
    }
    
    createParticleEffect(product) {
        const rect = product.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = (i / 10) * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.setProperty('--dx', dx + 'px');
            particle.style.setProperty('--dy', dy + 'px');
            
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 600);
        }
    }
    
    resetProductPosition(product) {
        product.classList.remove('thrown');
        product.style.position = 'absolute';
        product.style.zIndex = '10';
        
        // Reset to original position based on product type
        const positions = {
            apple: { left: '50px', bottom: '150px' },
            orange: { left: '120px', bottom: '180px' },
            banana: { left: '80px', bottom: '250px' },
            grape: { left: '150px', bottom: '120px' }
        };
        
        const type = product.dataset.type;
        if (positions[type]) {
            product.style.left = positions[type].left;
            product.style.bottom = positions[type].bottom;
            product.style.top = 'auto';
        }
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft <= 0) {
                this.endGame(false);
            }
        }, 1000);
    }
    
    updateUI() {
        document.getElementById('timeLeft').textContent = this.timeLeft;
        document.getElementById('productsLeft').textContent = this.productsRemaining;
    }
    
    endGame(won) {
        this.gameActive = false;
        clearInterval(this.timer);
        
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        
        if (won) {
            title.textContent = 'Congratulations!';
            title.style.color = '#27ae60';
            message.textContent = 'You got all products in the bucket!';
        } else {
            title.textContent = 'Time\'s Up!';
            title.style.color = '#e74c3c';
            message.textContent = `You got ${4 - this.productsRemaining} out of 4 products in the bucket.`;
        }
        
        this.gameOverScreen.classList.add('show');
    }
}

function restartGame() {
    // Reset all products
    const products = document.querySelectorAll('.product');
    products.forEach(product => {
        product.style.display = 'flex';
        product.classList.remove('thrown', 'in-bucket', 'dragging');
        product.style.position = 'absolute';
        product.style.zIndex = '10';
    });
    
    // Reset positions
    const positions = [
        { element: document.getElementById('product1'), left: '50px', bottom: '150px' },
        { element: document.getElementById('product2'), left: '120px', bottom: '180px' },
        { element: document.getElementById('product3'), left: '80px', bottom: '250px' },
        { element: document.getElementById('product4'), left: '150px', bottom: '120px' }
    ];
    
    positions.forEach(pos => {
        pos.element.style.left = pos.left;
        pos.element.style.bottom = pos.bottom;
        pos.element.style.top = 'auto';
    });
    
    // Hide game over screen
    document.getElementById('gameOverScreen').classList.remove('show');
    
    // Start new game
    setTimeout(() => {
        new BucketTossGame();
    }, 100);
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BucketTossGame();
});
