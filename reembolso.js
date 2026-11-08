/* «Solicitar reembolso» (1.28.23): formulario -> resumen para confirmar -> envío al servicio de licencias -> acuse con
 * la fecha y la hora (imprimible). Sin cookies ni analítica. Los textos vienen en los data-* del formulario. */
(function () {
  "use strict";

  var form = document.getElementById("reembolso-form");
  if (!form) return;
  var estado = document.getElementById("reembolso-estado");
  var caja = document.getElementById("reembolso-confirmar");
  var resumen = document.getElementById("reembolso-resumen");
  var enviar = document.getElementById("reembolso-enviar");
  var acuse = document.getElementById("reembolso-acuse");
  var datos = null;

  function texto(nombre) { return form.getAttribute("data-" + nombre) || ""; }
  function mal(t) { estado.textContent = t; estado.className = "aviso-estado mal"; }
  function etiqueta(campo) { var l = form.querySelector('label[for="' + campo.id + '"]'); return l ? l.textContent : campo.name; }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    estado.textContent = "";
    estado.className = "aviso-estado";
    var correo = form.elements.correo, pedido = form.elements.pedido, motivo = form.elements.motivo, detalle = form.elements.detalle;
    if (!correo.value.trim() || !correo.checkValidity() || pedido.value.trim().length < 3 || !motivo.value) return mal(texto("error"));
    datos = { correo: correo.value.trim(), pedido: pedido.value.trim(), motivo: motivo.value, detalle: detalle.value.trim(),
              idioma: form.getAttribute("data-idioma"), web: form.elements.web.value };
    resumen.textContent = "";
    [[correo, datos.correo], [pedido, datos.pedido], [motivo, motivo.options[motivo.selectedIndex].text], [detalle, datos.detalle || "—"]]
      .forEach(function (par) {
        var dt = document.createElement("dt"); dt.textContent = etiqueta(par[0]);
        var dd = document.createElement("dd"); dd.textContent = par[1];
        resumen.appendChild(dt); resumen.appendChild(dd);
      });
    form.hidden = true;
    caja.hidden = false;
    enviar.focus();
  });

  document.getElementById("reembolso-volver").addEventListener("click", function () {
    caja.hidden = true;
    form.hidden = false;
  });

  enviar.addEventListener("click", function () {
    var endpoint = form.getAttribute("data-endpoint");
    enviar.disabled = true;
    enviar.textContent = texto("enviando");
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.d || !res.d.id) throw new Error("rechazada");
        var fecha = res.d.fecha_texto || new Date(res.d.fecha).toLocaleString(form.getAttribute("data-idioma") === "en" ? "en-GB" : "es-ES");
        document.getElementById("reembolso-acuse-texto").textContent = texto("ok-texto").replace("{fecha}", fecha).replace("{id}", res.d.id);
        document.getElementById("reembolso-acuse-correo").textContent = res.d.acuse_enviado ? texto("ok-correo") : texto("ok-pantalla");
        caja.hidden = true;
        acuse.hidden = false;
        acuse.scrollIntoView({ block: "start" });
      })
      .catch(function () {
        caja.hidden = true;
        form.hidden = false;
        mal(texto("error-red"));
      })
      .then(function () { enviar.disabled = false; enviar.textContent = texto("confirmar"); });
  });
})();
