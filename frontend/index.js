import { backend } from 'declarations/backend';

// Helper function to convert timestamp to human-readable format
function timestampToString(timestamp) {
    return new Date(Number(timestamp) / 1000000).toLocaleString();
}

// Function to refresh the asset list
async function refreshAssets() {
    const assetList = document.getElementById('assetList');
    assetList.innerHTML = '';

    const assetsJson = await backend.getAssets();
    const assets = JSON.parse(assetsJson);

    assets.forEach(asset => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${asset.name} (ID: ${asset.id})</span>
            ${asset.reservationStatus ? 
                `<span class="reserved">Reserved by ${asset.reservationStatus.userId} until ${timestampToString(asset.reservationStatus.endTime)}</span>` :
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
}

// Function to refresh the reservation list
async function refreshReservations() {
    const reservationList = document.getElementById('reservationList');
    reservationList.innerHTML = '';

    const reservationsJson = await backend.getReservations();
    const reservations = JSON.parse(reservationsJson);

    reservations.forEach(reservation => {
        const li = document.createElement('li');
        li.textContent = `Asset ID: ${reservation.assetId}, User: ${reservation.userId}, Start: ${timestampToString(reservation.startTime)}, End: ${timestampToString(reservation.endTime)}, Period: ${reservation.period}`;
        reservationList.appendChild(li);
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

// Handler for reserving an asset
async function handleReserveAsset(e) {
    e.preventDefault();
    const form = e.target;
    const assetId = parseInt(form.elements.assetId.value);
    const timePeriod = form.elements.timePeriod.value;
    const result = await backend.reserveAsset(assetId, { [timePeriod]: null });
    if ('ok' in result) {
        alert('Reservation successful!');
        refreshAssets();
        refreshReservations();
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
        refreshAssets();
    } else {
        alert(`Asset removal failed: ${result.err}`);
    }
}

// Initial refresh of assets and reservations
refreshAssets();
refreshReservations();
