let template = document.getElementById("listItemTemplate");
let input = document.getElementById("todoField");
let list = document.getElementById("todoList");

input.addEventListener("keydown", (event) => {
    if(event.key == "Enter"){
        addTodo();
    }
})

function addTodo(){
    if(todoField.value.replace(/\s/g, "") !== ""){
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector("#cardTarget");
        item.querySelector("#itemContent").innerHTML = todoField.value;
        item.querySelector(".img-wrapper").addEventListener("click", () => {
            item.remove();
        })

        list.appendChild(item);
        input.value = "";
    }else{
        document.getElementById("errorText").innerHTML = "Feld darf nicht leer sein";
        document.getElementById("alert").style.transform = "translateY(0)";
        setTimeout(() => {

        })
    }
}

function closeError() {
    document.querySelector("#alert").style.transform = "translateY(100px)";
}
