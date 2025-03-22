const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
const clearBtn = document.getElementById("clearCanvas");
const undoBtn = document.getElementById("undo");
const generateFourierBtn = document.getElementById("generateFourier");

const uploadBtn = document.getElementById("uploadFourier");
const popup = document.getElementById("uploadPopup");
const closePopupBtn = document.getElementById("closePopup");
const confirmUploadBtn = document.getElementById("confirmUpload");
const fourierInput = document.getElementById("fourierInput");

let zoomFactor = 1; // Factor de zoom inicial
const minZoom = 0.01; // Mínimo zoom permitido
const maxZoom = 10;   // Máximo zoom permitido


canvas.width = 600;
canvas.height = 400;
ctx.lineWidth = 2;  // Grosor de la línea
ctx.strokeStyle = "black";  // Color de la línea
ctx.lineCap = "round";  // Extremos redondeados

let drawing = false;
let paths = [];  // Guarda los trazos
let currentPath = [];  // Trazo actual

// Iniciar trazo
canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    currentPath = [];  // Reinicia el trazo actual

    const x = e.offsetX;
    const y = e.offsetY;
    currentPath.push({ x, y });

    ctx.beginPath();  // Iniciar nuevo trazo
    ctx.moveTo(x, y); // Moverse a la posición inicial
});

// Dibujar
canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    const x = e.offsetX;
    const y = e.offsetY;
    currentPath.push({ x, y });

    ctx.lineTo(x, y);
    ctx.stroke();
});

// Finalizar trazo
canvas.addEventListener("mouseup", () => {
    drawing = false;
    if (currentPath.length > 0) {
        paths.push([...currentPath]);  // Guarda el trazo
    }
});

// Borrar todo
clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths = [];
});

// Deshacer último trazo
undoBtn.addEventListener("click", () => {
    if (paths.length > 0) {
        paths.pop();  // Elimina el último trazo
        redrawCanvas();
    }
});

// Redibujar todos los trazos almacenados
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths.forEach(path => {
        if (path.length > 0) {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            path.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
        }
    });
}

function dft(points) {
    let N = points.length;
    let fourier = [];

    for (let k = 0; k < N; k++) {
        let re = 0;  // Parte real
        let im = 0;  // Parte imaginaria

        for (let n = 0; n < N; n++) {
            let theta = (2 * Math.PI * k * n) / N;
            re += points[n].x * Math.cos(theta) + points[n].y * Math.sin(theta);
            im += points[n].y * Math.cos(theta) - points[n].x * Math.sin(theta);
        }

        re /= N;
        im /= N;

        fourier.push({ re, im, freq: k });
    }

    return fourier;
}

generateFourierBtn.addEventListener("click", () => {
    if (paths.length === 0) {
        alert("Dibuja algo antes de generar la Serie de Fourier");
        return;
    }

    let points = [];
    paths.forEach(path => points.push(...path));

    let fourierCoefficients = dft(points);
    console.log("Coeficientes de Fourier:", fourierCoefficients);

    // Guardar en ámbito global para que otras funciones puedan acceder
    window.fourierCoefficients = fourierCoefficients;

    // Generar ecuación en formato LaTeX
    let latexEquation = formatFourierEquationLaTeX(fourierCoefficients);
    
    // Mostrar ecuación en el HTML
    document.getElementById("fourierEquation").innerHTML = `$$${latexEquation}$$`;

    // Recargar MathJax para que renderice la ecuación
    MathJax.typeset();
});



// Abrir el popup
uploadBtn.addEventListener("click", () => {
    popup.style.display = "block";
});

// Cerrar el popup
closePopupBtn.addEventListener("click", () => {
    popup.style.display = "none";
});

// Procesar la serie ingresada
confirmUploadBtn.addEventListener("click", () => {
    let userInput = fourierInput.value.trim();

    try {
        let fourierData = JSON.parse(userInput);  // Intenta parsear como JSON

        if (!fourierData.a0 || !fourierData.terms) {
            alert("Formato incorrecto. Asegúrate de incluir a0 y los términos.");
            return;
        }

        console.log("Serie Cargada:", fourierData);

        // Aquí puedes llamar una función para graficar la serie en el lienzo
        drawFourierFromData(fourierData);

        popup.style.display = "none"; // Cierra el popup
    } catch (error) {
        alert("Error al analizar la serie. Asegúrate de ingresarla en formato JSON válido.");
    }
});


// Función para formatear la ecuación en LaTeX
function formatFourierEquationLaTeX(fourierCoefficients) {
    let equation = "f(x) = ";

    if (fourierCoefficients.length > 0) {
        equation += fourierCoefficients[0].re.toFixed(2); // a_0

        for (let i = 1; i < Math.min(10, fourierCoefficients.length); i++) { // Solo 10 términos
            let { re, im, freq } = fourierCoefficients[i];

            let cosTerm = `${re.toFixed(2)} \\cos(${freq}x)`;
            let sinTerm = `${im.toFixed(2)} \\sin(${freq}x)`;

            equation += ` + ${cosTerm} + ${sinTerm}`;

            // Agregar un salto de línea en LaTeX cada 3 términos
            if (i % 3 === 0) {
                equation += " \\\\ ";
            }
        }
    } else {
        equation = "No hay coeficientes calculados.";
    }

    return equation;
}
document.getElementById("copyEquation").addEventListener("click", function() {
    const equationDiv = document.getElementById("fourierEquation");

    if (equationDiv.innerText.includes("La ecuación aparecerá aquí") || equationDiv.innerText.trim() === "") {
        alert("No hay una ecuación para copiar.");
        return;
    }

    // Extraer el contenido en formato LaTeX
    let equationText = equationDiv.innerText.trim();

    // Reemplazar caracteres especiales para asegurar que se copie correctamente
    equationText = equationText.replace(/\n/g, " "); // Eliminar saltos de línea innecesarios
    equationText = equationText.replace(/\s+/g, " "); // Compactar espacios múltiples

    // Envolver la ecuación en formato LaTeX correcto
    const latexCode = `\\[ ${equationText} \\]`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(latexCode).then(() => {
        alert("Serie copiada en formato LaTeX.");
    }).catch(err => {
        console.error("Error al copiar: ", err);
    });
});

// Función para copiar la serie en formato JSON
function copyFourierAsJSON() {
    // Asegurar que la variable esté disponible en el ámbito global
    if (typeof window.fourierCoefficients === "undefined" || !window.fourierCoefficients.length) {
        alert("No hay coeficientes de Fourier para copiar.");
        return;
    }

    const jsonFourier = {
        a0: window.fourierCoefficients[0].re.toFixed(5),
        terms: window.fourierCoefficients.slice(1, 10).map(term => ({
            re: term.re.toFixed(5),
            im: term.im.toFixed(5),
            freq: term.freq
        }))
    };

    const jsonString = JSON.stringify(jsonFourier, null, 4);

    navigator.clipboard.writeText(jsonString).then(() => {
        alert("Serie copiada en formato JSON.");
    }).catch(err => {
        console.error("Error al copiar: ", err);
    });
}

// Agregar evento al botón de copiado en JSON
document.getElementById("copyEquationJSON").addEventListener("click", copyFourierAsJSON);


// Manejo de botones
document.getElementById("zoomIn").addEventListener("click", () => {
    console.log("Zoom + presionado"); // Ver si el evento se detecta
    if (zoomFactor < maxZoom) {
        zoomFactor *= 1.2;
        drawFourierFromData(window.lastFourierData);
    }
});

document.getElementById("zoomOut").addEventListener("click", () => {
    console.log("Zoom - presionado"); // Ver si el evento se detecta
    if (zoomFactor > minZoom) {
        zoomFactor /= 1.2;
        drawFourierFromData(window.lastFourierData);
    }
});

function drawFourierFromData(fourierData) {
    if (!fourierData) return;
    window.lastFourierData = fourierData; // Guarda los datos para zoom dinámico

    console.log("Dibujando la serie en el lienzo...", fourierData);

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpia el lienzo

    let a0 = parseFloat(fourierData.a0);
    let terms = fourierData.terms.map(term => ({
        re: parseFloat(term.re),
        im: parseFloat(term.im),
        freq: term.freq
    }));

    console.log("a0:", a0);
    console.log("Términos procesados:", terms);

    if (terms.length === 0) {
        console.warn("No hay términos de Fourier, no se puede dibujar.");
        return;
    }

    let centerY = canvas.height / 2;
    let centerX = canvas.width / 2;

    // 📏 Encontrar el valor máximo y mínimo de Y
    let minY = a0, maxY = a0;
    for (let x = 0; x < canvas.width; x++) {
        let sum = a0;
        terms.forEach(({ re, im, freq }) => {
            let angle = (2 * Math.PI * freq * x) / canvas.width;
            sum += re * Math.cos(angle) + im * Math.sin(angle);
        });
        minY = Math.min(minY, sum);
        maxY = Math.max(maxY, sum);
    }

    // 🔍 Ajustar la escala con zoom
    let scale = (canvas.height * 0.4) / Math.max(Math.abs(minY), Math.abs(maxY)) * zoomFactor;
    console.log("Escala ajustada con zoom:", scale);

    // 📈 Dibujar la gráfica con la nueva escala
    ctx.beginPath();
    ctx.moveTo(0, centerY - a0 * scale);

    for (let x = 0; x < canvas.width; x++) {
        let sum = a0;
        terms.forEach(({ re, im, freq }) => {
            let angle = (2 * Math.PI * freq * x) / canvas.width;
            sum += re * Math.cos(angle) + im * Math.sin(angle);
        });

        let y = centerY - sum * scale;
        ctx.lineTo(x, y);
    }

    ctx.stroke();
    console.log("Dibujo completado.");
}