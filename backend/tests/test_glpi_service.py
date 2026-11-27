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


def test_crear_solucion_sin_ticket_numerico_lanza_error():
    try:
        glpi_service.crear_solucion(CONFIG_OK, "abc", "<p>test</p>")
        assert False, "Debía lanzar GlpiError"
    except glpi_service.GlpiError as e:
        assert "ID numérico" in str(e)


@patch.object(glpi_service, "obtener_access_token", return_value="token-falso")
@patch.object(glpi_service, "_peticion", return_value={"id": 777, "href": "/x"})
def test_crear_solucion_ok(mock_peticion, mock_token):
    respuesta = glpi_service.crear_solucion(CONFIG_OK, "736774", "<p>solución</p>")
    assert respuesta["id"] == 777
    args, kwargs = mock_peticion.call_args
    assert "/api.php/v2/Assistance/Ticket/736774/Timeline/Solution" in args[0]
    assert kwargs["method"] == "POST"
    assert kwargs["headers"]["GLPI-Profile"] == "12"
    body = json.loads(kwargs["data"].decode("utf-8"))
    assert body["items_id"] == 736774
    assert body["itemtype"] == "Ticket"
    assert body["content"] == "<p>solución</p>"
    assert body["status"] == 3  # aceptada -> cierra el ticket


@patch.object(glpi_service, "obtener_access_token", return_value="token-falso")
@patch.object(glpi_service, "_peticion")
def test_crear_solucion_reintenta_solo_en_401(mock_peticion, mock_token):
    error_400 = glpi_service.GlpiError("GLPI respondió 400: ticket already closed", codigo_http=400)
    mock_peticion.side_effect = [error_400]
    try:
        glpi_service.crear_solucion(CONFIG_OK, "736774", "<p>x</p>")
        assert False, "Debía propagar el error 400"
    except glpi_service.GlpiError:
        pass
    assert mock_peticion.call_count == 1

    error_401 = glpi_service.GlpiError("GLPI respondió 401: token expirado", codigo_http=401)
    mock_peticion.side_effect = [error_401, {"id": 1}]
    respuesta = glpi_service.crear_solucion(CONFIG_OK, "736774", "<p>x</p>")
    assert respuesta == {"id": 1}
    assert mock_peticion.call_count == 3


@patch.object(glpi_service, "obtener_access_token")
def test_obtener_user_id_decodifica_jwt(mock_token):
    import base64 as _b64
    payload = _b64.urlsafe_b64encode(json.dumps({"sub": "1839"}).encode()).decode().rstrip("=")
    mock_token.return_value = f"header.{payload}.firma"
    assert glpi_service.obtener_user_id(CONFIG_OK) == 1839


@patch.object(glpi_service, "obtener_access_token", return_value="token-falso")
@patch.object(glpi_service, "_peticion", return_value={})
def test_asignar_miembro_team(mock_peticion, mock_token):
    glpi_service.asignar_miembro_team(CONFIG_OK, 736774, "Group", 5)
    args, kwargs = mock_peticion.call_args
    assert "/api.php/v2/Assistance/Ticket/736774/TeamMember" in args[0]
    body = json.loads(kwargs["data"].decode("utf-8"))
    assert body == {"type": "Group", "id": 5, "role": "assigned"}


@patch.object(glpi_service, "_mover_a_cerrado")
@patch.object(glpi_service, "crear_followup")
@patch.object(glpi_service, "crear_solucion", return_value={"id": 1})
def test_cerrar_caso_solucion_directa(mock_solucion, mock_followup, mock_cerrado):
    estado, detalle = glpi_service.cerrar_caso_con_solucion(CONFIG_OK, "736774", "<p>x</p>")
    assert estado == "publicado"
    mock_solucion.assert_called_once()
    mock_followup.assert_not_called()


@patch.object(glpi_service, "_mover_a_cerrado")
@patch.object(glpi_service, "crear_followup")
@patch.object(glpi_service, "asignar_miembro_team")
@patch.object(glpi_service, "obtener_user_id", return_value=1839)
@patch.object(glpi_service, "crear_solucion")
def test_cerrar_caso_asigna_tecnico_si_falta(mock_solucion, mock_uid, mock_team, mock_followup, mock_cerrado):
    error = glpi_service.GlpiError("Technician assigned is mandatory before ticket is solved/closed", codigo_http=500)
    mock_solucion.side_effect = [error, {"id": 1}]
    estado, detalle = glpi_service.cerrar_caso_con_solucion(CONFIG_OK, "736774", "<p>x</p>")
    assert estado == "publicado"
    assert mock_solucion.call_count == 2
    mock_team.assert_called_once_with(CONFIG_OK, 736774, "User", 1839)
    mock_followup.assert_not_called()


@patch.object(glpi_service, "_mover_a_cerrado")
@patch.object(glpi_service, "crear_followup")
@patch.object(glpi_service, "asignar_miembro_team")
@patch.object(glpi_service, "obtener_user_id", return_value=1839)
@patch.object(glpi_service, "crear_solucion")
def test_cerrar_caso_asigna_grupo_configurado(mock_solucion, mock_uid, mock_team, mock_followup, mock_cerrado):
    error_tec = glpi_service.GlpiError("Technician assigned is mandatory", codigo_http=500)
    error_grupo = glpi_service.GlpiError("Group of technicians assigned is mandatory before ticket is solved/closed", codigo_http=500)
    mock_solucion.side_effect = [error_tec, error_grupo, {"id": 1}]
    estado, detalle = glpi_service.cerrar_caso_con_solucion(CONFIG_OK, "736774", "<p>x</p>", group_id="7")
    assert estado == "publicado"
    assert mock_solucion.call_count == 3
    assert mock_team.call_count == 2  # User + Group
    mock_team.assert_any_call(CONFIG_OK, 736774, "Group", 7)
    mock_followup.assert_not_called()


@patch.object(glpi_service, "_mover_a_cerrado")
@patch.object(glpi_service, "crear_followup", return_value={"id": 2})
@patch.object(glpi_service, "asignar_miembro_team")
@patch.object(glpi_service, "obtener_user_id", return_value=1839)
@patch.object(glpi_service, "crear_solucion")
def test_cerrar_caso_sin_grupo_configurado_cae_a_comentario(mock_solucion, mock_uid, mock_team, mock_followup, mock_cerrado):
    error_grupo = glpi_service.GlpiError("Group of technicians assigned is mandatory before ticket is solved/closed", codigo_http=500)
    mock_solucion.side_effect = [error_grupo]
    estado, detalle = glpi_service.cerrar_caso_con_solucion(CONFIG_OK, "736774", "<p>x</p>", group_id="")
    assert estado == "publicado_comentario"
    mock_team.assert_not_called()
    mock_followup.assert_called_once()


@patch.object(glpi_service, "crear_followup")
@patch.object(glpi_service, "crear_solucion")
def test_cerrar_caso_ticket_inexistente_propaga_404(mock_solucion, mock_followup):
    error_404 = glpi_service.GlpiError("GLPI respondió 404: not found", codigo_http=404)
    mock_solucion.side_effect = error_404
    try:
        glpi_service.cerrar_caso_con_solucion(CONFIG_OK, "736774", "<p>x</p>")
        assert False, "Debía propagar el 404"
    except glpi_service.GlpiError as e:
        assert e.codigo_http == 404
    mock_followup.assert_not_called()
