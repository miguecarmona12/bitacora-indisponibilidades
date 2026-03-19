# Diagrama Entidad-Relación (Mermaid JS)

Copia todo el bloque de código de abajo y pégalo en [Mermaid Live Editor](https://mermaid.live) para ver tu diagrama al instante y poder exportarlo como imagen PNG o archivo vectorial SVG.

```mermaid
erDiagram
    empresas {
        serial id PK
        varchar(100) nombre UK
    }

    aplicaciones {
        serial id PK
        varchar(100) nombre UK
    }

    empresa_aplicacion {
        integer empresa_id PK, FK
        integer aplicacion_id PK, FK
    }

    categorias {
        serial id PK
        varchar(100) nombre UK
    }

    productos {
        serial id PK
        varchar(150) nombre UK
        integer categoria_id FK "Ligado a Categoría"
    }

    usuarios {
        serial id PK
        varchar(50) username UK
        varchar(100) email UK
        varchar(200) hashed_password
        varchar(20) rol "admin | tecnico | cliente"
        integer empresa_id FK "Restricción para Cliente/Técnico"
    }

    incidentes {
        serial id PK
        integer empresa_id FK
        integer aplicacion_id FK
        integer categoria_id FK
        integer producto_id FK
        timestamp fecha_inicio
        float duracion_minutos
        text motivo
        text solucion
        varchar(100) ticket
        varchar(50) mes_reporte
        integer usuario_id FK "Responsable"
        timestamp fecha_registro
    }

    %% Relaciones
    empresas ||--o{ empresa_aplicacion : "habilitado en"
    aplicaciones ||--o{ empresa_aplicacion : "asociada a"
    
    categorias ||--o{ productos : "contiene"
    
    empresas ||--o{ usuarios : "pertenece a"
    
    empresas ||--o{ incidentes : "sufre falla"
    aplicaciones ||--o{ incidentes : "produce falla"
    categorias ||--o{ incidentes : "reporta falla"
    productos ||--o{ incidentes : "reporta falla"
    usuarios ||--o{ incidentes : "registra o edita"
```
