document.addEventListener("DOMContentLoaded", () => {
    // --------- Login/Logout & Session ---------
    const loginBtn = document.querySelector(".login-btn");
    const loginModal = document.getElementById("login-modal");
    const registerModal = document.getElementById("register-modal");
    const closeBtns = document.querySelectorAll(".close");
    const registerLink = document.getElementById("register-link");
    const signUpLink = document.getElementById("sign-up-link");
    const userIcon = document.getElementById("user-icon");
    const dropdownMenu = document.getElementById("dropdown-menu");
    const logoutBtn = document.getElementById("logout");

    if (loginBtn && loginModal) {
        loginBtn.addEventListener("click", () => loginModal.style.display = "block");
    }

    if (registerLink && registerModal) {
        registerLink.addEventListener("click", (e) => {
            e.preventDefault();
            loginModal.style.display = "none";
            registerModal.style.display = "block";
        });
    }

    if (signUpLink && registerModal) {
        signUpLink.addEventListener("click", (e) => {
            e.preventDefault();
            loginModal.style.display = "none";
            registerModal.style.display = "block";
        });
    }

    closeBtns.forEach(btn => btn.addEventListener("click", () => {
        if (loginModal) loginModal.style.display = "none";
        if (registerModal) registerModal.style.display = "none";
    }));

    window.addEventListener("click", (e) => {
        if (e.target === loginModal) loginModal.style.display = "none";
        if (e.target === registerModal) registerModal.style.display = "none";
    });

    if (userIcon && dropdownMenu) {
        userIcon.addEventListener("click", () => dropdownMenu.classList.toggle("hidden"));

        window.addEventListener("click", (e) => {
            if (!userIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.add("hidden");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                const res = await fetch("/logout", {
                    method: "POST",
                    credentials: "include"
                });
                const result = await res.json();
                if (res.ok) {
                    alert(result.message);
                    localStorage.setItem("isLoggedIn", "false");
                    localStorage.removeItem("userEmail");
                    location.reload();
                } else {
                    alert(result.message || "Logout failed.");
                }
            } catch (err) {
                console.error("Logout error:", err);
                alert("Something went wrong during logout.");
            }
        });
    }

    // Session check
    fetch("/check-auth", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            console.log("Check-auth response:", data);
            const isLoggedIn = data.isLoggedIn;

            localStorage.setItem("isLoggedIn", isLoggedIn ? "true" : "false");
            if (isLoggedIn) {
                localStorage.setItem("userEmail", data.user.email);
                if (loginBtn) loginBtn.style.display = "none";
                if (userIcon) userIcon.classList.remove("hidden");
            } else {
                if (loginBtn) loginBtn.style.display = "inline-block";
                if (userIcon) userIcon.classList.add("hidden");
            }
        });

    // Protect booking links
    document.querySelectorAll('a[href="bus.html"], a[href="train.html"], a[href="flight.html"], a[href="cab.html"]').forEach(link => {
        link.addEventListener("click", (e) => {
            if (localStorage.getItem("isLoggedIn") !== "true") {
                e.preventDefault();
                alert("Please log in to use this feature.");
            }
        });
    });

    // --------- Login Handling ---------
    const loginForm = document.querySelector("#login-modal form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            try {
                const res = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ email, password })
                });

                const result = await res.json();
                if (res.ok) {
                    alert(result.message);
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("userEmail", email);
                    if (loginModal) loginModal.style.display = "none";
                    if (userIcon) userIcon.classList.remove("hidden");
                    if (loginBtn) loginBtn.style.display = "none";
                } else {
                    alert(result.message);
                }
            } catch (err) {
                console.error("Login error:", err);
                alert("Something went wrong. Please try again.");
            }
        });
    }

    // --------- Register Handling ---------
    const registerForm = document.querySelector("#register-modal form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const firstName = registerForm.querySelector('input[placeholder="First Name"]').value;
            const lastName = registerForm.querySelector('input[placeholder="Last Name"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const gender = registerForm.querySelector('select').value;
            const dob = registerForm.querySelector('input[type="date"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;

            try {
                const res = await fetch("/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ firstName, lastName, email, gender, dob, password })
                });

                const result = await res.json();
                if (res.ok) {
                    alert(result.message);
                    registerModal.style.display = "none";
                } else {
                    alert(result.message);
                }
            } catch (err) {
                console.error("Registration error:", err);
                alert("Something went wrong. Please try again.");
            }
        });
    }

    // --------- Train Search ---------
    const searchForm = document.getElementById("search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const from = searchForm.querySelector('input[name="from"]').value;
            const to = searchForm.querySelector('input[name="to"]').value;
            const travelClass = searchForm.querySelector('select[name="class"]').value;

            try {
                const queryParams = new URLSearchParams({ from, to, class: travelClass });
                const res = await fetch(`/search-trains?${queryParams}`);
                const trains = await res.json();

                displayTrainResults(trains);
            } catch (err) {
                console.error("Train search error:", err);
                alert("Train search failed.");
            }
        });
    }

    // Safe function call only if #train-results exists
    function displayTrainResults(trains) {
        const resultsContainer = document.getElementById("train-results");
        if (!resultsContainer) return;

        resultsContainer.innerHTML = "";

        if (trains.length === 0) {
            resultsContainer.innerHTML = "<p>No trains found.</p>";
            return;
        }

        trains.forEach(train => {
            const trainElement = document.createElement("div");
            trainElement.className = "train-item";
            trainElement.innerHTML = `
                <h3>${train.trainName} (${train.trainNumber})</h3>
                <p>From: ${train.from} → To: ${train.to}</p>
                <p>Class: ${Object.keys(train.classes).join(", ")}</p>
            `;
            resultsContainer.appendChild(trainElement);
        });
    }

    // --------- Bus Booking ---------
    const selectedBusContainer = document.getElementById("selectedBus");
    const bookingForm = document.getElementById("busBookingForm");
    const bookingMessage = document.getElementById("bookingMessage");

    if (selectedBusContainer && bookingForm && bookingMessage) {
        const selectedBus = JSON.parse(localStorage.getItem("selectedBus"));
        if (!selectedBus) {
            selectedBusContainer.innerHTML = "<p>No bus selected. Please go back and select a bus.</p>";
            bookingForm.style.display = "none";
            return;
        }

        selectedBusContainer.innerHTML = `
            <h2>${selectedBus.operator} - Bus No: ${selectedBus.busNumber}</h2>
            <p>From: ${selectedBus.from} → To: ${selectedBus.to}</p>
            <p>Type: ${selectedBus.type}</p>
            <p>Departure: ${selectedBus.departureTime} → Arrival: ${selectedBus.arrivalTime}</p>
            <p>Fare: ₹${selectedBus.fare}</p>
            <p>Seats Available: ${selectedBus.seatsAvailable}</p>
        `;

        bookingForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const passengerName = document.getElementById("passengerName").value.trim();
            const seatsRequested = parseInt(document.getElementById("seats").value);

            if (seatsRequested > selectedBus.seatsAvailable) {
                bookingMessage.textContent = "Not enough seats available.";
                bookingMessage.style.color = "red";
                return;
            }

            bookingMessage.textContent = `Booking confirmed for ${passengerName}! ${seatsRequested} seat(s) booked.`;
            bookingMessage.style.color = "green";
        });
    }
});
