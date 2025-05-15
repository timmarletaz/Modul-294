let cardGrid = document.getElementById("cardGrid");
let customers = [];
let borrowings = [];

document.addEventListener("DOMContentLoaded", async () => {
    showLoadingCards();
    borrowings = await getBorrowings();
    displayBorrowings(borrowings);
})

function searchForBorrowing() {
    //TODO
}

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

async function submitBorrowExtension(days, mediaId) {
    try {
        const response = await(await fetch("http://localhost:8080/api/borrowing/extend", {method: "PATCH", headers: {"Content-Type": "application/json", mediaId: mediaId}, body: JSON.stringify({days: days})})).json();
        console.log(response);
        return response;
    } catch (error) {
        openAlert(error.message || "Ausleihe konnte nicht verlängert werden", "danger", 2500);
    }
}

async function returnBorrowing(mediaId) {
    try {
        await fetch("http://localhost:8080/api/borrowing/return", {method: "PATCH", headers: {"Content-Type": "application/json",mediaId: mediaId}});
        return true;
    } catch (error) {
        openAlert(error.message || "Medium konnte nicht zurückgegeben werden", "danger", 2500);
        return false;
    }
}

function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

async function getBorrowings() {
    try {
        const response = await (await fetch("http://localhost:8080/api/borrowing/all")).json();
        return response;
    } catch (error) {
        openAlert(error.message || "Ausleihen konnten nicht geladen werden", 2500);
    }
}

function showLoadingCards() {
    let cardGrid = document.getElementById("cardGrid");
    cardGrid.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const template = document.getElementById("skeletonLoaderCard").content.cloneNode(true);
        cardGrid.appendChild(template);
    }
}

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

function closeAlert() {
    const alertWrapper = document.querySelector(".alert-wrapper");
    const alertItem = alertWrapper.querySelector(".alert-content-wrapper");
    if (alertItem) {
        alertWrapper.style.transform = "translateY(100px)";
        alertItem.remove();
    }
}