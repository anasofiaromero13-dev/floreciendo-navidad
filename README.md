# Una Navidad para florecer

Aplicación de Fundación Floreciendo con Amor, Navidad 2026.

## Estado

Cliente preparado con conexión a Supabase y API de reservas transaccionales. Campaña inactiva. Configuración de correos y activación pública pendientes. Las cartas se cargarán después de aprobar la publicación.

## Publicación

Vercel: servir el directorio `public`, sin instalación ni compilación. `src/live-app.js` es la fuente del cliente; `public/app.js` es el archivo preparado para publicación. El cliente solo contiene la clave pública de Supabase, protegida por permisos de base de datos.

## Funciones

- Compromisos independientes y sin duplicados para ropa y juguete.
- Acceso por enlace de correo y portal del padrino.
- Equipo interno con correo verificado del dominio floreciendoconamor.org.
- Edición de perfiles, carga de cartas y recuerdos privados.
- QR y llave Bre-B para aportes; registro de aviso de transferencia.
- Reglas de recordatorio para el 25 de noviembre y 2 de diciembre de 2026. El envío aún no está conectado.

## Verificación

`node --test lib/campaign.test.mjs`

Se probaron también las reservas, cancelaciones parciales y aislamiento de datos en una transacción de Supabase revertida al finalizar.

## Pendientes

- Configurar servicio de correo, dominio remitente y URL de retorno de autenticación.
- Confirmar publicación de perfiles y activación de compromisos reales.
- Cargar cartas; configurar Vercel y comprobar recorridos completos en navegador.
- Activar programador de recordatorios y verificación de donaciones desde el portal.

No guardar claves secretas en el repositorio.
