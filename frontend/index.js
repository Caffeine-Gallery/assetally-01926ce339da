import { backend } from 'declarations/backend';

// Helper function to convert timestamp to datetime-local format
function timestampToDatetimeLocal(timestamp) {
    return new Date(Number(timestamp) / 1000000).toISOString().slice(0, 16);
}

// Helper function to convert datetime-local to timestamp
function datetimeLocalToTimestamp(datetime) {
    return BigInt(new Date(datetime).getTime()) * BigInt(1000000);
}

// Function to refresh the asset list
async function refreshAssets() {
    const assetList = document.getElementById('assetList');
    const assetSelect = document.getElementById('assetSelect');
    assetList.innerHTML = '';
    assetSelect.innerHTML = '';

    const assetsJson = await backend.getAssets();
    const assets = JSON.parse(assetsJson);

    assets.forEach(asset => {
        const li = document.createElement('li');
        li.textContent = `${asset.name} (ID: ${asset.id})`;
        assetList.appendChild(li);

        const option = document.createElement('option');
        option.value = asset.id;
        option.textContent = asset.name;
        assetSelect.appendChild(option);
    });
}

// Function to refresh the reservation list
async function refreshReservations() {
    const reservationList = document.getElementById('reservationList');
    const reservationSelect = document.getElementById('reservationSelect');
    const cancelReservationSelect = document.getElementById('cancelReservationSelect');
    reservationList.innerHTML = '';
    reservationSelect.innerHTML = '';
    cancelReservationSelect.innerHTML = '';

    const reservationsJson = await backend.getReservations();
    const reservations = JSON.parse(reservationsJson);

    reservations.forEach(reservation => {
        const li = document.createElement('li');
        li.textContent = `Asset ID: ${reservation.assetId}, User: ${reservation.userId}, Start: ${new Date(Number(reservation.startTime) / 1000000).toLocaleString()}, End: ${new Date(Number(reservation.endTime) / 1000000).toLocaleString()}`;
        reservationList.appendChild(li);

        const option = document.createElement('option');
        option.value = reservation.id;
        option.textContent = `Asset ID: ${reservation.assetId}, Start: ${new Date(Number(reservation.startTime) / 1000000).toLocaleString()}`;
        reservationSelect.appendChild(option);
        cancelReservationSelect.appendChild(option.cloneNode(true));
    });
}

// Event listener for adding a new asset
document.getElementById('addAssetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newAssetName').value;
    await backend.addAsset(name);
    document.getElementById('newAssetName').value = '';
    refreshAssets();
});

// Event listener for reserving an asset
document.getElementById('reserveAssetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const assetId = parseInt(document.getElementById('assetSelect').value);
    const startTime = datetimeLocalToTimestamp(document.getElementById('startTime').value);
    const endTime = datetimeLocalToTimestamp(document.getElementById('endTime').value);
    const result = await backend.reserveAsset(assetId, startTime, endTime);
    if ('ok' in result) {
        alert('Reservation successful!');
        refreshReservations();
    } else {
        alert(`Reservation failed: ${result.err}`);
    }
});

// Event listener for extending a reservation
document.getElementById('extendReservationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const reservationId = parseInt(document.getElementById('reservationSelect').value);
    const newEndTime = datetimeLocalToTimestamp(document.getElementById('newEndTime').value);
    const result = await backend.extendReservation(reservationId, newEndTime);
    if ('ok' in result) {
        alert('Reservation extended successfully!');
        refreshReservations();
    } else {
        alert(`Extension failed: ${result.err}`);
    }
});

// Event listener for canceling a reservation
document.getElementById('cancelReservationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const reservationId = parseInt(document.getElementById('cancelReservationSelect').value);
    const result = await backend.cancelReservation(reservationId);
    if ('ok' in result) {
        alert('Reservation canceled successfully!');
        refreshReservations();
    } else {
        alert(`Cancellation failed: ${result.err}`);
    }
});

// Initial refresh of assets and reservations
refreshAssets();
refreshReservations();
