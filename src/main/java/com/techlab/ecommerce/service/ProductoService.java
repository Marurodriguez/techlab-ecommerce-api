package com.techlab.ecommerce.service;

import com.techlab.ecommerce.dto.request.ProductoRequest;
import com.techlab.ecommerce.model.Producto;
import java.util.List;

public interface ProductoService {
    List<Producto> listarTodos();
    Producto obtenerPorId(Long id);
    Producto crear(ProductoRequest request);
    Producto actualizar(Long id, ProductoRequest request);
    void eliminar(Long id);
    List<Producto> buscarPorNombre(String nombre);
    List<Producto> alertaStockBajo(int minStock);
}