// Check which page we're on
const currentPage = window.location.pathname.split('/').pop();

// Initialize Solana connection
const connection = new solanaWeb3.Connection(
    solanaWeb3.clusterApiUrl('devnet'),
    'confirmed'
);

// Helper to format address as "first5...last3"
function formatAddress(addr) {
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 3)}`;
}

// INDEX PAGE - Handle connect button
if (currentPage === 'index.html' || currentPage === '') {
    document.addEventListener('DOMContentLoaded', () => {
        const connectButton = document.getElementById('connectButton');
        const statusDiv = document.getElementById('status');
        
        connectButton.addEventListener('click', async () => {
            try {
                statusDiv.textContent = 'Connecting...';
                
                if (!window.solana) {
                    statusDiv.textContent = 'Please install Phantom wallet!';
                    return;
                }
                
                const wallet = window.solana;
                await wallet.connect();
                
                localStorage.setItem('walletPublicKey', wallet.publicKey.toString());
                window.location.href = 'dashboard.html';
                
            } catch (error) {
                statusDiv.textContent = 'Connection failed: ' + error.message;
            }
        });
    });
}

// WALLET PAGE - Display balance
if (currentPage === 'dashboard.html') {
    document.addEventListener('DOMContentLoaded', () => {
        const walletDisplay = document.getElementById('walletDisplay');
        const balanceDisplay = document.getElementById('balanceDisplay');
        const publicKeyString = localStorage.getItem('walletPublicKey');
        
        if (!publicKeyString) {
            walletDisplay.innerHTML = '<p>No wallet connected. <a href="index.html">Connect wallet</a></p>';
            balanceDisplay.style.display = 'none';
            return;
        }
        
        // Display formatted wallet address
        const formattedAddress = formatAddress(publicKeyString);
        walletDisplay.innerHTML = `<p>Wallet: ${formattedAddress}</p>`;
        
        // Display and fetch balance
        balanceDisplay.innerHTML = `<p>Balance: <span id="balance">Loading...</span></p>`;
        
        const publicKey = new solanaWeb3.PublicKey(publicKeyString);
        connection.getBalance(publicKey).then(balance => {
            const balanceInSOL = balance / solanaWeb3.LAMPORTS_PER_SOL;
            document.getElementById('balance').textContent = balanceInSOL.toFixed(4);
        }).catch(error => {
            document.getElementById('balance').textContent = 'Error loading balance';
            console.error(error);
        });
    });
}