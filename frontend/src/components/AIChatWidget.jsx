import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { 
  MessageSquare, Send, X, Bot, User, Sparkles, 
  CheckCircle2, AlertTriangle, Loader2, HelpCircle,
  Lightbulb, Zap, TrendingUp, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { bitacoraService, authService } from '../services/api';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

const SUGGESTED_PROMPTS = [
  { icon: Zap, text: 'Registrar caída de internet', label: 'Registrar caída' },
  { icon: TrendingUp, text: '¿Cuántos incidentes hubo este mes?', label: 'Incidentes del mes' },
  { icon: BarChart3, text: '¿Cuál fue el incidente más largo?', label: 'Incidente más largo' },
  { icon: Lightbulb, text: '¿Qué soluciones me recomiendas?', label: 'Recomendaciones' },
];

const CHAT_DARK_STYLES = `
  .dark .chat-window { background: #1a1a2e !important; border-color: #2e2e4e !important; }
  .dark .chat-msgs { background: #14141f !important; }
  .dark .chat-input-wrap { background: #1a1a2e !important; border-color: #2e2e4e !important; }
  .dark .chat-input { background: #14141f !important; border-color: #2e2e4e !important; color: #f1f1f6 !important; }
  .dark .chat-input::placeholder { color: #6b6b80 !important; }
  .dark .chat-msg-user { background: #7c3aed !important; }
  .dark .chat-msg-bot { background: #1e1e32 !important; border-color: #2e2e4e !important; color: #f1f1f6 !important; }
  .dark .chat-card { background: #1e1e32 !important; border-color: #2e2e4e !important; }
  .dark .chat-card .text-gray-900, .dark .chat-card .font-semibold.text-gray-900 { color: #f1f1f6 !important; }
  .dark .chat-card .text-gray-800 { color: #d1d1e0 !important; }
  .dark .chat-card .text-gray-700 { color: #c1c1d0 !important; }
  .dark .chat-card .text-gray-400, .dark .chat-card .font-semibold.text-gray-400 { color: #8a8aa0 !important; }
  .dark .chat-card .text-gray-500 { color: #7a7a90 !important; }
  .dark .chat-card .text-red-500 { color: #f87171 !important; }
`;

const AIChatWidget = () => {
  const location = useLocation();
  const flags = useFeatureFlags();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const chatEndRef = useRef(null);
  const currentUser = authService.getCurrentUser();

  const { data: catalogos = { empresas: [], aplicaciones: [], categorias: [], productos: [] } } = useQuery({
    queryKey: ['chat-catalogos'],
    queryFn: async () => {
      const [e, a, c, p] = await Promise.all([
        bitacoraService.getEmpresas(),
        bitacoraService.getAplicaciones(),
        bitacoraService.getCategorias(),
        bitacoraService.getProductos()
      ]);
      return { empresas: e, aplicaciones: a, categorias: c, productos: p };
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Mensaje de bienvenida inicial
  useEffect(() => {
    setMessages([
      {
        role: 'model',
        content: `¡Hola ${currentUser.username}! 👋 Soy **Bita**, tu asistente inteligente.\n\nPuedo ayudarte con varias cosas:\n1. **Registrar incidentes rápido**: Escribe un reporte en lenguaje natural (ej: *"Caída de Claro por 40 min hoy a las 10 am en Banca Móvil por falla de fibra. Se solucionó reiniciando el enrutador"*).\n2. **Asesoría técnica**: Pregúntame sobre soluciones anteriores o consultas de soporte general.\n3. **Lo que necesites**: Conversemos sobre tecnología, dudas de la app o lo que se te ocurra.`,
        incident_detected: false,
        extracted_data: null
      }
    ]);
  }, [currentUser.username]);

  // Scroll automático al final del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e, promptText) => {
    if (e) e.preventDefault();
    const text = promptText || inputValue.trim();
    if (!text || isLoading) return;

    const userMessageText = text;
    setInputValue('');

    // Agregar mensaje del usuario a la lista
    const newMessages = [...messages, { role: 'user', content: userMessageText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Filtrar el historial para pasarlo al backend (enviamos máximo los últimos 10 mensajes)
      const chatHistoryForBackend = newMessages.map(m => ({
        role: m.role,
        content: m.content
      })).slice(-10);

      const responseData = await bitacoraService.enviarChatIA(chatHistoryForBackend);

      setMessages(prev => [...prev, {
        role: 'model',
        content: responseData.response,
        incident_detected: responseData.incident_detected,
        extracted_data: responseData.extracted_data
      }]);
    } catch (err) {
      console.error(err);
      const errorDetail = err.response?.data?.detail || err.message || 'Error desconocido';
      setMessages(prev => [...prev, {
        role: 'model',
        content: `⚠️ Error: ${errorDetail}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmar y registrar el incidente desde el chat
  const handleConfirmarRegistro = async (extractedData, messageIndex) => {
    setIsRegistering(true);
    try {
      const result = await bitacoraService.registrarConIA(extractedData);
      
      // Actualizar el mensaje específico del chat para ocultar los botones de acción y mostrar éxito
      setMessages(prev => {
        const updated = [...prev];
        updated[messageIndex] = {
          ...updated[messageIndex],
          incident_detected: false, // Oculta los botones
          content: `${updated[messageIndex].content}\n\n✅ **¡Incidente registrado correctamente!**\n- **ID**: #${result.id}\n- **Producto**: ${result.producto?.nombre || 'Creado'}\n- **Duración**: ${result.duracion_minutos} minutos.`
        };
        return updated;
      });
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar el incidente en la base de datos.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Cancelar el pre-registro del incidente
  const handleCancelarRegistro = (messageIndex) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[messageIndex] = {
        ...updated[messageIndex],
        incident_detected: false,
        content: `${updated[messageIndex].content}\n\n❌ *Registro cancelado por el usuario.*`
      };
      return updated;
    });
  };

  // Obtener nombres amigables de los IDs
  const getNombreEmpresa = (id) => catalogos.empresas.find(e => e.id === id)?.nombre || `ID: ${id}`;
  const getNombreAplicacion = (id) => catalogos.aplicaciones.find(a => a.id === id)?.nombre || `ID: ${id}`;
  const getNombreCategoria = (id) => catalogos.categorias.find(c => c.id === id)?.nombre || `ID: ${id}`;
  const getNombreProducto = (id) => catalogos.productos.find(p => p.id === id)?.nombre || `ID: ${id}`;

  if (location.pathname === '/login' || !flags.chat_ia) return null;
  if (!currentUser.token || currentUser.rol === 'cliente') return null;

  return (
    <>
      <style>{CHAT_DARK_STYLES}</style>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center border border-white/20 focus:outline-none"
        title="Asistente de IA"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="chat-window fixed bottom-24 right-6 z-50 w-96 h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5">
          
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles size={20} className="text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Bita — Asistente IA</h3>
                  <span className="text-[10px] text-white/80 font-semibold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                    IA Activo
                  </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cuerpo de Mensajes */}
          <div className="chat-msgs flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Cabecera de Mensaje */}
                <span className="text-[10px] text-gray-400 mb-1 px-1 flex items-center gap-1">
                  {msg.role === 'user' ? (
                    <>Tú <User size={10} /></>
                  ) : (
                    <><Bot size={10} className="text-violet-600" /> Bita</>
                  )}
                </span>

                {/* Burbuja */}
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm font-normal leading-relaxed ${
                    msg.role === 'user' 
                      ? 'chat-msg-user bg-violet-600 text-white rounded-tr-none' 
                      : 'chat-msg-bot bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown
                      components={{
                        strong: ({ children }) => <strong className="font-bold text-violet-600">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
                        code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-[10px] font-mono">{children}</code>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Follow-up suggestions after bot response */}
                {msg.role === 'model' && !msg.incident_detected && idx === messages.length - 1 && idx > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      '¿Cómo registro un incidente?',
                      'Muéstrame una lista de soluciones',
                      '¿Qué es Bita?'
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => handleSend(null, s)}
                        className="text-[9px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-full px-2.5 py-1 transition-colors whitespace-nowrap"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Tarjeta interactiva de Incidentes Extraídos */}
                {msg.role === 'model' && msg.incident_detected && msg.extracted_data && (
                  <div className="chat-card mt-3 w-full bg-white border border-gray-150 rounded-xl p-3 shadow-md border-l-4 border-l-violet-500 animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-2">
                      <CheckCircle2 size={12} /> Confirmar Datos Extraídos
                    </div>
                    
                    <div className="space-y-1.5 text-[11px] text-gray-700 font-medium">
                      <div>
                        <span className="font-semibold text-gray-400 mr-1">Red/Proveedor:</span> 
                        <span className="text-gray-900 font-semibold">{getNombreEmpresa(msg.extracted_data.empresa_id)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400 mr-1">Aplicación:</span> 
                        {msg.extracted_data.aplicacion_id ? (
                          <span className="text-gray-900 font-semibold">{getNombreAplicacion(msg.extracted_data.aplicacion_id)}</span>
                        ) : msg.extracted_data.nueva_aplicacion_nombre ? (
                          msg.extracted_data.nueva_aplicacion_nombre === "SIN APP" ? (
                            <span className="text-gray-500 font-semibold">{msg.extracted_data.nueva_aplicacion_nombre}</span>
                          ) : (
                            <span className="text-violet-650 font-bold bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">
                              {msg.extracted_data.nueva_aplicacion_nombre} (Nueva Aplicación)
                            </span>
                          )
                        ) : (
                          <span className="text-red-500 font-semibold">No especificado</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400 mr-1">Producto:</span> 
                        {msg.extracted_data.producto_id ? (
                          <span className="text-gray-900 font-semibold">{getNombreProducto(msg.extracted_data.producto_id)}</span>
                        ) : msg.extracted_data.nuevo_producto_nombre ? (
                          msg.extracted_data.nuevo_producto_nombre === "SIN PROD" ? (
                            <span className="text-gray-500 font-semibold">{msg.extracted_data.nuevo_producto_nombre}</span>
                          ) : (
                            <span className="text-fuchsia-650 font-bold bg-fuchsia-50 px-1.5 py-0.5 rounded border border-fuchsia-100">
                              {msg.extracted_data.nuevo_producto_nombre} (Nuevo Producto)
                            </span>
                          )
                        ) : <span className="text-red-500 font-semibold">No especificado</span>}
                      </div>
                      
                      {/* Mostrar categoría seleccionada si es producto nuevo */}
                      {!msg.extracted_data.producto_id && (msg.extracted_data.categoria_id || msg.extracted_data.nueva_categoria_nombre) && (
                        <div>
                          <span className="font-semibold text-gray-400 mr-1">Categoría:</span> 
                          {msg.extracted_data.categoria_id ? (
                            <span className="text-gray-900 font-semibold">{getNombreCategoria(msg.extracted_data.categoria_id)}</span>
                          ) : (
                            <span className="text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              {msg.extracted_data.nueva_categoria_nombre} (Nueva Categoría)
                            </span>
                          )}
                        </div>
                      )}

                      <div>
                        <span className="font-semibold text-gray-400 mr-1">Fecha de Inicio:</span> 
                        <span className="text-gray-900 font-semibold">
                          {new Date(msg.extracted_data.fecha_inicio).toLocaleString('es-ES', { 
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      {msg.extracted_data.fecha_fin && (
                        <div>
                          <span className="font-semibold text-gray-400 mr-1">Fecha de Fin:</span> 
                          <span className="text-gray-900 font-semibold">
                            {new Date(msg.extracted_data.fecha_fin).toLocaleString('es-ES', { 
                              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-400 mr-1">Duración:</span> 
                        <span className="text-gray-900 font-bold">{msg.extracted_data.duracion_minutos} minutos</span>
                      </div>
                      {msg.extracted_data.tipo_afectacion && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-semibold text-gray-400 mr-1">Tipo de Afectación:</span> 
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            msg.extracted_data.tipo_afectacion === 'Caída Total' 
                              ? 'bg-red-50 text-red-600 border border-red-100' 
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {msg.extracted_data.tipo_afectacion}
                          </span>
                        </div>
                      )}
                      {msg.extracted_data.origen_afectacion && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-semibold text-gray-400 mr-1">Origen de Afectación:</span> 
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            msg.extracted_data.origen_afectacion === 'Aliado / Tercero' 
                              ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                              : 'bg-purple-50 text-purple-600 border border-purple-100'
                          }`}>
                            {msg.extracted_data.origen_afectacion}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-400 mr-1">Motivo:</span> 
                        <span className="text-gray-800">{msg.extracted_data.motivo}</span>
                      </div>
                      {msg.extracted_data.solucion && (
                        <div>
                          <span className="font-semibold text-gray-400 mr-1">Solución:</span> 
                          <span className="text-gray-800">{msg.extracted_data.solucion}</span>
                        </div>
                      )}
                      {msg.extracted_data.ticket && (
                        <div>
                          <span className="font-semibold text-gray-400 mr-1">Ticket:</span> 
                          <span className="text-violet-600 font-mono font-semibold">{msg.extracted_data.ticket}</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción de la tarjeta */}
                    {currentUser.rol !== 'admin' && (
                      ((msg.extracted_data.nueva_aplicacion_nombre && msg.extracted_data.nueva_aplicacion_nombre.trim() !== '' && msg.extracted_data.nueva_aplicacion_nombre.trim().toUpperCase() !== 'SIN APP') ||
                       (msg.extracted_data.nuevo_producto_nombre && msg.extracted_data.nuevo_producto_nombre.trim() !== '' && msg.extracted_data.nuevo_producto_nombre.trim().toUpperCase() !== 'SIN PROD'))
                    ) ? (
                      <div className="mt-3 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 p-2.5 rounded-lg flex items-start gap-1.5 leading-relaxed">
                        <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          No encuentras la aplicación o producto en el catálogo. Comunícate con el administrador para que sea creada antes de poder registrar el incidente.
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2 justify-end">
                        <button
                          onClick={() => handleCancelarRegistro(idx)}
                          disabled={isRegistering}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleConfirmarRegistro(msg.extracted_data, idx)}
                          disabled={isRegistering}
                          className="px-3 py-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                        >
                          {isRegistering ? (
                            <>
                              <Loader2 size={10} className="animate-spin" /> Guardando...
                            </>
                          ) : (
                            <>Confirmar e Ingresar</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Sugerencias rápidas */}
            {messages.length <= 1 && !isLoading && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                {SUGGESTED_PROMPTS.map(p => (
                  <button
                    key={p.text}
                    onClick={() => handleSend(null, p.text)}
                    className="flex items-center gap-1 text-[9px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-full px-3 py-1.5 transition-colors"
                  >
                    <p.icon size={10} />
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Burbuja de Carga */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-gray-400 mb-1 px-1 flex items-center gap-1">
                  <Bot size={10} className="text-violet-600" /> Bita
                </span>
                <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <span className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400">Analizando...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Formulario de Input */}
          <form onSubmit={handleSend} className="chat-input-wrap p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregunta o describe el incidente..."
              disabled={isLoading || isRegistering}
              className="chat-input flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-gray-800 placeholder-gray-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isRegistering}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}
    </>
  );
};

export default AIChatWidget;
