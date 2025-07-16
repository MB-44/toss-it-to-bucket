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
            originalY: 0,
            width: 0,
            height: 0
        };

        this.products.forEach(product => {
            product.addEventListener('mousedown', this.startDrag.bind(this));
            product.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
        });

        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this), { passive: false });

        document.addEventListener('mouseup', this.endDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));

        this.startTimer();
    }

    startDrag(e) {
        if (!this.gameActive) return;
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const product = e.target;
        const rect = product.getBoundingClientRect();
        this.dragData.isDragging = true;
        this.dragData.element = product;
        this.dragData.startX = rect.left + rect.width / 2;
        this.dragData.startY = rect.top + rect.height / 2;
        this.dragData.currentX = touch.clientX;
        this.dragData.currentY = touch.clientY;
        this.dragData.originalX = rect.left;
        this.dragData.originalY = rect.top;
        this.dragData.width = rect.width;
        this.dragData.height = rect.height;
        product.classList.add('dragging');
        product.style.position = 'fixed';
        product.style.zIndex = '20';
        this.showTrajectory();
    }

    drag(e) {
        if (!this.dragData.isDragging || !this.gameActive) return;
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        this.dragData.currentX = touch.clientX;
        this.dragData.currentY = touch.clientY;
        const product = this.dragData.element;
        product.style.left = (this.dragData.currentX - this.dragData.width / 2) + 'px';
        product.style.top = (this.dragData.currentY - this.dragData.height / 2) + 'px';
        this.showTrajectory();
    }

    showTrajectory() {
        const deltaX = this.dragData.startX - this.dragData.currentX;
        const deltaY = this.dragData.startY - this.dragData.currentY;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance > 20) {
            const length = Math.min(distance * 2, 200);
            const angle = Math.atan2(-deltaY, -deltaX) * 180 / Math.PI;
            this.trajectoryLine.style.left = this.dragData.startX + 'px';
            this.trajectoryLine.style.top = this.dragData.startY + 'px';
            this.trajectoryLine.style.width = length + 'px';
            this.trajectoryLine.style.transform = `rotate(${angle}deg)`;
            this.trajectoryLine.classList.add('show');
            const power = Math.min(distance / 100, 1);
            this.trajectoryLine.style.height = (2 + power * 3) + 'px';
        } else {
            this.trajectoryLine.classList.remove('show');
        }
    }

    endDrag(e) {
        if (!this.dragData.isDragging || !this.gameActive) return;
        const product = this.dragData.element;
        const deltaX = this.dragData.startX - this.dragData.currentX;
        const deltaY = this.dragData.startY - this.dragData.currentY;
        const distance = Math.hypot(deltaX, deltaY);
        this.trajectoryLine.classList.remove('show');
        if (distance > 30) {
            const power = Math.min(distance / 50, 3);
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
        let currentX = this.dragData.startX - 25;
        let currentY = this.dragData.startY - 25;
        let vx = velocityX;
        let vy = velocityY;
        const gravity = 0.4;
        const friction = 0.995;
        const animate = () => {
            vy += gravity;
            vx *= friction;
            currentX += vx;
            currentY += vy;
            product.style.left = currentX + 'px';
            product.style.top = currentY + 'px';
            if (this.checkBucketCollision(product, currentX, currentY)) {
                this.productInBucket(product);
                return;
            }
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
        return (x + 25 >= bucketRect.left &&
                x + 25 <= bucketRect.right &&
                y + 50 >= bucketRect.top &&
                y <= bucketRect.bottom);
    }

    productInBucket(product) {
        this.createParticleEffect(product);
        product.classList.add('in-bucket');
        setTimeout(() => product.style.display = 'none', 500);
        this.productsRemaining--;
        this.updateUI();
        if (this.productsRemaining === 0) this.endGame(true);
    }

    resetProductPosition(product) {
        const positions = {
            apple: { left: '50px', bottom: '150px' },
            orange: { left: '120px', bottom: '180px' },
            banana: { left: '80px', bottom: '250px' },
            grape: { left: '150px', bottom: '120px' }
        };
        const type = product.dataset.type;
        const pos = positions[type];
        if (pos) {
            product.style.left = pos.left;
            product.style.bottom = pos.bottom;
            product.style.top = 'auto';
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            if (this.timeLeft <= 0) this.endGame(false);
        }, 1000);
    }

    updateUI() {
        document.getElementById('timeLeft').textContent = this.timeLeft;
        document.getElementById('productsLeft').textContent = this.productsRemaining;
    }

    endGame(won) {
        clearInterval(this.timer);
        this.gameActive = false;
        const screen = document.getElementById('gameOverScreen');
        screen.querySelector('h2').textContent = won
            ? `You got all products!`
            : `Time’s up!`;
        screen.classList.add('show');
        setTimeout(() => new BucketTossGame(), 100);
    }
}

document.addEventListener('DOMContentLoaded', () => new BucketTossGame());