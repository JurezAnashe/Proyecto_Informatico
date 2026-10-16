function abrirVentana(nombre, apellido, edad, posicion, valor, dorsal, descripcion) {
    document.getElementById("ventana-nombre").innerText = nombre + " " + apellido;
    
    document.getElementById("ventana-dorsal").innerText = dorsal;
    document.getElementById("ventana-posicion").innerText = posicion;
    document.getElementById("ventana-edad").innerText = edad;
    document.getElementById("ventana-valor").innerText = valor; 
    
    let modalDesc = document.getElementById("ventana-descripcion");
    if (modalDesc) {
        modalDesc.style.display = "none";
    }

    let listaDatos = document.querySelectorAll(".lista-datos li");
    listaDatos.forEach(function(li) {
        if (li.innerText.includes("Club Actual")) {
            li.innerHTML = "<strong>Club Actual:</strong> Popiteam FC";
        }
    });
    
    document.getElementById("ventanaJugador").style.display = "block";
}

function cerrarVentana() {
    document.getElementById("ventanaJugador").style.display = "none";
}

window.onclick = function(event) {
    let ventana = document.getElementById("ventanaJugador");
    if (event.target == ventana) {
        ventana.style.display = "none";
    }
}