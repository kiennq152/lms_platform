export type Role = 'student' | 'instructor' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type CourseStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'published';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'text' | 'quiz' | 'assignment';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: Role | null;
  status: UserStatus;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  social_link: string | null;
  degree: string | null;
  experience_years: number | null;
  admin_approved: boolean;
  created_at: string;
  last_login?: string | null;
}

export interface Category {
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Course {
  course_id: number;
  instructor_id: string;
  title: string;
  description: string;
  short_description: string | null;
  price: number;
  category_id: number | null;
  thumbnail_url: string | null;
  status: CourseStatus;
  rating: number;
  total_enrollments: number;
  total_lessons: number;
  duration_hours: number;
  level: CourseLevel | null;
  language: string | null;
  learning_outcomes: string | null;
  requirements: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  instructor?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'avatar_url' | 'bio' | 'degree' | 'experience_years'> | null;
  category?: Pick<Category, 'name'> | null;
}

export interface Module {
  module_id: number;
  course_id: number;
  title: string;
  description: string | null;
  order_index: number;
}

export interface Lesson {
  lesson_id: number;
  module_id: number;
  title: string;
  description: string | null;
  content_type: LessonType;
  video_url: string | null;
  youtube_url: string | null;
  video_duration: number;
  content_text: string | null;
  attachment_url: string | null;
  order_index: number;
  is_preview: boolean;
}

export interface OutlineLesson {
  lesson_id: number;
  module_id: number;
  course_id: number;
  title: string;
  content_type: LessonType;
  video_duration: number;
  order_index: number;
  is_preview: boolean;
}

export interface Enrollment {
  enrollment_id: number;
  student_id: string;
  course_id: number;
  enrollment_date: string;
  completion_date: string | null;
  progress_percentage: number;
  status: 'active' | 'completed' | 'dropped';
  last_accessed_at: string | null;
  created_at: string;
  course?: Course;
}

export interface Transaction {
  transaction_id: number;
  student_id: string;
  course_id: number | null;
  amount: number;
  currency: string;
  payment_method: 'credit_card' | 'paypal' | 'bank_transfer';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_gateway_transaction_id: string | null;
  coupon_code: string | null;
  discount_amount: number;
  transaction_date: string;
  course?: Pick<Course, 'title'> | null;
  student?: Pick<Profile, 'first_name' | 'last_name' | 'email'> | null;
}

export interface Review {
  review_id: number;
  course_id: number;
  student_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  student?: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null;
}

export interface Certificate {
  certificate_id: number;
  enrollment_id: number;
  student_id: string;
  course_id: number;
  certificate_code: string;
  issued_at: string;
  course?: Pick<Course, 'title' | 'instructor_id' | 'duration_hours' | 'total_lessons'> & { instructor?: Course['instructor'] };
  student?: Pick<Profile, 'first_name' | 'last_name'> | null;
}

export interface ForumTopic {
  topic_id: number;
  course_id: number | null;
  author_id: string;
  title: string;
  content: string;
  type: 'discussion' | 'question';
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  created_at: string;
  author?: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url' | 'role'> | null;
  course?: Pick<Course, 'title' | 'instructor_id'> | null;
}

export interface ForumReply {
  reply_id: number;
  topic_id: number;
  author_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  author?: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url' | 'role'> | null;
}

export interface Coupon {
  coupon_id: number;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AppSettings {
  id: number;
  site_name: string;
  support_email: string | null;
  support_phone: string | null;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  allow_instructor_signup: boolean;
}

export interface SupportTicket {
  ticket_id: number;
  user_id: string | null;
  name: string | null;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_note: string | null;
  created_at: string;
}

export interface QuoteItem {
  course_id: number;
  title: string;
  thumbnail_url: string | null;
  price: number;
  discount: number;
  amount: number;
}

export interface Quote {
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  coupon_valid: boolean;
  coupon_message: string | null;
}
