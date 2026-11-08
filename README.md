# Una Navidad para florecer

Aplicación de Fundación Floreciendo con Amor para Navidad 2026.

Sitio: https://floreciendo-navidad.vercel.app

## Funciones activas

- Ocho cartas y reservas independientes de ropa y juguete, sin duplicados.
- El padrino confirma con sus datos sin esperar un correo ni crear contraseña.
- Rincón personal con enlace privado, sugerencias, cambios de entrega y cancelación.
- Portal del equipo con contraseña y activación por invitación privada para correos @floreciendoconamor.org.
- Edición y alta de perfiles, cartas públicas y fotos o videos privados para los padrinos.
- Donaciones por QR o llave Bre-B, registro de aportes y verificación del equipo.

## Pendiente

El envío de recordatorios es lo único pendiente del servicio de correo. Las reglas contemplan el 25 de noviembre y 2 de diciembre de 2026 y excluyen compromisos entregados o cancelados.

## Infraestructura

Vercel sirve `public` sin dependencias ni compilación. Supabase contiene la base de datos, permisos y archivos. La función `campaign-access` usa credenciales exclusivamente del servidor para crear accesos de invitados y consumir invitaciones del equipo. El navegador solo recibe la clave pública.

La identidad de un padrino se protege mediante su enlace privado; el correo de contacto no se usa como prueba de identidad. Las altas del equipo requieren una invitación secreta, de un solo uso y asociada a su correo. Escribir un correo del dominio no concede permisos.

## Verificación

`node --test lib/campaign.test.mjs`

Las pruebas de navegador comprobaron confirmación, restauración con enlace, entrega persistida y cancelación parcial. Las pruebas de API comprobaron invitación de equipo, uso único, edición, reserva, sugerencias privadas, registro y verificación de aportes, recepción e aislamiento de perfiles. Las campañas de prueba quedan inactivas y los accesos temporales del equipo deshabilitados.

No subir claves secretas, invitaciones ni enlaces privados de padrinos al repositorio.
