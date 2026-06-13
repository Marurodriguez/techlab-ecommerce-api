// repository/ProductoRepository.java
package com.techlab.ecommerce.repository;

import com.techlab.ecommerce.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    // Spring crea la query automáticamente por el nombre del método
    List<Producto> findByNombreContainingIgnoreCase(String nombre);

    List<Producto> findByCategoriaId(Long categoriaId);

    // Alerta de stock bajo
    List<Producto> findByStockLessThan(int minStock);
}