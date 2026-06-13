const API_BASE = 'http://localhost:8080/api';
let productosCache = [];

/* ---------------------------------------------------------
   Utilidades generales
   --------------------------------------------------------- */

// Formatea un número como moneda simple (sin depender de locale del navegador)
function formatearPrecio(valor) {
  const numero = Number(valor) || 0;
  return '$' + numero.toFixed(2);
}

// Muestra un mensaje flotante (toast) de éxito o error
function mostrarToast(mensaje, esError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.classList.toggle('is-error', esError);
  toast.classList.add('is-visible');

  // Lo ocultamos automáticamente después de unos segundos
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 4000);
}

// Wrapper sobre fetch que centraliza manejo de errores de la API.
// Si la API devuelve un error (4xx/5xx), intenta leer el JSON
// de error que arma nuestro GlobalExceptionHandler.
async function apiFetch(path, opciones = {}) {
  const respuesta = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });

  if (!respuesta.ok) {
    let detalle = `Error ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json();
      // El GlobalExceptionHandler devuelve { error: "mensaje" }
      // o { errores: [...] } para validaciones
      if (cuerpo.error) detalle = cuerpo.error;
      else if (cuerpo.errores) detalle = cuerpo.errores.join(' / ');
    } catch (_) {
      // Si no vino JSON, nos quedamos con el detalle genérico
    }
    throw new Error(detalle);
  }

  // 204 No Content no tiene body para parsear
  if (respuesta.status === 204) return null;
  return respuesta.json();
}

/* ---------------------------------------------------------
   Estado de conexión (header)
   --------------------------------------------------------- */

async function verificarConexion() {
  const dot = document.getElementById('statusDot');
  const texto = document.getElementById('statusText');

  try {
    await apiFetch('/productos');
    dot.classList.add('ok');
    dot.classList.remove('bad');
    texto.textContent = 'API conectada — localhost:8080';
  } catch (err) {
    dot.classList.add('bad');
    dot.classList.remove('ok');
    texto.textContent = 'Sin conexión a la API';
  }
}

/* ---------------------------------------------------------
   Tabs
   --------------------------------------------------------- */

function inicializarTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const destino = tab.dataset.tab;

      tabs.forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      panels.forEach((p) => {
        p.classList.toggle('is-active', p.id === `panel-${destino}`);
      });
    });
  });
}

/* ---------------------------------------------------------
   Sección Productos
   --------------------------------------------------------- */

// Pide la lista de productos a la API y la dibuja en la tabla
async function cargarProductos() {
  const tbody = document.querySelector('#tablaProductos tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="empty">Cargando productos…</td></tr>';

  try {
    const productos = await apiFetch('/productos');
    productosCache = productos;

    if (productos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay productos cargados todavía.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    productos.forEach((producto) => {
      const fila = document.createElement('tr');

      // Marcamos en rojo el stock si está bajo (menos de 5 unidades)
      const stockBajo = producto.stock < 5;

      fila.innerHTML = `
        <td>${producto.id}</td>
        <td>${producto.nombre}</td>
        <td>${producto.categoria ? producto.categoria.nombre : '—'}</td>
        <td class="num">${formatearPrecio(producto.precio)}</td>
        <td class="num">
          <span class="stock-pill ${stockBajo ? 'low' : ''}">${producto.stock}</span>
        </td>
        <td>
          <button class="btn btn--ghost btn--small" data-eliminar="${producto.id}">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(fila);
    });

    // Actualizamos los selects de productos en la sección de pedidos
    actualizarSelectsProductos();

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">No se pudo cargar el catálogo: ${err.message}</td></tr>`;
  }
}

// Maneja el envío del formulario "Agregar producto"
function inicializarFormProducto() {
  const form = document.getElementById('formProducto');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const datos = new FormData(form);
    const body = {
      nombre: datos.get('nombre'),
      descripcion: datos.get('descripcion') || '',
      precio: Number(datos.get('precio')),
      stock: Number(datos.get('stock')),
      imagenUrl: datos.get('imagenUrl') || '',
      categoriaId: Number(datos.get('categoriaId')),
    };

    try {
      await apiFetch('/productos', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      mostrarToast(`Producto "${body.nombre}" creado correctamente.`);
      form.reset();
      form.closest('details').open = false;
      cargarProductos();
    } catch (err) {
      mostrarToast(`No se pudo crear el producto: ${err.message}`, true);
    }
  });
}

// Maneja los botones "Eliminar" de la tabla (delegación de eventos)
function inicializarEliminarProducto() {
  const tabla = document.getElementById('tablaProductos');

  tabla.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('[data-eliminar]');
    if (!boton) return;

    const id = boton.dataset.eliminar;
    if (!confirm(`¿Eliminar el producto #${id}? Esta acción no se puede deshacer.`)) return;

    try {
      await apiFetch(`/productos/${id}`, { method: 'DELETE' });
      mostrarToast(`Producto #${id} eliminado.`);
      cargarProductos();
    } catch (err) {
      mostrarToast(`No se pudo eliminar: ${err.message}`, true);
    }
  });
}

/* ---------------------------------------------------------
   Sección Nuevo pedido
   --------------------------------------------------------- */

// Crea una nueva línea de pedido (select de producto + cantidad)
function crearLineaPedido() {
  const contenedor = document.getElementById('lineasPedido');

  const linea = document.createElement('div');
  linea.className = 'linea';
  linea.innerHTML = `
    <select class="linea__producto">
      ${opcionesProductos()}
    </select>
    <input type="number" class="linea__cantidad" min="1" value="1" placeholder="Cant.">
    <button type="button" class="linea__remove" title="Quitar línea">×</button>
  `;

  contenedor.appendChild(linea);

  // Quitar línea
  linea.querySelector('.linea__remove').addEventListener('click', () => {
    linea.remove();
    actualizarTotalEstimado();
  });

  // Recalcular total cuando cambian producto o cantidad
  linea.querySelector('.linea__producto').addEventListener('change', actualizarTotalEstimado);
  linea.querySelector('.linea__cantidad').addEventListener('input', actualizarTotalEstimado);

  actualizarTotalEstimado();
}

// Genera las <option> a partir del cache de productos
function opcionesProductos() {
  if (productosCache.length === 0) {
    return '<option value="">Sin productos cargados</option>';
  }
  return productosCache
    .map((p) => `<option value="${p.id}" data-precio="${p.precio}">${p.nombre} (stock: ${p.stock})</option>`)
    .join('');
}

// Refresca las opciones de todos los selects ya creados,
// por si se cargaron productos nuevos
function actualizarSelectsProductos() {
  document.querySelectorAll('.linea__producto').forEach((select) => {
    const valorActual = select.value;
    select.innerHTML = opcionesProductos();
    if (valorActual) select.value = valorActual;
  });
}

// Recalcula el total estimado sumando precio * cantidad de cada línea
function actualizarTotalEstimado() {
  let total = 0;

  document.querySelectorAll('.linea').forEach((linea) => {
    const select = linea.querySelector('.linea__producto');
    const cantidadInput = linea.querySelector('.linea__cantidad');

    const opcion = select.options[select.selectedIndex];
    const precio = opcion ? Number(opcion.dataset.precio || 0) : 0;
    const cantidad = Number(cantidadInput.value) || 0;

    total += precio * cantidad;
  });

  document.getElementById('totalEstimado').textContent =
    `Total estimado: ${formatearPrecio(total)}`;
}

// Envía el pedido a la API
async function confirmarPedido() {
  const usuarioId = Number(document.getElementById('pedidoUsuarioId').value);

  if (!usuarioId) {
    mostrarToast('Ingresá el ID de usuario para crear el pedido.', true);
    return;
  }

  const lineas = [];
  document.querySelectorAll('.linea').forEach((linea) => {
    const select = linea.querySelector('.linea__producto');
    const cantidad = Number(linea.querySelector('.linea__cantidad').value);

    if (select.value && cantidad > 0) {
      lineas.push({
        productoId: Number(select.value),
        cantidad: cantidad,
      });
    }
  });

  if (lineas.length === 0) {
    mostrarToast('Agregá al menos una línea con producto y cantidad.', true);
    return;
  }

  try {
    const pedido = await apiFetch('/pedidos', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, lineas }),
    });

    mostrarToast(`Pedido #${pedido.id} creado. Total: ${formatearPrecio(pedido.total)}`);

    // Limpiamos el formulario y refrescamos el stock visible
    document.getElementById('lineasPedido').innerHTML = '';
    crearLineaPedido();
    cargarProductos();

  } catch (err) {
    // Acá es donde se ve el mensaje de StockInsuficienteException, por ejemplo
    mostrarToast(`No se pudo crear el pedido: ${err.message}`, true);
  }
}

/* ---------------------------------------------------------
   Sección Historial
   --------------------------------------------------------- */

async function buscarHistorial() {
  const usuarioId = document.getElementById('historialUsuarioId').value;
  const contenedor = document.getElementById('historialResultados');

  if (!usuarioId) {
    mostrarToast('Ingresá un ID de usuario para buscar su historial.', true);
    return;
  }

  contenedor.innerHTML = '<p class="panel__sub">Buscando pedidos…</p>';

  try {
    const pedidos = await apiFetch(`/pedidos/usuario/${usuarioId}`);

    if (pedidos.length === 0) {
      contenedor.innerHTML = '<p class="panel__sub">Este usuario todavía no tiene pedidos.</p>';
      return;
    }

    contenedor.innerHTML = '';
    pedidos.forEach((pedido) => {
      const card = document.createElement('article');
      card.className = 'pedido-card';

      const fecha = new Date(pedido.fecha).toLocaleString('es-AR');
      const estadoClase = `estado--${pedido.estado.toLowerCase()}`;

      const itemsHtml = (pedido.lineas || [])
        .map((linea) => `
          <li>
            <span>${linea.producto ? linea.producto.nombre : 'Producto #' + linea.producto?.id} × ${linea.cantidad}</span>
            <span>${formatearPrecio(linea.precioUnitario * linea.cantidad)}</span>
          </li>
        `)
        .join('');

      card.innerHTML = `
        <div class="pedido-card__head">
          <h3>Pedido #${pedido.id}</h3>
          <span class="estado ${estadoClase}">${pedido.estado}</span>
        </div>
        <div class="pedido-card__meta">${fecha}</div>
        <ul>${itemsHtml}</ul>
        <div class="pedido-card__total">Total: ${formatearPrecio(pedido.total)}</div>
      `;

      contenedor.appendChild(card);
    });

  } catch (err) {
    contenedor.innerHTML = `<p class="panel__sub">No se pudo obtener el historial: ${err.message}</p>`;
  }
}

/* ---------------------------------------------------------
   Inicialización general
   --------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  inicializarTabs();
  inicializarFormProducto();
  inicializarEliminarProducto();

  document.getElementById('refreshProductos').addEventListener('click', cargarProductos);
  document.getElementById('agregarLinea').addEventListener('click', crearLineaPedido);
  document.getElementById('confirmarPedido').addEventListener('click', confirmarPedido);
  document.getElementById('buscarHistorial').addEventListener('click', buscarHistorial);

  verificarConexion();
  cargarProductos();
  crearLineaPedido(); // arrancamos con una línea de pedido lista para usar
});