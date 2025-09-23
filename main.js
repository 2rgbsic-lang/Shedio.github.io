let materiasData = {};
let currentUser = null;
let selectedCellId = null;
let assignments = {};

function init() {
  ["horarioSection","infoSection","chatSection"].forEach(id =>
    document.getElementById(id).classList.add("hidden")
  );
  document.getElementById("loginSection").classList.remove("hidden");
  ["selectModal","infoModal"].forEach(id =>
    document.getElementById(id).classList.add("hidden")
  );
}
window.onload = init;

async function loadData() {
  const res = await fetch("data/materias.json");
  materiasData = await res.json();

  // 🔹 Llenamos la lista de grados dinámicamente
  llenarListaGrados();
}
loadData();

function llenarListaGrados() {
  const select = document.getElementById("gradoInput");
  select.innerHTML = '<option value="">-- Selecciona tu grado --</option>';

  if (!materiasData.profesores) return;

  // Sacamos todos los grados únicos
  const grados = new Set();
  materiasData.profesores.forEach(p => {
    p.grados.forEach(g => grados.add(g.trim().toUpperCase()));
  });

  // Insertamos opciones
  grados.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    select.appendChild(opt);
  });
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle('active'); 
}

function showSection(section) {
  ["horario","info","chat"].forEach(s =>
    document.getElementById(s+"Section").classList.add("hidden")
  );
  document.getElementById(section + "Section").classList.remove("hidden");
  toggleSidebar();
}

function login() {
  const nombre = document.getElementById("nombreInput").value.trim();
  const grado = document.getElementById("gradoInput").value.trim();
  if (!nombre || !grado) { alert("Por favor ingresa nombre y grado"); return; }

  currentUser = { nombre, grado: grado.toUpperCase() };
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("horarioSection").classList.remove("hidden");
  document.getElementById("welcomeTitle").innerText =
    `Hola ${nombre}, este es tu horario (${currentUser.grado})`;
  buildHorario();
}



function buildHorario() {
  const table = document.getElementById("horarioTable");
  table.innerHTML = "";
  const days = ["Día 1","Día 2","Día 3","Día 4","Día 5"];
  const hours = ["Hora 1","Hora 2","Hora 3","Descanso","Hora 4","Hora 5","Hora 6"];

  const headerRow = document.createElement("tr");
  headerRow.appendChild(document.createElement("th"));
  days.forEach(d => {
    const th = document.createElement("th");
    th.innerText = d;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  hours.forEach((h, hi) => {
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.innerText = h;
    row.appendChild(th);

    days.forEach((d, di) => {
      const td = document.createElement("td");
      td.id = `cell-${hi}-${di}`;

      if (h.toLowerCase() === "descanso") {
        td.textContent = "—";
        td.classList.add("descanso");
      } else {
        td.innerHTML = "<span class='plus'>+</span>";
        td.onclick = () => { selectedCellId = td.id; showSelectModal(); };
      }

      row.appendChild(td);
    });

    table.appendChild(row);
  });
}

function getMateriasPorGrado(grado) {
  if(!materiasData.profesores) return [];
  return materiasData.profesores
    .filter(p => p.grados.some(g => g.trim().toUpperCase() === grado))
    .map(p => ({
      id: p.materia.toLowerCase().replace(/\s+/g,'_'),
      nombre: p.materia,
      color: generarColorMateria(p.materia),
      descripcion: p.tipo_ensenanza,
      profesor: { nombre: p.nombre, correo: p.correo, foto: p.foto, plan_aula: p.plan_aula }
    }));
}

function generarColorMateria(nombre) {
  const colores = {
    "inglés": "#34d399",
    "ciencias naturales / química": "#a855f7",
    "física / matemáticas": "#ef4444",
    "matemáticas / geometría": "#f59e0b",
    "filosofía / sociales": "#3b82f6",
    "educación física": "#10b981",
    "español": "#60a5fa"
  };
  return colores[nombre.toLowerCase()] || "#6366f1";
}

function showSelectModal(){
  const materiasList = document.getElementById("materiasList");
  materiasList.innerHTML = '';
  const list = getMateriasPorGrado(currentUser?.grado);
  if(!list.length){
    materiasList.innerHTML = '<p>No hay materias para este grado</p>';
  } else {
    list.forEach(m => {
      const card = document.createElement('div');
      card.classList.add("materia-card");
      card.style.background = m.color + "20";
      card.innerHTML = `
        <div class="materia-nombre" style="color:${m.color}">${m.nombre}</div>
        <div class="materia-profesor">${m.profesor.nombre}</div>
      `;
      card.onclick = () => {
        assignMateriaToCell(selectedCellId, m.id, m);
        hideModal('selectModal');
      };
      materiasList.appendChild(card);
    });
  }
  showModal('selectModal');
}

function assignMateriaToCell(cellId, materiaId, materiaData){
  const td = document.getElementById(cellId);
  td.innerHTML = `
    <div><b>${materiaData.nombre}</b></div>
    <div style="font-size:12px; color:#444">${materiaData.profesor.nombre}</div>
  `;
  td.style.background = materiaData.color + "33";
  td.onclick = () => { selectedCellId = cellId; showInfoModal(materiaId); };
  assignments[cellId] = materiaData;
}

function showInfoModal(materiaId){
  const infoContent = document.getElementById("infoContent");
  infoContent.innerHTML = "";
  const full = getMateriasPorGrado(currentUser.grado).find(m => m.id === materiaId);
  if(!full) return;

  const title = document.createElement("h3");
  title.innerText = full.nombre;

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.gap = "12px";

  const img = document.createElement("img");
  img.src = full.profesor.foto || "https://via.placeholder.com/100x100?text=Profe";
  img.style.maxWidth = "100px";
  img.style.borderRadius = "8px";

  const right = document.createElement("div");
  right.innerHTML = `
    <p><strong>Profesor:</strong> ${full.profesor.nombre}</p>
    <p><strong>Correo:</strong> ${full.profesor.correo}</p>
    <p><strong>Metodología:</strong><br/>${full.descripcion}</p>
    ${full.profesor.plan_aula ? `<p><a href="${full.profesor.plan_aula}" target="_blank">📄 Ver plan de aula</a></p>` : ''}
  `;

  wrapper.appendChild(img);
  wrapper.appendChild(right);
  infoContent.appendChild(title);
  infoContent.appendChild(wrapper);
  showModal("infoModal");
}

// 📸 Exportar a JPG
function exportToJPG() {
  const horario = document.getElementById("horarioTable");
  html2canvas(horario).then(canvas => {
    const link = document.createElement("a");
    link.download = "horario.jpg";
    link.href = canvas.toDataURL("image/jpeg");
    link.click();
  });
}

// 📄 Exportar a PDF
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const horario = document.getElementById("horarioTable");

  html2canvas(horario).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4"); 
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 10, 10, pdfWidth - 20, pdfHeight);
    pdf.save("horario.pdf");
  });
}

// 📊 Exportar a Excel
function exportToExcel() {
  const table = document.getElementById("horarioTable");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Horario" });
  XLSX.writeFile(wb, "horario.xlsx");
}

function showModal(id){ document.getElementById(id).classList.remove("hidden"); }
function hideModal(id){ document.getElementById(id).classList.add("hidden"); }

function sendMessage(){
  const input = document.getElementById("chatInput");
  if(!input.value.trim()) return;
  const div = document.createElement("div");
  div.innerText = `${currentUser.nombre}: ${input.value}`;
  document.getElementById("messages").appendChild(div);
  input.value = "";
}

// ======== MENÚ LATERAL ========
const menuIcon = document.querySelector(".menu-icon");
const sidebar = document.querySelector(".sidebar");

menuIcon.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// ======== FORZAR SELECT HACIA ABAJO ========
const gradoInput = document.getElementById("gradoInput");
gradoInput.setAttribute("size", "1"); // mantiene estilo normal

gradoInput.addEventListener("mousedown", function () {
  this.size = 5; // muestra 5 opciones máximo
});

gradoInput.addEventListener("blur", function () {
  this.size = 1; // vuelve al modo normal
});

