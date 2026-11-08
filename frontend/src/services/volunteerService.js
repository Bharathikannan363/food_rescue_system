
import api from './api';

export const volunteerService = {

  // Get tasks available for volunteers.
  getAvailableTasks: () =>
    api.get('/volunteer/available-tasks'),

  // Claim an available food request.
  claimTask: (request_id) => {
    if (!request_id) {
      return Promise.reject(
        new Error('Request ID is required to claim a task.')
      );
    }

    return api.post('/volunteer/claim-task', {
      request_id
    });
  },

  // Get assignments belonging to the logged-in volunteer.
  getAssignments: () =>
    api.get('/volunteer/assignments'),

  // Accept or reject an assignment.
  respondAssignment: (assignmentId, action) => {
    if (!assignmentId || !['accept', 'reject'].includes(action)) {
      return Promise.reject(
        new Error('Valid assignment ID and action are required.')
      );
    }

    return api.post(
      `/volunteer/assignments/${assignmentId}/respond`,
      { action }
    );
  },

  // Update assignment delivery status.
  updateStatus: (assignment_id, status) => {
    if (!assignment_id || !status) {
      return Promise.reject(
        new Error('Assignment ID and status are required.')
      );
    }

    return api.post('/volunteer/update-status', {
      assignment_id,
      status
    });
  },

  // Upload delivery proof.
  uploadProof: (formData) =>
    api.post('/volunteer/upload-proof', formData),

  // Update the volunteer's GPS location.
  updateLocation: (latitude, longitude) => {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return Promise.reject(
        new Error('Invalid GPS coordinates.')
      );
    }

    return api.post('/location/update', {
      latitude,
      longitude
    });
  }

};

export default volunteerService;
