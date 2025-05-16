const cardGrid = document.getElementById("cardGrid");
let media = [];
let customers = [];
let borrowingCustomer;
let timeout;

/**
 * Diese Funktion wird nach dem Laden der Seite ausgeführt. Sie lädt die Medien und Kunden und zeigt sie an.
 */
document.addEventListener("DOMContentLoaded", async () => {
    showLoadingCards();
    media = await getMedia();
    if (media) {
        displayMedia(media);
    }
    customers = await getCustomers();
})

/**
 * Diese Funktion lädt alle Kunden aus dem Backend
 * @returns {Promise<any>} -> Liste aller Medien
 */
async function getCustomers() {
    try {
        return await (await fetch("http://localhost:8080/api/customers/all")).json();
    } catch (error) {
        openAlert(error.message || "Kunden konnten nicht geladen werden", "danger", 3500);
    }
}

/**
 * Diese Funktion lädt alle Medien aus dem Backend
 * @returns {Promise<any>} -> Liste der Medien
 */
async function getMedia() {
    try {
        return await (await fetch("http://localhost:8080/api/media/all")).json();
    } catch (error) {
        openAlert("Es ist etwas schiefgelaufen", "danger", 3000);
    }
}

/**
 * Diese Funktion rendert einen bestimmten Array von Medien
 * @param mediaArray -> Array von zu rendernden Medien
 */
function displayMedia(mediaArray) {
    document.getElementById("cardGrid").style.userSelect = "auto";
    cardGrid.innerHTML = "";
    if (mediaArray) {
        console.log(mediaArray);
        mediaArray.slice().reverse().forEach(mediaElement => {
            const template = document.getElementById("mediaCardTemplate").content.cloneNode(true);
            if (mediaElement.genre) template.querySelector("#genre").textContent = mediaElement.genre;
            const titleElement = template.querySelector("#titel");
            titleElement.childNodes[0].textContent = mediaElement.title;
            if (mediaElement.fsk) template.querySelector(".fsk").textContent = "(FSK " + mediaElement.fsk + ")";
            template.querySelector("#autor").textContent = mediaElement.author;
            if (mediaElement.isbn) template.querySelector("#isbn").textContent = mediaElement.isbn;
            if(mediaElement.borrowed){
                template.querySelector(".availability").style.backgroundColor = "var(--bs-danger)";
            }
            template.querySelector(".edit-button").addEventListener("click", () => {
                editMedium(mediaElement)
            });
            template.querySelector(".delete-button").addEventListener("click", async () => {
                if (confirm("Medium '" + mediaElement.title + "' wirklich löschen?")) {
                    try {
                        const response = await fetch("http://localhost:8080/api/media/" + mediaElement.id, {method: "DELETE"});
                        if(!response.ok) {
                            throw new Error(response.message);
                        }
                        media.splice(media.indexOf(mediaElement), 1);
                        displayMedia(media);
                        openAlert("Erfolgreich gelöscht", "success", 2500);
                    } catch (error) {
                        openAlert("Konnte nicht gelöscht werden. Überprüfen sie die Ausleihen", "danger", 2500);
                    }
                }
            })
            template.querySelector("#borrowButton").addEventListener("click", () => {
                openBorrowWindow(mediaElement);
            })
            cardGrid.appendChild(template);
        })
    }
}

/**
 * Diese Funktion öffnet ein Popup, um ein Medium ausleihen zu können
 * @param mediaElement -> das Medium, welches ausgeliehen wird
 */
function openBorrowWindow(mediaElement) {
    const template = document.getElementById("borrowWindowTemplate").content.cloneNode(true);
    template.querySelector(".genre").textContent = mediaElement.genre || "";
    template.querySelector(".fsk").textContent = mediaElement.fsk || "";
    template.querySelector(".title-author").innerHTML = `${mediaElement.title}<br>${mediaElement.author}`;
    template.querySelector(".isbn").textContent = mediaElement.isbn;
    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector("#borrowPopup"));
    })
    template.querySelector("button[type='submit']").addEventListener("click", async () => {
        if (!borrowingCustomer) {
            openAlert("Kein Kunde ausgewählt", "warning", 3000);
        } else {
            try {
                const response = await submitNewBorrowing(borrowingCustomer.id, mediaElement.id);
                console.log(response.status);
                if (response.status !== 200) {
                    console.log(response);
                    throw new Error(response.message);
                }
                let copy = {...mediaElement};
                copy.borrowed = true;
                media.splice(media.indexOf(mediaElement), 1, copy);
                displayMedia(media);
                openAlert("Ausleihe getätigt", "success", 2500);
            } catch (error) {
                openAlert(error.message || "Medium ist bereits ausgeliehen", "info", 2500);
            }
            document.body.removeChild(document.querySelector("#borrowPopup"));
            borrowingCustomer = null;
        }
    })
    template.querySelector("#borrowPopup").addEventListener("click", (e) => {
        if (e.target.id === "borrowPopup") {
            document.body.removeChild(document.querySelector("#borrowPopup"));
        }
    })
    document.body.appendChild(template);
    renderBorrowCustomers(customers.slice(0, 10));
}

/**
 * Mit dieser Funktion wird eine neue Ausleihe an das Backend geschickt
 * @param customerId
 * @param mediaId
 * @returns {Promise<Response>}
 */
async function submitNewBorrowing(customerId, mediaId) {
    try {
        const response = await fetch("http://localhost:8080/api/borrowing", {
            method: "POST",
            headers: {mediaId: mediaId, customerId: customerId}
        })
        return response;
    } catch (error) {
        openAlert(error.message || "Ausleihe konnte nicht getätigt werden", "danger", 3000);
    }
}

/**
 * Diese Funktion wird verwendet, um bestimmte Kunden innerhalb des Ausleihe Fensters anzuzeigen
 * @param customerArray
 */
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

/**
 * Mit dieser Funktion kann man innerhalb des Ausleihe-Fensters nach bestimmten Benutzern suchen
 */
function searchForCustomer() {
    let value = document.getElementById("borrowingCustomerSearch").value.trim().toLowerCase();
    value = DOMPurify.sanitize(value);
    let data = customers.filter(customer => {
        return (customer.firstname.trim().toLowerCase().includes(value) || customer.lastname.trim().toLowerCase().includes(value) || customer.id.toString() === value);
    });
    renderBorrowCustomers(data);
}

/**
 * Diese Funktion erlaubt es einem, ein neues Medium anzulegen
 */
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
        if (e.target.classList.contains("new-object-popup")) {
            document.body.removeChild(document.querySelector(".new-object-popup"));
        }
    })
    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })
    document.body.appendChild(template);
}

/**
 * Mit dieser Funktion lässt sich ein bereits existierendes Medium bearbeiten
 * @param mediaElement -> zu bearbeitendes Medium
 * @returns {Promise<void>} -> Neues Medium
 */
async function editMedium(mediaElement) {
    const template = document.querySelector("#newMediumTemplate").content.cloneNode(true);
    template.querySelector("button[type='submit']").innerHTML = "Speichern";
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
        if (e.target.classList.contains("new-object-popup")) {
            document.body.removeChild(document.querySelector(".new-object-popup"));
        }
    })

    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })

    document.body.appendChild(template);
}

/**
 * Diese Funktion gibt ein bearbeitetes Medium an das Backend weiter
 * @param data -> Informationen des bearbeitenden Mediums
 * @param mediaElement -> Altes Medium
 * @returns {Promise<void>} -> neues Medium-Objekt
 */
async function updateMedia(data, mediaElement) {
    try {
        data.id = mediaElement.id;
        const response = await fetch("http://localhost:8080/api/media", {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });
        if (!response.ok) {
           throw new Error(response.message);
        }
        let responseData = await response.json();
        let idx = media.indexOf(mediaElement);
        media.splice(idx, 1, responseData);
        openAlert("Erfolgreich geändert", "success", 2500);
        displayMedia(media);
    } catch (error) {
        openAlert(error.message || "Es ist etwas schiefgelaufen", "danger", 2000);
    }
}

/**
 * Diese Funktion gibt ein neues Medium an das Backend weiter
 * @returns {Promise<any>} -> Neues Medium-Objekt
 */
async function submitNewMedium() {
    let data = returnMediaArray();
    try {
        const response = await fetch("http://localhost:8080/api/media/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        if(!response.ok){
            throw new Error(response.message);
        }
        return await response.json();
    } catch (error) {
        openAlert(error.message || "Es ist etwas schiefgelaufen", "danger", 3000);
    }
}

/**
 * Diese Funktion gibt die Werte des Erstellungs-/Bearbeitungsformulars zurück
 * @returns {{author: *, title: *}} -> Array aller gültigen Werte
 */
function returnMediaArray() {
    const form = document;
    let data = {
        title: DOMPurify.sanitize(form.querySelector("#newObjectTitle").value),
        author: DOMPurify.sanitize(form.querySelector("#newObjectAuthor").value)
    };
    let genre = DOMPurify.sanitize(form.querySelector("#newObjectGenre").value);
    if (genre) data.genre = genre;

    let fsk = DOMPurify.sanitize(form.querySelector("#newObjectFsk").value);
    if (fsk) data.fsk = fsk;

    let code = DOMPurify.sanitize(form.querySelector("#newObjectCode").value);
    if (code) data.code = code;

    let isbn = DOMPurify.sanitize(form.querySelector("#newObjectIsbn").value);
    if (isbn) data.isbn = isbn;

    return data;
}

/**
 * Mit dieser Funktion kann man nach einem Medium suchen
 */
async function searchForMedia() {
    let value = document.getElementById("searchInput").value;
    value = DOMPurify.sanitize(value);
    if (value.replace(/\s+/g, "") === "") {
        displayMedia(media);
        return;
    }

    if (!isNaN(parseInt(value))) {
        try {
            const response = await fetch("http://localhost:8080/api/media/id/" + value);
            let data = [];
            console.log(response);
            if (!response.ok){
                displayMedia(null);
                return;
            }
            data.push(await response.json());
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

/**
 * Diese Funktion zeigt die Skeleton-Karten an
 */
function showLoadingCards() {
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
    if (timeout) {
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