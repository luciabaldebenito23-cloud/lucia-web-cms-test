/* =========================================================================
   Lucía Baldebenito — Corretaje Inmobiliario & LB Consultora
   script.js — Interactividad en JavaScript vanilla
   Contenido:
     1. Menú móvil (hamburguesa)
     2. Cierre de menú al navegar + link activo
     3. Filtros de propiedades
     4. Validación de formularios (Tasación y Contacto)
     5. Buscador simulado del hero
     6. Utilidades varias (año del footer, sombra de header al hacer scroll)
   ========================================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* -----------------------------------------------------------------------
     1. MENÚ MÓVIL (HAMBURGUESA)
     ----------------------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primaryNav');

  function closeMenu() {
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
    document.body.style.overflow = '';
    closeAllDropdowns();
  }

  function openMenu() {
    primaryNav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    document.body.style.overflow = 'hidden';
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = primaryNav.classList.contains('is-open');
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });

    /* 2. Cerrar el menú al elegir un link (solo relevante en mobile) */
    var navLinks = primaryNav.querySelectorAll('a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    /* Cerrar con la tecla Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (primaryNav.classList.contains('is-open')) { closeMenu(); }
        closeAllDropdowns();
      }
    });

    /* Si el usuario agranda la ventana a escritorio, aseguramos estado limpio */
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960) { closeMenu(); }
    });
  }

  /* -----------------------------------------------------------------------
     1b. DESPLEGABLES DEL MENÚ
     Servicios, Consultoría y Propiedades son, cada uno, un link normal
     (lleva directo a su sección) MÁS un botón de flechita aparte que solo
     abre/cierra su submenú — los dos funcionan de forma independiente.
     En mobile el submenú es un acordeón dentro del panel; en desktop el
     de primer nivel flota como panel y uno anidado (Consultoría) queda
     como acordeón adentro de ese panel.
     ----------------------------------------------------------------------- */
  var navDropdownTriggers = document.querySelectorAll('.nav-dropdown-caret');

  function closeDropdown(trigger) {
    trigger.setAttribute('aria-expanded', 'false');
    var head = trigger.closest('.nav-dropdown-head');
    var menu = head ? head.nextElementSibling : null;
    if (menu) { menu.classList.remove('is-open'); }
  }

  function openDropdown(trigger) {
    trigger.setAttribute('aria-expanded', 'true');
    var head = trigger.closest('.nav-dropdown-head');
    var menu = head ? head.nextElementSibling : null;
    if (menu) { menu.classList.add('is-open'); }
  }

  function closeAllDropdowns() {
    navDropdownTriggers.forEach(function (t) { closeDropdown(t); });
  }

  navDropdownTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = trigger.getAttribute('aria-expanded') === 'true';

      if (isOpen) {
        closeDropdown(trigger);
        return;
      }

      /* Al abrir, cerramos los desplegables "hermanos" del mismo nivel
         (pero no el desplegable padre, si este es uno anidado) */
      var parentMenu = trigger.closest('.nav-dropdown-menu');
      navDropdownTriggers.forEach(function (t) {
        if (t === trigger) { return; }
        var sameLevel = parentMenu ? parentMenu.contains(t) : !t.closest('.nav-dropdown-menu');
        if (sameLevel) { closeDropdown(t); }
      });

      openDropdown(trigger);
    });
  });

  /* Cerrar los desplegables al hacer click afuera (relevante en desktop,
     donde el panel de Servicios flota sobre el contenido) */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-dropdown')) {
      closeAllDropdowns();
    }
  });

  /* -----------------------------------------------------------------------
     LINK ACTIVO SEGÚN LA SECCIÓN VISIBLE
     ----------------------------------------------------------------------- */
  var sections = document.querySelectorAll('main section[id]');
  var navAnchors = document.querySelectorAll('.nav-link');

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          navAnchors.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* -----------------------------------------------------------------------
     SOMBRA / ESTILO DEL HEADER AL HACER SCROLL
     ----------------------------------------------------------------------- */
  var header = document.getElementById('site-header');
  function updateHeaderShadow() {
    if (!header) return;
    if (window.scrollY > 12) {
      header.style.boxShadow = '0 6px 20px rgba(13, 44, 74, 0.08)';
    } else {
      header.style.boxShadow = 'none';
    }
  }
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });
  updateHeaderShadow();

  /* -----------------------------------------------------------------------
     3. FILTROS DE PROPIEDADES
     Chips rápidos (operación y tipo) + panel de "Más filtros" (tipo, estado,
     precio, apta crédito, barrio, ciudad). Los desplegables de tipo, estado,
     barrio y ciudad se arman solos leyendo los data-* de las propiedades
     que ya están cargadas, así que se van completando a medida que se
     suben propiedades nuevas, sin tocar código.
     ----------------------------------------------------------------------- */
  var filterChips = document.querySelectorAll('.filter-chip');
  var propertyCards = document.querySelectorAll('.property-card');
  var emptyState = document.getElementById('propertiesEmpty');

  var filtersToggle = document.getElementById('filtersToggle');
  var advancedFilters = document.getElementById('advancedFilters');
  var filterTipoSelect = document.getElementById('filterTipo');
  var filterEstadoSelect = document.getElementById('filterEstado');
  var filterBarrioSelect = document.getElementById('filterBarrio');
  var filterCiudadSelect = document.getElementById('filterCiudad');
  var filterAptaCreditoSelect = document.getElementById('filterAptaCredito');
  var filterPrecioMin = document.getElementById('filterPrecioMin');
  var filterPrecioMax = document.getElementById('filterPrecioMax');
  var filtersClear = document.getElementById('filtersClear');

  var TIPO_LABELS = {
    casa: 'Casa',
    departamento: 'Departamento',
    terreno: 'Terreno',
    local: 'Local / oficina',
    ph: 'PH'
  };

  var activeFilters = {
    operacion: 'todas',
    tipo: 'todos',
    estado: 'todos',
    barrio: 'todos',
    ciudad: 'todos',
    aptaCredito: 'indistinto',
    precioMin: null,
    precioMax: null
  };

  /* Páginas de Ventas / Alquileres / Emprendimientos no tienen chip de
     operación (ya está implícito en la página): la sección de propiedades
     trae un data-operacion-fixed y lo usamos como filtro fijo. */
  var propertiesSectionFixed = document.querySelector('[data-operacion-fixed]');
  if (propertiesSectionFixed) {
    activeFilters.operacion = propertiesSectionFixed.dataset.operacionFixed;
  }

  /* Arma las opciones de un <select> a partir de los valores únicos que
     encuentre en el data-attribute indicado de las propiedades cargadas. */
  function populateSelectFromData(selectEl, dataKey, labelMap) {
    if (!selectEl) return;
    var values = [];
    propertyCards.forEach(function (card) {
      var raw = card.dataset[dataKey];
      if (raw && values.indexOf(raw) === -1) { values.push(raw); }
    });
    values.sort(function (a, b) { return a.localeCompare(b, 'es'); });
    values.forEach(function (value) {
      var option = document.createElement('option');
      option.value = value;
      option.textContent = (labelMap && labelMap[value.toLowerCase()]) || value;
      selectEl.appendChild(option);
    });
  }

  populateSelectFromData(filterTipoSelect, 'tipo', TIPO_LABELS);
  populateSelectFromData(filterEstadoSelect, 'estado');
  populateSelectFromData(filterBarrioSelect, 'barrio');
  populateSelectFromData(filterCiudadSelect, 'ciudad');

  /* Si se llega desde el buscador del inicio con un tipo elegido
     (?tipo=casa), lo preseleccionamos acá — tanto en el chip rápido como
     en el select del panel avanzado. */
  var urlParams = new URLSearchParams(window.location.search);
  var urlTipo = urlParams.get('tipo');
  if (urlTipo) {
    var urlTipoChip = document.querySelector('.filter-chip[data-filter-group="tipo"][data-filter-value="' + urlTipo + '"]');
    if (urlTipoChip) {
      document.querySelectorAll('.filter-chip[data-filter-group="tipo"]').forEach(function (c) {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });
      urlTipoChip.classList.add('is-active');
      urlTipoChip.setAttribute('aria-pressed', 'true');
      activeFilters.tipo = urlTipo;
    }
    if (filterTipoSelect && urlTipoChip) { filterTipoSelect.value = urlTipo; }
  }

  /* Corre una vez al cargar la página, además de en cada cambio de filtro,
     para que el aviso de "no hay propiedades" también aparezca cuando
     todavía no se cargó ninguna propiedad (no solo cuando un filtro no
     encuentra resultados). */
  applyFilters();

  function applyFilters() {
    var visibleCount = 0;
    var precioMin = activeFilters.precioMin !== null && activeFilters.precioMin !== '' ? Number(activeFilters.precioMin) : null;
    var precioMax = activeFilters.precioMax !== null && activeFilters.precioMax !== '' ? Number(activeFilters.precioMax) : null;

    propertyCards.forEach(function (card) {
      var matchesOperacion = activeFilters.operacion === 'todas' || card.dataset.operacion === activeFilters.operacion;
      var matchesTipo = activeFilters.tipo === 'todos' || card.dataset.tipo === activeFilters.tipo;
      var matchesEstado = activeFilters.estado === 'todos' || card.dataset.estado === activeFilters.estado;
      var matchesBarrio = activeFilters.barrio === 'todos' || card.dataset.barrio === activeFilters.barrio;
      var matchesCiudad = activeFilters.ciudad === 'todos' || card.dataset.ciudad === activeFilters.ciudad;

      var matchesAptaCredito = true;
      if (activeFilters.aptaCredito !== 'indistinto') {
        var aptaCredito = (card.dataset.aptaCredito || '').toLowerCase();
        matchesAptaCredito = aptaCredito === activeFilters.aptaCredito;
      }

      var precio = card.dataset.precio ? Number(card.dataset.precio) : null;
      var matchesPrecio = true;
      if (precio !== null) {
        if (precioMin !== null && precio < precioMin) { matchesPrecio = false; }
        if (precioMax !== null && precio > precioMax) { matchesPrecio = false; }
      } else if (precioMin !== null || precioMax !== null) {
        matchesPrecio = false;
      }

      var isVisible = matchesOperacion && matchesTipo && matchesEstado && matchesBarrio && matchesCiudad && matchesAptaCredito && matchesPrecio;

      card.hidden = !isVisible;
      if (isVisible) { visibleCount++; }
    });

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  }

  filterChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var group = chip.dataset.filterGroup;
      var value = chip.dataset.filterValue;

      /* Desactivar los demás chips del mismo grupo */
      document.querySelectorAll('.filter-chip[data-filter-group="' + group + '"]').forEach(function (c) {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });

      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');

      activeFilters[group] = value;

      /* El chip de tipo y el select de tipo del panel avanzado comparten
         el mismo estado — los mantenemos sincronizados en los dos sentidos. */
      if (group === 'tipo' && filterTipoSelect) {
        filterTipoSelect.value = value;
      }

      applyFilters();
    });
  });

  if (filterTipoSelect) {
    filterTipoSelect.addEventListener('change', function () {
      activeFilters.tipo = filterTipoSelect.value;

      var matchingChip = document.querySelector('.filter-chip[data-filter-group="tipo"][data-filter-value="' + filterTipoSelect.value + '"]');
      document.querySelectorAll('.filter-chip[data-filter-group="tipo"]').forEach(function (c) {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });
      if (matchingChip) {
        matchingChip.classList.add('is-active');
        matchingChip.setAttribute('aria-pressed', 'true');
      }

      applyFilters();
    });
  }

  if (filterEstadoSelect) {
    filterEstadoSelect.addEventListener('change', function () {
      activeFilters.estado = filterEstadoSelect.value;
      applyFilters();
    });
  }

  if (filterBarrioSelect) {
    filterBarrioSelect.addEventListener('change', function () {
      activeFilters.barrio = filterBarrioSelect.value;
      applyFilters();
    });
  }

  if (filterCiudadSelect) {
    filterCiudadSelect.addEventListener('change', function () {
      activeFilters.ciudad = filterCiudadSelect.value;
      applyFilters();
    });
  }

  if (filterAptaCreditoSelect) {
    filterAptaCreditoSelect.addEventListener('change', function () {
      activeFilters.aptaCredito = filterAptaCreditoSelect.value;
      applyFilters();
    });
  }

  if (filterPrecioMin) {
    filterPrecioMin.addEventListener('input', function () {
      activeFilters.precioMin = filterPrecioMin.value;
      applyFilters();
    });
  }

  if (filterPrecioMax) {
    filterPrecioMax.addEventListener('input', function () {
      activeFilters.precioMax = filterPrecioMax.value;
      applyFilters();
    });
  }

  var filtersToggleLabel = filtersToggle ? filtersToggle.querySelector('.filters-toggle-label') : null;

  if (filtersToggle && advancedFilters) {
    filtersToggle.addEventListener('click', function () {
      var isOpen = !advancedFilters.hidden;
      advancedFilters.hidden = isOpen;
      filtersToggle.setAttribute('aria-expanded', String(!isOpen));
      if (filtersToggleLabel) {
        filtersToggleLabel.textContent = isOpen ? 'Más filtros' : 'Menos filtros';
      }
    });
  }

  if (filtersClear) {
    filtersClear.addEventListener('click', function () {
      activeFilters = {
        operacion: 'todas',
        tipo: 'todos',
        estado: 'todos',
        barrio: 'todos',
        ciudad: 'todos',
        aptaCredito: 'indistinto',
        precioMin: null,
        precioMax: null
      };

      document.querySelectorAll('.filter-chip').forEach(function (c) {
        var isDefault = c.dataset.filterValue === 'todas' || c.dataset.filterValue === 'todos';
        c.classList.toggle('is-active', isDefault);
        c.setAttribute('aria-pressed', String(isDefault));
      });

      if (filterTipoSelect) { filterTipoSelect.value = 'todos'; }
      if (filterEstadoSelect) { filterEstadoSelect.value = 'todos'; }
      if (filterBarrioSelect) { filterBarrioSelect.value = 'todos'; }
      if (filterCiudadSelect) { filterCiudadSelect.value = 'todos'; }
      if (filterAptaCreditoSelect) { filterAptaCreditoSelect.value = 'indistinto'; }
      if (filterPrecioMin) { filterPrecioMin.value = ''; }
      if (filterPrecioMax) { filterPrecioMax.value = ''; }

      applyFilters();
    });
  }

  /* -----------------------------------------------------------------------
     4. VALIDACIÓN DE FORMULARIOS
     ----------------------------------------------------------------------- */

  function showError(field, message) {
    var wrapper = field.closest('.field');
    if (!wrapper) return;
    wrapper.classList.add('has-error');
    var errorEl = wrapper.querySelector('.field-error');
    if (errorEl) { errorEl.textContent = message; }
  }

  function clearError(field) {
    var wrapper = field.closest('.field');
    if (!wrapper) return;
    wrapper.classList.remove('has-error');
    var errorEl = wrapper.querySelector('.field-error');
    if (errorEl) { errorEl.textContent = ''; }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value) {
    var digits = value.replace(/[^\d]/g, '');
    return digits.length >= 8;
  }

  /**
   * Valida un formulario genéricamente, recorriendo los campos requeridos.
   * Devuelve true si todo está OK.
   */
  function validateForm(form) {
    var valid = true;
    var fields = form.querySelectorAll('[required]');

    fields.forEach(function (field) {
      clearError(field);
      var value = field.value.trim();

      if (!value) {
        showError(field, 'Este campo es obligatorio.');
        valid = false;
        return;
      }

      if (field.type === 'email' && !isValidEmail(value)) {
        showError(field, 'Ingresá un email válido.');
        valid = false;
        return;
      }

      if (field.type === 'tel' && !isValidPhone(value)) {
        showError(field, 'Ingresá un teléfono válido (mínimo 8 dígitos).');
        valid = false;
        return;
      }

      if (field.type === 'number' && Number(value) <= 0) {
        showError(field, 'Ingresá un valor mayor a 0.');
        valid = false;
      }
    });

    return valid;
  }

  function attachLiveValidation(form) {
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('blur', function () {
        if (field.hasAttribute('required') && !field.value.trim()) {
          showError(field, 'Este campo es obligatorio.');
        } else {
          clearError(field);
        }
      });
      field.addEventListener('input', function () {
        var wrapper = field.closest('.field');
        if (wrapper && wrapper.classList.contains('has-error')) {
          clearError(field);
        }
      });
    });
  }

  function handleFormSubmit(formId, successId, errorId) {
    var form = document.getElementById(formId);
    var successEl = document.getElementById(successId);
    var errorEl = errorId ? document.getElementById(errorId) : null;
    if (!form) return;

    attachLiveValidation(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (successEl) { successEl.hidden = true; }
      if (errorEl) { errorEl.hidden = true; }

      if (!validateForm(form)) {
        var firstError = form.querySelector('.has-error input, .has-error select, .has-error textarea');
        if (firstError) { firstError.focus(); }
        return;
      }

      /* Envío real del formulario vía FormSubmit.co (formulario-a-email,
         sin backend propio). El fetch con Accept: application/json evita
         la página intermedia de confirmación y devuelve JSON directo. */
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }

      var formData = new FormData(form);

      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) { throw new Error('Envío no exitoso'); }
          if (successEl) {
            successEl.hidden = false;
            successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          form.reset();
        })
        .catch(function () {
          if (errorEl) {
            errorEl.hidden = false;
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        });
    });
  }

  handleFormSubmit('tasacionForm', 'tasacionSuccess', 'tasacionError');
  handleFormSubmit('contactoForm', 'contactoSuccess', 'contactoError');

  /**
   * Formularios de "interés de compra" dentro de las tarjetas de
   * Descargables (uno por ítem pago). A diferencia de handleFormSubmit,
   * pueden existir varios en la misma página, así que se buscan por
   * clase y cada uno usa sus propios mensajes de éxito/error internos.
   * Al enviarse OK, se abre en una pestaña nueva el link de pago de
   * Mercado Pago guardado en data-checkout-url del propio formulario.
   * Esto solo avisa que alguien quiere comprar: la confirmación real del
   * pago se revisa a mano en la cuenta de Mercado Pago antes de mandar
   * el archivo por email.
   */
  function handleDescargableForms() {
    var forms = document.querySelectorAll('.descargable-compra-form');

    forms.forEach(function (form) {
      var successEl = form.querySelector('.descargable-success');
      var errorEl = form.querySelector('.descargable-error');

      attachLiveValidation(form);

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (successEl) { successEl.hidden = true; }
        if (errorEl) { errorEl.hidden = true; }

        if (!validateForm(form)) {
          var firstError = form.querySelector('.has-error input, .has-error select, .has-error textarea');
          if (firstError) { firstError.focus(); }
          return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        var originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Enviando...';
        }

        var formData = new FormData(form);

        fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
          .then(function (response) {
            if (!response.ok) { throw new Error('Envío no exitoso'); }
            if (successEl) {
              successEl.hidden = false;
              successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            form.reset();
            var checkoutUrl = form.dataset.checkoutUrl;
            if (checkoutUrl) {
              window.open(checkoutUrl, '_blank', 'noopener');
            }
          })
          .catch(function () {
            if (errorEl) {
              errorEl.hidden = false;
              errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
            }
          });
      });
    });
  }

  handleDescargableForms();

  /* -----------------------------------------------------------------------
     5. BUSCADOR DEL HERO
     Lleva directo a la página de Ventas, Alquileres o Emprendimientos
     según la operación elegida, con el tipo (si se eligió uno) como
     parámetro en la URL para que esa página lo preseleccione.
     ----------------------------------------------------------------------- */
  var heroSearchForm = document.getElementById('heroSearchForm');
  if (heroSearchForm) {
    var PAGE_BY_OPERACION = {
      venta: 'propiedades/ventas.html',
      alquiler: 'propiedades/alquileres.html',
      emprendimiento: 'propiedades/emprendimientos.html'
    };

    heroSearchForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var operacion = document.getElementById('searchOperacion').value;
      var tipo = document.getElementById('searchTipo').value;

      var targetPage = PAGE_BY_OPERACION[operacion] || PAGE_BY_OPERACION.venta;
      window.location.href = targetPage + (tipo ? '?tipo=' + encodeURIComponent(tipo) : '');
    });
  }

  /* -----------------------------------------------------------------------
     6. UTILIDADES VARIAS
     ----------------------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

});
