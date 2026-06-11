const API_URL = "";

let categoria = "ESO";
let textoPDF = "";

let usos = parseInt(localStorage.getItem("estudiaia_usos")) || 0;

function registrarUso(){

  usos++;

  localStorage.setItem("estudiaia_usos", usos);

  if(usos % 5 === 0){
    document.getElementById("popupDonacion").style.display = "block";
  }
}

function cerrarPopup(){
  document.getElementById("popupDonacion").style.display = "none";
}

function setCat(el,c){

  categoria = c;

  document
    .querySelectorAll(".option")
    .forEach(e => e.classList.remove("active"));

  el.classList.add("active");

  document.getElementById("file").value = "";

  document.getElementById("resultado").innerHTML =
    "Esperando PDF...";

  document.getElementById("dropzone").innerHTML =
    "📄 Haz clic o arrastra un PDF aquí";

  textoPDF = "";
}

function format(text){

  return text
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
    .replace(/\n/g,"<br>");
}

async function upload(){

  const file = document.getElementById("file").files[0];

  if(!file){
    return alert("Selecciona un PDF");
  }

  const modo = document.getElementById("modo").value;

  const resBox = document.getElementById("resultado");

  try{

    resBox.innerHTML = "📄 Leyendo PDF...";

    const form = new FormData();

    form.append("file", file);

    const res = await fetch("/upload",{
      method:"POST",
      body:form
    });

    const data = await res.json();

    textoPDF = data.texto;

    if(!textoPDF){

      resBox.innerHTML = "Error leyendo PDF";

      return;
    }

    resBox.innerHTML = "🧠 Generando IA...";

    const resIA = await fetch("/resumir",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        texto:textoPDF,
        categoria,
        modo
      })
    });

    const dataIA = await resIA.json();

    resBox.innerHTML = format(dataIA.resultado);

    registrarUso();

  }catch(err){

    console.error(err);

    resBox.innerHTML = "❌ Error servidor";
  }
}

async function uploadText(){

  const text =
    document.getElementById("userText").value;

  if(!text || text.trim().length < 5){
    return alert("Escribe algo válido");
  }

  const modo =
    document.getElementById("modo").value;

  const resBox =
    document.getElementById("resultado");

  try{

    resBox.innerHTML =
      "🧠 Generando IA...";

    const resIA =
      await fetch("/resumir",{

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        texto:text,
        categoria,
        modo
      })

    });

    const dataIA =
      await resIA.json();

    resBox.innerHTML =
      format(dataIA.resultado);

    registrarUso();

  }catch(err){

    console.error(err);

    resBox.innerHTML =
      "❌ Error servidor";
  }
}

window.addEventListener("DOMContentLoaded",()=>{

  const fileInput =
    document.getElementById("file");

  if(fileInput){

    fileInput.addEventListener("change",(e)=>{

      const name =
        e.target.files[0]?.name;

      if(name){

        document.getElementById("dropzone")
          .innerHTML = "📄 " + name;
      }

    });

  }

});