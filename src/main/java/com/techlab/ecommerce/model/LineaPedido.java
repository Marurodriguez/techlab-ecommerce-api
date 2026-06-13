package com.techlab.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lineas_pedido")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class LineaPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cantidad del producto en esta línea
    @Column(nullable = false)
    private Integer cantidad;

    // Precio capturado al momento del pedido (puede cambiar después)
    @Column(nullable = false)
    private Double precioUnitario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    // Calcula el subtotal de esta línea
    public Double getSubtotal() {
        return this.cantidad * this.precioUnitario;
    }
}