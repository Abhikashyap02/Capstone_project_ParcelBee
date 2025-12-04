document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (typeof window !== 'undefined' && window.API && window.API.checkAuthAndRedirect) {
        if (!window.API.checkAuthAndRedirect(true)) {
            return; // Redirected to login, stop execution
        }
    } else {
        // Fallback: Check token manually
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Mobile menu functionality
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            const icon = mobileMenuButton.querySelector('svg');
            if (mobileMenu.classList.contains('hidden')) {
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(90deg)';
            }
        });

        document.addEventListener('click', function(event) {
            if (!mobileMenuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.add('hidden');
                mobileMenuButton.querySelector('svg').style.transform = 'rotate(0deg)';
            }
        });
    }

    // DOM elements
    const availableRequestsList = document.getElementById('availableRequestsList');
    const activeDeliveriesList = document.getElementById('activeDeliveriesList');
    const pastDeliveriesList = document.getElementById('pastDeliveriesList');
    const availableEmptyState = document.getElementById('availableEmptyState');
    const activeEmptyState = document.getElementById('activeEmptyState');
    const pastEmptyState = document.getElementById('pastEmptyState');
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');

    // API Base URL
    const apiBaseUrl = (typeof window !== 'undefined' && window.API) 
        ? window.API.BASE_URL 
        : 'http://127.0.0.1:8000/api';

    // Function to get auth headers
    function getAuthHeaders() {
        if (typeof window !== 'undefined' && window.API && window.API.getAuthHeaders) {
            return window.API.getAuthHeaders();
        }
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    // Show success
    function showSuccessMessage(message) {
        if (successText) successText.textContent = message;
        if (successMessage) {
            successMessage.classList.remove('hidden');
            setTimeout(() => successMessage.classList.add('hidden'), 3500);
        }
    }

    // Handle API errors and 401 redirect
    async function handleApiError(response) {
        if (response.status === 401) {
            if (typeof window !== 'undefined' && window.API && window.API.clearToken) {
                window.API.clearToken();
            } else {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
            }
            alert('Your session has expired. Please login again.');
            window.location.href = 'login.html';
            return true;
        }
        return false;
    }

    // Load available + my deliveries (we will split my deliveries into active/past)
    async function loadAllPartnerLists() {
        await loadAvailableRequests();
        await loadMyDeliveriesAndSplit();
    }

    // Load available requests
    async function loadAvailableRequests() {
        try {
            if (availableRequestsList) {
                availableRequestsList.innerHTML = '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div></div>';
            }

            const resp = await fetch(`${apiBaseUrl}/delivery/list/?status=available`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (await handleApiError(resp)) return;

            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Failed to load available requests');

            renderAvailableRequests(data.deliveries || []);
        } catch (err) {
            console.error('Error loading available requests:', err);
            if (availableRequestsList) {
                availableRequestsList.innerHTML = `<div class="text-center py-4"><p class="text-red-500 text-sm">Failed to load requests</p></div>`;
            }
        }
    }

    // Load "my" deliveries and split into active & past
    async function loadMyDeliveriesAndSplit() {
        try {
            if (activeDeliveriesList) activeDeliveriesList.innerHTML = '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>';
            if (pastDeliveriesList) pastDeliveriesList.innerHTML = '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div></div>';

            const resp = await fetch(`${apiBaseUrl}/delivery/list/?status=my`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (await handleApiError(resp)) return;

            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Failed to load my deliveries');

            const all = data.deliveries || [];
            // active = not delivered or cancelled
            const active = all.filter(d => d.status !== 'delivered' && d.status !== 'cancelled');
            // past = delivered OR cancelled
            const past = all.filter(d => d.status === 'delivered' || d.status === 'cancelled');

            renderActiveDeliveries(active);
            renderPastDeliveries(past);
        } catch (err) {
            console.error('Error loading my deliveries:', err);
            if (activeDeliveriesList) activeDeliveriesList.innerHTML = `<div class="text-center py-4"><p class="text-red-500 text-sm">Failed to load deliveries</p></div>`;
            if (pastDeliveriesList) pastDeliveriesList.innerHTML = `<div class="text-center py-4"><p class="text-red-500 text-sm">Failed to load past deliveries</p></div>`;
        }
    }

    // Render available requests
    function renderAvailableRequests(list) {
        const container = availableRequestsList;
        const emptyState = availableEmptyState;

        if (!container) return;
        if (!list || list.length === 0) {
            container.innerHTML = "";
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = list.map(del => `
            <div class="delivery-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-3">
                    <span class="text-sm font-mono text-gray-500">#${del.id}</span>
                    <span class="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>
                </div>
                <p class="text-sm text-gray-700"><b>Pickup:</b> ${escapeHtml(del.pickup_address || 'N/A')}</p>
                <p class="text-sm text-gray-700"><b>Drop:</b> ${escapeHtml(del.drop_address || 'N/A')}</p>
                <p class="text-sm text-gray-700"><b>Weight:</b> ${del.weight != null ? del.weight + ' kg' : 'N/A'}</p>
                <button onclick="acceptDelivery(${del.id})" class="mt-3 w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600">
                    Accept Delivery
                </button>
            </div>
        `).join('');
    }

    // Render active deliveries (non-delivered)
    function renderActiveDeliveries(list) {
        const container = activeDeliveriesList;
        const emptyState = activeEmptyState;

        if (!container) return;
        if (!list || list.length === 0) {
            container.innerHTML = "";
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = list.map(del => {
            const statusLabel = (del.status || 'pending').replace('_', ' ');
            // show action buttons for partner (in_transit / delivered)
            const actions = `
                <div class="mt-3 flex space-x-3">
                    ${del.status === 'accepted' || del.status === 'in_transit' ? `<button onclick="markAsDelivered(${del.id})" class="px-3 py-2 bg-green-500 text-white rounded">Mark Delivered</button>` : ''}
                    ${del.status === 'accepted' ? `<button onclick="markInTransit(${del.id})" class="px-3 py-2 bg-purple-500 text-white rounded">Start Transit</button>` : ''}
                </div>
            `;
            return `
                <div class="delivery-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-sm font-mono text-gray-500">#${del.id}</span>
                        <span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">${escapeHtml(statusLabel)}</span>
                    </div>
                    <p class="text-sm text-gray-700"><b>Pickup:</b> ${escapeHtml(del.pickup_address || 'N/A')}</p>
                    <p class="text-sm text-gray-700"><b>Drop:</b> ${escapeHtml(del.drop_address || 'N/A')}</p>
                    ${actions}
                </div>
            `;
        }).join('');
    }

    // Render past deliveries
    function renderPastDeliveries(list) {
        const container = pastDeliveriesList;
        const emptyState = pastEmptyState;

        if (!container) return;
        if (!list || list.length === 0) {
            container.innerHTML = "";
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = list.map(del => `
            <div class="delivery-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-3">
                    <span class="text-sm font-mono text-gray-500">#${del.id}</span>
                    <span class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">${escapeHtml((del.status || '').replace('_',' '))}</span>
                </div>
                <p class="text-sm text-gray-700"><b>Pickup:</b> ${escapeHtml(del.pickup_address || 'N/A')}</p>
                <p class="text-sm text-gray-700"><b>Drop:</b> ${escapeHtml(del.drop_address || 'N/A')}</p>
                <div class="text-xs text-gray-400 mt-2">Completed: ${del.delivered_at ? new Date(del.delivered_at).toLocaleString() : (del.updated_at ? new Date(del.updated_at).toLocaleString() : '')}</div>
            </div>
        `).join('');
    }

    // Accept delivery (partner)
    async function _acceptDeliveryInternal(deliveryId) {
        try {
            const resp = await fetch(`${apiBaseUrl}/delivery/${deliveryId}/accept/`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (await handleApiError(resp)) return;

            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Failed to accept delivery');

            showSuccessMessage('Delivery accepted successfully.');
            await loadAllPartnerLists();
        } catch (err) {
            console.error('Error accepting delivery:', err);
            alert(err.message || 'Failed to accept delivery');
        }
    }

    // Expose both names so onclick from HTML always works
    window.acceptDelivery = function(id) { _acceptDeliveryInternal(id); };
    window.acceptRequest = function(id) { _acceptDeliveryInternal(id); };

    // Mark in transit
    window.markInTransit = async function(deliveryId) {
        try {
            const resp = await fetch(`${apiBaseUrl}/delivery/${deliveryId}/update-status/`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: 'in_transit' })
            });

            if (await handleApiError(resp)) return;

            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Failed to update status');

            showSuccessMessage('Delivery marked in transit.');
            await loadMyDeliveriesAndSplit();
        } catch (err) {
            console.error('Error updating to in_transit:', err);
            alert(err.message || 'Failed to update status');
        }
    };

    // Mark as delivered
    window.markAsDelivered = async function(deliveryId) {
        try {
            const resp = await fetch(`${apiBaseUrl}/delivery/${deliveryId}/update-status/`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: 'delivered' })
            });

            if (await handleApiError(resp)) return;

            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Failed to update status');

            showSuccessMessage('Delivery marked delivered.');
            // After marking delivered, reload lists so it moves to past
            await loadMyDeliveriesAndSplit();
        } catch (err) {
            console.error('Error marking delivered:', err);
            alert(err.message || 'Failed to update status');
        }
    };

    // Simple HTML escape to avoid injection
    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initialize lists
    loadAllPartnerLists();

    // Periodic refresh
    setInterval(() => {
        loadAllPartnerLists();
    }, 30000);
});
