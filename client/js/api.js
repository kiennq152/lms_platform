// API Service Layer
const API_BASE_URL = window.location.origin + '/api';

class API {
  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response is ok before parsing
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
          throw new Error(errorMessages || 'Validation error');
        }
        throw new Error(data.error || `Request failed: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', {
        endpoint,
        error: error.message,
        stack: error.stack
      });
      
      // Provide more helpful error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please check your connection and make sure the server is running.');
      }
      
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email, password) {
    console.log('📡 API.login called:', { email, passwordLength: password?.length });
    try {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      console.log('✅ API.login success:', { hasToken: !!data.token, hasUser: !!data.user });
      if (data.token) {
        this.setToken(data.token);
        console.log('🔑 Token stored in localStorage');
      }
      return data;
    } catch (error) {
      console.error('❌ API.login error:', error);
      throw error;
    }
  }

  async verifyEmail(token) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(email) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async requestOTP(email) {
    return this.request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async loginWithOTP(email, otp) {
    const data = await this.request('/auth/login-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('currentUser');
  }

  // Courses endpoints
  async getCourses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/courses${queryString ? `?${queryString}` : ''}`);
  }

  async getCourse(id) {
    return this.request(`/courses/${id}`);
  }

  async createCourse(courseData) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(id, courseData) {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id) {
    return this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  async createModule(courseId, moduleData) {
    return this.request(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(moduleData),
    });
  }

  async updateModule(courseId, moduleId, moduleData) {
    return this.request(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify({ ...moduleData, module_id: moduleId }),
    });
  }

  async createLesson(courseId, lessonData) {
    return this.request(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(lessonData),
    });
  }

  async updateLesson(courseId, lessonId, lessonData) {
    return this.request(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify({ ...lessonData, lesson_id: lessonId }),
    });
  }

  // Enrollments endpoints
  async getEnrollments() {
    return this.request('/enrollments');
  }

  async enrollInCourse(courseId) {
    return this.request('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    });
  }

  async updateProgress(enrollmentId, progress) {
    return this.request(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(progress),
    });
  }

  async unenrollFromCourse(enrollmentId) {
    return this.request(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  }

  async unenrollByCourseId(courseId) {
    return this.request(`/enrollments/course/${courseId}`, {
      method: 'DELETE',
    });
  }

  // Instructor endpoints
  async getInstructorStats() {
    return this.request('/instructor/dashboard/stats');
  }

  async getInstructorCourses(status) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/instructor/courses${query}`);
  }

  async getInstructorStudents(courseId) {
    const query = courseId ? `?course_id=${courseId}` : '';
    return this.request(`/instructor/students${query}`);
  }

  async getInstructorAnalytics(period = 30) {
    return this.request(`/instructor/analytics?period=${period}`);
  }

  // Content library endpoints
  async getContent(type) {
    const query = type ? `?type=${type}` : '';
    return this.request(`/content${query}`);
  }

  async addContent(contentData) {
    return this.request('/content', {
      method: 'POST',
      body: JSON.stringify(contentData),
    });
  }

  async deleteContent(id) {
    return this.request(`/content/${id}`, {
      method: 'DELETE',
    });
  }

  // Users endpoints (admin)
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async approveUser(userId) {
    return this.request(`/users/${userId}/approve`, {
      method: 'POST',
    });
  }

  async rejectUser(userId) {
    return this.request(`/users/${userId}/reject`, {
      method: 'POST',
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Legacy method name for backward compatibility
  async approveInstructor(userId) {
    return this.approveUser(userId);
  }

  // Certificates endpoints
  async getCertificates() {
    return this.request('/certificates');
  }

  async getCertificate(id) {
    return this.request(`/certificates/${id}`);
  }

  async generateCertificate(courseId) {
    return this.request('/certificates', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    });
  }

  async downloadCertificate(id) {
    return this.request(`/certificates/${id}/download`);
  }

  async verifyCertificate(code) {
    return this.request(`/certificates/verify/${code}`);
  }

  // Transactions endpoints
  async getTransactions() {
    return this.request('/transactions');
  }

  async getTransaction(id) {
    return this.request(`/transactions/${id}`);
  }

  async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async getFinancialReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/transactions/reports/summary${queryString ? `?${queryString}` : ''}`);
  }

  // Lesson Progress endpoints
  async getLessonProgress(enrollmentId) {
    return this.request(`/lesson-progress/enrollment/${enrollmentId}`);
  }

  async updateLessonProgress(progressId, progressData) {
    return this.request(`/lesson-progress/${progressId}`, {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
  }

  async saveLessonProgress(progressData) {
    return this.request('/lesson-progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  }

  // System Logs endpoints (admin)
  async getSystemLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/system-logs${queryString ? `?${queryString}` : ''}`);
  }

  async createSystemLog(logData) {
    return this.request('/system-logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  async cleanupSystemLogs(days = 90) {
    return this.request(`/system-logs/cleanup?days=${days}`, {
      method: 'DELETE',
    });
  }

  // Settings endpoints (admin)
  async getSettings() {
    return this.request('/settings');
  }

  async getSetting(key) {
    return this.request(`/settings/${key}`);
  }

  async updateSetting(key, value, description) {
    return this.request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, description }),
    });
  }

  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  async updateUserStatus(userId, status) {
    return this.request(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Cart endpoints
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(courseId) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    });
  }

  async removeFromCart(courseId) {
    return this.request(`/cart/${courseId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart', {
      method: 'DELETE',
    });
  }

  // User profile endpoints
  async getUserProfile() {
    return this.request('/users/me');
  }

  async updateUserProfile(profileData) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Forum endpoints
  async getForumTopics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/forum/topics${queryString ? `?${queryString}` : ''}`);
  }

  async getMyPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/forum/topics/my-posts${queryString ? `?${queryString}` : ''}`);
  }

  async getTopic(topicId) {
    return this.request(`/forum/topics/${topicId}`);
  }

  async createTopic(topicData) {
    return this.request('/forum/topics', {
      method: 'POST',
      body: JSON.stringify(topicData),
    });
  }

  async createReply(topicId, content) {
    return this.request(`/forum/topics/${topicId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async markAsSolution(replyId) {
    return this.request(`/forum/replies/${replyId}/solution`, {
      method: 'POST',
    });
  }
}

// Export singleton instance
const api = new API();
window.api = api; // Make available globally

// Also make it available immediately for non-module scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

// For ES modules
if (typeof exports !== 'undefined') {
  exports.default = api;
}

