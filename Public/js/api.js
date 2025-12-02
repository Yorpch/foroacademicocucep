const API_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
    console.log('🔧 ApiService inicializado');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Obtener token fresco de localStorage
    const currentToken = localStorage.getItem('token');
    console.log('🔑 Token actual:', currentToken ? 'Presente' : 'Ausente');
    
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
      
      // Verificar si el token ha expirado
      if (this.tokenExpirado(currentToken)) {
        console.log('⚠️ Token ha expirado, limpiando...');
        this.limpiarSesion();
        throw new Error('Token expirado. Por favor, inicia sesión nuevamente.');
      }
    }
    
    try {
      console.log(`🌐 Haciendo request a: ${API_URL}${endpoint}`);
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      console.log('📨 Response status:', response.status, response.statusText);
      
      // Si el error es 403 (Token inválido), limpiar sesión
      if (response.status === 403) {
        console.log('❌ Error 403 - Token inválido o expirado');
        this.limpiarSesion();
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensaje || `Error ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error en la petición:', error);
      
      // Si es error de autenticación, redirigir a login
      if (error.message.includes('expirado') || error.message.includes('403') || error.message.includes('401')) {
        this.redirigirALogin();
      }
      
      throw error;
    }
  }

  // Verificar si el token ha expirado
  tokenExpirado(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiraEn = payload.exp * 1000; // Convertir a milisegundos
      const ahora = Date.now();
      
      console.log('⏰ Token expira en:', new Date(expiraEn));
      console.log('⏰ Hora actual:', new Date(ahora));
      console.log('⏰ Diferencia (min):', (expiraEn - ahora) / 60000);
      
      // Considerar expirado si falta menos de 1 minuto
      return expiraEn - ahora < 60000;
    } catch (error) {
      console.log('❌ Error verificando token:', error);
      return true; // Si no se puede decodificar, considerar expirado
    }
  }

  async login(email, password) {
    console.log('🔐 Intentando login para:', email);
    
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        correo: email, 
        contrasena: password 
      }),
    });
    
    if (result.token) {
      this.token = result.token;
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.usuario));
      console.log('✅ Login exitoso, token guardado');
      console.log('👤 Usuario:', result.usuario);
    } else {
      console.log('❌ Login falló, no hay token en respuesta');
    }
    
    return result;
  }

  logout() {
    this.limpiarSesion();
    console.log('✅ Sesión cerrada');
  }

  limpiarSesion() {
    console.log('🧹 Limpiando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
  }

  redirigirALogin() {
    console.log('🔄 Redirigiendo a login...');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1000);
  }

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return false;
    }
    
    // Verificar si el token está expirado
    if (this.tokenExpirado(token)) {
      console.log('⚠️ Token expirado en isAuthenticated()');
      this.limpiarSesion();
      return false;
    }
    
    return true;
  }

  getUserData() {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    return userData;
  }
  
  // Obtener información del token
  getTokenInfo() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        payload: payload,
        expira: new Date(payload.exp * 1000),
        usuario_id: payload.id,
        email: payload.email,
        tiempoRestante: Math.floor((payload.exp * 1000 - Date.now()) / 60000) // minutos
      };
    } catch (error) {
      return null;
    }
  }
}

const api = new ApiService();