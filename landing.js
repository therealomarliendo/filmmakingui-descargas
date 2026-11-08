/* Web de FilmmakingUI: formulario «Cursos — próximamente» y versión de la página de descarga.
 * Sin cookies ni analítica. El formulario solo envía el correo (y el consentimiento) al servicio de licencias. */
(function () {
  "use strict";

  var form = document.getElementById("aviso-cursos");
  if (form) {
    var estado = document.getElementById("aviso-estado");
    var enviar = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var correo = form.elements.correo.value.trim();
      estado.className = "aviso-estado";
      if (!form.elements.correo.checkValidity() || !correo || !form.elements.consentimiento.checked) {
        estado.textContent = form.getAttribute("data-error");
        estado.className = "aviso-estado mal";
        return;
      }
      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) { estado.textContent = form.getAttribute("data-error-red"); estado.className = "aviso-estado mal"; return; }
      enviar.disabled = true;
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo, consentimiento: true, idioma: form.getAttribute("data-idioma"), web: form.elements.web.value }),
      }).then(function (r) {
        if (r.ok) {
          estado.textContent = form.getAttribute("data-ok");
          estado.className = "aviso-estado bien";
          form.elements.correo.value = "";
          form.elements.consentimiento.checked = false;
          return;
        }
        estado.textContent = form.getAttribute("data-error");
        estado.className = "aviso-estado mal";
      }).catch(function () {
        estado.textContent = form.getAttribute("data-error-red");
        estado.className = "aviso-estado mal";
      }).then(function () { enviar.disabled = false; });
    });
  }

  // Galería «Hecho con FilmmakingUI»: cada vídeo se reproduce solo mientras está a la vista (y nunca con «reducir movimiento»).
  var videos = document.querySelectorAll(".hecho-item video");
  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (videos.length && "IntersectionObserver" in window && !quieto) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: 0.35 });
    videos.forEach(function (v) { obs.observe(v); });
  }

  // Espejo (8-nov-2026): si el servidor de descargas (R2, en Cloudflare) no responde, se enseña el aviso con los
  // enlaces de GitHub. Solo se comprueba si el instalador está en este mismo sitio (en el espejo no hace falta).
  var espejo = document.getElementById("descarga-espejo");
  function mostrarEspejo() { if (espejo) espejo.hidden = false; }
  if (espejo && espejo.getAttribute("data-comprobar")) {
    try {
      var comprobar = new URL(espejo.getAttribute("data-comprobar"), location.href);
      if (comprobar.origin === location.origin && window.fetch) {
        var opciones = { method: "HEAD", cache: "no-store" };
        if (window.AbortSignal && AbortSignal.timeout) opciones.signal = AbortSignal.timeout(8000);
        fetch(comprobar.href, opciones).then(function (r) { if (!r.ok) mostrarEspejo(); }).catch(mostrarEspejo);
      }
    } catch (e) { /* URL rara: no se comprueba */ }
  }

  var descarga = document.querySelector(".descarga[data-manifiesto]");
  if (descarga) {
    var url = descarga.getAttribute("data-manifiesto");
    var version = document.getElementById("descarga-version");
    if (url) {
      fetch(url, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (m) {
        if (!m || typeof m.version !== "string") return Promise.reject();
        version.textContent = m.version + (m.fecha ? " (" + m.fecha + ")" : "");
        var instalador = m.archivos && m.archivos.instalador;
        if (instalador && instalador.sha256) {
          document.getElementById("descarga-sha-valor").textContent = instalador.sha256;
          document.getElementById("descarga-sha").hidden = false;
        }
      }).catch(function () { version.textContent = "—"; mostrarEspejo(); });
    } else {
      version.textContent = "—";
    }
  }

  // Origen (?ref= o ?utm_source=): si la página llegó con uno, se añade a los enlaces internos al pulsarlos (descarga,
  // /ir/… y /descargas/…), así el contador del servidor sabe de qué tienda o directorio viene la descarga. No se guarda
  // nada en el navegador: ni cookies ni almacenamiento local; si cierras la pestaña, se pierde.
  var params = new URLSearchParams(location.search);
  var ref = (params.get("ref") || params.get("utm_source") || "").trim().toLowerCase();
  if (/^[a-z0-9_-]{1,30}$/.test(ref)) {
    document.addEventListener("click", function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!a) return;
      var destino;
      try { destino = new URL(a.getAttribute("href"), location.href); } catch (e) { return; }
      if (destino.origin !== location.origin || destino.searchParams.has("ref")) return;
      if (destino.pathname === location.pathname && destino.hash) return; // anclas de la misma página (#precios)
      if (!/^\/(ir\/|descargas\/|descarga|en\/download|$|en\/?$|index)/.test(destino.pathname)) return;
      destino.searchParams.set("ref", ref);
      a.setAttribute("href", destino.pathname + destino.search + destino.hash);
    }, true);
  }
})();
