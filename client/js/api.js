
// API Service Layer (Supabase Version)

class API {
  constructor() {
    this.supabase = window.supabase;
  }

  // Helper to handle Supabase responses
  async handleResponse(query) {
    const { data, error } = await query;
    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  // Auth endpoints
  async register(userData) {
    const { email, password, firstName, lastName, role } = userData;
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role || 'student',
        },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async login(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);

    // Fetch user profile to match old API return shape
    if (data.user) {
      const { data: profile } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        token: data.session?.access_token,
        user: { ...data.user, ...profile }
      };
    }
    return data;
  }

  async logout() {
    await this.supabase.auth.signOut();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  async requestOTP(email) {
    const { data, error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false // Or true, depending on if you want registration via OTP
      }
    });
    if (error) throw new Error(error.message);
    return { message: 'OTP sent successfully', ...data };
  }

  async loginWithOTP(email, token) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw new Error(error.message);

    if (data.user) {
      const { data: profile } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        token: data.session?.access_token,
        user: { ...data.user, ...profile }
      };
    }
    return data;
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user: { ...user, ...profile } };
  }

  // Courses endpoints
  async getCourses(params = {}) {
    let query = this.supabase.from('courses').select('*, instructor:users(*)');
    // Basic filtering support can be added here if 'params' are structured
    return this.handleResponse(query);
  }

  async getCourse(id) {
    return this.handleResponse(
      this.supabase.from('courses').select('*, modules(*, lessons(*))').eq('course_id', id).single()
    );
  }

  async createCourse(courseData) {
    return this.handleResponse(
      this.supabase.from('courses').insert(courseData).select().single()
    );
  }

  async updateCourse(id, courseData) {
    return this.handleResponse(
      this.supabase.from('courses').update(courseData).eq('course_id', id).select().single()
    );
  }

  async deleteCourse(id) {
    return this.handleResponse(
      this.supabase.from('courses').delete().eq('course_id', id)
    );
  }

  // Modules & Lessons
  async createModule(courseId, moduleData) {
    return this.handleResponse(
      this.supabase.from('modules').insert({ ...moduleData, course_id: courseId }).select().single()
    );
  }

  async updateModule(courseId, moduleId, moduleData) {
    return this.handleResponse(
      this.supabase.from('modules').update(moduleData).eq('module_id', moduleId).select().single()
    );
  }

  async createLesson(courseId, lessonData) {
    // lessonData usually contains module_id
    return this.handleResponse(
      this.supabase.from('lessons').insert(lessonData).select().single()
    );
  }

  async updateLesson(courseId, lessonId, lessonData) {
    return this.handleResponse(
      this.supabase.from('lessons').update(lessonData).eq('lesson_id', lessonId).select().single()
    );
  }

  // Enrollments endpoints
  async getEnrollments() {
    return this.handleResponse(
      this.supabase.from('enrollments').select('*, course:courses(*)')
    );
  }

  async enrollInCourse(courseId) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    return this.handleResponse(
      this.supabase.from('enrollments').insert({
        course_id: courseId,
        student_id: user.id
      }).select().single()
    );
  }

  async updateProgress(enrollmentId, progress) {
    return this.handleResponse(
      this.supabase.from('enrollments').update({
        progress_percentage: progress
      }).eq('enrollment_id', enrollmentId).select().single()
    );
  }

  // Instructor endpoints
  async getInstructorCourses(status) {
    let query = this.supabase.from('courses').select('*');
    if (status) query = query.eq('status', status);
    // RLS handles 'instructor only' filtering automatically if policy is set correctly
    return this.handleResponse(query);
  }

  // Users (Admin)
  async getUsers(params = {}) {
    return this.handleResponse(this.supabase.from('users').select('*'));
  }

  // Basic shim for other methods to avoid immediate crashes
  async verifyEmail(token) { console.warn('Not implemented in Supabase client yet'); }
  async resendVerification(email) { console.warn('Not implemented in Supabase client yet'); }

  // ... Add other methods as needed, following the pattern:
  // return this.handleResponse(this.supabase.from('TABLE').ACTION...)
}

// Export singleton instance
const api = new API();
window.api = api;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
if (typeof exports !== 'undefined') {
  exports.default = api;
}
