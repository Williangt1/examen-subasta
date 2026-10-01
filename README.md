# RodaBid — Sistema de Gestión y Remates de Vehículos en Vivo

Plataforma SPA orientada a la compra, venta e importación de vehículos de subasta. Integra un mecanismo reactivo para la recepción de posturas simultáneas en tiempo real, catálogo técnico categorizado y control de accesos por roles.

---

## 🔗 Despliegue en Producción
- **Sitio Web Activo:** [https://subasta-auto.web.app](https://subasta-auto.web.app)
- **Infraestructura:** Firebase Hosting (Certificación SSL / HTTPS)

---

## 👥 Cuentas de Acceso para Pruebas Cruzadas
Para validar la concurrencia entre navegadores independientes sin necesidad de registrar nuevos perfiles:

* **Postor Líder 1:** `postor1@demo.com` | `123456`
* **Postor Rival 2:** `postor2@demo.com` | `123456`
* **Vendedor / Creador:** `vendedor@demo.com` | `123456`

*(El sistema también admite el alta de nuevos usuarios desde el formulario de registro).*

---

## 📌 Especificaciones Funcionales Implementadas

### Módulo de Subastas y Concurrencia en Vivo
* **Actualización en Tiempo Real:** Comunicación continua mediante Firebase Realtime Database; los cambios en el monto líder se reflejan de inmediato sin interacción manual ni F5.
* **Control de Posturas:** Validación estricta donde cada oferta debe superar a la anterior en al menos un **10%** del valor vigente, tomando como piso base **Q. 20,000**.
* **Protección de Identidad:** Las ofertas registradas protegen la privacidad de los participantes, mostrando públicamente únicamente el valor de la postura.
* **Retroalimentación Visual Inmediata:**
  * Indicador en verde (*"¡Vas ganando esta subasta!"*) para el participante con la mejor oferta.
  * Alerta en rojo (*"Tu oferta ha sido superada. ¡Haz tu oferta ahora antes de que termine el tiempo!"*) al recibir una sobrepuja.
* **Cierre Automatizado:** Cronómetro descendente en cada publicación; al cumplirse el plazo se deshabilita la posibilidad de ofertar.

### Catálogo e Inventario Dinámico
* **Segmentación Rápida:** Filtros instantáneos en memoria combinables por Marca, Modelo, Rango de Años, Tipo de Combustible y Nivel de Daño.
* **Ficha Técnica Detallada:** Registro de especificaciones completas (Tracción AWD/FWD/RWD/4WD, Carrocería, Transmisión, Motor y Número de Cilindros).
* **Inspección Visual de Daño:**
  * 🟢 **Verde:** Daños leves o estéticos (Clean / Minor).
  * 🟡 **Amarillo:** Daño estructural medio (Repairable).
  * 🔴 **Rojo:** Pérdida severa / Salvamento (Total / Severe).
* **Galería Fotográfica:** Módulo visual con capacidad para un mínimo de 5 fotografías por lote.

### Seguridad y Restricciones de Navegación
* **Acceso Público:** Modo de solo lectura disponible para usuarios anónimos en el catálogo general y detalle de vehículos.
* **Acciones Restringidas:** Inicio de sesión forzoso para ingresar ofertas o dar de alta nuevos vehículos.
* **Gestión de Lotes:** Panel que permite al vendedor buscar y modificar datos de sus publicaciones vigentes.

---

## 💻 Entorno y Componentes Técnicos
* **Framework:** React 19 + Vite
* **Librería de Componentes / UI:** Lucide React & CSS3 Modular (Paleta clara)
* **Persistencia y Sockets:** Firebase Realtime Database
* **Servicio de Autenticación:** Firebase Authentication