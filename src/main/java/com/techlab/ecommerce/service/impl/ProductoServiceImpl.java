package com.techlab.ecommerce.service.impl;

import com.techlab.ecommerce.dto.request.ProductoRequest;
import com.techlab.ecommerce.exception.RecursoNoEncontradoException;
import com.techlab.ecommerce.model.*;
import com.techlab.ecommerce.repository.*;
import com.techlab.ecommerce.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor // Lombok inyecta el constructor con los campos final
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    @Override
    public Producto obtenerPorId(Long id) {
        // Si no existe lanza la excepción personalizada
        return productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", id));
    }

    @Override
    public Producto crear(ProductoRequest request) {
        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría", request.getCategoriaId()));

        Producto producto = new Producto();
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());
        producto.setImagenUrl(request.getImagenUrl());
        producto.setCategoria(categoria);

        return productoRepository.save(producto);
    }

    @Override
    public Producto actualizar(Long id, ProductoRequest request) {
        Producto producto = obtenerPorId(id);
        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría", request.getCategoriaId()));

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());
        producto.setImagenUrl(request.getImagenUrl());
        producto.setCategoria(categoria);

        return productoRepository.save(producto);
    }

    @Override
    public void eliminar(Long id) {
        // Verificamos que exista antes de eliminar
        obtenerPorId(id);
        productoRepository.deleteById(id);
    }

    @Override
    public List<Producto> buscarPorNombre(String nombre) {
        return productoRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @Override
    public List<Producto> alertaStockBajo(int minStock) {
        return productoRepository.findByStockLessThan(minStock);
    }
}