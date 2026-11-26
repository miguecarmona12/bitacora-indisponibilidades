"""
Cliente de integración con GLPI 12 (High-Level API v2).

Publica la "Acción Correctiva" de un incidente como comentario (followup)
en el ticket original de GLPI.

Autenticación: OAuth2 Password Grant contra /api.php/token
Followups:      POST /api.php/v2/Assistance/Ticket/{id}/Timeline/Followup

Configuración (variables de entorno):
    GLPI_BASE_URL       ej: https://sos.ux.technology
    GLPI_CLIENT_ID      client_id del OAuth Client (Configuración > Clientes OAuth)
    GLPI_CLIENT_SECRET  client_secret del OAuth Client
    GLPI_USERNAME       usuario GLPI de servicio
    GLPI_PASSWORD       contraseña del usuario GLPI
"""
import html
import json
import os
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

from loguru import logger

GLPI_BASE_URL = (os.getenv("GLPI_BASE_URL") or "").rstrip("/")
GLPI_CLIENT_ID = os.getenv("GLPI_CLIENT_ID", "")
GLPI_CLIENT_SECRET = os.getenv("GLPI_CLIENT_SECRET", "")
GLPI_USERNAME = os.getenv("GLPI_USERNAME", "")
GLPI_PASSWORD = os.getenv("GLPI_PASSWORD", "")
# ID del perfil GLPI con permisos de añadir seguimientos (ej: perfil técnico).
# Opcional: si el perfil por defecto del usuario ya sirve, dejar vacío.
GLPI_PROFILE_ID = os.getenv("GLPI_PROFILE_ID", "")

_TIMEOUT = 15  # segundos por petición HTTP

# Caché del access token (expira en ~1h según GLPI_OAUTH_ACCESS_TOKEN_EXPIRES)
_token_cache = {"access_token": None, "expires_at": 0.0}
_token_lock = threading.Lock()


class GlpiError(Exception):
    """Error de comunicación o autenticación con GLPI."""

    def __init__(self, mensaje: str, codigo_http: int = None):
        super().__init__(mensaje)
        self.codigo_http = codigo_http


def glpi_configurado() -> bool:
    """Indica si la integración tiene todas las credenciales necesarias."""
    return bool(GLPI_BASE_URL and GLPI_CLIENT_ID and GLPI_CLIENT_SECRET and GLPI_USERNAME and GLPI_PASSWORD)


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


def obtener_access_token(forzar: bool = False) -> str:
    """Obtiene (y cachea) un access token OAuth2 con Password Grant."""
    with _token_lock:
        if not forzar and _token_cache["access_token"] and time.time() < _token_cache["expires_at"]:
            return _token_cache["access_token"]

        if not glpi_configurado():
            raise GlpiError("Integración GLPI no configurada (faltan variables GLPI_*)")

        datos = urllib.parse.urlencode({
            "grant_type": "password",
            "client_id": GLPI_CLIENT_ID,
            "client_secret": GLPI_CLIENT_SECRET,
            "username": GLPI_USERNAME,
            "password": GLPI_PASSWORD,
            "scope": "api",
        }).encode("utf-8")

        respuesta = _peticion(
            f"{GLPI_BASE_URL}/api.php/token",
            data=datos,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )

        token = respuesta.get("access_token")
        expira_en = int(respuesta.get("expires_in", 3600))
        if not token:
            raise GlpiError("GLPI no devolvió access_token en la autenticación OAuth2")

        # Margen de 60s para no usar un token a punto de expirar
        _token_cache["access_token"] = token
        _token_cache["expires_at"] = time.time() + max(60, expira_en - 60)
        logger.debug("GLPI: nuevo access token OAuth2 obtenido")
        return token


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


def crear_followup(ticket_ref: str, contenido_html: str, privado: bool = False) -> dict:
    """Publica un comentario (ITILFollowup) en el ticket de GLPI.

    Devuelve la respuesta de GLPI ({"id": ..., "href": ...}).
    Lanza GlpiError si el ticket no existe o falla la publicación.
    """
    ticket_id = extraer_ticket_id(ticket_ref)
    if not ticket_id:
        raise GlpiError(f"No se pudo extraer un ID numérico de ticket de: '{ticket_ref}'")

    token = obtener_access_token()
    body = json.dumps({
        "itemtype": "Ticket",
        "items_id": ticket_id,
        "content": contenido_html,
        "is_private": privado,
    }).encode("utf-8")

    url = f"{GLPI_BASE_URL}/api.php/v2/Assistance/Ticket/{ticket_id}/Timeline/Followup"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if GLPI_PROFILE_ID:
        headers["GLPI-Profile"] = GLPI_PROFILE_ID

    try:
        return _peticion(url, data=body, headers=headers, method="POST")
    except GlpiError as e:
        # El token pudo expirar entre la obtención y el uso: reintentar solo si es 401
        if e.codigo_http != 401:
            raise
        token = obtener_access_token(forzar=True)
        headers["Authorization"] = f"Bearer {token}"
        return _peticion(url, data=body, headers=headers, method="POST")
