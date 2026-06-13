# TechLab E-commerce API

API RESTful desarrollada con Spring Boot 3 y MySQL para gestionar un sistema de e-commerce completo.

## Stack
- Java 17 · Spring Boot 3.2
- Spring Data JPA · Hibernate
- MySQL 8 · Lombok · Jakarta Validation
- Documentación con Swagger / OpenAPI

## Cómo correr el proyecto
1. Clonar el repositorio
2. Crear base de datos: `CREATE DATABASE techlab_db;`
3. Configurar credenciales en `application.properties`
4. `mvn spring-boot:run`
5. Swagger: http://localhost:8080/swagger-ui.html

## Endpoints principales
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/productos | Listar productos |
| POST | /api/productos | Crear producto |
| PUT | /api/productos/{id} | Actualizar producto |
| DELETE | /api/productos/{id} | Eliminar producto |
| POST | /api/pedidos | Crear pedido |
| GET | /api/pedidos/usuario/{id} | Historial por usuario |