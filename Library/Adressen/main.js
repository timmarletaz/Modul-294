let cardGrid = document.getElementById("cardGrid");
let addresses = [];

/**
 * Diese Funktion wird nach dem Laden der Seite ausgeführt. Sie lädt die Adressen und zeigt sie an.
 */
document.addEventListener("DOMContentLoaded", async () => {
    showLoadingCards();
    addresses = await getAddresses();
    displayAddresses(addresses);
})

/**
 * Diese Funktion zeigt alle Adressen, welche über den Parameter mitgegeben werden an
 * @param addressArray -> Array aller Adressen, die angezeigt werden sollen
 */
async function displayAddresses(addressArray) {
    cardGrid.innerHTML = "";
    if (addressArray) {
        for (const address of addressArray.slice().reverse()) {
            const template = document.querySelector("#addressCardTemplate").content.cloneNode(true);
            template.querySelector(".id").textContent = address.id;
            template.querySelector(".address").textContent = address.address;
            template.querySelector(".plz-city").textContent = address.zip + " " + address.city;
            template.querySelector(".delete-button").addEventListener("click", async() => {
                if(confirm("Adresse löschen?")){
                    if(await deleteAddress(address)){
                        addresses.splice(addresses.indexOf(address), 1);
                        openAlert("Adresse erfolgreich gelöscht", "info", 2500);
                        displayAddresses(addresses);
                    }else {
                        openAlert("Adresse kann nicht gelöscht werden", "info", 2500);
                    }
                }
            });
            cardGrid.appendChild(template);
        }
    }
}

/**
 * Mit dieser Funktion kann man nach Adressen suchen.
 * Sie nimmt den Wert des Inputs und überprüft, ob es sich dabei um eine ID oder ein normales Kriterium handelt.
 */
async function searchForAddress(){
    let value = document.getElementById("searchInput").value;
    value = DOMPurify.sanitize(value);
    if (value.replace(/\s+/g, "") === "") {
        displayAddresses(addresses);
        return;
    }
    if(!isNaN(parseInt(value))){
        try {
            const response = await fetch("http://localhost:8080/api/customers/address/id/" + value);
            if(response.ok){
                displayAddresses([await response.json()]);
            }
        } catch (error) {
            openAlert("Es ist etwas schiefgelaufen", "warning", 2500);
        }
    }
    else {
        try {
            const response = await(await fetch("http://localhost:8080/api/customers/address/street", {method: "POST", headers: {"Content-Type": "application/json"}, body: value})).json();
            displayAddresses(response);
        } catch (error) {
            openAlert("Es ist etwas schiefgelaufen", "warning", 2500);
        }
    }
}

/**
 * Mit dieser Funktion lässt sich eine Adresse löschen
 * @param address -> Adresse, welche gelöscht werden soll
 * @returns {Promise<boolean>} -> Status, ob die Adresse gelöscht wurde, oder ob etwas schiefgelaufen ist
 */
async function deleteAddress(address) {
    try {
        const response = await fetch("http://localhost:8080/api/customers/address/delete", {method: "DELETE", headers: {id: address.id}})
        if(response.ok){
            return true;
        }else{
            return false;
        }
    } catch (error) {
        openAlert(error.message || "Es ist etwas schiefgelaufen", "danger", 2500);
        return false;
    }
}

/**
 * Diese Funktion holt sich alle Adressen aus dem Backend
 * @returns {Promise<any>} -> Die Liste der Adressen
 */
async function getAddresses() {
    try {
        const response = await (await fetch("http://localhost:8080/api/customers/address/all")).json();
        return response;
    } catch (error) {
        openAlert(error.message || "Etwas ist schiefgelaufen", "danger", 2500);
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