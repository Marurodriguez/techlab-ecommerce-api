package com.techlab.ecommerce.exception;

public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String recurso, Long id) {
        super("No se encontró " + recurso + " con ID: " + id);
    }
}