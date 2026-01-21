// Real-time Price Updater for TSLA and SOL
// This script fetches live market data and updates price stats on both pages

class LivePriceUpdater {
    constructor() {
        this.updateInterval = 60000; // Update every 60 seconds
        this.init();
    }

    async fetchSOLPrice() {
        try {
            // Using CORS proxy to fetch SOL price from Yahoo Finance
            const symbol = 'SOL-USD';
            const corsProxy = 'https://corsproxy.io/?';
            const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
            const response = await fetch(corsProxy + encodeURIComponent(apiUrl));
            const data = await response.json();

            if (data && data.chart && data.chart.result && data.chart.result[0]) {
                const result = data.chart.result[0];
                const meta = result.meta;

                // Get current price
                const currentPrice = meta.regularMarketPrice || meta.previousClose;

                // Calculate change
                const previousClose = meta.chartPreviousClose || meta.previousClose;
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;

                return {
                    currentPrice: currentPrice.toFixed(2),
                    change: change.toFixed(2),
                    changePercent: changePercent.toFixed(2)
                };
            }
        } catch (error) {
            console.error('Error fetching SOL price:', error);
            return null;
        }
    }

    async fetchTSLAPrice() {
        try {
            // Using CORS proxy to bypass restrictions on file:// protocol
            const symbol = 'TSLA';
            const corsProxy = 'https://corsproxy.io/?';
            const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
            const response = await fetch(corsProxy + encodeURIComponent(apiUrl));
            const data = await response.json();

            if (data && data.chart && data.chart.result && data.chart.result[0]) {
                const result = data.chart.result[0];
                const meta = result.meta;
                const quote = result.indicators.quote[0];

                // Get current price
                const currentPrice = meta.regularMarketPrice || meta.previousClose;

                // Get 24h data from the latest candle
                const latestIndex = quote.close.length - 1;
                const high = quote.high[latestIndex];
                const low = quote.low[latestIndex];
                const close = quote.close[latestIndex];

                // Calculate change
                const previousClose = meta.chartPreviousClose || meta.previousClose;
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;

                return {
                    currentPrice: currentPrice.toFixed(2),
                    high: high.toFixed(2),
                    low: low.toFixed(2),
                    close: close.toFixed(2),
                    change: change.toFixed(2),
                    changePercent: changePercent.toFixed(2),
                    previousClose: previousClose.toFixed(2)
                };
            }
        } catch (error) {
            console.error('Error fetching TSLA price:', error);
            console.log('💡 Note: Live data requires internet connection. Using TradingView chart for real-time data.');
            return null;
        }
    }

    updateDashboard(priceData) {
        if (!priceData) return;

        // Update Top Stats - TSLA/USD Card (Dashboard)
        const tslaPrice = document.querySelector('[data-stat="tsla-price"]');
        const tslaChange = document.querySelector('[data-stat="tsla-change"]');
        if (tslaPrice) tslaPrice.textContent = `$${priceData.currentPrice}`;
        if (tslaChange) {
            const isPositive = parseFloat(priceData.changePercent) >= 0;
            tslaChange.textContent = `${isPositive ? '↑' : '↓'} ${Math.abs(priceData.changePercent)}%`;
            tslaChange.className = `small ${isPositive ? 'text-success' : 'text-danger'} mt-1 mb-0`;
        }

        // Update 24h High/Low (Dashboard)
        const highLowRange = document.querySelector('[data-stat="high-low"]');
        if (highLowRange) {
            highLowRange.textContent = `$${priceData.high} / $${priceData.low}`;
        }

        // Update Chart Footer Stats (Dashboard)
        const footerHigh = document.querySelector('[data-stat="footer-high"]');
        const footerClose = document.querySelector('[data-stat="footer-close"]');
        const footerLow = document.querySelector('[data-stat="footer-low"]');

        if (footerHigh) footerHigh.textContent = `$${priceData.high}`;
        if (footerClose) footerClose.textContent = `$${priceData.close}`;
        if (footerLow) footerLow.textContent = `$${priceData.low}`;

        // Update Your Rate (50% discount) (Dashboard)
        const yourRate = document.querySelector('[data-stat="your-rate"]');
        if (yourRate) {
            const discountedPrice = (parseFloat(priceData.currentPrice) * 0.5).toFixed(2);
            yourRate.textContent = `$${discountedPrice}`;
        }

        // Update Index Page prices (using data-tsla-price and data-tsla-discount)
        const indexPriceElements = document.querySelectorAll('[data-tsla-price]');
        indexPriceElements.forEach(el => {
            el.textContent = `~$${priceData.currentPrice}`;
        });

        const indexDiscountElements = document.querySelectorAll('[data-tsla-discount]');
        const discountedPrice = (parseFloat(priceData.currentPrice) * 0.5).toFixed(2);
        indexDiscountElements.forEach(el => {
            el.textContent = `~$${discountedPrice}`;
        });
    }

    updateSOLPrice(solData) {
        if (!solData) return;

        // Update SOL price on index page
        const solPrice = document.querySelector('[data-sol-price]');
        const solChange = document.querySelector('[data-sol-change]');

        if (solPrice) solPrice.textContent = `$${solData.currentPrice}`;
        if (solChange) {
            const isPositive = parseFloat(solData.changePercent) >= 0;
            solChange.textContent = `${isPositive ? '↑' : '↓'} ${Math.abs(solData.changePercent)}% (24h)`;
            solChange.className = `small ${isPositive ? 'text-success' : 'text-danger'} mt-2 mb-0`;
        }
    }

    async init() {
        // Initial update for both TSLA and SOL
        const tslaData = await this.fetchTSLAPrice();
        this.updateDashboard(tslaData);

        const solData = await this.fetchSOLPrice();
        this.updateSOLPrice(solData);

        // Set up periodic updates for both
        setInterval(async () => {
            const tslaData = await this.fetchTSLAPrice();
            this.updateDashboard(tslaData);

            const solData = await this.fetchSOLPrice();
            this.updateSOLPrice(solData);
        }, this.updateInterval);

        console.log('✅ Live Price Updater initialized - Updates TSLA & SOL every 60 seconds');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new LivePriceUpdater();
    });
} else {
    new LivePriceUpdater();
}
