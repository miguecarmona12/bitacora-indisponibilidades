import json
import sys
import os
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import glpi_service


CONFIG_OK = {
    "base_url": "https://glpi.example.com",
    "client_id": "client-id",
    "client_secret": "client-secret",
    "username": "servicio",
    "password": "secreto",
    "profile_id": "12",
}


class IncidenteFake:
    id = 42
    ticket = "736774"
    motivo = "Caída total del servicio por falla en el balanceador"
    causa_raiz = "Certificado SSL vencido en el nodo principal"
    solucion = "Se renovó el certificado y se restableció el servicio"
    accion_correctiva = "Reinicio del servicio y parche aplicado"
    fecha_fin = None


def test_config_valida():
    assert glpi_service.config_valida(CONFIG_OK)
    assert not glpi_service.config_valida(None)
    assert not glpi_service.config_valida({})
    incompleta = dict(CONFIG_OK, password="")
    assert not glpi_service.config_valida(incompleta)
    incompleta = dict(CONFIG_OK, base_url="   ")
    assert not glpi_service.config_valida(incompleta)


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
    import datetime as _dt

    class ConFechaFin:
        id = 3
        ticket = "3"
        motivo = None
        causa_raiz = "x"
        solucion = None
        accion_correctiva = None
        fecha_fin = _dt.datetime(2026, 11, 26, 12, 30)

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
        glpi_service.crear_followup(CONFIG_OK, "abc", "<p>test</p>")
        assert False, "Debía lanzar GlpiError"
    except glpi_service.GlpiError as e:
        assert "ID numérico" in str(e)


@patch.object(glpi_service, "obtener_access_token", return_value="token-falso")
@patch.object(glpi_service, "_peticion", return_value={"id": 555, "href": "/x"})
def test_crear_followup_ok(mock_peticion, mock_token):
    respuesta = glpi_service.crear_followup(CONFIG_OK, "736774", "<p>contenido</p>")
    assert respuesta["id"] == 555
    args, kwargs = mock_peticion.call_args
    assert "736774" in args[0]
    assert "/api.php/v2/Assistance/Ticket/736774/Timeline/Followup" in args[0]
    assert kwargs["method"] == "POST"
    assert kwargs["headers"]["GLPI-Profile"] == "12"
    body = json.loads(kwargs["data"].decode("utf-8"))
    assert body["items_id"] == 736774
    assert body["itemtype"] == "Ticket"
    assert body["content"] == "<p>contenido</p>"


def test_crear_followup_sin_profile_no_envia_header():
    config_sin_perfil = dict(CONFIG_OK, profile_id="")

    @patch.object(glpi_service, "obtener_access_token", return_value="token-falso")
    @patch.object(glpi_service, "_peticion", return_value={"id": 1})
    def _run(mock_peticion, mock_token):
        glpi_service.crear_followup(config_sin_perfil, "736774", "<p>x</p>")
        _, kwargs = mock_peticion.call_args
        assert "GLPI-Profile" not in kwargs["headers"]

    _run()


@patch.object(glpi_service, "obtener_access_token", return_value="token-falso")
@patch.object(glpi_service, "_peticion")
def test_crear_followup_reintenta_solo_en_401(mock_peticion, mock_token):
    error_403 = glpi_service.GlpiError("GLPI respondió 403: permisos", codigo_http=403)
    mock_peticion.side_effect = [error_403]
    try:
        glpi_service.crear_followup(CONFIG_OK, "736774", "<p>x</p>")
        assert False, "Debía propagar el error 403"
    except glpi_service.GlpiError:
        pass
    assert mock_peticion.call_count == 1

    # Con 401 reintenta una vez
    error_401 = glpi_service.GlpiError("GLPI respondió 401: token expirado", codigo_http=401)
    mock_peticion.side_effect = [error_401, {"id": 1}]
    respuesta = glpi_service.crear_followup(CONFIG_OK, "736774", "<p>x</p>")
    assert respuesta == {"id": 1}
    assert mock_peticion.call_count == 3


@patch.object(glpi_service, "_peticion")
def test_obtener_access_token_cachea(mock_peticion):
    mock_peticion.return_value = {"access_token": "tok-1", "expires_in": 3600}
    glpi_service._token_cache["huella"] = None
    glpi_service._token_cache["access_token"] = None
    glpi_service._token_cache["expires_at"] = 0

    token1 = glpi_service.obtener_access_token(CONFIG_OK)
    token2 = glpi_service.obtener_access_token(CONFIG_OK)
    assert token1 == "tok-1"
    assert token2 == "tok-1"
    assert mock_peticion.call_count == 1  # la segunda usa caché

    # Cambiar la configuración invalida la caché
    otra_config = dict(CONFIG_OK, password="otro-secreto")
    glpi_service.obtener_access_token(otra_config)
    assert mock_peticion.call_count == 2

    glpi_service._token_cache["huella"] = None
    glpi_service._token_cache["access_token"] = None
    glpi_service._token_cache["expires_at"] = 0


def test_obtener_access_token_sin_config_lanza_error():
    try:
        glpi_service.obtener_access_token({})
        assert False, "Debía lanzar GlpiError"
    except glpi_service.GlpiError as e:
        assert "no configurada" in str(e)


@patch.object(glpi_service, "obtener_access_token", side_effect=glpi_service.GlpiError("GLPI respondió 401: credenciales inválidas"))
def test_probar_conexion_devuelve_error(mock_token):
    ok, mensaje = glpi_service.probar_conexion(CONFIG_OK)
    assert not ok
    assert "401" in mensaje


@patch.object(glpi_service, "obtener_access_token", return_value="tok")
def test_probar_conexion_ok(mock_token):
    ok, mensaje = glpi_service.probar_conexion(CONFIG_OK)
    assert ok
    assert "exitosa" in mensaje
