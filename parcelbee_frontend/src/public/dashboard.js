document.addEventListener("DOMContentLoaded", function () {
  // Check authentication first
  if (
    typeof window !== "undefined" &&
    window.API &&
    window.API.checkAuthAndRedirect
  ) {
    if (!window.API.checkAuthAndRedirect(true)) {
      return; // Redirected to login, stop execution
    }
  } else {
    // Fallback: Check token manually
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }
  }

  // Mobile menu functionality
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", function () {
      mobileMenu.classList.toggle("hidden");

      // Animate hamburger icon
      const icon = mobileMenuButton.querySelector("svg");
      if (mobileMenu.classList.contains("hidden")) {
        icon.style.transform = "rotate(0deg)";
      } else {
        icon.style.transform = "rotate(90deg)";
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", function (event) {
      if (
        !mobileMenuButton.contains(event.target) &&
        !mobileMenu.contains(event.target)
      ) {
        mobileMenu.classList.add("hidden");
        mobileMenuButton.querySelector("svg").style.transform = "rotate(0deg)";
      }
    });
  }

  // Form elements
  const deliveryForm = document.getElementById("deliveryForm");
  const successMessage = document.getElementById("successMessage");
  const deliveriesList = document.getElementById("deliveriesList");
  const emptyState = document.getElementById("emptyState");

  // API Base URL
  const apiBaseUrl =
    typeof window !== "undefined" && window.API
      ? window.API.BASE_URL
      : "http://127.0.0.1:8000/api";

  // Status badge colors - mapping backend status to frontend display
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    in_transit: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  // Status display names
  const statusDisplayNames = {
    pending: "Pending",
    accepted: "Accepted",
    in_transit: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  // Function to get auth headers
  function getAuthHeaders() {
    if (
      typeof window !== "undefined" &&
      window.API &&
      window.API.getAuthHeaders
    ) {
      return window.API.getAuthHeaders();
    }
    // Fallback
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  // Function to load deliveries from API
  async function loadDeliveries() {
    try {
      // Show loading state
      if (deliveriesList) {
        deliveriesList.innerHTML =
          '<div class="text-center py-8"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div><p class="mt-2 text-gray-600">Loading deliveries...</p></div>';
      }

      const response = await fetch(`${apiBaseUrl}/delivery/list/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        // Unauthorized - token expired
        if (
          typeof window !== "undefined" &&
          window.API &&
          window.API.clearToken
        ) {
          window.API.clearToken();
        } else {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
        }
        alert("Your session has expired. Please login again.");
        window.location.href = "login.html";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load deliveries");
      }

      // Update deliveries list
      renderDeliveries(data.deliveries || []);
    } catch (error) {
      console.error("Error loading deliveries:", error);

      // Show error message
      if (deliveriesList) {
        deliveriesList.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-red-500 mb-2">⚠️</div>
                        <p class="text-gray-600 mb-4">Failed to load deliveries</p>
                        <button onclick="location.reload()" class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">
                            Retry
                        </button>
                    </div>
                `;
      }

      // Show error alert
      if (error.message) {
        alert(`Error: ${error.message}`);
      } else {
        alert("Failed to load deliveries. Please try again.");
      }
    }
  }

  // Function to render deliveries
  // Render deliveries into Active and Past lists
  function renderDeliveries(deliveries) {
    // containers
    const activeList = document.getElementById("activeDeliveriesList");
    const pastList = document.getElementById("pastDeliveriesList");
    const activeEmpty = document.getElementById("activeEmptyState");
    const pastEmpty = document.getElementById("pastEmptyState");

    if (!activeList || !pastList) return;

    // classify: active = pending / accepted / in_transit ; past = delivered / cancelled
    const activeStatuses = ["pending", "accepted", "in_transit"];
    const pastStatuses = ["delivered", "cancelled"];

    const active = deliveries.filter((d) => activeStatuses.includes(d.status));
    const past = deliveries.filter((d) => pastStatuses.includes(d.status));

    // Render Active
    if (active.length === 0) {
      activeList.innerHTML = "";
      if (activeEmpty) activeEmpty.classList.remove("hidden");
    } else {
      if (activeEmpty) activeEmpty.classList.add("hidden");
      activeList.innerHTML = active
        .map((delivery) => {
          const status = delivery.status || "pending";
          const statusDisplay = statusDisplayNames[status] || status;
          const weight = delivery.weight ? `${delivery.weight} kg` : "N/A";
          const deliveryId = `REQ${String(delivery.id).padStart(3, "0")}`;
          const priceText = delivery.estimated_price
            ? `₹${delivery.estimated_price}`
            : "N/A";

          return `
            <div class="delivery-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center">
                        <span class="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">${deliveryId}</span>
                        <span class="status-badge ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[status] ||
                          "bg-yellow-100 text-yellow-800"
                        }">
                            ${statusDisplay}
                        </span>
                    </div>
                    <div class="text-sm font-semibold text-green-600">${priceText}</div>
                </div>

                <div class="space-y-2 mb-3">
                    <div class="flex items-start">
                        <div class="text-green-500 mr-2 mt-1">📍</div>
                        <div>
                            <div class="text-xs text-gray-500 uppercase tracking-wide">Pickup</div>
                            <div class="text-sm text-gray-800">${
                              delivery.pickup_address || "N/A"
                            }</div>
                        </div>
                    </div>

                    <div class="flex items-start">
                        <div class="text-red-500 mr-2 mt-1">📍</div>
                        <div>
                            <div class="text-xs text-gray-500 uppercase tracking-wide">Drop</div>
                            <div class="text-sm text-gray-800">${
                              delivery.drop_address || "N/A"
                            }</div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center text-sm">
                    <div class="text-gray-600">
                        <span class="font-medium">Item:</span> ${
                          delivery.description || "N/A"
                        }
                    </div>
                    ${
                      delivery.partner_name
                        ? `<div class="text-gray-600"><span class="font-medium">Partner:</span> ${delivery.partner_name}</div>`
                        : '<div class="text-gray-400 italic">Awaiting partner</div>'
                    }
                </div>

                ${
                  delivery.created_at
                    ? `<div class="text-xs text-gray-400 mt-2">Created: ${new Date(
                        delivery.created_at
                      ).toLocaleString()}</div>`
                    : ""
                }
                
                <!-- Action buttons for partners (only show when status is accepted/in_transit to progress flow) -->
                <div class="mt-3">
                    ${
                      status === "accepted"
                        ? `<button data-id="${delivery.id}" class="mark-picked btn inline-block bg-blue-500 text-white px-3 py-1 rounded">Mark Picked</button>`
                        : ""
                    }
                    ${
                      status === "in_transit"
                        ? `<button data-id="${delivery.id}" class="mark-delivered btn inline-block bg-green-500 text-white px-3 py-1 rounded">Mark Delivered</button>`
                        : ""
                    }
                </div>
            </div>
            `;
        })
        .join("");
    }

    // Render Past
    if (past.length === 0) {
      pastList.innerHTML = "";
      if (pastEmpty) pastEmpty.classList.remove("hidden");
    } else {
      if (pastEmpty) pastEmpty.classList.add("hidden");
      pastList.innerHTML = past
        .map((delivery) => {
          const status = delivery.status || "delivered";
          const deliveryId = `REQ${String(delivery.id).padStart(3, "0")}`;
          const priceText = delivery.estimated_price
            ? `₹${delivery.estimated_price}`
            : "N/A";
          const dateText = delivery.updated_at
            ? new Date(delivery.updated_at).toLocaleString()
            : delivery.created_at
            ? new Date(delivery.created_at).toLocaleString()
            : "";
          return `
            <div class="delivery-card border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-gray-50">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center">
                        <span class="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">${deliveryId}</span>
                        <span class="status-badge ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[status] || "bg-green-100 text-green-800"
                        }">
                            ${statusDisplayNames[status] || status}
                        </span>
                    </div>
                    <div class="text-sm font-semibold text-gray-700">${priceText}</div>
                </div>

                <div class="flex items-start">
                    <div class="text-green-500 mr-2 mt-1">📍</div>
                    <div>
                        <div class="text-xs text-gray-500 uppercase tracking-wide">Pickup</div>
                        <div class="text-sm text-gray-800">${
                          delivery.pickup_address || "N/A"
                        }</div>
                    </div>
                </div>

                <div class="flex items-start mt-2">
                    <div class="text-red-500 mr-2 mt-1">📍</div>
                    <div>
                        <div class="text-xs text-gray-500 uppercase tracking-wide">Drop</div>
                        <div class="text-sm text-gray-800">${
                          delivery.drop_address || "N/A"
                        }</div>
                    </div>
                </div>

                <div class="text-xs text-gray-400 mt-2">Completed: ${dateText}</div>
            </div>
            `;
        })
        .join("");
    }

    async function updateDeliveryStatus(id, newStatus) {
      try {
        const res = await fetch(`${apiBaseUrl}/delivery/${id}/update-status/`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || err.detail || "Failed to update status");
          return;
        }
        // reload deliveries to reflect move to past/active
        await loadDeliveries();
      } catch (e) {
        console.error("Update status failed", e);
        alert("Failed to update status");
      }
    }

    // Attach click handlers for the action buttons (delegation)
    // Use event delegation on parent container
    if (activeList) {
      activeList.querySelectorAll(".mark-picked").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const id = this.dataset.id;
          await updateDeliveryStatus(id, "in_transit");
        });
      });
      activeList.querySelectorAll(".mark-delivered").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const id = this.dataset.id;
          await updateDeliveryStatus(id, "delivered");
        });
      });
    }
  }

  // Form submission handler
  // Submit handler for delivery form (safe + builds payload from UI + posts to backend)
  deliveryForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Get form values
    const formData = new FormData(deliveryForm);
    const pickupAddress =
      formData.get("pickupAddress") ||
      document.getElementById("pickupAddress").value;
    const dropAddress =
      formData.get("dropAddress") ||
      document.getElementById("dropAddress").value;
    const parcelDescription =
      formData.get("parcelDescription") ||
      document.getElementById("parcelDescription").value;
    const weightRaw =
      formData.get("weight") || document.getElementById("weight").value;

    // Basic validation
    if (!pickupAddress || !dropAddress || !parcelDescription || !weightRaw) {
      alert("Please fill in all fields");
      return;
    }

    const weightNum = parseFloat(weightRaw);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert("Please enter a valid weight (greater than 0)");
      return;
    }

    // Find a submit button safely (fallback to price-card request button)
    let submitButton = deliveryForm.querySelector('button[type="submit"]');
    if (!submitButton)
      submitButton = document.getElementById("requestFromPriceBtn");
    let originalText = submitButton
      ? submitButton.textContent || ""
      : "Processing";

    if (submitButton) {
      submitButton.textContent = "Processing...";
      submitButton.disabled = true;
      submitButton.classList.add("opacity-75");
    }

    try {
      // Read hidden lat/lng if present (may be empty if not calculated)
      const pickupLat =
        parseFloat(document.getElementById("pickupLat").value) || null;
      const pickupLng =
        parseFloat(document.getElementById("pickupLng").value) || null;
      const dropLat =
        parseFloat(document.getElementById("dropLat").value) || null;
      const dropLng =
        parseFloat(document.getElementById("dropLng").value) || null;

      // Read price summary values from DOM as fallback (they were rendered by calculate step)
      const getNumberFrom = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const txt = el.textContent || el.innerText || "";
        // remove currency symbols and commas
        const n = txt.replace(/[^\d.\-]/g, "");
        const v = parseFloat(n);
        return isNaN(v) ? null : v;
      };

      const distance_km = getNumberFrom("price_distance") || null;
      const base_fee = getNumberFrom("price_base") || null;
      const distance_fee = getNumberFrom("price_distance_fee") || null;
      const weight_fee = getNumberFrom("price_weight_fee") || null;
      // price_total may be wrapped in <strong>, so use innerText
      const totalEl = document.getElementById("price_total");
      let estimated_price = null;
      if (totalEl) {
        const txt = totalEl.textContent || totalEl.innerText || "";
        const v = txt.replace(/[^\d.\-]/g, "");
        estimated_price = v ? Math.round(parseFloat(v)) : null;
      }

      // Build price_breakdown object (only include numbers if available)
      const price_breakdown = {};
      if (base_fee !== null) price_breakdown.base_fee = base_fee;
      if (distance_fee !== null) price_breakdown.distance_fee = distance_fee;
      if (weight_fee !== null) price_breakdown.weight_fee = weight_fee;
      if (distance_km !== null) price_breakdown.distance_km = distance_km;

      // Fallback: if estimated_price null, compute simple estimate on client-side as last resort
      if (estimated_price === null) {
        const BASE_FEE = 30;
        const PER_KM = 10;
        const PER_KG = 5;
        const dist = distance_km || 0;
        estimated_price = Math.round(
          BASE_FEE + dist * PER_KM + weightNum * PER_KG
        );
      }

      // Payload to backend (include lat/lng if available and price breakdown)
      // const payload = {
      //     pickup_address: pickupAddress,
      //     drop_address: dropAddress,
      //     description: parcelDescription,
      //     weight: weightNum,
      //     pickup_lat: pickupLat,
      //     pickup_lng: pickupLng,
      //     drop_lat: dropLat,
      //     drop_lng: dropLng,
      //     distance_km: distance_km,
      //     price_breakdown: Object.keys(price_breakdown).length ? price_breakdown : null,
      //     estimated_price: estimated_price
      // };
      const payload = {
        pickup_address: pickupAddress,
        drop_address: dropAddress,
        description: parcelDescription,
        weight: weightNum,
        // optional fields if you calculated price earlier:
        estimated_price: window.latestEstimate?.estimated_price ?? null,
        distance_km: window.latestEstimate?.distance_km ?? null,
        price_breakdown: window.latestEstimate?.breakdown ?? null,
      };

      // Send to backend
      const response = await fetch(`${apiBaseUrl}/delivery/create/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        // Unauthorized - token expired
        if (
          typeof window !== "undefined" &&
          window.API &&
          window.API.clearToken
        ) {
          window.API.clearToken();
        } else {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
        }
        alert("Your session has expired. Please login again.");
        window.location.href = "login.html";
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Failed to create delivery"
        );
      }

      // Show success message
      if (successMessage) {
        successMessage.classList.remove("hidden");
        setTimeout(() => {
          successMessage.classList.add("hidden");
        }, 5000);
      }

      // Reset form (keep hidden lat/lng cleared)
      deliveryForm.reset();
      document.getElementById("pickupLat").value = "";
      document.getElementById("pickupLng").value = "";
      document.getElementById("dropLat").value = "";
      document.getElementById("dropLng").value = "";

      // Reload deliveries to show the new one
      await loadDeliveries();

      // Scroll to deliveries section on mobile
      if (window.innerWidth < 1024 && deliveriesList) {
        deliveriesList.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch (error) {
      console.error("Error creating delivery:", error);

      // Show error message
      if (error.message) {
        alert(`Error: ${error.message}`);
      } else {
        alert("Failed to create delivery. Please try again.");
      }
    } finally {
      // Reset button (safe)
      if (submitButton) {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove("opacity-75");
      }
    }
  });

  // deliveryForm.addEventListener('submit', async function(e) {
  //     e.preventDefault();

  //     // Get form data
  //     const formData = new FormData(deliveryForm);
  //     const pickupAddress = formData.get('pickupAddress');
  //     const dropAddress = formData.get('dropAddress');
  //     const parcelDescription = formData.get('parcelDescription');
  //     const weight = formData.get('weight');

  //     // Basic validation
  //     if (!pickupAddress || !dropAddress || !parcelDescription || !weight) {
  //         alert('Please fill in all fields');
  //         return;
  //     }

  //     // Validate weight is a number
  //     const weightNum = parseFloat(weight);
  //     if (isNaN(weightNum) || weightNum <= 0) {
  //         alert('Please enter a valid weight (greater than 0)');
  //         return;
  //     }

  //     // Add loading state to button
  //     const submitButton = deliveryForm.querySelector('button[type="submit"]');
  //     const originalText = submitButton.textContent;
  //     submitButton.textContent = 'Processing...';
  //     submitButton.disabled = true;
  //     submitButton.classList.add('opacity-75');

  //     try {
  //         const response = await fetch(`${apiBaseUrl}/delivery/create/`, {
  //             method: 'POST',
  //             headers: getAuthHeaders(),
  //             body: JSON.stringify({
  //                 pickup_address: pickupAddress,
  //                 drop_address: dropAddress,
  //                 description: parcelDescription,
  //                 weight: weightNum
  //             })
  //         });

  //         if (response.status === 401) {
  //             // Unauthorized - token expired
  //             if (typeof window !== 'undefined' && window.API && window.API.clearToken) {
  //                 window.API.clearToken();
  //             } else {
  //                 localStorage.removeItem('token');
  //                 sessionStorage.removeItem('token');
  //             }
  //             alert('Your session has expired. Please login again.');
  //             window.location.href = 'login.html';
  //             return;
  //         }

  //         const data = await response.json();

  //         if (!response.ok) {
  //             throw new Error(data.error || 'Failed to create delivery');
  //         }

  //         // Show success message
  //         if (successMessage) {
  //             successMessage.classList.remove('hidden');
  //             setTimeout(() => {
  //                 successMessage.classList.add('hidden');
  //             }, 5000);
  //         }

  //         // Reset form
  //         deliveryForm.reset();

  //         // Reload deliveries to show the new one
  //         await loadDeliveries();

  //         // Scroll to deliveries section on mobile
  //         if (window.innerWidth < 1024 && deliveriesList) {
  //             deliveriesList.scrollIntoView({
  //                 behavior: 'smooth',
  //                 block: 'start'
  //             });
  //         }

  //     } catch (error) {
  //         console.error('Error creating delivery:', error);

  //         // Show error message
  //         if (error.message) {
  //             alert(`Error: ${error.message}`);
  //         } else {
  //             alert('Failed to create delivery. Please try again.');
  //         }
  //     } finally {
  //         // Reset button
  //         submitButton.textContent = originalText;
  //         submitButton.disabled = false;
  //         submitButton.classList.remove('opacity-75');
  //     }
  // });

  // Add smooth focus animations to form inputs
  const inputs = document.querySelectorAll("input, textarea");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.classList.add("transform", "scale-105");
    });

    input.addEventListener("blur", function () {
      this.parentElement.classList.remove("transform", "scale-105");
    });
  });

  // Add click animation to submit button
  const submitButton = deliveryForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.addEventListener("mousedown", function () {
      this.style.transform = "scale(0.98)";
    });

    submitButton.addEventListener("mouseup", function () {
      this.style.transform = "scale(1)";
    });

    submitButton.addEventListener("mouseleave", function () {
      this.style.transform = "scale(1)";
    });
  }

  // Initialize the dashboard - load deliveries
  loadDeliveries();

  // Set up periodic refresh (every 30 seconds)
  setInterval(() => {
    loadDeliveries();
  }, 30000);

  // Add welcome animation
  setTimeout(() => {
    const welcomeHeader = document.querySelector(
      "main > div > div:first-child"
    );
    if (welcomeHeader) {
      welcomeHeader.style.animation = "fadeInUp 0.6s ease-out";
    }
  }, 100);
});

// --- Price calculation & Maps helpers (added) ---
(function () {
  // Pricing params
  const BASE_FEE = 30;
  const PER_KM = 10;
  const PER_KG = 5;
  const RANGE_PERCENT = 0.1; // show ±10% range

  // Elements (createPrice UI ids expected in HTML)
  const calculateBtn = document.getElementById("calculatePriceBtn");
  const requestFromPriceBtn = document.getElementById("requestFromPriceBtn");
  const priceDistance = document.getElementById("price_distance");
  const priceBase = document.getElementById("price_base");
  const priceDistanceFee = document.getElementById("price_distance_fee");
  const priceWeightFee = document.getElementById("price_weight_fee");
  const priceTotal = document.getElementById("price_total");

  // Hidden inputs for lat/lng
  const pickupLat = document.getElementById("pickupLat");
  const pickupLng = document.getElementById("pickupLng");
  const dropLat = document.getElementById("dropLat");
  const dropLng = document.getElementById("dropLng");

  // Get weight input element
  const weightInput = document.getElementById("weight");
  const pickupInput = document.getElementById("pickupAddress");
  const dropInput = document.getElementById("dropAddress");
  let lastEstimate = null;

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function calculatePrice(distance_km, weight_kg) {
    const distanceFee = distance_km * PER_KM;
    const weightFee = weight_kg * PER_KG;
    const subtotal = BASE_FEE + distanceFee + weightFee;
    const roundedTotal = Math.round(subtotal);
    return {
      base_fee: BASE_FEE,
      distance_fee: Math.round(distanceFee),
      weight_fee: Math.round(weightFee),
      total: roundedTotal,
      min_range: Math.round(subtotal * (1 - RANGE_PERCENT)),
      max_range: Math.round(subtotal * (1 + RANGE_PERCENT)),
    };
  }

  function renderPrice(distKm, weightKg, breakdown) {
    if (priceDistance) priceDistance.textContent = distKm.toFixed(2) + " km";
    if (priceBase) priceBase.textContent = "₹ " + breakdown.base_fee;
    if (priceDistanceFee)
      priceDistanceFee.textContent = "₹ " + breakdown.distance_fee;
    if (priceWeightFee)
      priceWeightFee.textContent = "₹ " + breakdown.weight_fee;
    if (priceTotal)
      priceTotal.innerHTML = "<strong>₹ " + breakdown.total + "</strong>";
  }

  async function getDistanceKm() {
    // Prefer Google Directions if loaded
    try {
      if (window.google && google.maps && google.maps.DirectionsService) {
        const directionsService = new google.maps.DirectionsService();
        return new Promise((resolve, reject) => {
          const request = {
            origin: pickupInput.value,
            destination: dropInput.value,
            travelMode: google.maps.TravelMode.DRIVING,
          };
          directionsService.route(request, (response, status) => {
            if (status === "OK" && response.routes.length) {
              let meters = 0;
              const legs = response.routes[0].legs;
              for (let i = 0; i < legs.length; i++)
                meters += legs[i].distance.value;
              resolve(meters / 1000);
            } else {
              reject("directions_failed");
            }
          });
        });
      }
    } catch (e) {
      console.warn("Google Directions not available, falling back", e);
    }

    // Fallback to lat/lng haversine if available
    const pLat = parseFloat(pickupLat.value);
    const pLng = parseFloat(pickupLng.value);
    const dLat = parseFloat(dropLat.value);
    const dLng = parseFloat(dropLng.value);
    if (!isNaN(pLat) && !isNaN(pLng) && !isNaN(dLat) && !isNaN(dLng)) {
      return haversineKm(pLat, pLng, dLat, dLng);
    }

    // If not available, prompt manual distance
    const manual = prompt(
      "Could not auto-calculate distance. Please enter approximate distance in km (e.g., 3.5):"
    );
    const manualKm = parseFloat(manual);
    if (!isNaN(manualKm) && manualKm > 0) return manualKm;
    throw new Error("no_distance");
  }

  // Attach calculate button handler
  if (calculateBtn) {
    calculateBtn.addEventListener("click", async function () {
      const weight = parseFloat(weightInput.value);
      if (!pickupInput.value || !dropInput.value) {
        alert("Please fill pickup and drop addresses.");
        return;
      }
      if (isNaN(weight) || weight <= 0) {
        alert("Please enter a valid weight.");
        return;
      }
      calculateBtn.disabled = true;
      calculateBtn.textContent = "Calculating...";
      try {
        const distKm = await getDistanceKm();
        const breakdown = calculatePrice(distKm, weight);
        lastEstimate = { distKm, weight, breakdown };
        renderPrice(distKm, weight, breakdown);
        // scroll to price card
        const priceCard = document.getElementById("priceCard");
        if (priceCard) priceCard.scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        alert("Unable to calculate distance automatically.");
        console.error(err);
      } finally {
        calculateBtn.disabled = false;
        calculateBtn.textContent = "Calculate Price";
      }
    });
  }

  // When user clicks Request on price card, submit the original form (which already handles create)
  if (requestFromPriceBtn) {
    requestFromPriceBtn.addEventListener("click", function () {
      // Before submitting, ensure we saved lat/lng if Google Places filled them
      // Submit the form programmatically
      if (document.getElementById("deliveryForm")) {
        // Use requestSubmit if available to trigger form validation and submit handlers
        if (
          typeof document.getElementById("deliveryForm").requestSubmit ===
          "function"
        ) {
          document.getElementById("deliveryForm").requestSubmit();
        } else {
          document.getElementById("deliveryForm").submit();
        }
      }
    });
  }

  // Initialize simple Places Autocomplete if google maps loaded (non-blocking)
  function initPlacesAutocomplete() {
    try {
      if (window.google && google.maps && google.maps.places) {
        const pickupAuto = new google.maps.places.Autocomplete(
          document.getElementById("pickupAddress")
        );
        const dropAuto = new google.maps.places.Autocomplete(
          document.getElementById("dropAddress")
        );
        pickupAuto.addListener("place_changed", function () {
          const place = pickupAuto.getPlace();
          if (place.geometry) {
            document.getElementById("pickupLat").value =
              place.geometry.location.lat();
            document.getElementById("pickupLng").value =
              place.geometry.location.lng();
          }
        });
        dropAuto.addListener("place_changed", function () {
          const place = dropAuto.getPlace();
          if (place.geometry) {
            document.getElementById("dropLat").value =
              place.geometry.location.lat();
            document.getElementById("dropLng").value =
              place.geometry.location.lng();
          }
        });
      }
    } catch (e) {
      console.warn("Places autocomplete not available.", e);
    }
  }

  // Try to initialize when maps API is already loaded or when it becomes available later
  if (window.google && window.google.maps) {
    initPlacesAutocomplete();
  } else {
    // Poll for google.maps (useful if script is added later)
    let mapsInterval = setInterval(function () {
      if (window.google && window.google.maps) {
        clearInterval(mapsInterval);
        initPlacesAutocomplete();
      }
    }, 500);
  }
})();

// in src/public/dashboard.js — inside calculate button handler
async function fetchServerEstimate(payload) {
  const url = "http://127.0.0.1:8000/api/price/estimate/";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": "Bearer <token>"  // add if your API requires auth
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Estimate failed");
    }
    return await res.json();
  } catch (e) {
    throw e;
  }
}

// Usage example — on Calculate button click:
document
  .getElementById("calculatePriceBtn")
  .addEventListener("click", async function () {
    const pickup = document.getElementById("pickupAddress").value;
    const drop = document.getElementById("dropAddress").value;
    const weight = parseFloat(document.getElementById("weight").value) || 0;
    if (!pickup || !drop || !weight) {
      alert("Please enter pickup, drop and weight");
      return;
    }
    this.disabled = true;
    this.textContent = "Calculating...";
    try {
      const data = await fetchServerEstimate({
        pickup_address: pickup,
        drop_address: drop,
        weight: weight,
      });
      // fill UI
      document.getElementById("price_distance").textContent =
        data.distance_km + " km";
      document.getElementById("price_base").textContent =
        "₹ " + data.breakdown.base_fee;
      document.getElementById("price_distance_fee").textContent =
        "₹ " + data.breakdown.distance_fee;
      document.getElementById("price_weight_fee").textContent =
        "₹ " + data.breakdown.weight_fee;
      document.getElementById("price_total").innerHTML =
        "<strong>₹ " + data.estimated_price + "</strong>";
      // save lat/lng into hidden inputs for later delivery create
      document.getElementById("pickupLat").value = data.pickup_lat;
      document.getElementById("pickupLng").value = data.pickup_lng;
      document.getElementById("dropLat").value = data.drop_lat;
      document.getElementById("dropLng").value = data.drop_lng;
    } catch (err) {
      alert("Estimate failed: " + err.message);
      console.error(err);
    } finally {
      this.disabled = false;
      this.textContent = "Calculate Price";
    }
  });
