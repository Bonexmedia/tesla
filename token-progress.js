// Dynamic Token Allocation Progress
// Automatically increases from start date to 95% over 1.5 months (45 days)

class TokenAllocationProgress {
    constructor() {
        // Configuration
        this.startDate = new Date('2026-01-15T00:00:00'); // Set your ICO start date here
        this.durationDays = 45; // 1.5 months
        this.maxProgress = 95; // Stop at 95%
        this.totalTokens = 100000; // 100k total tokens
        this.startProgress = 45; // Starting percentage (optional, can be 0)

        this.initializeElements();
        this.updateProgress();

        // Update every 5 minutes
        setInterval(() => this.updateProgress(), 5 * 60 * 1000);
    }

    initializeElements() {
        // Progress display elements
        this.percentDisplay = document.getElementById('progress-percent');
        this.progressBar = document.getElementById('progress-bar');
        this.soldTokens = document.getElementById('sold-tokens');
        this.leftTokens = document.getElementById('left-tokens');
        this.totalTokensDisplay = document.getElementById('total-tokens');
    }

    calculateCurrentProgress() {
        const now = new Date();
        const startTime = this.startDate.getTime();
        const endTime = startTime + (this.durationDays * 24 * 60 * 60 * 1000);
        const currentTime = now.getTime();

        // If before start date, use start progress
        if (currentTime < startTime) {
            return this.startProgress;
        }

        // If after end date or at max progress, cap at max
        if (currentTime >= endTime) {
            return this.maxProgress;
        }

        // Calculate linear progress from start to max over duration
        const elapsed = currentTime - startTime;
        const totalDuration = endTime - startTime;
        const progressRange = this.maxProgress - this.startProgress;
        const calculatedProgress = this.startProgress + (elapsed / totalDuration) * progressRange;

        // Cap at max progress
        return Math.min(calculatedProgress, this.maxProgress);
    }

    updateProgress() {
        const currentProgress = this.calculateCurrentProgress();

        // Calculate token amounts
        const sold = Math.floor((currentProgress / 100) * this.totalTokens);
        const left = this.totalTokens - sold;

        // Update percentage display
        if (this.percentDisplay) {
            this.percentDisplay.textContent = `${currentProgress.toFixed(1)}%`;
        }

        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${currentProgress}%`;
        }

        // Update sold tokens
        if (this.soldTokens) {
            this.soldTokens.textContent = this.formatTokenCount(sold);
        }

        // Update left tokens
        if (this.leftTokens) {
            this.leftTokens.textContent = this.formatTokenCount(left);
        }

        // Update total (should stay constant)
        if (this.totalTokensDisplay) {
            this.totalTokensDisplay.textContent = this.formatTokenCount(this.totalTokens);
        }

        console.log(`📊 Token Progress: ${currentProgress.toFixed(1)}% (${sold.toLocaleString()} sold, ${left.toLocaleString()} left)`);
    }

    formatTokenCount(count) {
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k`;
        }
        return count.toString();
    }

    // Method to get time remaining until 95%
    getTimeRemaining() {
        const now = new Date();
        const endTime = this.startDate.getTime() + (this.durationDays * 24 * 60 * 60 * 1000);
        const remaining = endTime - now.getTime();

        if (remaining <= 0) {
            return 'Campaign completed';
        }

        const daysLeft = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hoursLeft = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

        return `${daysLeft}d ${hoursLeft}h remaining`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TokenAllocationProgress();
    });
} else {
    new TokenAllocationProgress();
}
