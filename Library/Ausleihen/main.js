let cardGrid = document.getElementById("cardGrid");
let customers = [];
let borrowings = [];

/**
 * Diese Funktion wird nach dem Laden der Seite ausgeführt. Sie lädt die Ausleihen und zeigt sie an.
 */
document.addEventListener("DOMContentLoaded", async () => {
    showLoadingCards();
    borrowings = await getBorrowings();
    displayBorrowings(borrowings);
})

/**
 * Mit dieser Funktion kann man nach Ausleihen suchen, entweder mit der ID, oder einem anderen Kriterium
 */
async function searchForBorrowing() {
    let value = document.getElementById("searchInput").value;
    value = DOMPurify.sanitize(value);
    if (value.replace(/\s+/g, "") === "") {
        displayBorrowings(borrowings);
        return;
    }
    let data = [];
    if(!isNaN(parseInt(value))){
        try {
            const response = await (await fetch("http://localhost:8080/api/borrowing/" + value)).json()
            data.push(response);
        } catch (error) {
            console.log(error);
        }
    } else {
        data = borrowings.filter(borrowing => {return (borrowing.customer.firstname + " " + borrowing.customer.lastname).includes(value) || borrowing.media.title.includes(value)});
    }
    displayMedia(data);
}

/**
 * Diese Funktion zeigt alle Ausleihen an, die in die Funktion mitgegeben werden
 * @param borrowingArray -> Array aller anzuzeigenden Ausleihen
 */
function displayBorrowings(borrowingArray) {
    if (borrowingArray) {
        cardGrid.innerHTML = "";
        borrowingArray.slice().reverse().forEach(borrowing => {
            const template = document.querySelector("#borrowCardTemplate").content.cloneNode(true);
            template.querySelector(".borrow-date").textContent = borrowing.borrowDate;
            template.querySelector(".author-title").textContent = borrowing.media.title + ", " + borrowing.media.author;
            template.querySelector(".first-lastname").textContent = borrowing.customer.firstname + " " + borrowing.customer.lastname;
            let returnDate = new Date(borrowing.borrowDate);
            returnDate.setDate(new Date(borrowing.borrowDate).getDate() + parseInt(borrowing.borrowDuration));
            template.querySelector(".return-date").textContent = formatDate(returnDate);
            template.querySelector(".return-button").addEventListener("click", () => {
                if (confirm("Medium zurückgeben?")) {
                    if(returnBorrowing(borrowing.media.id)){
                    borrowings.splice(borrowings.indexOf(borrowing), 1);
                    openAlert("Medium erfolgreich zurückgegeben", "success", 2000);
                    displayBorrowings(borrowings);
                    }
                }
            })
            template.querySelector(".extend-button").addEventListener("click", () => {
                openExtensionWindow(borrowing.media.id, returnDate);
            })
            cardGrid.appendChild(template);
        })
    }
}

/**
 * Mit dieser Funktion kann man ein Fenster zur Verlängerung einer Ausleihe öffnen
 * @param mediaId -> Id des Mediums, von welcher die Ausleihe verlängert werden soll
 * @param returnDate -> Das bisherige Enddatum der Ausleihe
 */
function openExtensionWindow(mediaId, returnDate) {
    const template = document.querySelector("#extendTemplate").content.cloneNode(true);

    let borrowingEnd = new Date(returnDate);
    console.log(borrowingEnd);

    const formatDate = date =>
        date.toISOString().split("T")[0];

    let input = template.querySelector("input");
    input.value = formatDate(borrowingEnd);
    input.min = formatDate(borrowingEnd);
    template.querySelector(".extend-button").addEventListener("click", async () => {
        if(input.checkValidity()){
            let newDate = new Date(input.value);
            let diffTime = newDate - new Date();
            let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            console.log(days);
            const response = await submitBorrowExtension(days, mediaId);
            if(response) {
                let idx = borrowings.findIndex(borrowing => borrowing.media.id === mediaId);
                borrowings.splice(idx, 1, response);
                document.body.removeChild(document.querySelector(".new-object-popup"));
                displayBorrowings(borrowings);
            }
        } else {
            openAlert("Bitte gültiges Datum auswählen", "warning", 2000);
        }
    })
    template.querySelector(".return-button").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })
    template.querySelector(".new-object-popup").addEventListener("click", (e) => {
        if(e.target.classList.contains("new-object-popup")){
            document.body.removeChild(document.querySelector(".new-object-popup"));
        }
    })
    document.body.appendChild(template);
}

/**
 * Diese Funktion macht einen API-Call an das Backend, um eine Ausleihe zu verändern
 * @param days -> Die Anzahl Tage der Verlängerung
 * @param mediaId -> Die ID des Mediums
 * @returns {Promise<Response>} -> Das neue Ausleihe-Objekt
 */
async function submitBorrowExtension(days, mediaId) {
    try {
        const response = await fetch("http://localhost:8080/api/borrowing/extend", {method: "PATCH", headers: {"Content-Type": "application/json", mediaId: mediaId}, body: JSON.stringify({days: days})});
        if(!response.ok){
            throw new Error();
        }
        return await response.json();
    } catch (error) {
        openAlert(error.message || "Ausleihe konnte nicht verlängert werden", "danger", 2500);
    }
}

/**
 * Diese Funktion lässt einen eine Ausleihe zurückgeben
 * @param mediaId -> Die ID des Mediums, das zurückgegeben werden soll
 * @returns {Promise<boolean>} -> Status, ob das Medium zurückgegeben wurde
 */
async function returnBorrowing(mediaId) {
    try {
        const response = await fetch("http://localhost:8080/api/borrowing/return", {method: "PATCH", headers: {"Content-Type": "application/json",mediaId: mediaId}});
        if(!response.ok) {
            throw new Error(response.message);
        }
        return true;
    } catch (error) {
        openAlert(error.message || "Medium konnte nicht zurückgegeben werden", "danger", 2500);
        return false;
    }
}

/**
 * Eine Funktion, um ein mitgegebenes Datum zu formatieren ("DD.MM.YYY)
 * @param date -> Datum, welches formatiert werden soll
 * @returns {string} -> Das formatierte Datum
 */
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Diese Funktion gibt alle Ausleihen aus dem Backend zurück
 * @returns {Promise<any>} -> Liste der Ausleihen
 */
async function getBorrowings() {
    try {
        const response = await (await fetch("http://localhost:8080/api/borrowing/all")).json();
        return response;
    } catch (error) {
        openAlert(error.message || "Ausleihen konnten nicht geladen werden", 2500);
    }
}

/**
 * Diese Funktion zeigt die Skeleton-Karten an
 */
function showLoadingCards() {
    let cardGrid = document.getElementById("cardGrid");
    cardGrid.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const template = document.getElementById("skeletonLoaderCard").content.cloneNode(true);
        cardGrid.appendChild(template);
    }
}

/**
 * Mit dieser Funktion lässt sich ein Alert/Banner öffnen, um dem User etwas mitzuteilen
 * @param message -> Anzuzeigender Text
 * @param status -> Art der Information (Danger, Warning, Success, Info)
 * @param duration -> Zeit, wie lange der Alert sichtbar sein sollte
 */
function openAlert(message, status, duration) {
    let alertWrapper = document.querySelector(".alert-wrapper");
    document.querySelectorAll(".alert-content-wrapper").forEach(alert => alert.remove());
    let alert = document.getElementById("alert").content.cloneNode(true);
    switch (status) {
        case "danger":
            alert.querySelector(".status-icon").className = "fa-solid fa-circle-exclamation status-icon";
            alert.querySelector(".alert-content-wrapper").style.backgroundColor = "var(--bs-danger) !important";
            break;
        case "warning":
            alert.querySelector(".status-icon").className = "fa-solid fa-triangle-exclamation status-icon";
            alert.querySelector(".alert-content-wrapper").style.backgroundColor = "var(--bs-warning) !important";
            break;
        case "success":
            alert.querySelector(".status-icon").className = "fa-solid fa-check status-icon";
            alert.querySelector(".alert-content-wrapper").style.backgroundColor = "var(--bs-success) !important";
            break;
        default:
            alert.querySelector(".status-icon").className = "fa-solid fa-circle-info status-icon";
            alert.querySelector(".alert-content-wrapper").style.backgroundColor = "var(--bs-info) !important";
    }
    alert.querySelector("#message").textContent = message;
    alertWrapper.appendChild(alert);
    alertWrapper.style.transform = "translateY(0)";
    alertWrapper.querySelector(".close-button").addEventListener("click", closeAlert);
    setTimeout(closeAlert, duration);
}

/**
 * Mit dieser Funktion wird der Alert wieder geschlossen
 */
function closeAlert() {
    const alertWrapper = document.querySelector(".alert-wrapper");
    const alertItem = alertWrapper.querySelector(".alert-content-wrapper");
    if (alertItem) {
        alertWrapper.style.transform = "translateY(100px)";
        alertItem.remove();
    }
}