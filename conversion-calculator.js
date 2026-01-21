// Combined SOL to TSLA Conversion Calculator & Wallet Manager
// Handles wallet connection, balance display, and SOL↔TSLA conversions

class ConversionCalculator {
    constructor() {
        this.minTSLA = 0.5; // Minimum TSLA shares that can be purchased
        this.networkFee = 0.00025; // Fixed SOL network fee
        this.solPrice = 0;
        this.tslaPrice = 0;
        this.tslaDiscountedPrice = 0;

        // Wallet state
        this.connection = null;
        this.walletPublicKey = null;

        this.initializeElements();
        this.attachEventListeners();
        this.initializeWallet();
        this.startPriceSync();
    }

    initializeElements() {
        // Calculator elements
        this.solInput = document.getElementById('sol-input');
        this.tslaOutput = document.getElementById('tsla-output');
        this.maxButton = document.getElementById('max-button');
        this.solUsdValue = document.getElementById('sol-usd-value');
        this.tslaUsdValue = document.getElementById('tsla-usd-value');
        this.rateDisplay = document.getElementById('conversion-rate');
        this.validationMsg = document.getElementById('validation-message');

        // Wallet display elements (Dashboard page)
        this.walletButton = document.querySelector('button.btn-primary.fw-medium.px-4');
        this.solBalance = document.getElementById('sol-balance');
    }

    initializeWallet() {
        // Check for Solana Web3 library
        if (typeof solanaWeb3 === 'undefined') {
            console.error('Solana Web3 library not loaded');
            return;
        }

        // Set up connection
        this.connection = new solanaWeb3.Connection(
            solanaWeb3.clusterApiUrl('devnet'),
            'confirmed'
        );

        // Check for existing wallet connection
        this.walletPublicKey = localStorage.getItem('walletPublicKey');
        
        const currentPage = window.location.pathname.split('/').pop();
        
        if (currentPage === 'dashboard.html') {
            if (this.walletPublicKey) {
                this.displayWalletInfo();
            } else {
                // Redirect to index if no wallet connected
                window.location.href = 'index.html';
            }
        }
    }

    formatAddress(addr) {
        if (!addr || addr.length < 8) return addr;
        return `${addr.substring(0, 5)}...${addr.substring(addr.length - 3)}`;
    }

    async connectWallet(event) {
        event.preventDefault();
        
        if (!window.solana) {
            alert('Please install Phantom wallet!');
            return false;
        }
        
        try {
            const wallet = window.solana;
            await wallet.connect();
            
            this.walletPublicKey = wallet.publicKey.toString();
            localStorage.setItem('walletPublicKey', this.walletPublicKey);
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
            return true;
        } catch (error) {
            console.error('Wallet connection error:', error);
            alert('Connection failed: ' + error.message);
            return false;
        }
    }

    async displayWalletInfo() {
        if (!this.walletPublicKey || !this.connection) return;

        const formattedAddress = this.formatAddress(this.walletPublicKey);
        
        // Update wallet button with formatted address
        if (this.walletButton) {
            this.walletButton.textContent = formattedAddress;
        }

        // Fetch and display balance
        try {
            const publicKey = new solanaWeb3.PublicKey(this.walletPublicKey);
            const balance = await this.connection.getBalance(publicKey);
            const balanceInSOL = balance / solanaWeb3.LAMPORTS_PER_SOL;
            
            if (this.solBalance) {
                this.solBalance.textContent = balanceInSOL.toFixed(4);
            }
        } catch (error) {
            console.error('Failed to load balance:', error);
            if (this.solBalance) {
                this.solBalance.textContent = '0.00';
            }
        }
    }

    attachEventListeners() {
        // Calculator listeners
        if (this.solInput) {
            this.solInput.addEventListener('input', () => this.calculateConversion());
        }

        if (this.maxButton) {
            this.maxButton.addEventListener('click', () => this.setMaxAmount());
        }

        // Wallet connect listeners (for index page)
        const currentPage = window.location.pathname.split('/').pop();
        
        if (currentPage === 'index.html' || currentPage === '') {
            // Find all links to dashboard.html and attach click handlers
            const connectLinks = document.querySelectorAll('a[href="dashboard.html"]');
            connectLinks.forEach(link => {
                link.addEventListener('click', (e) => this.connectWallet(e));
            });
        }
    }

    setMaxAmount() {
        if (this.solBalance) {
            const balanceText = this.solBalance.textContent.trim();
            const balance = parseFloat(balanceText);
            if (!isNaN(balance) && balance > 0) {
                this.solInput.value = balance.toFixed(4);
                this.calculateConversion();
            }
        }
    }

    async startPriceSync() {
        const checkPrices = setInterval(() => {
            const tslaElement = document.querySelector('[data-stat="tsla-price"]');
            const solElement = document.querySelector('[data-sol-price]');

            if (tslaElement && solElement) {
                const tslaPriceText = tslaElement.textContent.replace(/[$,]/g, '');
                const solPriceText = solElement.textContent.replace(/[$,]/g, '');

                this.tslaPrice = parseFloat(tslaPriceText);
                this.solPrice = parseFloat(solPriceText);

                if (this.tslaPrice > 0 && this.solPrice > 0) {
                    this.tslaDiscountedPrice = this.tslaPrice * 0.5;
                    this.updateRateDisplay();
                    this.calculateConversion();
                    clearInterval(checkPrices);
                    console.log('✅ Conversion calculator synced with live prices');
                }
            }
        }, 500);

        setTimeout(() => clearInterval(checkPrices), 30000);
    }

    calculateConversion() {
        const solAmount = parseFloat(this.solInput.value) || 0;

        if (this.validationMsg) {
            this.validationMsg.textContent = '';
            this.validationMsg.style.display = 'none';
        }

        if (solAmount <= 0) {
            this.updateOutputs(0, 0, 0);
            return;
        }

        const solValueInUSD = solAmount * this.solPrice;
        const tslaShares = solValueInUSD / this.tslaDiscountedPrice;

        if (tslaShares > 0 && tslaShares < this.minTSLA) {
            const minSolRequired = (this.minTSLA * this.tslaDiscountedPrice) / this.solPrice;
            if (this.validationMsg) {
                this.validationMsg.textContent = `Minimum purchase: ${this.minTSLA} TSLA (≈ ${minSolRequired.toFixed(4)} SOL required)`;
                this.validationMsg.style.display = 'block';
            }
        }

        const tslaUsdValue = tslaShares * this.tslaPrice;
        this.updateOutputs(tslaShares, solValueInUSD, tslaUsdValue);
    }

    updateOutputs(tslaShares, solUsd, tslaUsd) {
        if (this.tslaOutput) {
            this.tslaOutput.value = tslaShares > 0 ? tslaShares.toFixed(4) : '0.00';
        }

        if (this.solUsdValue) {
            this.solUsdValue.textContent = `≈ $${solUsd.toFixed(2)}`;
        }

        if (this.tslaUsdValue) {
            this.tslaUsdValue.textContent = `≈ $${tslaUsd.toFixed(2)}`;
        }
    }

    updateRateDisplay() {
        if (!this.rateDisplay || this.solPrice === 0 || this.tslaDiscountedPrice === 0) return;

        const rate = this.solPrice / this.tslaDiscountedPrice;
        this.rateDisplay.textContent = `1 SOL = ${rate.toFixed(4)} TSLA`;
    }
}

// Initialize application
function initApp() {
    if (typeof solanaWeb3 !== 'undefined') {
        window.calculator = new ConversionCalculator();
    } else {
        console.error('Solana Web3 library not loaded');
        const errorMsg = document.createElement('div');
        errorMsg.textContent = 'Error: Solana Web3 library failed to load';
        errorMsg.style.cssText = 'color: red; padding: 10px; text-align: center;';
        document.body.prepend(errorMsg);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}