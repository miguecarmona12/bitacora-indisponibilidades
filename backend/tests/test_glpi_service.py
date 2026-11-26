import json
import sys
import os
import urllib.error
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import glpi_service


class RespuestaFake:
    def __init__(self, cuerpo: dict, codigo: int = 200):
        self._cuerpo = cuerpo
        self.codigo = codigo

    def read(self):
        return json.dumps(self._cuerpo).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class IncidenteFake:
    id = 42
    ticket = "736774"
    motivo = "Caída total del servicio por falla en el balanceador"
    causa_raiz = "Certificado SSL vencido en el nodo principal"
    solucion = "Se renovó el certificado y se restableció el servicio"
    accion_correctiva = "Reinicio del servicio y parche aplicado"
    fecha_fin = None


def test_extraer_ticket_id():
    assert glpi_service.extraer_ticket_id("736774") == 736774
    assert glpi_service.extraer_ticket_id("#736774") == 736774
    assert glpi_service.extraer_ticket_id("Ticket 736599") == 736599
    assert glpi_service.extraer_ticket_id("caso 123") == 123
    assert glpi_service.extraer_ticket_id("") is None
    assert glpi_service.extraer_ticket_id(None) is None
    assert glpi_service.extraer_ticket_id("sin numeros") is None


def test_construir_contenido_followup():
    contenido = glpi_service.construir_contenido_followup(IncidenteFake())
    assert "DOCUMENTACIÓN DEL INCIDENTE" in contenido
    assert "Incidente #42" in contenido
    assert "SITUACIÓN" in contenido
    assert "Caída total del servicio por falla en el balanceador" in contenido
    assert "CAUSA RAÍZ" in contenido
    assert "Certificado SSL vencido en el nodo principal" in contenido
    assert "SOLUCIÓN APLICADA" in contenido
    assert "Se renovó el certificado y se restableció el servicio" in contenido
    assert "ACCIÓN CORRECTIVA" in contenido
    assert "Reinicio del servicio y parche aplicado" in contenido
    assert "Registrado por" not in contenido
    assert "<p>" in contenido


def test_construir_contenido_omite_secciones_vacias():
    class Parcial:
        id = 7
        ticket = "7"
        motivo = None
        causa_raiz = "Falla de disco"
        solucion = ""
        accion_correctiva = None
        fecha_fin = None

    contenido = glpi_service.construir_contenido_followup(Parcial())
    assert "SITUACIÓN" not in contenido
    assert "CAUSA RAÍZ" in contenido
    assert "Falla de disco" in contenido
    assert "SOLUCIÓN APLICADA" not in contenido
    assert "ACCIÓN CORRECTIVA" not in contenido


def test_construir_contenido_fecha_de_cierre():
    class ConFechaFin:
        id = 3
        ticket = "3"
        motivo = None
        causa_raiz = "x"
        solucion = None
        accion_correctiva = None
        fecha_fin = None

    import datetime as _dt
    ConFechaFin.fecha_fin = _dt.datetime(2026, 11, 26, 12, 30)
    contenido = glpi_service.construir_contenido_followup(ConFechaFin())
    assert "Fecha de cierre: 2026-11-26 12:30" in contenido


def test_construir_contenido_escapa_html():
    class Peligroso:
        id = 1
        ticket = "1"
        motivo = "<script>alert('x')</script>"
        causa_raiz = None
        solucion = None
        accion_correctiva = None
        fecha_fin = None

    contenido = glpi_service.construir_contenido_followup(Peligroso())
    assert "<script>" not in contenido
    assert "&lt;script&gt;" in contenido


def test_crear_followup_sin_ticket_numerico_lanza_error():
    try:
        glpi_service.crear_followup("abc", "<p>test</p>")
        assert False, "Debía lanzar GlpiError"
    except glpi_service.GlpiError as e:
        assert "ID numérico" in str(e)


@patch.object(glpi_service, "obtener_access_token", return_value="token-falso")
@patch.object(glpi_service, "_peticion", return_value={"id": 555, "href": "/x"})
def test_crear_followup_ok(mock_peticion, mock_token):
    respuesta = glpi_service.crear_followup("736774", "<p>contenido</p>")
    assert respuesta["id"] == 555
    args, kwargs = mock_peticion.call_args
    assert "736774" in args[0]
    assert kwargs["method"] == "POST"
    body = json.loads(kwargs["data"].decode("utf-8"))
    assert body["items_id"] == 736774
    assert body["itemtype"] == "Ticket"
    assert body["content"] == "<p>contenido</p>"


@patch.object(glpi_service, "glpi_configurado", return_value=True)
@patch.object(glpi_service, "obtener_access_token", return_value="token-falso")
@patch.object(glpi_service, "_peticion")
def test_crear_followup_reintenta_solo_en_401(mock_peticion, mock_token, mock_conf):
    error_403 = glpi_service.GlpiError("GLPI respondió 403: permisos", codigo_http=403)
    mock_peticion.side_effect = [error_403]
    try:
        glpi_service.crear_followup("736774", "<p>x</p>")
        assert False, "Debía propagar el error 403"
    except glpi_service.GlpiError:
        pass
    assert mock_peticion.call_count == 1

    # Con 401 reintenta una vez
    error_401 = glpi_service.GlpiError("GLPI respondió 401: token expirado", codigo_http=401)
    mock_peticion.side_effect = [error_401, {"id": 1}]
    respuesta = glpi_service.crear_followup("736774", "<p>x</p>")
    assert respuesta == {"id": 1}
    assert mock_peticion.call_count == 3


@patch.object(glpi_service, "glpi_configurado", return_value=True)
@patch.object(glpi_service, "_peticion")
def test_obtener_access_token_cachea(mock_peticion, mock_conf):
    mock_peticion.return_value = {"access_token": "tok-1", "expires_in": 3600}
    glpi_service._token_cache["access_token"] = None
    glpi_service._token_cache["expires_at"] = 0

    token1 = glpi_service.obtener_access_token()
    token2 = glpi_service.obtener_access_token()
    assert token1 == "tok-1"
    assert token2 == "tok-1"
    assert mock_peticion.call_count == 1  # la segunda usa caché
    glpi_service._token_cache["access_token"] = None
    glpi_service._token_cache["expires_at"] = 0


def test_glpi_error_sin_configurar():
    # Sin variables de entorno el token lanza GlpiError con mensaje claro
    guardado = dict(glpi_service._token_cache)
    glpi_service._token_cache["access_token"] = None
    glpi_service._token_cache["expires_at"] = 0
    try:
        with patch.object(glpi_service, "glpi_configurado", return_value=False):
            try:
                glpi_service.obtener_access_token()
                assert False, "Debía lanzar GlpiError"
            except glpi_service.GlpiError as e:
                assert "no configurada" in str(e)
    finally:
        glpi_service._token_cache.update(guardado)
