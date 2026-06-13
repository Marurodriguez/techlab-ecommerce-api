package com.techlab.ecommerce.exception;

public class StockInsuficienteException extends RuntimeException {

    public StockInsuficienteException(String nombreProducto, int stockDisponible) {
        super("Stock insuficiente para '" + nombreProducto +
                "'. Stock disponible: " + stockDisponible);
    }
}