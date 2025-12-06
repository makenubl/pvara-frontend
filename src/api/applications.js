import apiClient from './client';

export const applicationsAPI = {
  // Get all applications
  getAll: async (params = {}) => {
    const response = await apiClient.get('/applications', { params });
    return response.data;
  },

  // Get single application
  getById: async (id) => {
    const response = await apiClient.get(`/applications/${id}`);
    return response.data;
  },

  // Submit application
  create: async (applicationData) => {
    const response = await apiClient.post('/applications', applicationData);
    return response.data;
  },

  // Update application status
  updateStatus: async (id, status, reason = '') => {
    const response = await apiClient.put(`/applications/${id}/status`, { status, reason });
    return response.data;
  },

  // Add note to application
  addNote: async (id, noteData) => {
    const response = await apiClient.post(`/applications/${id}/notes`, noteData);
    return response.data;
  },

  // Bulk status update
  bulkUpdateStatus: async (applicationIds, status) => {
    const response = await apiClient.post('/applications/bulk-status', { 
      applicationIds, 
      status 
    });
    return response.data;
  }
};
