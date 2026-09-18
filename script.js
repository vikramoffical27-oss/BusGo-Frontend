// ======================================================
// GLOBAL VARIABLES
// ======================================================

const API = "https://busreservationsystem-frh2.onrender.com";

let selectedSeat = null;
let bookedSeats = [];


// ======================================================
// COMMON HELPERS
// ======================================================

function getValue(id) {
    return document.getElementById(id)?.value.trim() || "";
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.innerText = value || "--";
    }
}

function getStored(key, fallback = "") {
    return localStorage.getItem(key) || fallback;
}

function escapeQuotes(value) {
    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


// ======================================================
// SIGNUP
// ======================================================

function signup() {

    const name = getValue("username");
    const email = getValue("email");
    const password = getValue("password");

    if (!name || !email || !password) {
        alert("Please fill all fields.");
        return;
    }

    fetch(`${API}/users/signup`, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            name: name,
            email: email,
            password: password
        })
    })

    .then(async response => {

        const data = await response.text();

        if (!response.ok) {
            throw new Error(
                data || `HTTP Error: ${response.status}`
            );
        }

        return data;
    })

    .then(data => {

        console.log("SIGNUP RESPONSE:", data);

        alert(data);

        if (data.trim() === "Registration Successful") {

            window.location.href = "login.html";
        }
    })

    .catch(error => {

        console.error("SIGNUP ERROR:", error);

        alert(
            "Unable to register.\n" +
            error.message
        );
    });
}


// ======================================================
// LOGIN
// ======================================================

function loginUser() {

    const email = getValue("email");
    const password = getValue("password");

    if (!email || !password) {

        alert("Please enter email and password.");

        return;
    }

    fetch(`${API}/users/login`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email: email,
            password: password
        })
    })

    .then(async response => {

        const data = await response.text();

        if (!response.ok) {

            throw new Error(
                data || `HTTP Error: ${response.status}`
            );
        }

        return data;
    })

    .then(data => {

        console.log("LOGIN RESPONSE:", data);

        alert(data);

        if (data.trim() === "Login Successful") {

            localStorage.setItem(
                "loggedInEmail",
                email
            );

            window.location.href = "searchbus.html";
        }
    })

    .catch(error => {

        console.error("LOGIN ERROR:", error);

        alert(
            "Login failed.\n" +
            error.message
        );
    });
}


// ======================================================
// LOGOUT
// ======================================================

function logoutUser() {

    localStorage.removeItem("loggedInEmail");
    localStorage.removeItem("selectedBusId");
    localStorage.removeItem("selectedSeat");
    localStorage.removeItem("lastTicket");

    window.location.href = "login.html";
}


// ======================================================
// SEARCH BUS
// ======================================================

function searchBus() {

    const source = getValue("source");

    const destination = getValue("destination");

    const journeyDate =
        document.getElementById("journeyDate")?.value || "";

    const result =
        document.getElementById("result");


    if (!source || !destination || !journeyDate) {

        alert(
            "Please enter From, To and Journey Date."
        );

        return;
    }


    if (!result) {

        console.error(
            "Result element not found."
        );

        return;
    }


    result.innerHTML =
        "<p>Searching buses...</p>";


    const url =
        `${API}/bus/search?source=${encodeURIComponent(source)}` +
        `&destination=${encodeURIComponent(destination)}`;


    fetch(url)

        .then(async response => {

            if (!response.ok) {

                throw new Error(
                    `Bus search failed: ${response.status}`
                );
            }

            return response.json();
        })

        .then(buses => {

            if (
                !Array.isArray(buses) ||
                buses.length === 0
            ) {

                result.innerHTML = `
                    <div class="empty">

                        <h3>🚌 No buses found</h3>

                        <p>
                            No buses available for
                            ${source} → ${destination}
                        </p>

                    </div>
                `;

                return;
            }


            result.innerHTML = buses.map(bus => `

                <div class="bus-card">

                    <h3>
                        🚌 ${bus.busName || "Bus"}
                    </h3>


                    <p>

                        <strong>
                            Bus Number:
                        </strong>

                        ${bus.busNumber || "--"}

                    </p>


                    <p>

                        📍 ${bus.source || "--"}

                        →

                        ${bus.destination || "--"}

                    </p>


                    <p>

                        🕐 ${bus.departureTime || "--"}

                        →

                        ${bus.arrivalTime || "--"}

                    </p>


                    <p>

                        📅 Journey Date:

                        <strong>
                            ${journeyDate}
                        </strong>

                    </p>


                    <p>

                        💰 Fare:

                        <strong>
                            ₹${bus.fare ?? 0}
                        </strong>

                    </p>


                    <p>

                        💺 Available Seats:

                        <strong>
                            ${bus.availableSeats ?? 0}
                        </strong>

                    </p>


                    <button
                        type="button"
                        class="book-btn"

                        onclick="selectBus(
                            ${bus.id},
                            '${escapeQuotes(bus.busName)}',
                            '${escapeQuotes(bus.busNumber)}',
                            '${escapeQuotes(bus.source)}',
                            '${escapeQuotes(bus.destination)}',
                            '${escapeQuotes(bus.departureTime)}',
                            '${escapeQuotes(bus.arrivalTime)}',
                            ${Number(bus.fare || 0)},
                            '${escapeQuotes(journeyDate)}'
                        )"
                    >

                        🎟️ Book Ticket

                    </button>

                </div>

            `).join("");
        })

        .catch(error => {

            console.error(
                "SEARCH BUS ERROR:",
                error
            );


            result.innerHTML = `

                <div class="error-box">

                    <h3>
                        ❌ Unable to search buses
                    </h3>

                    <p>
                        ${error.message}
                    </p>

                    <p>
                        Please check the deployed
                        backend connection.
                    </p>

                </div>

            `;
        });
}


// ======================================================
// SELECT BUS FROM SEARCH PAGE
// ======================================================

function selectBus(
    id,
    busName,
    busNumber,
    source,
    destination,
    departureTime,
    arrivalTime,
    fare,
    journeyDate
) {

    localStorage.setItem(
        "selectedBusId",
        String(id)
    );

    localStorage.setItem(
        "selectedBusName",
        busName || ""
    );

    localStorage.setItem(
        "selectedBusNumber",
        busNumber || ""
    );

    localStorage.setItem(
        "selectedSource",
        source || ""
    );

    localStorage.setItem(
        "selectedDestination",
        destination || ""
    );

    localStorage.setItem(
        "selectedDepartureTime",
        departureTime || ""
    );

    localStorage.setItem(
        "selectedArrivalTime",
        arrivalTime || ""
    );

    localStorage.setItem(
        "selectedFare",
        String(fare || 0)
    );

    localStorage.setItem(
        "journeyDate",
        journeyDate || ""
    );

    localStorage.removeItem(
        "selectedSeat"
    );

    window.location.href =
        "booking.html";
}


// ======================================================
// LOAD ALL BUSES
// ======================================================

function loadAllBuses() {

    const result =
        document.getElementById("result");


    if (!result) {

        console.error(
            "Result element not found."
        );

        return;
    }


    result.innerHTML =
        "<p>Loading buses...</p>";


    fetch(`${API}/bus/all`)

        .then(async response => {

            if (!response.ok) {

                throw new Error(
                    `HTTP Error: ${response.status}`
                );
            }

            return response.json();
        })

        .then(buses => {

            if (
                !Array.isArray(buses) ||
                buses.length === 0
            ) {

                result.innerHTML = `

                    <div class="empty">

                        <h3>
                            🚌 No buses available
                        </h3>

                        <p>
                            There are currently
                            no buses in the database.
                        </p>

                    </div>

                `;

                return;
            }


            result.innerHTML = buses.map(bus => `

                <div class="bus-card">

                    <h2>
                        🚌 ${bus.busName || "Bus"}
                    </h2>


                    <p>

                        <strong>
                            Bus Number:
                        </strong>

                        ${bus.busNumber || "--"}

                    </p>


                    <p>

                        📍 ${bus.source || "--"}

                        →

                        ${bus.destination || "--"}

                    </p>


                    <p>

                        🕐 ${bus.departureTime || "--"}

                        →

                        ${bus.arrivalTime || "--"}

                    </p>


                    <p>

                        💰 Fare:

                        <strong>
                            ₹${bus.fare ?? 0}
                        </strong>

                    </p>


                    <p>

                        💺 Available Seats:

                        <strong>
                            ${bus.availableSeats ?? 0}
                        </strong>

                    </p>


                    <button
                        type="button"
                        class="book-btn"

                        onclick="
                            selectBusFromBusesPage(${bus.id})
                        "
                    >

                        🎟️ Book Ticket

                    </button>

                </div>

            `).join("");
        })

        .catch(error => {

            console.error(
                "LOAD ALL BUSES ERROR:",
                error
            );


            result.innerHTML = `

                <div class="error-box">

                    <h3>
                        ❌ Unable to load buses
                    </h3>

                    <p>
                        ${error.message}
                    </p>

                    <p>
                        Please check the deployed
                        backend connection.
                    </p>

                </div>

            `;
        });
}


// ======================================================
// SELECT BUS FROM BUSES PAGE
// ======================================================

function selectBusFromBusesPage(busId) {

    localStorage.setItem(
        "selectedBusId",
        String(busId)
    );

    localStorage.removeItem(
        "selectedSeat"
    );

    window.location.href =
        "booking.html";
}


// ======================================================
// LOAD SELECTED BUS
// ======================================================

function loadSelectedBus() {

    const busDetails =
        document.getElementById("busDetails");

    const busId =
        localStorage.getItem("selectedBusId");


    if (!busDetails) {
        return;
    }


    if (!busId) {

        alert("No bus selected.");

        window.location.href =
            "buses.html";

        return;
    }


    busDetails.innerHTML =
        "<p>🚌 Loading bus details...</p>";


    fetch(
        `${API}/bus/${encodeURIComponent(busId)}`
    )

        .then(async response => {

            if (!response.ok) {

                throw new Error(
                    `Bus not found: ${response.status}`
                );
            }

            return response.json();
        })

        .then(bus => {

            localStorage.setItem(
                "selectedBusName",
                bus.busName || ""
            );

            localStorage.setItem(
                "selectedBusNumber",
                bus.busNumber || ""
            );

            localStorage.setItem(
                "selectedSource",
                bus.source || ""
            );

            localStorage.setItem(
                "selectedDestination",
                bus.destination || ""
            );

            localStorage.setItem(
                "selectedDepartureTime",
                bus.departureTime || ""
            );

            localStorage.setItem(
                "selectedArrivalTime",
                bus.arrivalTime || ""
            );

            localStorage.setItem(
                "selectedFare",
                String(bus.fare || 0)
            );


            const journeyDate =
                getStored(
                    "journeyDate",
                    "--"
                );


            busDetails.innerHTML = `

                <div class="selected-bus-card">

                    <h2>
                        🚌 ${bus.busName || "Bus"}
                    </h2>


                    <p>

                        <strong>
                            Bus Number:
                        </strong>

                        ${bus.busNumber || "--"}

                    </p>


                    <p>

                        📍 ${bus.source || "--"}

                        →

                        ${bus.destination || "--"}

                    </p>


                    <p>

                        📅 Journey Date:

                        <strong>
                            ${journeyDate}
                        </strong>

                    </p>


                    <p>

                        🛫 Departure:

                        <strong>
                            ${bus.departureTime || "--"}
                        </strong>

                    </p>


                    <p>

                        🛬 Arrival:

                        <strong>
                            ${bus.arrivalTime || "--"}
                        </strong>

                    </p>


                    <p>

                        💰 Fare:

                        <strong>
                            ₹${bus.fare ?? 0}
                        </strong>

                    </p>


                    <p>

                        💺 Available Seats:

                        <strong>
                            ${bus.availableSeats ?? 0}
                        </strong>

                    </p>

                </div>

            `;


            const hiddenBusId =
                document.getElementById("busId");


            if (hiddenBusId) {

                hiddenBusId.value =
                    bus.id;
            }

        })

        .catch(error => {

            console.error(
                "LOAD SELECTED BUS ERROR:",
                error
            );


            busDetails.innerHTML = `

                <div class="error-box">

                    ❌ Unable to load bus details.

                    <br><br>

                    ${error.message}

                </div>

            `;
        });
}


// ======================================================
// LOAD LOGGED-IN EMAIL
// ======================================================

function loadLoggedInEmail() {

    const email =
        localStorage.getItem("loggedInEmail");


    if (!email) {

        alert("Please login first.");

        window.location.href =
            "login.html";

        return false;
    }


    const emailField =
        document.getElementById("email");


    if (emailField) {

        emailField.value =
            email;

        emailField.readOnly =
            true;
    }


    return true;
}


// ======================================================
// LOAD BOOKED SEATS
// ======================================================

function loadSeats() {

    const busId =
        localStorage.getItem("selectedBusId");

    const container =
        document.getElementById("seats");


    if (!busId || !container) {
        return;
    }


    container.innerHTML =
        "<p>Loading seats...</p>";


    fetch(
        `${API}/booking/booked-seats?busId=${encodeURIComponent(busId)}`
    )

        .then(async response => {

            if (!response.ok) {

                throw new Error(
                    `Seat API returned ${response.status}`
                );
            }

            return response.json();
        })

        .then(data => {

            bookedSeats =
                Array.isArray(data)
                    ? [...new Set(
                        data.map(Number)
                    )]
                    : [];


            displaySeats();
        })

        .catch(error => {

            console.error(
                "LOAD SEATS ERROR:",
                error
            );


            bookedSeats = [];


            container.innerHTML = `

                <div class="error-box">

                    ❌ Unable to load seats.

                    <br>

                    Please refresh and try again.

                </div>

            `;
        });
}


// ======================================================
// DISPLAY 40 SEATS
// ======================================================

function displaySeats() {

    const container =
        document.getElementById("seats");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const layout =
        document.createElement("div");


    layout.className =
        "seat-layout";


    let seatNumber = 1;


    for (let row = 0; row < 8; row++) {

        const seatRow =
            document.createElement("div");

        seatRow.className =
            "seat-row";


        const leftSide =
            document.createElement("div");

        leftSide.className =
            "seat-side left-side";


        for (let i = 0; i < 2; i++) {

            leftSide.appendChild(
                createSeatButton(seatNumber)
            );

            seatNumber++;
        }


        const aisle =
            document.createElement("div");

        aisle.className =
            "aisle";

        aisle.innerHTML =
            "<span>AISLE</span>";


        const rightSide =
            document.createElement("div");

        rightSide.className =
            "seat-side right-side";


        for (let i = 0; i < 3; i++) {

            rightSide.appendChild(
                createSeatButton(seatNumber)
            );

            seatNumber++;
        }


        seatRow.appendChild(leftSide);

        seatRow.appendChild(aisle);

        seatRow.appendChild(rightSide);


        layout.appendChild(seatRow);
    }


    container.appendChild(layout);
}


// ======================================================
// CREATE SEAT BUTTON
// ======================================================

function createSeatButton(number) {

    const button =
        document.createElement("button");


    button.type = "button";

    button.className = "seat";

    button.innerText = number;


    if (bookedSeats.includes(number)) {

        button.disabled = true;

        button.classList.add(
            "booked"
        );

        button.title =
            "Seat Already Booked";

    } else {

        button.addEventListener(
            "click",
            () => {
                selectSeat(
                    number,
                    button
                );
            }
        );
    }


    return button;
}


// ======================================================
// SELECT SEAT
// ======================================================

function selectSeat(
    seatNumber,
    button
) {

    selectedSeat =
        Number(seatNumber);


    localStorage.setItem(
        "selectedSeat",
        String(selectedSeat)
    );


    setText(
        "selectedSeat",
        selectedSeat
    );


    document
        .querySelectorAll(".seat")
        .forEach(seat => {

            seat.classList.remove(
                "selected"
            );
        });


    button.classList.add(
        "selected"
    );


    console.log(
        "SELECTED SEAT:",
        selectedSeat
    );
}


// ======================================================
// BOOK TICKET
// ======================================================

function bookTicket() {

    const passengerName =
        getValue("passengerName");

    const age =
        getValue("age");

    const gender =
        getValue("gender");


    const busId =
        getValue("busId") ||
        localStorage.getItem(
            "selectedBusId"
        );


    const email =
        localStorage.getItem(
            "loggedInEmail"
        );


    if (!passengerName) {

        alert(
            "Please enter passenger name."
        );

        return;
    }


    if (!age || Number(age) <= 0) {

        alert(
            "Please enter a valid age."
        );

        return;
    }


    if (!gender) {

        alert(
            "Please select gender."
        );

        return;
    }


    if (!email) {

        alert(
            "Please login first."
        );

        window.location.href =
            "login.html";

        return;
    }


    if (!busId) {

        alert(
            "Bus ID is missing. Please select a bus again."
        );

        window.location.href =
            "searchbus.html";

        return;
    }


    if (selectedSeat === null) {

        const savedSeat =
            localStorage.getItem(
                "selectedSeat"
            );


        if (savedSeat) {

            selectedSeat =
                Number(savedSeat);
        }
    }


    if (
        selectedSeat === null ||
        !Number.isInteger(
            Number(selectedSeat)
        ) ||
        Number(selectedSeat) <= 0
    ) {

        alert(
            "Please select a seat."
        );

        return;
    }


    if (
        bookedSeats.includes(
            Number(selectedSeat)
        )
    ) {

        alert(
            "This seat is already booked. Please select another seat."
        );

        return;
    }


    const booking = {

        passengerName: passengerName,

        age: Number(age),

        gender: gender,

        email: email,

        busId: Number(busId),

        seatNumber:
            Number(selectedSeat),

        busName:
            getStored(
                "selectedBusName"
            ),

        busNumber:
            getStored(
                "selectedBusNumber"
            ),

        source:
            getStored(
                "selectedSource"
            ),

        destination:
            getStored(
                "selectedDestination"
            ),

        departureTime:
            getStored(
                "selectedDepartureTime"
            ),

        arrivalTime:
            getStored(
                "selectedArrivalTime"
            ),

        departureDate:
            getStored(
                "journeyDate"
            ),

        arrivalDate:
            getStored(
                "journeyDate"
            ),

        fare:
            Number(
                getStored(
                    "selectedFare",
                    0
                )
            )
    };


    console.log(
        "SENDING BOOKING:",
        booking
    );


    const bookButton =
        document.querySelector(
            'button[onclick="bookTicket()"]'
        );


    if (bookButton) {

        bookButton.disabled =
            true;

        bookButton.innerText =
            "Booking...";
    }


    fetch(
        `${API}/booking/add`,
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(
                    booking
                )
        }
    )

        .then(async response => {

            const data =
                await response.text();


            if (!response.ok) {

                throw new Error(
                    data ||
                    `HTTP Error: ${response.status}`
                );
            }


            return data;
        })

        .then(data => {

            alert(data);


            if (
                data.trim() !==
                "Ticket Booked Successfully"
            ) {

                throw new Error(data);
            }


            const ticket = {

                ...booking,

                bookingMessage:
                    data
            };


            localStorage.setItem(
                "lastTicket",
                JSON.stringify(ticket)
            );


            localStorage.setItem(
                "selectedSeat",
                String(selectedSeat)
            );


            localStorage.setItem(
                "passengerName",
                passengerName
            );


            window.location.href =
                "ticket.html";
        })

        .catch(error => {

            console.error(
                "BOOKING ERROR:",
                error
            );


            alert(
                "Booking failed.\n\n" +
                error.message
            );


            if (bookButton) {

                bookButton.disabled =
                    false;

                bookButton.innerText =
                    "🎟️ Book Ticket";
            }
        });
}


// ======================================================
// LOAD MY BOOKINGS
// ======================================================

function loadBookings() {

    const email =
        localStorage.getItem(
            "loggedInEmail"
        );

    const result =
        document.getElementById(
            "result"
        );


    if (!email) {

        alert(
            "Please login first."
        );

        window.location.href =
            "login.html";

        return;
    }


    if (!result) {
        return;
    }


    result.innerHTML =
        "<p>🚌 Loading your bookings...</p>";


    fetch(
        `${API}/booking/mybooking?email=${encodeURIComponent(email)}`
    )

        .then(async response => {

            if (!response.ok) {

                throw new Error(
                    `Failed to load bookings: ${response.status}`
                );
            }


            return response.json();
        })

        .then(bookings => {

            if (
                !Array.isArray(bookings) ||
                bookings.length === 0
            ) {

                result.innerHTML = `

                    <div class="no-bookings">

                        <h3>
                            🎫 No Bookings Found
                        </h3>

                        <p>
                            You do not have any
                            bus tickets yet.
                        </p>

                        <button
                            onclick="
                                window.location.href='searchbus.html'
                            "
                        >

                            🚌 Book a Bus

                        </button>

                    </div>

                `;

                return;
            }


            result.innerHTML =
                bookings.map(ticket => `

                    <div class="booking-card">

                        <div class="booking-top">

                            <div>

                                <h3>
                                    🚌 ${ticket.busName || "Bus"}
                                </h3>

                                <p>

                                    Bus Number:

                                    <strong>
                                        ${ticket.busNumber || "--"}
                                    </strong>

                                </p>

                            </div>


                            <div class="booking-status">

                                ✓ CONFIRMED

                            </div>

                        </div>


                        <div class="route-section">

                            <p>

                                📍 ${ticket.source || "--"}

                                →

                                ${ticket.destination || "--"}

                            </p>


                            <p>

                                🕐 ${ticket.departureTime || "--"}

                                →

                                ${ticket.arrivalTime || "--"}

                            </p>

                        </div>


                        <div class="booking-details">

                            <p>

                                <strong>
                                    Passenger:
                                </strong>

                                ${ticket.passengerName || "--"}

                            </p>


                            <p>

                                <strong>
                                    Seat:
                                </strong>

                                ${ticket.seatNumber}

                            </p>


                            <p>

                                <strong>
                                    Journey Date:
                                </strong>

                                ${ticket.departureDate || "--"}

                            </p>


                            <p>

                                <strong>
                                    Fare:
                                </strong>

                                ₹${ticket.fare ?? 0}

                            </p>


                            <p>

                                <strong>
                                    Booking ID:
                                </strong>

                                #${ticket.id}

                            </p>


                            <p>

                                <strong>
                                    Age:
                                </strong>

                                ${ticket.age}

                            </p>


                            <p>

                                <strong>
                                    Gender:
                                </strong>

                                ${ticket.gender || "--"}

                            </p>

                        </div>


                        <button
                            class="cancel-btn"

                            onclick="
                                cancelTicket(${ticket.id})
                            "
                        >

                            ✕ Cancel Ticket

                        </button>

                    </div>

                `).join("");
        })

        .catch(error => {

            console.error(
                "LOAD BOOKINGS ERROR:",
                error
            );


            result.innerHTML = `

                <div class="error-box">

                    <h3>
                        ❌ Unable to load bookings
                    </h3>

                    <p>
                        ${error.message}
                    </p>

                    <button
                        onclick="loadBookings()"
                    >

                        🔄 Try Again

                    </button>

                </div>

            `;
        });
}


// ======================================================
// CANCEL TICKET
// ======================================================

function cancelTicket(id) {

    const confirmCancel =
        confirm(
            "Are you sure you want to cancel this ticket?"
        );


    if (!confirmCancel) {
        return;
    }


    fetch(
        `${API}/booking/cancel/${id}`,
        {
            method: "DELETE"
        }
    )

        .then(async response => {

            const data =
                await response.text();


            if (!response.ok) {

                throw new Error(
                    data ||
                    `HTTP Error: ${response.status}`
                );
            }


            return data;
        })

        .then(data => {

            alert(data);

            loadBookings();
        })

        .catch(error => {

            console.error(
                "CANCEL ERROR:",
                error
            );


            alert(
                "Cancellation failed.\n" +
                error.message
            );
        });
}


// ======================================================
// LOAD TICKET PAGE
// ======================================================

function loadTicket() {

    const raw =
        localStorage.getItem(
            "lastTicket"
        );


    const result =
        document.getElementById(
            "ticket"
        );


    if (result) {

        if (!raw) {

            result.innerHTML = `

                <div class="empty">

                    <h3>
                        No ticket available
                    </h3>

                    <a href="searchbus.html">
                        Search for a bus
                    </a>

                </div>

            `;

            return;
        }


        const ticket =
            JSON.parse(raw);


        result.innerHTML = `

            <div class="ticket">

                <div class="ticket-header">

                    <h1>
                        🚌 BusGo
                    </h1>

                    <p>
                        Booking Confirmed ✓
                    </p>

                </div>


                <div class="ticket-body">

                    <p>

                        <strong>
                            Booking ID:
                        </strong>

                        #${ticket.id || "Generated"}

                    </p>


                    <p>

                        <strong>
                            Passenger:
                        </strong>

                        ${ticket.passengerName || "--"}

                    </p>


                    <p>

                        <strong>
                            Age:
                        </strong>

                        ${ticket.age || "--"}

                    </p>


                    <p>

                        <strong>
                            Gender:
                        </strong>

                        ${ticket.gender || "--"}

                    </p>


                    <p>

                        <strong>
                            Email:
                        </strong>

                        ${ticket.email || "--"}

                    </p>


                    <p>

                        <strong>
                            Bus:
                        </strong>

                        ${ticket.busName || "--"}

                    </p>


                    <p>

                        <strong>
                            Bus Number:
                        </strong>

                        ${ticket.busNumber || "--"}

                    </p>


                    <p>

                        <strong>
                            Route:
                        </strong>

                        ${ticket.source || "--"}

                        →

                        ${ticket.destination || "--"}

                    </p>


                    <p>

                        <strong>
                            Journey Date:
                        </strong>

                        ${ticket.departureDate || "--"}

                    </p>


                    <p>

                        <strong>
                            Departure:
                        </strong>

                        ${ticket.departureTime || "--"}

                    </p>


                    <p>

                        <strong>
                            Arrival:
                        </strong>

                        ${ticket.arrivalTime || "--"}

                    </p>


                    <p>

                        <strong>
                            Seat Number:
                        </strong>

                        ${ticket.seatNumber || "--"}

                    </p>


                    <p>

                        <strong>
                            Fare:
                        </strong>

                        ₹${ticket.fare ?? 0}

                    </p>

                </div>


                <div class="ticket-footer">

                    <p>
                        Thank you for booking with BusGo.
                    </p>


                    <button
                        onclick="
                            window.location.href='mybookings.html'
                        "
                    >

                        My Bookings

                    </button>


                    <button
                        onclick="
                            window.location.href='searchbus.html'
                        "
                    >

                        Book Another Ticket

                    </button>

                </div>

            </div>

        `;

        return;
    }


    setText(
        "ticketSource",
        getStored("selectedSource")
    );

    setText(
        "ticketDestination",
        getStored("selectedDestination")
    );

    setText(
        "ticketBusName",
        getStored("selectedBusName")
    );

    setText(
        "ticketBusNumber",
        getStored("selectedBusNumber")
    );

    setText(
        "ticketDepartureDate",
        getStored("journeyDate")
    );

    setText(
        "ticketDepartureTime",
        getStored("selectedDepartureTime")
    );

    setText(
        "ticketArrivalDate",
        getStored("journeyDate")
    );

    setText(
        "ticketArrivalTime",
        getStored("selectedArrivalTime")
    );

    setText(
        "ticketFare",
        "₹" +
        getStored(
            "selectedFare",
            "--"
        )
    );

    setText(
        "ticketSeat",
        getStored("selectedSeat")
    );

    setText(
        "ticketPassenger",
        getStored("passengerName")
    );

    setText(
        "ticketEmail",
        getStored("loggedInEmail")
    );
}


// ======================================================
// PAGE INITIALIZATION
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // ==============================================
        // BOOKING PAGE - BUS DETAILS
        // ==============================================

        if (
            document.getElementById(
                "busDetails"
            )
        ) {

            loadSelectedBus();
        }


        // ==============================================
        // BOOKING PAGE - SEATS
        // ==============================================

        if (
            document.getElementById(
                "seats"
            )
        ) {

            loadSeats();
        }


        // ==============================================
        // BOOKING PAGE ONLY
        // ==============================================
        // IMPORTANT:
        // Do NOT check for "email" here.
        //
        // Signup and Login pages also contain
        // an element with id="email".
        //
        // passengerName exists on the booking page,
        // so this prevents the signup email from
        // becoming readonly.

        if (
            document.getElementById(
                "passengerName"
            )
        ) {

            loadLoggedInEmail();
        }


        // ==============================================
        // TICKET PAGE
        // ==============================================

        if (
            document.getElementById(
                "ticket"
            )
        ) {

            loadTicket();
        }

    }
);