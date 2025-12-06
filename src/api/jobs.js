import apiClient from './client';

export const jobsAPI = {
  // Get all jobs
  getAll: async (params = {}) => {
    const response = await apiClient.get('/jobs', { params });
    return response.data;
  },

  // Get single job
  getById: async (id) => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data;
  },

  // Create job
  create: async (jobData) => {
    const response = await apiClient.post('/jobs', jobData);
    return response.data;
  },

  // Update job
  update: async (id, jobData) => {
    const response = await apiClient.put(`/jobs/${id}`, jobData);
    return response.data;
  },

  // Delete job
  delete: async (id) => {
    const response = await apiClient.delete(`/jobs/${id}`);
    return response.data;
  }
};
