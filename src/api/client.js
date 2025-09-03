// API client
const API_BASE = '';

class ApiClient {
  async initSession() {
    const response = await fetch(`${API_BASE}/api/session/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`Failed to initialize session: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    return await response.json();
  }

  async sendMessage(sessionId, message, attachedFile = null) {
    const response = await fetch(`${API_BASE}/api/consult/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }
    
    return await response.json();
  }

  async uploadFile(sessionId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/api/upload/${sessionId}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.status}`);
    }
    
    return await response.json();
  }

  async checkSessionStatus(sessionId) {
    const response = await fetch(`${API_BASE}/api/session/${sessionId}/status`);
    
    if (response.status === 404) {
      return { exists: false };
    }
    
    if (!response.ok) {
      throw new Error(`Failed to check session: ${response.status}`);
    }
    
    return await response.json();
  }

  async restoreSession(sessionId) {
    const response = await fetch(`${API_BASE}/api/session/${sessionId}/restore`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to restore session: ${response.status}`);
    }
    
    return await response.json();
  }
}

export default new ApiClient();
