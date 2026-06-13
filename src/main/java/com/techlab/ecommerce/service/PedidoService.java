package com.techlab.ecommerce.service;

import com.techlab.ecommerce.dto.request.PedidoRequest;
import com.techlab.ecommerce.model.EstadoPedido;
import com.techlab.ecommerce.model.Pedido;
import java.util.List;

public interface PedidoService {

    // Crea un nuevo pedido, validando stock y descontándolo
    Pedido crearPedido(PedidoRequest request);

    // Devuelve el historial de pedidos de un usuario
    List<Pedido> historialPorUsuario(Long usuarioId);

    // Cambia el estado de un pedido (pendiente, confirmado, etc.)
    Pedido cambiarEstado(Long pedidoId, EstadoPedido nuevoEstado);
}