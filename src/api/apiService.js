// src/api/apiService.js
// ABSOLUTELY FINAL VERSION

const BASE_URL = 'https://cognitech.pythonanywhere.com';

const apiService = {
  register: async (userId, password, nombre, apellido, fecha_nacimiento, numero_celular, direccion) => {
    try {
      console.log('🔵 apiService.register called with parameters:');
      console.log('  userId:', userId);
      console.log('  password:', password ? '***' : 'undefined');
      console.log('  nombre:', nombre);
      console.log('  apellido:', apellido);
      console.log('  fecha_nacimiento:', fecha_nacimiento);
      console.log('  numero_celular:', numero_celular);
      console.log('  direccion:', direccion);

      const body = {
        user_id: userId,
        password: password,
        nombre: nombre,
        apellido: apellido,
        fecha_nacimiento: fecha_nacimiento,
        numero_celular: numero_celular,
        direccion: direccion,
      };

      console.log('🔵 Sending to Django:', body);

      const response = await fetch(`${BASE_URL}/api/accounts/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('🔵 Response status:', response.status);

      const responseText = await response.text();
      console.log('🔵 Response body:', responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Parsed JSON:', data);
      } catch (parseError) {
        console.error('❌ JSON Parse Error!');
        console.error('Response was HTML:', responseText.substring(0, 200));
        throw new Error('Django returned HTML. Check Django error logs on PythonAnywhere!');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  },

  login: async (userId, password) => {
    try {
      const response = await fetch(`${BASE_URL}/api/accounts/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      return {
        success: true,
        user_id: data.user_id,
        message: data.message,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  getUserMonedas: async (userId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/accounts/monedas/?user_id=${userId}`);
      
      if (!response.ok) {
        return { monedas: 0 };
      }

      const data = await response.json();
      return {
        monedas: data.monedas || 0,
      };
    } catch (error) {
      console.log('Monedas endpoint error, using default 0');
      return { monedas: 0 };
    }
  },

  getActiveEvents: async () => {
    try {
      const response = await fetch(`${BASE_URL}/eventos/api/active-events/`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener eventos activos');
      }

      return {
        events: data.events || [],
      };
    } catch (error) {
      console.error('Get active events error:', error);
      throw error;
    }
  },

  getCurrentEvent: async () => {
    try {
      const response = await fetch(`${BASE_URL}/eventos/api/current-event/`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener evento actual');
      }

      return data;
    } catch (error) {
      console.error('Get current event error:', error);
      throw error;
    }
  },

  participateInRonda: async (userId, rondaId) => {
    try {
      const response = await fetch(`${BASE_URL}/eventos/api/participate-in-ronda/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ronda_id: rondaId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al participar en la ronda');
      }

      return {
        success: true,
        participation_id: data.participation_id,
        monedas_remaining: data.remaining_monedas,
        ronda_number: data.ronda_number,
        event_name: data.event_name,
      };
    } catch (error) {
      console.error('Participate in ronda error:', error);
      throw error;
    }
  },

  getUserRondaParticipations: async (userId, eventoId = null) => {
    try {
      let url = `${BASE_URL}/eventos/api/user-ronda-participations/?user_id=${userId}`;
      if (eventoId) {
        url += `&evento_id=${eventoId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener participaciones');
      }

      return {
        participations: data.participations || [],
        total_participations: data.total_participations || 0,
      };
    } catch (error) {
      console.error('Get user ronda participations error:', error);
      throw error;
    }
  },

  submitRondaPredictions: async (participationId, predictions) => {
    try {
      const response = await fetch(`${BASE_URL}/eventos/api/submit-ronda-predictions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participation_id: participationId,
          predictions: predictions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar predicciones');
      }

      return {
        success: true,
        predictions_saved: data.predictions_saved,
        message: data.message,
      };
    } catch (error) {
      console.error('Submit ronda predictions error:', error);
      throw error;
    }
  },

  getRondaResults: async (rondaId) => {
    try {
      const response = await fetch(`${BASE_URL}/eventos/api/ronda-results/?ronda_id=${rondaId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener resultados');
      }

      return data;
    } catch (error) {
      console.error('Get ronda results error:', error);
      throw error;
    }
  },

  getRankings: async (eventoId) => {
    try {
      const response = await fetch(`${BASE_URL}/eventos/api/rankings/${eventoId}/`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener rankings');
      }

      return data;
    } catch (error) {
      console.error('Get rankings error:', error);
      throw error;
    }
  },

  checkParticipation: async (userId, eventId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/eventos/api/check-participation/?user_id=${userId}&event_id=${eventId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar participación');
      }

      return data;
    } catch (error) {
      console.error('Check participation error:', error);
      throw error;
    }
  },

  getUserResults: async (userId) => {
    try {
      const response = await fetch(`${BASE_URL}/eventos/api/user-results/?user_id=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener resultados');
      }

      return data;
    } catch (error) {
      console.error('Get user results error:', error);
      throw error;
    }
  },
};

export default apiService;