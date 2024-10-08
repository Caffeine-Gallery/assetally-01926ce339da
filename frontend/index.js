import { backend } from 'declarations/backend';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

let authClient;
let userPrincipal;

// Helper function to convert timestamp to human-readable format
function timestampToString(timestamp) {
    return new Date(Number(timestamp) / 1000000).toLocaleString();
}

// Function to initialize authentication
async function initAuth() {
    authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        userPrincipal = await authClient.getIdentity().getPrincipal();
        handleAuthenticated();
    } else {
        showLoginPrompt();
    }
}

// Function to handle login
async function login() {
    await authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: handleAuthenticated,
    });
}

// Function to handle logout
async function logout() {
    await authClient.logout();
    userPrincipal = null;
    showLoginPrompt();
}

// Function to show login prompt
function showLoginPrompt() {
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginPrompt').style.display = 'block';
}

// Function to handle authenticated state
async function handleAuthenticated() {
    userPrincipal = await authClient.getIdentity().getPrincipal();
    document.getElementById('loginPrompt').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    refreshUI();
}

// Function to refresh the asset list
async function refreshAssets() {
    const assetList = document.getElementById('assetList');
    assetList.innerHTML = '';

    const assetsJson = await backend.getAssets();
    const assets = JSON.parse(assetsJson);

    const userReservationsJson = await backend.getUserReservations(userPrincipal);
    const userReservations = JSON.parse(userReservationsJson);

    assets.forEach(asset => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${asset.name} (ID: ${asset.id})</span>
            ${asset.reservationStatus ? 
                `<span class="reserved">Reserved by ${asset.reservationStatus.userId} until ${timestampToString(asset.reservationStatus.endTime)}</span>
                 ${asset.reservationStatus.userId === userPrincipal.toText() ? 
                    `<button class="extend-reservation" data-id="${asset.reservationStatus.id}">Extend Reservation</button>` : 
                    ''
                 }` :
                `<form class="reserve-form">
                    <input type="hidden" name="assetId" value="${asset.id}">
                    <select name="timePeriod" required>
                        <option value="OneHour">1 Hour</option>
                        <option value="EightHours">8 Hours</option>
                        <option value="OneDay">1 Day</option>
                    </select>
                    <button type="submit">Reserve</button>
                </form>`
            }
            <button class="remove-asset" data-id="${asset.id}">Remove</button>
        `;
        assetList.appendChild(li);
    });

    // Add event listeners for reserve forms
    document.querySelectorAll('.reserve-form').forEach(form => {
        form.addEventListener('submit', handleReserveAsset);
    });

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-asset').forEach(button => {
        button.addEventListener('click', handleRemoveAsset);
    });

    // Add event listeners for extend reservation buttons
    document.querySelectorAll('.extend-reservation').forEach(button => {
        button.addEventListener('click', handleExtendReservation);
    });
}

// Function to refresh the reservation list
async function refreshReservations() {
    const reservationList = document.getElementById('reservationList');
    reservationList.innerHTML = '';

    const reservationsJson = await backend.getUserReservations(userPrincipal);
    const reservations = JSON.parse(reservationsJson);

    reservations.forEach(reservation => {
        const li = document.createElement('li');
        li.textContent = `Asset ID: ${reservation.assetId}, Start: ${timestampToString(reservation.startTime)}, End: ${timestampToString(reservation.endTime)}, Period: ${reservation.period}`;
        reservationList.appendChild(li);
    });
}

// Function to refresh the entire UI
async function refreshUI() {
    await refreshAssets();
    await refreshReservations();
}

// Event listener for adding a new asset
document.getElementById('addAssetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newAssetName').value;
    await backend.addAsset(name);
    document.getElementById('newAssetName').value = '';
    refreshUI();
});

// Handler for reserving an asset
async function handleReserveAsset(e) {
    e.preventDefault();
    const form = e.target;
    const assetId = parseInt(form.elements.assetId.value);
    const timePeriod = form.elements.timePeriod.value;
    const result = await backend.reserveAsset(assetId, { [timePeriod]: null });
    if ('ok' in result) {
        alert('Reservation successful!');
        refreshUI();
    } else {
        alert(`Reservation failed: ${result.err}`);
    }
}

// Handler for removing an asset
async function handleRemoveAsset(e) {
    const assetId = parseInt(e.target.dataset.id);
    const result = await backend.removeAsset(assetId);
    if ('ok' in result) {
        alert('Asset removed successfully!');
        refreshUI();
    } else {
        alert(`Asset removal failed: ${result.err}`);
    }
}

// Handler for extending a reservation
async function handleExtendReservation(e) {
    const reservationId = parseInt(e.target.dataset.id);
    const result = await backend.extendReservation(reservationId);
    if ('ok' in result) {
        alert('Reservation extended successfully!');
        refreshUI();
    } else {
        alert(`Extension failed: ${result.err}`);
    }
}

// Event listeners for login and logout
document.getElementById('loginButton').addEventListener('click', login);
document.getElementById('logoutButton').addEventListener('click', logout);

// Initialize authentication and UI
initAuth();
