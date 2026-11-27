"""
Cliente de integración con GLPI 12 (High-Level API v2).

Publica la documentación del incidente (SITUACIÓN / CAUSA RAÍZ / SOLUCIÓN /
ACCIÓN CORRECTIVA) en el ticket original de GLPI:

  1. Como Solución aceptada -> cierra el caso en GLPI (comportamiento principal).
     Si GLPI exige técnico/grupo asignados antes de cerrar, se asignan
     automáticamente (el usuario de servicio y, si está configurado, el grupo).
  2. Como comentario (followup) -> respaldo cuando el caso no admite cierre
     (p.ej. ya está cerrado o falta grupo sin configurar).

Autenticación: OAuth2 Password Grant contra /api.php/token
Soluciones:     POST /api.php/v2/Assistance/Ticket/{id}/Timeline/Solution
Seguimientos:   POST /api.php/v2/Assistance/Ticket/{id}/Timeline/Followup
Team:           POST /api.php/v2/Assistance/Ticket/{id}/TeamMember

La configuración es un dict con las claves:
    base_url       ej: https://sos.ux.technology
    client_id      client_id del OAuth Client (Configuración > Clientes OAuth)
    client_secret  client_secret del OAuth Client
    username       usuario GLPI de servicio
    password       contraseña del usuario GLPI
    profile_id     ID del perfil GLPI con permisos (ej: 12, técnico de mesa de servicio)
"""
import base64
import hashlib
import html
import json
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

from loguru import logger

_TIMEOUT = 15  # segundos por petición HTTP

# Caché del access token (expira en ~1h según GLPI_OAUTH_ACCESS_TOKEN_EXPIRES)
# keyed por huella de la configuración para invalidarse si cambian las credenciales
_token_cache = {"huella": None, "access_token": None, "expires_at": 0.0}
_token_lock = threading.Lock()


class GlpiError(Exception):
    """Error de comunicación o autenticación con GLPI."""

    def __init__(self, mensaje: str, codigo_http: int = None):
        super().__init__(mensaje)
        self.codigo_http = codigo_http


def config_valida(config: dict) -> bool:
    """Indica si la configuración tiene los datos mínimos para operar.
    El profile_id es obligatorio: sin él GLPI usa el perfil self-service
    del usuario, que no tiene permiso para crear seguimientos."""
    if not config:
        return False
    return all((config.get(k) or "").strip() for k in ("base_url", "client_id", "client_secret", "username", "password", "profile_id"))


def _huella_config(config: dict) -> str:
    """Huella estable de la configuración para la caché del token."""
    material = "|".join((config.get(k) or "") for k in ("base_url", "client_id", "client_secret", "username", "password"))
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def extraer_ticket_id(ticket_ref: str) -> int | None:
    """Extrae el ID numérico del ticket desde el campo 'Ticket / Caso'.

    Acepta: "736599", "#736599", "Ticket 736599", "caso 736599".
    """
    if not ticket_ref:
        return None
    m = re.search(r"(\d+)", str(ticket_ref))
    return int(m.group(1)) if m else None


def _peticion(url: str, data=None, headers=None, method="GET") -> dict:
    """Ejecuta una petición HTTP y devuelve la respuesta JSON parseada."""
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        detalle = ""
        try:
            detalle = e.read().decode("utf-8", errors="replace")[:500]
        except Exception:
            pass
        raise GlpiError(f"GLPI respondió {e.code}: {detalle or e.reason}", codigo_http=e.code) from e
    except urllib.error.URLError as e:
        raise GlpiError(f"No se pudo conectar con GLPI: {e.reason}") from e
    except json.JSONDecodeError as e:
        raise GlpiError(f"GLPI devolvió una respuesta no válida: {e}") from e


def obtener_access_token(config: dict, forzar: bool = False) -> str:
    """Obtiene (y cachea) un access token OAuth2 con Password Grant."""
    if not config_valida(config):
        raise GlpiError("Integración GLPI no configurada (faltan datos de conexión)")

    huella = _huella_config(config)
    base_url = config["base_url"].rstrip("/")

    with _token_lock:
        if not forzar and _token_cache["access_token"] and _token_cache["huella"] == huella and time.time() < _token_cache["expires_at"]:
            return _token_cache["access_token"]

        datos = urllib.parse.urlencode({
            "grant_type": "password",
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "username": config["username"],
            "password": config["password"],
            "scope": "api",
        }).encode("utf-8")

        respuesta = _peticion(
            f"{base_url}/api.php/token",
            data=datos,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )

        token = respuesta.get("access_token")
        expira_en = int(respuesta.get("expires_in", 3600))
        if not token:
            raise GlpiError("GLPI no devolvió access_token en la autenticación OAuth2")

        # Margen de 60s para no usar un token a punto de expirar
        _token_cache["huella"] = huella
        _token_cache["access_token"] = token
        _token_cache["expires_at"] = time.time() + max(60, expira_en - 60)
        logger.debug("GLPI: nuevo access token OAuth2 obtenido")
        return token


def probar_conexion(config: dict) -> tuple[bool, str]:
    """Valida que la configuración funcie: pide un token OAuth2.

    Devuelve (exitoso, mensaje). Nunca lanza excepciones.
    """
    try:
        obtener_access_token(config, forzar=True)
        return True, "Conexión exitosa con GLPI: credenciales válidas"
    except GlpiError as e:
        return False, str(e)


def construir_contenido_followup(incidente) -> str:
    """Genera el HTML del comentario de documentación que se publica en el ticket GLPI.

    Incluye una sección por cada campo documentado con contenido:
    SITUACIÓN (motivo), CAUSA RAÍZ, SOLUCIÓN APLICADA y ACCIÓN CORRECTIVA.
    """
    secciones = [
        ("SITUACIÓN", getattr(incidente, "motivo", None)),
        ("CAUSA RAÍZ", getattr(incidente, "causa_raiz", None)),
        ("SOLUCIÓN APLICADA", getattr(incidente, "solucion", None)),
        ("ACCIÓN CORRECTIVA", getattr(incidente, "accion_correctiva", None)),
    ]

    partes = [
        "<p><strong>DOCUMENTACIÓN DEL INCIDENTE</strong> — Bitácora de Indisponibilidades "
        f"(Incidente #{incidente.id})</p>"
    ]

    for titulo, contenido in secciones:
        if not (contenido or "").strip():
            continue
        texto = html.escape(contenido.strip()).replace("\n", "<br>")
        partes.append(f"<p><strong>{titulo}</strong><br>{texto}</p>")

    if getattr(incidente, "fecha_fin", None):
        partes.append(f"<p><em>Fecha de cierre: {incidente.fecha_fin.strftime('%Y-%m-%d %H:%M')}</em></p>")

    return "".join(partes)


def _post_ticket_subrecurso(config: dict, ticket_id: int, path: str, body: dict) -> dict:
    """POST a un subrecurso del ticket (Timeline/Followup, Timeline/Solution, TeamMember...)."""
    base_url = config["base_url"].rstrip("/")
    token = obtener_access_token(config)
    url = f"{base_url}/api.php/v2/Assistance/Ticket/{ticket_id}/{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    profile_id = (config.get("profile_id") or "").strip()
    if profile_id:
        headers["GLPI-Profile"] = profile_id
    data = json.dumps(body).encode("utf-8")

    try:
        return _peticion(url, data=data, headers=headers, method="POST")
    except GlpiError as e:
        # El token pudo expirar entre la obtención y el uso: reintentar solo si es 401
        if e.codigo_http != 401:
            raise
        token = obtener_access_token(config, forzar=True)
        headers["Authorization"] = f"Bearer {token}"
        return _peticion(url, data=data, headers=headers, method="POST")


def crear_followup(config: dict, ticket_ref: str, contenido_html: str, privado: bool = False) -> dict:
    """Publica un comentario (ITILFollowup) en el ticket de GLPI.

    Devuelve la respuesta de GLPI ({"id": ..., "href": ...}).
    Lanza GlpiError si el ticket no existe o falla la publicación.
    """
    ticket_id = extraer_ticket_id(ticket_ref)
    if not ticket_id:
        raise GlpiError(f"No se pudo extraer un ID numérico de ticket de: '{ticket_ref}'")

    return _post_ticket_subrecurso(config, ticket_id, "Timeline/Followup", {
        "itemtype": "Ticket",
        "items_id": ticket_id,
        "content": contenido_html,
        "is_private": privado,
    })


def crear_solucion(config: dict, ticket_ref: str, contenido_html: str) -> dict:
    """Publica la documentación como Solución del ticket y cierra el caso.

    En GLPI una solución con estado aceptado (status=3) cierra el ticket.
    Devuelve la respuesta de GLPI. Lanza GlpiError si falla; lo típico es
    que el caso ya esté cerrado y GLPI no admita otra solución.
    """
    ticket_id = extraer_ticket_id(ticket_ref)
    if not ticket_id:
        raise GlpiError(f"No se pudo extraer un ID numérico de ticket de: '{ticket_ref}'")

    return _post_ticket_subrecurso(config, ticket_id, "Timeline/Solution", {
        "itemtype": "Ticket",
        "items_id": ticket_id,
        "content": contenido_html,
        "status": 3,  # aceptada -> cierra el ticket
    })


def obtener_user_id(config: dict) -> int:
    """ID del usuario de servicio en GLPI (claim 'sub' del access token)."""
    token = obtener_access_token(config)
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        claims = json.loads(base64.urlsafe_b64decode(payload_b64))
        return int(claims.get("sub") or 0)
    except Exception as e:
        raise GlpiError(f"No se pudo obtener el ID de usuario desde el token: {e}")


def asignar_miembro_team(config: dict, ticket_id: int, tipo: str, item_id: int, rol: str = "assigned") -> dict:
    """Asigna un miembro (User/Group/Supplier) al team del ticket."""
    return _post_ticket_subrecurso(config, ticket_id, "TeamMember", {
        "type": tipo,
        "id": item_id,
        "role": rol,
    })


def _patch_ticket(config: dict, ticket_id: int, body: dict) -> dict:
    """PATCH de campos del ticket (ej: mover a Cerrado)."""
    base_url = config["base_url"].rstrip("/")
    token = obtener_access_token(config)
    url = f"{base_url}/api.php/v2/Assistance/Ticket/{ticket_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    profile_id = (config.get("profile_id") or "").strip()
    if profile_id:
        headers["GLPI-Profile"] = profile_id
    data = json.dumps(body).encode("utf-8")

    try:
        return _peticion(url, data=data, headers=headers, method="PATCH")
    except GlpiError as e:
        if e.codigo_http != 401:
            raise
        token = obtener_access_token(config, forzar=True)
        headers["Authorization"] = f"Bearer {token}"
        return _peticion(url, data=data, headers=headers, method="PATCH")


def _mover_a_cerrado(config: dict, ticket_id: int):
    """Best-effort: tras la solución aceptada, mover el ticket a Cerrado (6).

    GLPI deja el ticket en 'Resuelto' al aceptar la solución; si el PATCH falla
    (permisos o transición no permitida) se queda en Resuelto, que ya es válido.
    """
    try:
        _patch_ticket(config, ticket_id, {"status": 6})
    except GlpiError as e:
        logger.debug(f"GLPI: no se pudo mover el ticket {ticket_id} a Cerrado (queda Resuelto): {e}")


def cerrar_caso_con_solucion(config: dict, ticket_ref: str, contenido_html: str, group_id: str = "") -> tuple[str, str]:
    """Publica la documentación como Solución y cierra el caso en GLPI.

    GLPI puede exigir técnico y/o grupo de técnicos asignados antes de cerrar:
      - Si falta técnico, se asigna automáticamente el usuario de servicio.
      - Si falta grupo y group_id está configurado, se asigna ese grupo.
    Si el caso no admite cierre (ya está cerrado o falta grupo sin configurar),
    la documentación se publica como comentario y se devuelve "publicado_comentario".

    Devuelve (estado, detalle) con estado "publicado" o "publicado_comentario".
    Lanza GlpiError si el ticket no existe (404) o si falla todo.
    """
    ticket_id = extraer_ticket_id(ticket_ref)
    if not ticket_id:
        raise GlpiError(f"No se pudo extraer un ID numérico de ticket de: '{ticket_ref}'")

    def _intentar_solucion() -> GlpiError | None:
        try:
            crear_solucion(config, ticket_ref, contenido_html)
            _mover_a_cerrado(config, ticket_id)
            return None
        except GlpiError as e:
            if e.codigo_http == 404:
                raise
            return e

    ultimo_error = _intentar_solucion()
    if ultimo_error is None:
        return "publicado", "Solución publicada y caso cerrado en GLPI"

    # GLPI exige técnico asignado: asignar el usuario de servicio y reintentar
    msg = str(ultimo_error).lower()
    if "technician assigned is mandatory" in msg:
        try:
            asignar_miembro_team(config, ticket_id, "User", obtener_user_id(config))
            ultimo_error = _intentar_solucion()
            if ultimo_error is None:
                return "publicado", "Solución publicada y caso cerrado (técnico asignado automáticamente)"
            msg = str(ultimo_error).lower()
        except GlpiError as e:
            if e.codigo_http == 404:
                raise
            msg = str(e).lower()

    # GLPI exige grupo de técnicos: asignar el grupo configurado y reintentar
    if "group of technicians assigned is mandatory" in msg and (group_id or "").strip():
        try:
            asignar_miembro_team(config, ticket_id, "Group", int(group_id))
            ultimo_error = _intentar_solucion()
            if ultimo_error is None:
                return "publicado", "Solución publicada y caso cerrado (grupo de técnicos asignado)"
        except GlpiError as e:
            if e.codigo_http == 404:
                raise
        except ValueError:
            pass  # group_id no numérico: continuar al comentario

    # El caso no admite cierre automático: dejar la documentación como comentario
    crear_followup(config, ticket_ref, contenido_html)
    return "publicado_comentario", "El caso no admite cierre automático; documentación publicada como comentario"
