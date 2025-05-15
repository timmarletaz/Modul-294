const cardGrid = document.getElementById("cardGrid");
let media = [];
let customers = [];
let borrowingCustomer;
let timeout;

document.addEventListener("DOMContentLoaded", async () => {
    showLoadingCards();
    media = await fetchMedia();
    if (media) {
        displayMedia(media);
    }
    customers = await getCustomers();
})

async function getCustomers() {
    try {
        return await (await fetch("http://localhost:8080/api/customers/all")).json();
    } catch (error) {
        openAlert(error.message || "Kunden konnten nicht geladen werden", "danger", 3500);
    }
}

async function fetchMedia() {
    try {
        return await (await fetch("http://localhost:8080/api/media/all")).json();
    } catch (error) {
        openAlert("Es ist etwas schiefgelaufen", "danger", 3000);
    }
}

function displayMedia(mediaArray) {
    document.getElementById("cardGrid").style.userSelect = "auto";
    if (mediaArray) {
        cardGrid.innerHTML = "";
        mediaArray.slice().reverse().forEach(media => {
            const template = document.getElementById("mediaCardTemplate").content.cloneNode(true);
            if (media.genre) template.querySelector("#genre").textContent = media.genre;
            const titleElement = template.querySelector("#titel");
            titleElement.childNodes[0].textContent = media.title;
            if (media.fsk) template.querySelector(".fsk").textContent = "(FSK " + media.fsk + ")";
            template.querySelector("#autor").textContent = media.author;
            if (media.isbn) template.querySelector("#isbn").textContent = media.isbn;
            template.querySelector(".edit-button").addEventListener("click", () => {
                editMedium(media)
            });
            template.querySelector("#borrowButton").addEventListener("click", () => {
                openBorrowWindow(media);
            })
            cardGrid.appendChild(template);
        })
    }
}

function openBorrowWindow(media) {
    const template = document.getElementById("borrowWindowTemplate").content.cloneNode(true);
    template.querySelector(".genre").textContent = media.genre || "";
    template.querySelector(".fsk").textContent = media.fsk || "";
    template.querySelector(".title-author").innerHTML = `${media.title}<br>${media.author}`;
    template.querySelector(".isbn").textContent = media.isbn;
    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector("#borrowPopup"));
    })
    template.querySelector("button[type='submit']").addEventListener("click", async () => {
        if(!borrowingCustomer){
            openAlert("Kein Kunde ausgewählt", "warning", 3000);
        }else{
            const response = await submitNewBorrowing(borrowingCustomer.id, media.id);
            document.body.removeChild(document.querySelector("#borrowPopup"));
            openAlert("Ausleihe getätigt", "success", 2500);
            borrowingCustomer = null;
        }
    })
    template.querySelector("#borrowPopup").addEventListener("click", (e) => {
        if(e.target.id === "borrowPopup"){
        document.body.removeChild(document.querySelector("#borrowPopup"));
        }
    })
    document.body.appendChild(template);
    renderBorrowCustomers(customers.slice(0, 10));
}

async function submitNewBorrowing(customerId, mediaId) {
    try {
        const response = await(await fetch("http://localhost:8080/api/borrowing", {method: "POST", headers: {mediaId: mediaId, customerId: customerId}})).json();
        return response;
    } catch (error) {
        openAlert(error.message || "Ausleihe konnte nicht getätigt werden", "danger", 3000);
    }
}

function renderBorrowCustomers(customerArray) {
    document.querySelectorAll(".customer-card-wrapper .card").forEach(card => document.querySelector(".customer-card-wrapper").removeChild(card));
    customerArray.forEach(customer => {
        const customerCardTemplate = document.querySelector("#borrowCustomerCard").content.cloneNode(true);
        customerCardTemplate.querySelector(".id").textContent = customer.id;
        customerCardTemplate.querySelector(".name").textContent = `${customer.firstname} ${customer.lastname}`;
        customerCardTemplate.querySelector(".address").textContent = `${customer.address.address}, ${customer.address.zip} ${customer.address.city}`;
        let card = customerCardTemplate.querySelector(".card");
        document.querySelector(".customer-card-wrapper").appendChild(customerCardTemplate);
        if (borrowingCustomer) {
            if (borrowingCustomer.id === customer.id) {
                document.querySelectorAll(".customer-card-wrapper .card").forEach(card => card.classList.remove("border-2", "border-info"))
                card.classList.add("border-2", "border-info");
            }
        }
        card.addEventListener("click", () => {
            document.querySelectorAll(".customer-card-wrapper .card").forEach(card => card.classList.remove("border-2", "border-info"))
            card.classList.add("border-2", "border-info");
            borrowingCustomer = customer;
        })
    })
}

function searchForCustomer() {
    const value = document.getElementById("borrowingCustomerSearch").value.trim().toLowerCase();
    let data = customers.filter(customer => {
        return (customer.firstname.trim().toLowerCase().includes(value) || customer.lastname.trim().toLowerCase().includes(value) || customer.id.toString() === value);
    });
    renderBorrowCustomers(data);
}

function addNewMedium() {
    const template = document.querySelector("#newMediumTemplate").content.cloneNode(true);
    template.querySelector("#new-object-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const response = await submitNewMedium();
        media.push(response);
        openAlert("Medium erfolgreich erstellt", "success", 2500);
        document.body.removeChild(document.querySelector(".new-object-popup"));
        displayMedia(media);
    })
    template.querySelector(".new-object-popup").addEventListener("click", (e) => {
        if(e.target.classList.contains("new-object-popup")) {
            document.body.removeChild(document.querySelector(".new-object-popup"));
        }
    })
    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })
    document.body.appendChild(template);
}

async function editMedium(mediaElement) {
    const template = document.querySelector("#newMediumTemplate").content.cloneNode(true);
    template.querySelector("button[type='submit']").innerHTML = "Aktualisieren";
    template.querySelector("#newObjectTitle").value = mediaElement.title;
    template.querySelector("#newObjectAuthor").value = mediaElement.author;
    if (mediaElement.fsk) template.querySelector("#newObjectFsk").value = mediaElement.fsk;
    if (mediaElement.genre) template.querySelector("#newObjectGenre").value = mediaElement.genre;
    if (mediaElement.code) template.querySelector("#newObjectCode").value = mediaElement.code;
    if (mediaElement.isbn) template.querySelector("#newObjectIsbn").value = mediaElement.isbn;

    template.querySelector("#new-object-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        let data = returnMediaArray(template);
        await updateMedia(data, mediaElement);
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })

    template.querySelector(".new-object-popup").addEventListener("click", (e) => {
        if(e.target.classList.contains("new-object-popup")) {
            document.body.removeChild(document.querySelector(".new-object-popup"));
        }
    })

    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })

    document.body.appendChild(template);
}

async function updateMedia(data, mediaElement) {
    try {
        data.id = mediaElement.id;
        const response = await (await fetch("http://localhost:8080/api/media", {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        })).json();
        let idx = media.indexOf(mediaElement);
        media.splice(idx, 1, response);
        displayMedia(media);
    } catch (error) {
        openAlert(error.message || "Es ist etwas schiefgelaufen", "danger", 2000);
    }
}

async function submitNewMedium() {
    let data = returnMediaArray();
    try {
        const response = (await fetch("http://localhost:8080/api/media/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })).json();
        return response;
    } catch (error) {
        openAlert(error.message || "Es ist etwas schiefgelaufen", "danger", 3000);
    }
}

function returnMediaArray() {
    const form = document;
    let data = {
        title: form.querySelector("#newObjectTitle").value,
        author: form.querySelector("#newObjectAuthor").value
    };
    let genre = form.querySelector("#newObjectGenre").value;
    if (genre) data.genre = genre;

    let fsk = form.querySelector("#newObjectFsk").value;
    if (fsk) data.fsk = fsk;

    let code = form.querySelector("#newObjectCode").value;
    if (code) data.code = code;

    let isbn = form.querySelector("#newObjectIsbn").value;
    if (isbn) data.isbn = isbn;

    return data;
}

async function searchForMedia() {
    let value = document.getElementById("searchInput").value;
    if (value.replace(/\s+/g, "") === "") {
        displayMedia(media);
        return;
    }

    if (!isNaN(parseInt(value))) {
        try {
            const response = await fetch("http://localhost:8080/api/media/id/" + value);
            let data = [];
            if (response.ok) data.push(await response.json());
            displayMedia(data);
        } catch (error) {
            this.openAlert(error.message || "Es ist etwas schiefgelaufen", "warning", "3000");
        }
    } else {
        try {
            const response = await (await fetch("http://localhost:8080/api/media/title/" + value)).json();
            displayMedia(response);
        } catch (error) {
            this.openAlert(error.message || "Es ist etwas schiefgelaufen", "warning", "3000");
        }
    }
}

function showLoadingCards() {
    cardGrid.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const template = document.getElementById("skeletonLoaderCard").content.cloneNode(true);
        cardGrid.appendChild(template);
    }
}

function openAlert(message, status, duration) {
    if(timeout){
        clearTimeout(timeout)
    }
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
    timeout = setTimeout(() => {
        closeAlert();
        timeout = null;
    }, duration);
}

function closeAlert() {
    const alertWrapper = document.querySelector(".alert-wrapper");
    const alertItem = alertWrapper.querySelector(".alert-content-wrapper");
    if (alertItem) {
        alertWrapper.style.transform = "translateY(100px)";
        alertItem.remove();
    }
}