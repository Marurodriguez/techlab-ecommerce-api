package com.techlab.ecommerce.service.impl;

import com.techlab.ecommerce.dto.request.PedidoRequest;
import com.techlab.ecommerce.exception.*;
import com.techlab.ecommerce.model.*;
import com.techlab.ecommerce.repository.*;
import com.techlab.ecommerce.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;

    @Override
    @Transactional // Si algo falla, hace rollback automático
    public Pedido crearPedido(PedidoRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", request.getUsuarioId()));

        List<LineaPedido> lineas = new ArrayList<>();
        double total = 0.0;

        // Procesamos cada línea del pedido
        for (PedidoRequest.LineaPedidoRequest lineaReq : request.getLineas()) {
            Producto producto = productoRepository.findById(lineaReq.getProductoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto", lineaReq.getProductoId()));

            // Validación de stock
            if (producto.getStock() < lineaReq.getCantidad()) {
                throw new StockInsuficienteException(producto.getNombre(), producto.getStock());
            }

            // Descontamos el stock
            producto.setStock(producto.getStock() - lineaReq.getCantidad());
            productoRepository.save(producto);

            // Construimos la línea
            LineaPedido linea = new LineaPedido();
            linea.setProducto(producto);
            linea.setCantidad(lineaReq.getCantidad());
            linea.setPrecioUnitario(producto.getPrecio()); // capturamos el precio actual

            total += linea.getSubtotal();
            lineas.add(linea);
        }

        // Armamos el pedido completo
        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);
        pedido.setFecha(LocalDateTime.now());
        pedido.setEstado(EstadoPedido.PENDIENTE);
        pedido.setTotal(total);
        pedido.setLineas(lineas);

        // Asociamos las líneas al pedido antes de guardar
        lineas.forEach(l -> l.setPedido(pedido));

        return pedidoRepository.save(pedido);
    }

    @Override
    public List<Pedido> historialPorUsuario(Long usuarioId) {
        return pedidoRepository.findByUsuarioId(usuarioId);
    }

    @Override
    public Pedido cambiarEstado(Long pedidoId, EstadoPedido nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido", pedidoId));
        pedido.setEstado(nuevoEstado);
        return pedidoRepository.save(pedido);
    }
}