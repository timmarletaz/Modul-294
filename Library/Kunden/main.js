const cardGrid = document.getElementById("cardGrid");
let customers = {}

/**
 * Diese Funktion wird nach dem Laden der Seite ausgeführt. Sie lädt die Kunden und zeigt sie an.
 */
document.addEventListener("DOMContentLoaded", async () => {
    showLoadingCards();
    customers = await getCustomers();
    if (customers) {
        displayCustomers(customers);
    }
})

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
 * Diese Funktion rendert alle Kunden aus einem mitgegebenen Array
 * @param customerArray -> Array mit Kunden, die gerendert werden sollen
 */
function displayCustomers(customerArray) {
    if (customerArray) {
        cardGrid.innerHTML = "";
        customerArray.slice().reverse().forEach((customer, index) => {
            const template = document.getElementById("customerCardTemplate").content.cloneNode(true);
            template.querySelector("#customerId").textContent = customer.id;
            template.querySelector("#name").childNodes[0].textContent = customer.firstname + " " + customer.lastname;
            let date = new Date(customer.birthdate);
            template.querySelector("#birthdate").textContent = String(date.getDate()).padStart(2, '0') + "." + String(date.getMonth() + 1).padStart(2, '0') + "." + date.getFullYear();
            template.querySelector("#email").textContent = customer.email;
            template.querySelector("#addressWrapper #street").textContent = customer.address.address;
            template.querySelector("#addressWrapper #place").textContent = customer.address.city;
            template.querySelector("#addressWrapper #plz").textContent = customer.address.zip;
            template.querySelector("#addressWrapper").id = `addressWrapper-${index}`;
            template.querySelector("#icon").id = `icon-${index}`;
            template.querySelector("#collapse").setAttribute("data-bs-target", `#addressWrapper-${index}`);
            //TODO link machen zu allen Ausleihen mit ID oder so
            template.querySelector(`#addressWrapper-${index}`).addEventListener("show.bs.collapse", () => {
                document.querySelector(`#icon-${index}`).style.transform = "rotate(180deg)";
            })
            template.querySelector(`#addressWrapper-${index}`).addEventListener("hide.bs.collapse", () => {
                document.querySelector(`#icon-${index}`).style.transform = "rotate(0)";
            })
            template.querySelector(".edit-button").addEventListener("click", () => {
                editCustomer(customer)
            });
            template.querySelector(".delete-button").addEventListener("click", () => {
                deleteCustomer(customer);
            })
            cardGrid.appendChild(template);
        })
    }
}

/**
 * Diese Funktion beinhaltet das Löschen eines Kunden
 * @param customer -> Kunde, welcher gelöscht werden soll
 */
async function deleteCustomer(customer) {
    if (confirm("Möchten sie den User (" + customer.id + "): " + customer.firstname + " " + customer.lastname + " endgültig löschen?")) {
        try {
            await fetch("http://localhost:8080/api/customers/delete", {method: "DELETE", headers: {id: customer.id}})
            customers.splice(customers.indexOf(customer), 1);
            displayCustomers(customers);
            openAlert("Kunde wurde gelöscht", "info", 2000);
        } catch (error) {
            openAlert("Kunde konnte nicht gelöscht werden", "warning", 2500);
        }
    }
}

/**
 * Mit dieser Funktion kann man einen neuen Kunden erfassen
 */
async function addNewCustomer() {
    const template = document.getElementById("newCustomerTemplate").content.cloneNode(true);
    template.querySelector("#new-object-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        let data = returnFormData();
        const response = await submitNewCustomer(data);
        customers.push(response);
        openAlert("Kunde erfolgreich erfasst", "success", 2500);
        document.body.removeChild(document.querySelector(".new-object-popup"));
        displayCustomers(customers);
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
 * Diese Funktion gibt einen neuen Kunden an das Backend, um ihn zu speichern
 * @param data -> Kunde, welcher gespeichert werden soll
 * @returns {Promise<any>} -> Objekt des neuen Kunden
 */
async function submitNewCustomer(data) {
    try {
        return await (await fetch("http://localhost:8080/api/customers/create", {
            method: "POST", headers: {
                "Content-Type": "application/json"
            }, body: JSON.stringify(data)
        })).json();
    } catch (error) {
        openAlert("User konnte nicht erstellt werden", "danger", 3000);
    }
}

/**
 * Diese Funktion erlaubt es einem nach einem Kunden (mit ID oder Nachnamen) zu suchen
 * @returns {Promise<void>} -> Liste der korrespondierenden Kunden
 */
async function searchForCustomer() {
    let value = document.querySelector("#searchInput").value;
    value = DOMPurify.sanitize(value);
    if (value.replace(/\s+/g, "") === "") {
        displayCustomers(customers);
        return;
    }

    if (!isNaN(parseInt(value))) {
        try {
            const response = await fetch("http://localhost:8080/api/customers/id/" + value);
            let data = [];
            if (response.ok) data.push(await response.json());
            displayCustomers(data);
        } catch (error) {
            this.openAlert(error.message, "warning", "3000");
        }
    } else {
        try {
            const response = await (await fetch("http://localhost:8080/api/customers/lastname/" + value)).json();
            displayCustomers(response);
        } catch (error) {
            this.openAlert(error.message, "warning", "3000");
        }
    }
}

/**
 * Diese Funktion gibt die Daten des Formulars zur Erfassung/Bearbeitung eines Kunden zurück.
 * @returns {{firstname: *, birthdate: *, address: {zip: *, address: *, city: *}, email: *, lastname: *}} -> Array der Formulardaten
 */
function returnFormData() {
    return {
        firstname: DOMPurify.sanitize(document.querySelector("#newObjectFirstname").value),
        lastname: DOMPurify.sanitize(document.querySelector("#newObjectLastname").value),
        birthdate: DOMPurify.sanitize(document.querySelector("#newObjectBirthdate").value),
        email: DOMPurify.sanitize(document.querySelector("#newObjectEmail").value),
        address: {
            address: DOMPurify.sanitize(document.querySelector("#newObjectStreet").value),
            city: DOMPurify.sanitize(document.querySelector("#newObjectCity").value),
            zip: DOMPurify.sanitize(document.querySelector("#newObjectPlz").value)
        }
    };
}

/**
 * Mit dieser Funktion lässt sich ein bereits bestehender Kunde bearbeiten
 * @param customer -> Aktualisiertes Kundenobjekt
 */
function editCustomer(customer) {
    const template = document.querySelector("#newCustomerTemplate").content.cloneNode(true);
    template.querySelector("#newObjectFirstname").value = customer.firstname;
    template.querySelector("#newObjectLastname").value = customer.lastname;
    template.querySelector("#newObjectEmail").value = customer.email;
    template.querySelector("#newObjectBirthdate").value = formatDate(customer.birthdate.toString());
    template.querySelector("#newObjectStreet").value = customer.address.address;
    template.querySelector("#newObjectCity").value = customer.address.city;
    template.querySelector("#newObjectPlz").value = customer.address.zip;
    template.querySelector("button[type='submit']").textContent = "Speichern";

    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })

    template.querySelector(".new-object-popup").addEventListener("click", (e) => {
        if (e.target.classList.contains("new-object-popup")) {
            document.body.removeChild(document.querySelector(".new-object-popup"));
        }
    })

    template.querySelector("#new-object-form").addEventListener("submit", async (e) => {
        event.preventDefault();
        let editedCustomer = await submitCustomerChanges(customer);
        customers.splice(customers.indexOf(customer), 1, editedCustomer);
        displayCustomers(customers);
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })

    document.body.appendChild(template);
}

/**
 * Diese Funktion gibt die Änderungen, welche an einem Kunden vorgenommen wurden, an das Backend weiter
 * @param customer -> Kunde der aktualisiert wurde
 * @returns {Promise<any>} -> Neues Kundenobjekt
 */
async function submitCustomerChanges(customer) {
    let data = returnFormData();
    data.id = customer.id;
    try {
        const response = await (await fetch("http://localhost:8080/api/customers/update", {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        })).json();
        openAlert("Erfolgreich geändert", "info", 2500);
        return response;
    } catch (error) {
        openAlert(error.message, "warning", 3000);
    }
}

/**
 * Diese Funktion formatiert ein bestimmtes Datum im Format (DD.MM.YYYY)
 * @param dateString -> Datum, welches formatiert werden soll
 * @returns {string} -> Formatiertes Datum
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // Format für <input type="date">
}

/**
 * Diese Funktion gibt eine Liste aller Kunden zurück
 * @returns {Promise<any>} -> Liste aller Kunden
 */
async function getCustomers() {
    try {
        const response = await (await fetch("http://localhost:8080/api/customers/all")).json();
        return response;
    } catch (error) {
        openAlert("Etwas ist schiefgelaufen", "danger", 3000);
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