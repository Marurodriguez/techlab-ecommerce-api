package com.techlab.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class PedidoRequest {

    @NotNull
    private Long usuarioId;

    @NotEmpty(message = "El pedido debe tener al menos un producto")
    private List<LineaPedidoRequest> lineas;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class LineaPedidoRequest {

        @NotNull
        private Long productoId;

        @NotNull
        @Min(value = 1, message = "La cantidad mínima es 1")
        private Integer cantidad;
    }
}