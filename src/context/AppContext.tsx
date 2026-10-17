import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Student,
  Assignment,
  PositiveBadge,
  LearningMaterial,
  ParentNotification,
  ParentFeedback,
  UserProfile,
  UserRole,
  ClassRoom,
  TeacherProfile,
  CustomSubject,
  GenericLesson,
  AuthSession
} from '../types';
import {
  INITIAL_TEACHER,
  INITIAL_STUDENTS,
  INITIAL_ASSIGNMENTS,
  POSITIVE_BADGES,
  DIGITAL_MATERIALS,
  PARENT_NOTIFICATIONS,
  PARENT_FEEDBACKS
} from '../data/initialData';
import {
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_GENERIC_LESSONS
} from '../data/classAndSubjectData';
import { databaseService, DatabaseConfig, ClassroomSyncPayload } from '../services/databaseService';

export type NavView =
  | 'dashboard'
  | 'competition'
  | 'students'
  | 'classroom'
  | 'english'
  | 'math'
  | 'vietnamese'
  | 'informatics'
  | 'games'
  | 'aibuddy'
  | 'assistant'
  | 'materials'
  | 'parents'
  | 'reports'
  | 'subject-world';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole, studentId?: string) => void;
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  teacherInfo: TeacherProfile;
  students: Student[];
  assignments: Assignment[];
  badges: PositiveBadge[];
  materials: LearningMaterial[];
  notifications: ParentNotification[];
  feedbacks: ParentFeedback[];
  aiLiveStatus: { hasKey: boolean; model: string; mode: string };

  // Multi-Class Management
  classes: ClassRoom[];
  activeClassId: string;
  activeClass: ClassRoom;
  setActiveClassId: (id: string) => void;
  addClass: (newClass: Omit<ClassRoom, 'id'>) => void;
  updateClass: (id: string, updates: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;
  isClassModalOpen: boolean;
  setClassModalOpen: (open: boolean) => void;

  // Teacher Profile
  teacherProfile: TeacherProfile;
  updateTeacherProfile: (updates: Partial<TeacherProfile>) => void;
  isTeacherModalOpen: boolean;
  setTeacherModalOpen: (open: boolean) => void;

  // Dynamic Subjects & Lessons
  subjects: CustomSubject[];
  activeSubjectId: string;
  setActiveSubjectId: (id: string) => void;
  addSubject: (newSubject: Omit<CustomSubject, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<CustomSubject>) => void;
  deleteSubject: (id: string) => void;
  isSubjectModalOpen: boolean;
  setSubjectModalOpen: (open: boolean) => void;

  genericLessons: GenericLesson[];
  addGenericLesson: (lesson: GenericLesson) => void;
  updateGenericLesson: (id: string, updates: Partial<GenericLesson>) => void;
  deleteGenericLesson: (id: string) => void;
  isLessonEditorOpen: boolean;
  setLessonEditorOpen: (open: boolean) => void;
  editingLesson: GenericLesson | null;
  setEditingLesson: (lesson: GenericLesson | null) => void;

  selectedGrade: number;
  setSelectedGrade: (grade: number) => void;

  // Student actions
  addStudent: (student: Omit<Student, 'id' | 'stt' | 'studentCode'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  changeStudentStt: (studentId: string, newStt: number) => void;
  bulkImportStudents: (imported: Partial<Student>[]) => void;

  // Classroom actions
  markAttendance: (studentId: string, status: Student['attendanceStatus'], note?: string) => void;
  markAllPresent: () => void;
  awardBadge: (studentId: string, badgeId: string) => void;
  updateSeat: (studentId: string, seatGroup: number, seatIndex: number) => void;
  swapSeats: (studentId1: string, studentId2: string) => void;

  // Assignment actions
  createAssignment: (assignment: Omit<Assignment, 'id' | 'submissionsCount' | 'createdAt'>) => void;
  submitAssignmentDemo: (assignmentId: string, studentId: string) => void;

  // Material actions
  addMaterial: (material: Omit<LearningMaterial, 'id' | 'uploadedAt'>) => void;

  // Parent communication
  addNotification: (title: string, content: string, isImportant?: boolean) => void;
  addFeedback: (studentId: string, message: string) => void;
  replyFeedback: (id: string, replyText: string) => void;

  // Celebration
  triggerCelebration: () => void;

  // Online Database & Cloud Sync
  dbConfig: DatabaseConfig;
  isDbModalOpen: boolean;
  setDbModalOpen: (open: boolean) => void;
  isApiKeyModalOpen: boolean;
  setApiKeyModalOpen: (open: boolean) => void;
  isSyncing: boolean;
  syncStatusMessage: string;
  updateDbConfig: (newConfig: Partial<DatabaseConfig>) => void;
  syncToCloud: () => Promise<{ success: boolean; message: string }>;
  syncFromCloud: () => Promise<{ success: boolean; message: string }>;
  syncFromGoogleSheet: (overrideUrl?: string) => Promise<{ success: boolean; message: string; count?: number }>;
  testDbConnection: (config?: DatabaseConfig) => Promise<{ success: boolean; latencyMs: number; message: string }>;
  resetToInitialData: () => void;
  importDatabase: (payload: ClassroomSyncPayload) => void;
  exportDatabaseBackup: () => void;

  // Authentication & Credentials
  authSession: AuthSession | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; message: string; role?: 'teacher' | 'student' };
  logout: () => void;
  changeTeacherPassword: (classIdOrName: string, oldPass: string, newPass: string) => { success: boolean; message: string };
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isChangePasswordOpen: boolean;
  setChangePasswordOpen: (open: boolean) => void;
  getTeacherPassword: (classIdOrName: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CLASSES: 'aiclass_classes_v2',
  ACTIVE_CLASS_ID: 'aiclass_active_class_id_v2',
  TEACHER_PROFILE: 'aiclass_teacher_profile_v2',
  SUBJECTS: 'aiclass_subjects_v2',
  GENERIC_LESSONS: 'aiclass_generic_lessons_v2',
  STUDENTS: 'aiclass_students_v1',
  ASSIGNMENTS: 'aiclass_assignments_v1',
  NOTIFICATIONS: 'aiclass_notifications_v1',
  FEEDBACKS: 'aiclass_feedbacks_v1',
  MATERIALS: 'aiclass_materials_v1',
  AUTH_SESSION: 'aiclass_auth_session_v2',
  TEACHER_PASSWORDS: 'aiclass_teacher_passwords_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Teacher Profile State (Họ và tên giáo viên, chức danh, trường, ảnh đại diện)
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEACHER_PROFILE);
      return saved ? JSON.parse(saved) : { id: 'teacher-1', ...INITIAL_TEACHER };
    } catch {
      return { id: 'teacher-1', ...INITIAL_TEACHER };
    }
  });

  const [isTeacherModalOpen, setTeacherModalOpen] = useState(false);

  // 2. Multi-Class State (Quản lý nhiều lớp, chuyển đổi lớp)
  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CLASSES;
  });

  const [activeClassId, setActiveClassIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS_ID);
      if (saved) return saved;
    } catch {}
    return INITIAL_CLASSES[0]?.id || 'c-3a2';
  });

  const [isClassModalOpen, setClassModalOpen] = useState(false);

  // Active class instance
  const activeClass = classes.find(c => c.id === activeClassId) || classes[0] || INITIAL_CLASSES[0];

  // 3. Dynamic Subjects & Lessons
  const [subjects, setSubjects] = useState<CustomSubject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SUBJECTS;
  });

  const [activeSubjectId, setActiveSubjectId] = useState<string>('science');
  const [isSubjectModalOpen, setSubjectModalOpen] = useState(false);

  const [genericLessons, setGenericLessons] = useState<GenericLesson[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GENERIC_LESSONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_GENERIC_LESSONS;
  });

  const [isLessonEditorOpen, setLessonEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<GenericLesson | null>(null);

  // Active Grade Level (Khối 1, 2, 3, 4, 5)
  const [selectedGrade, setSelectedGrade] = useState<number>(() => activeClass?.grade || 3);

  // Current User (Session)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => ({
    id: teacherProfile.id,
    name: teacherProfile.name,
    role: 'teacher',
    avatar: teacherProfile.avatar,
    className: activeClass?.name || '3A2',
    schoolName: teacherProfile.school
  }));

  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [badges] = useState<PositiveBadge[]>(POSITIVE_BADGES);

  // 4. Students list for currently active class
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return activeClass?.students?.length > 0 ? activeClass.students : INITIAL_STUDENTS;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  });

  const [materials, setMaterials] = useState<LearningMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      return saved ? JSON.parse(saved) : DIGITAL_MATERIALS;
    } catch {
      return DIGITAL_MATERIALS;
    }
  });

  const [notifications, setNotifications] = useState<ParentNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : PARENT_NOTIFICATIONS;
    } catch {
      return PARENT_NOTIFICATIONS;
    }
  });

  const [feedbacks, setFeedbacks] = useState<ParentFeedback[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      return saved ? JSON.parse(saved) : PARENT_FEEDBACKS;
    } catch {
      return PARENT_FEEDBACKS;
    }
  });

  const [aiLiveStatus, setAiLiveStatus] = useState({
    hasKey: false,
    model: 'gemini-3.8-flash',
    mode: 'pedagogical_demo'
  });

  // Online Database & Cloud Sync States
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(() => databaseService.getConfig());
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(() => {
    try {
      const key = localStorage.getItem('gemini_api_key');
      return !key;
    } catch {
      return false;
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState('');

  // 5. Authentication & Credentials State
  const [teacherPasswords, setTeacherPasswords] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEACHER_PASSWORDS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      username: 'thhn_3c1',
      role: 'teacher',
      className: '3C1',
      fullName: 'Đỗ Thị Hoà',
      loggedInAt: new Date().toISOString()
    };
  });

  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

  // Save persistent data
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch (e) {
      console.warn('LocalStorage classes error:', e);
    }
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS_ID, activeClassId);
    } catch (e) {
      console.warn('LocalStorage activeClassId error:', e);
    }
  }, [activeClassId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHER_PROFILE, JSON.stringify(teacherProfile));
    } catch (e) {
      console.warn('LocalStorage teacherProfile error:', e);
    }
  }, [teacherProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.warn('LocalStorage subjects error:', e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GENERIC_LESSONS, JSON.stringify(genericLessons));
    } catch (e) {
      console.warn('LocalStorage genericLessons error:', e);
    }
  }, [genericLessons]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.warn('LocalStorage students error:', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    } catch (e) {
      console.warn('LocalStorage assignments error:', e);
    }
  }, [assignments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('LocalStorage notifications error:', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
    } catch (e) {
      console.warn('LocalStorage feedbacks error:', e);
    }
  }, [feedbacks]);

  // Keep active class student list in sync when students change
  useEffect(() => {
    setClasses(prev => prev.map(c => (c.id === activeClassId ? { ...c, students } : c)));
  }, [students, activeClassId]);

  // Check online database connection on startup
  useEffect(() => {
    databaseService.testConnection(dbConfig).then(res => {
      if (res.success) {
        setDbConfig(prev => {
          const updated = { ...prev, status: 'connected' as const, errorMessage: undefined };
          databaseService.saveConfig(updated);
          return updated;
        });
      } else {
        setDbConfig(prev => {
          const updated = { ...prev, status: 'disconnected' as const };
          databaseService.saveConfig(updated);
          return updated;
        });
      }
    }).catch(() => {
      setDbConfig(prev => ({ ...prev, status: 'disconnected' as const }));
    });
  }, []);

  // Check AI live status on mount
  useEffect(() => {
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        if (data) setAiLiveStatus(data);
      })
      .catch(() => {});
  }, []);

  // ==================== MULTI-CLASS SWITCHING & MUTATIONS ====================
  const setActiveClassId = (targetId: string) => {
    const target = classes.find(c => c.id === targetId);
    if (!target) return;

    setActiveClassIdState(targetId);
    setStudents(target.students || []);
    setSelectedGrade(target.grade);

    // Update session user
    setCurrentUser(prev => ({
      ...prev,
      className: target.name,
      schoolName: target.schoolName
    }));

    // If target class has a googleSheetUrl, update dbConfig
    if (target.googleSheetUrl) {
      setDbConfig(prev => {
        const updated = { ...prev, googleSheetUrl: target.googleSheetUrl || '' };
        databaseService.saveConfig(updated);
        return updated;
      });
    }

    triggerCelebration();
  };

  const addClass = (newClassData: Omit<ClassRoom, 'id'>) => {
    const newId = `c-${Date.now()}`;
    const newClassRoom: ClassRoom = {
      ...newClassData,
      id: newId
    };

    setClasses(prev => [...prev, newClassRoom]);
    setActiveClassId(newId);
  };

  const updateClass = (id: string, updates: Partial<ClassRoom>) => {
    setClasses(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    if (id === activeClassId) {
      if (updates.grade) setSelectedGrade(updates.grade);
      if (updates.name) {
        setCurrentUser(prev => ({ ...prev, className: updates.name || prev.className }));
      }
    }
  };

  const deleteClass = (id: string) => {
    if (classes.length <= 1) {
      alert('Hệ thống cần duy trì ít nhất 1 lớp học.');
      return;
    }
    const remaining = classes.filter(c => c.id !== id);
    setClasses(remaining);
    if (id === activeClassId && remaining.length > 0) {
      setActiveClassId(remaining[0].id);
    }
  };

  // ==================== TEACHER PROFILE MUTATIONS ====================
  const updateTeacherProfile = (updates: Partial<TeacherProfile>) => {
    setTeacherProfile(prev => {
      const updated = { ...prev, ...updates };
      return updated;
    });

    // Sync with currentUser when in teacher role
    setCurrentUser(prev => {
      if (prev.role === 'teacher') {
        return {
          ...prev,
          name: updates.name || prev.name,
          avatar: updates.avatar || prev.avatar,
          schoolName: updates.school || prev.schoolName
        };
      }
      return prev;
    });
  };

  // ==================== DYNAMIC SUBJECTS & LESSONS ====================
  const addSubject = (newSubjectData: Omit<CustomSubject, 'id'>) => {
    const newId = `sub-${Date.now()}`;
    const createdSubject: CustomSubject = {
      ...newSubjectData,
      id: newId
    };
    setSubjects(prev => [...prev, createdSubject]);

    // Create an initial starter lesson for this new subject
    const starterLesson: GenericLesson = {
      id: `lesson-${newId}-${selectedGrade}-1`,
      subjectId: newId,
      grade: selectedGrade,
      chapter: 'Chủ đề 1',
      lessonNumber: 1,
      title: `Bài 1: Khám phá môn ${newSubjectData.name}`,
      subtitle: `Bài học mở đầu môn học ${newSubjectData.name} - Khối ${selectedGrade}`,
      summary: `Chào mừng các em đến với môn học ${newSubjectData.name}. Trong bài học này, chúng ta cùng làm quen với các khái niệm cơ bản và ý nghĩa của môn học trong đời sống.`,
      contentParagraphs: [
        `1. Giới thiệu môn học: ${newSubjectData.description || `Môn ${newSubjectData.name} giúp học sinh phát triển năng lực tư duy, sáng tạo và thực hành trong học tập.`}`,
        `2. Nhiệm vụ học tập: Học sinh cần chăm chỉ lắng nghe, tích cực tham gia thảo luận nhóm và vận dụng kiến thức đã học vào thực tiễn hàng ngày.`,
        `3. Đánh giá và rèn luyện: Hoàn thành bài tập trắc nghiệm và tham gia các hoạt động để nhận huy hiệu thi đua xuất sắc.`
      ],
      keyTerms: [
        { term: newSubjectData.name, explanation: 'Môn học mới trong chương trình giáo dục tiểu học.' },
        { term: 'Thực hành', explanation: 'Vận dụng kiến thức bài học vào đời sống xung quanh.' }
      ],
      practicalApplication: `Học sinh có thể quan sát và liên hệ các kiến thức của môn ${newSubjectData.name} ngay tại trường lớp và gia đình.`,
      audioText: `Chào các bạn nhỏ! Hôm nay chúng ta cùng bắt đầu bài học đầu tiên của môn ${newSubjectData.name}. Chúc các em có một buổi học vui vẻ và bổ ích!`,
      drills: [
        {
          id: `drill-${newId}-1`,
          question: `Môn học ${newSubjectData.name} có mã viết tắt là gì?`,
          options: [newSubjectData.code, 'TOÁN', 'TV', 'TA'],
          correctAnswer: newSubjectData.code,
          hint: `Hãy nhìn vào mã môn viết tắt của môn học ${newSubjectData.name}.`,
          explanation: `Mã viết tắt của môn ${newSubjectData.name} là ${newSubjectData.code}.`
        },
        {
          id: `drill-${newId}-2`,
          question: `Để học tốt môn ${newSubjectData.name}, em cần có thái độ học tập như thế nào?`,
          options: [
            'Chăm chú nghe giảng, chủ động phát biểu và hoàn thành bài tập',
            'Không tập trung và mất trật tự trong giờ học',
            'Chỉ học qua loa khi có kiểm tra',
            'Không ghi chép bài đầy đủ'
          ],
          correctAnswer: 'Chăm chú nghe giảng, chủ động phát biểu và hoàn thành bài tập',
          hint: 'Thái độ học tập tích cực giúp em tiếp thu kiến thức tốt nhất.',
          explanation: 'Chăm chỉ, tích cực và chủ động là bí quyết giúp em học giỏi toàn diện mọi môn học.'
        }
      ]
    };

    setGenericLessons(prev => [...prev, starterLesson]);
    setActiveSubjectId(newId);
  };

  const updateSubject = (id: string, updates: Partial<CustomSubject>) => {
    setSubjects(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSubject = (id: string) => {
    const target = subjects.find(s => s.id === id);
    if (target?.isCore) {
      alert('Không thể xóa 4 môn học nòng cốt (Tiếng Anh, Toán, Tiếng Việt, Tin học).');
      return;
    }
    setSubjects(prev => prev.filter(s => s.id !== id));
    setGenericLessons(prev => prev.filter(l => l.subjectId !== id));
    if (activeSubjectId === id) {
      setActiveSubjectId('english');
    }
  };

  const addGenericLesson = (lesson: GenericLesson) => {
    setGenericLessons(prev => [...prev, lesson]);
  };

  const updateGenericLesson = (id: string, updates: Partial<GenericLesson>) => {
    setGenericLessons(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteGenericLesson = (id: string) => {
    setGenericLessons(prev => prev.filter(l => l.id !== id));
  };

  // ==================== AUTHENTICATION & CREDENTIALS ====================
  const getTeacherPassword = (classIdOrName: string): string => {
    const key = (classIdOrName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (teacherPasswords[key]) return teacherPasswords[key];
    if (teacherPasswords[classIdOrName]) return teacherPasswords[classIdOrName];
    const cl = classes.find(
      c => c.id === classIdOrName || c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === key
    );
    if (cl?.teacherPassword) return cl.teacherPassword;
    return 'Thhn_12@';
  };

  const changeTeacherPassword = (
    classIdOrName: string,
    oldPass: string,
    newPass: string
  ): { success: boolean; message: string } => {
    const currentPass = getTeacherPassword(classIdOrName);
    if (oldPass !== currentPass) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác!' };
    }
    if (!newPass || newPass.trim().length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' };
    }
    const key = (classIdOrName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNewPass = newPass.trim();
    const updated = {
      ...teacherPasswords,
      [key]: cleanNewPass,
      [classIdOrName]: cleanNewPass
    };
    setTeacherPasswords(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHER_PASSWORDS, JSON.stringify(updated));
    } catch {}

    setClasses(prev =>
      prev.map(c => {
        if (c.id === classIdOrName || c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === key) {
          return { ...c, teacherPassword: cleanNewPass };
        }
        return c;
      })
    );

    triggerCelebration();
    return { success: true, message: 'Đổi mật khẩu giáo viên thành công!' };
  };

  const login = (
    usernameInput: string,
    passwordInput: string
  ): { success: boolean; message: string; role?: 'teacher' | 'student' } => {
    const cleanUser = (usernameInput || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' };
    }

    // 1. Kiểm tra tài khoản Giáo viên (Định dạng: thhn_#malop#, ví dụ: thhn_3c1, thhn_3a2)
    if (cleanUser.startsWith('thhn_') || cleanUser === 'thhn' || cleanUser.startsWith('gv_')) {
      const classSuffix = cleanUser.replace('thhn_', '').replace('gv_', '').replace(/[^a-z0-9]/g, '');

      // Tìm lớp học tương ứng
      let targetClass = classes.find(
        c =>
          c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === classSuffix ||
          c.id.toLowerCase().replace(/[^a-z0-9]/g, '') === classSuffix
      );

      if (!targetClass) {
        targetClass = activeClass || classes[0];
      }

      const expectedPassword = getTeacherPassword(targetClass ? targetClass.id : 'default');

      if (cleanPass === expectedPassword) {
        if (targetClass && targetClass.id !== activeClassId) {
          setActiveClassId(targetClass.id);
        }

        setCurrentUser({
          id: 'teacher-1',
          name: teacherProfile.name,
          role: 'teacher',
          avatar: teacherProfile.avatar,
          className: targetClass ? targetClass.name : teacherProfile.className,
          schoolName: targetClass?.schoolName || teacherProfile.school
        });

        const newSession: AuthSession = {
          username: `thhn_${targetClass ? targetClass.name.toLowerCase() : '3c1'}`,
          role: 'teacher',
          className: targetClass ? targetClass.name : teacherProfile.className,
          classId: targetClass?.id,
          fullName: teacherProfile.name,
          avatar: teacherProfile.avatar,
          loggedInAt: new Date().toISOString()
        };

        setAuthSession(newSession);
        try {
          localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(newSession));
        } catch {}

        triggerCelebration();
        return {
          success: true,
          message: `Đăng nhập thành công! Chào mừng ${teacherProfile.title} ${teacherProfile.name} (Lớp ${targetClass ? targetClass.name : '3C1'}).`,
          role: 'teacher'
        };
      } else {
        return {
          success: false,
          message: 'Mật khẩu giáo viên không chính xác. Mật khẩu mặc định là Thhn_12@ (hoặc mật khẩu mới nếu đã thay đổi).'
        };
      }
    }

    // 2. Kiểm tra tài khoản Học sinh (nạp từ Google Sheet)
    const otherClassStudents = classes
      .filter(c => c.id !== activeClassId)
      .flatMap(c => c.students || []);
    const candidateStudents = [...students, ...otherClassStudents];

    const foundStudent = candidateStudents.find(s => {
      const u = (s.username || '').toLowerCase().trim();
      const code = (s.studentCode || '').toLowerCase().trim();
      const sid = (s.id || '').toLowerCase().trim();
      const stdUsername = `hs${(s.className || '').toLowerCase().replace(/[^a-z0-9]/g, '')}${s.stt < 10 ? '0' + s.stt : s.stt}`;
      const stdUsernameUnder = `hs_${(s.className || '').toLowerCase().replace(/[^a-z0-9]/g, '')}_${s.stt}`;

      return (
        cleanUser === u ||
        cleanUser === code ||
        cleanUser === sid ||
        cleanUser === stdUsername ||
        cleanUser === stdUsernameUnder
      );
    });

    if (foundStudent) {
      const expectedStudentPass = (foundStudent.password || '').trim() || '123456';

      if (cleanPass === expectedStudentPass) {
        const studentClass = classes.find(c =>
          c.name.toLowerCase() === (foundStudent.className || '').toLowerCase() ||
          (c.students || []).some(st => st.id === foundStudent.id)
        );
        if (studentClass && studentClass.id !== activeClassId) {
          setActiveClassId(studentClass.id);
        }

        switchRole('student', foundStudent.id);

        const newSession: AuthSession = {
          username: foundStudent.username || foundStudent.studentCode.toLowerCase(),
          role: 'student',
          className: foundStudent.className,
          classId: studentClass?.id,
          fullName: foundStudent.fullName,
          studentId: foundStudent.id,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${foundStudent.studentCode}`,
          loggedInAt: new Date().toISOString()
        };

        setAuthSession(newSession);
        try {
          localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(newSession));
        } catch {}

        triggerCelebration();
        return {
          success: true,
          message: `Đăng nhập thành công! Chào mừng em ${foundStudent.fullName} (Lớp ${foundStudent.className}).`,
          role: 'student'
        };
      } else {
        return {
          success: false,
          message: 'Mật khẩu học sinh không chính xác. Mật khẩu được nạp từ Google Sheet liên kết.'
        };
      }
    }

    return {
      success: false,
      message: 'Tên đăng nhập không tồn tại!\n• Giáo viên: thhn_#malop# (Ví dụ: thhn_3c1, thhn_3a2) - MK: Thhn_12@\n• Học sinh: Sử dụng tài khoản từ danh sách Google Sheet.'
    };
  };

  const logout = () => {
    setAuthSession(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch {}
    setAuthModalOpen(true);
  };

  // ==================== DATABASE HELPERS ====================
  const updateDbConfig = (newConfig: Partial<DatabaseConfig>) => {
    setDbConfig(prev => {
      const updated = { ...prev, ...newConfig };
      databaseService.saveConfig(updated);
      return updated;
    });
  };

  const testDbConnection = async (customConfig?: DatabaseConfig) => {
    const target = customConfig || dbConfig;
    const res = await databaseService.testConnection(target);
    if (res.success) {
      updateDbConfig({ status: 'connected', errorMessage: undefined });
    } else {
      updateDbConfig({ status: 'error', errorMessage: res.message });
    }
    return res;
  };

  const syncToCloud = async () => {
    setIsSyncing(true);
    setSyncStatusMessage('Đang đồng bộ dữ liệu lên cơ sở dữ liệu trực tuyến...');
    const payload: ClassroomSyncPayload = {
      classId: activeClass.name,
      className: `Lớp ${activeClass.name} - ${teacherProfile.school}`,
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      students,
      assignments,
      notifications,
      feedbacks,
      materials
    };

    const result = await databaseService.pushData(payload, dbConfig);
    setIsSyncing(false);
    if (result.success) {
      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSyncStatusMessage(`Đồng bộ thành công lúc ${now}`);
      updateDbConfig({ status: 'connected', lastSyncedAt: new Date().toISOString(), errorMessage: undefined });
      triggerCelebration();
      return { success: true, message: result.message };
    } else {
      setSyncStatusMessage(result.message);
      updateDbConfig({ status: 'error', errorMessage: result.message });
      return { success: false, message: result.message };
    }
  };

  const syncFromCloud = async () => {
    setIsSyncing(true);
    setSyncStatusMessage('Đang tải dữ liệu từ máy chủ đám mây...');
    const result = await databaseService.pullData(dbConfig);
    setIsSyncing(false);
    if (result.success && result.data) {
      if (Array.isArray(result.data.students)) {
        setStudents(result.data.students);
      }
      if (Array.isArray(result.data.assignments)) {
        setAssignments(result.data.assignments);
      }
      if (Array.isArray(result.data.notifications)) {
        setNotifications(result.data.notifications);
      }
      if (Array.isArray(result.data.feedbacks)) {
        setFeedbacks(result.data.feedbacks);
      }
      if (Array.isArray(result.data.materials)) {
        setMaterials(result.data.materials);
      }
      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSyncStatusMessage(`Tải dữ liệu thành công lúc ${now}`);
      updateDbConfig({ status: 'connected', lastSyncedAt: new Date().toISOString(), errorMessage: undefined });
      return { success: true, message: result.message };
    } else {
      setSyncStatusMessage(result.message);
      return { success: false, message: result.message };
    }
  };

  const syncFromGoogleSheet = async (overrideUrl?: string) => {
    setIsSyncing(true);
    setSyncStatusMessage(`Đang kết nối tới Google Sheets danh sách lớp ${activeClass.name}...`);
    const targetUrl = overrideUrl || activeClass.googleSheetUrl || dbConfig.googleSheetUrl;
    const configToUse: DatabaseConfig = {
      ...dbConfig,
      provider: 'googlesheets',
      googleSheetUrl: targetUrl
    };

    const res = await databaseService.fetchGoogleSheetStudents(configToUse);
    setIsSyncing(false);
    if (res.success && res.students.length > 0) {
      setStudents(res.students);
      // Save this url to the active class
      updateClass(activeClassId, { googleSheetUrl: targetUrl, students: res.students });

      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSyncStatusMessage(`Đã đồng bộ ${res.students.length} học sinh từ Google Sheet lúc ${now}`);
      updateDbConfig({
        provider: 'googlesheets',
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
        googleSheetUrl: targetUrl,
        errorMessage: undefined
      });
      triggerCelebration();
      return { success: true, message: res.message, count: res.students.length };
    } else {
      setSyncStatusMessage(res.message);
      updateDbConfig({ status: 'error', errorMessage: res.message });
      return { success: false, message: res.message };
    }
  };

  const resetToInitialData = () => {
    setClasses(INITIAL_CLASSES);
    setActiveClassId(INITIAL_CLASSES[0].id);
    setTeacherProfile({ id: 'teacher-1', ...INITIAL_TEACHER });
    setSubjects(INITIAL_SUBJECTS);
    setGenericLessons(INITIAL_GENERIC_LESSONS);
    setStudents(INITIAL_STUDENTS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setNotifications(PARENT_NOTIFICATIONS);
    setFeedbacks(PARENT_FEEDBACKS);
    setMaterials(DIGITAL_MATERIALS);
    triggerCelebration();
  };

  const importDatabase = (payload: ClassroomSyncPayload) => {
    if (payload.students) setStudents(payload.students);
    if (payload.assignments) setAssignments(payload.assignments);
    if (payload.notifications) setNotifications(payload.notifications);
    if (payload.feedbacks) setFeedbacks(payload.feedbacks);
    if (payload.materials) setMaterials(payload.materials);
  };

  const exportDatabaseBackup = () => {
    const payload: ClassroomSyncPayload = {
      classId: activeClass.name,
      className: `Lớp ${activeClass.name} - ${teacherProfile.school}`,
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      students,
      assignments,
      notifications,
      feedbacks,
      materials
    };
    databaseService.exportBackupJson(payload);
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5538F5', '#6738FF', '#9B20F5', '#10B981', '#F59E0B'],
      });
    } catch {}
  };

  const switchRole = (role: UserRole, studentId?: string) => {
    if (role === 'teacher') {
      setCurrentUser({
        id: teacherProfile.id,
        name: teacherProfile.name,
        role: 'teacher',
        avatar: teacherProfile.avatar,
        className: activeClass.name,
        schoolName: teacherProfile.school
      });
    } else if (role === 'student') {
      const targetStudent = students.find(s => s.id === (studentId || 's-1')) || students[0];
      setCurrentUser({
        id: targetStudent ? targetStudent.id : 's-1',
        name: targetStudent ? targetStudent.fullName : 'Học sinh',
        role: 'student',
        studentId: targetStudent?.id,
        avatar: targetStudent?.gender === 'Nữ'
          ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=256',
        className: activeClass.name,
        schoolName: teacherProfile.school
      });
    } else if (role === 'parent') {
      const targetStudent = students.find(s => s.id === (studentId || 's-1')) || students[0];
      setCurrentUser({
        id: `parent-${targetStudent?.id || 's-1'}`,
        name: targetStudent ? `${targetStudent.parentName} (PH em ${targetStudent.fullName})` : 'Phụ huynh học sinh',
        role: 'parent',
        studentId: targetStudent?.id,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
        className: activeClass.name,
        schoolName: teacherProfile.school
      });
    }
  };

  // ==================== STUDENT ACTIONS ====================
  const addStudent = (studentData: Omit<Student, 'id' | 'stt' | 'studentCode'>) => {
    setStudents(prev => {
      const newStt = prev.length + 1;
      const cleanClassName = activeClass.name.replace(/\s+/g, '');
      const newCode = `HS${cleanClassName}${newStt < 10 ? '0' + newStt : newStt}`;
      const newStudent: Student = {
        ...studentData,
        id: `s-${activeClass.id}-${Date.now()}`,
        stt: newStt,
        studentCode: newCode,
        className: activeClass.name,
        seatGroup: ((newStt - 1) % 4) + 1,
        seatIndex: Math.floor((newStt - 1) / 4) + 1
      };
      return [...prev, newStudent];
    });
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, index) => ({
        ...s,
        stt: index + 1
      }));
    });
  };

  const changeStudentStt = (studentId: string, newStt: number) => {
    setStudents(prev => {
      const target = prev.find(s => s.id === studentId);
      if (!target) return prev;
      const otherStudents = prev.filter(s => s.id !== studentId);
      const safeIndex = Math.max(0, Math.min(newStt - 1, otherStudents.length));
      otherStudents.splice(safeIndex, 0, target);
      return otherStudents.map((s, i) => ({ ...s, stt: i + 1 }));
    });
  };

  const bulkImportStudents = (imported: Partial<Student>[]) => {
    setStudents(prev => {
      let currentStt = prev.length;
      const cleanClassName = activeClass.name.replace(/\s+/g, '');
      const newStudents: Student[] = imported.map((imp) => {
        currentStt++;
        const code = `HS${cleanClassName}${currentStt < 10 ? '0' + currentStt : currentStt}`;
        return {
          id: `s-imp-${Date.now()}-${currentStt}`,
          stt: currentStt,
          studentCode: imp.studentCode || code,
          fullName: imp.fullName || 'Học sinh mới',
          gender: imp.gender || 'Nam',
          birthDate: imp.birthDate || '2018-01-01',
          className: activeClass.name,
          accountStatus: 'active',
          attendanceStatus: 'present',
          attendanceHistory: [{ date: '2026-10-16', status: 'present' }],
          activeTasksCount: 2,
          learningProgress: imp.learningProgress || 80,
          skills: imp.skills || { english: 80, math: 80, vietnamese: 80, informatics: 80 },
          supportGoal: imp.supportGoal || 'Rèn luyện các kỹ năng học tập tích cực',
          badges: imp.badges || ['daily-learner'],
          parentName: imp.parentName || 'Phụ huynh học sinh',
          parentPhone: imp.parentPhone || '0900 000 000',
          seatGroup: ((currentStt - 1) % 4) + 1,
          seatIndex: Math.floor((currentStt - 1) / 4) + 1
        };
      });
      return [...prev, ...newStudents];
    });
  };

  const markAttendance = (studentId: string, status: Student['attendanceStatus'], note?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s;
        const newHistory = [{ date: today, status, note }, ...(s.attendanceHistory || []).filter(h => h.date !== today)];
        return {
          ...s,
          attendanceStatus: status,
          attendanceHistory: newHistory
        };
      })
    );
  };

  const markAllPresent = () => {
    const today = new Date().toISOString().split('T')[0];
    setStudents(prev =>
      prev.map(s => ({
        ...s,
        attendanceStatus: 'present',
        attendanceHistory: [{ date: today, status: 'present' }, ...(s.attendanceHistory || []).filter(h => h.date !== today)]
      }))
    );
    triggerCelebration();
  };

  const awardBadge = (studentId: string, badgeId: string) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s;
        const existing = s.badges || [];
        if (existing.includes(badgeId)) return s;
        return {
          ...s,
          badges: [...existing, badgeId]
        };
      })
    );
    triggerCelebration();
  };

  const updateSeat = (studentId: string, seatGroup: number, seatIndex: number) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, seatGroup, seatIndex } : s))
    );
  };

  const swapSeats = (studentId1: string, studentId2: string) => {
    setStudents(prev => {
      const s1 = prev.find(s => s.id === studentId1);
      const s2 = prev.find(s => s.id === studentId2);
      if (!s1 || !s2) return prev;
      return prev.map(s => {
        if (s.id === studentId1) {
          return { ...s, seatGroup: s2.seatGroup, seatIndex: s2.seatIndex };
        }
        if (s.id === studentId2) {
          return { ...s, seatGroup: s1.seatGroup, seatIndex: s1.seatIndex };
        }
        return s;
      });
    });
  };

  // ==================== ASSIGNMENT ACTIONS ====================
  const createAssignment = (assignmentData: Omit<Assignment, 'id' | 'submissionsCount' | 'createdAt'>) => {
    const newAssignment: Assignment = {
      ...assignmentData,
      id: `assign-${Date.now()}`,
      submissionsCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAssignments(prev => [newAssignment, ...prev]);
  };

  const submitAssignmentDemo = (assignmentId: string, studentId: string) => {
    setAssignments(prev =>
      prev.map(a => {
        if (a.id !== assignmentId) return a;
        return {
          ...a,
          submissionsCount: Math.min(a.totalAssigned, a.submissionsCount + 1)
        };
      })
    );
    triggerCelebration();
  };

  // ==================== MATERIAL ACTIONS ====================
  const addMaterial = (materialData: Omit<LearningMaterial, 'id' | 'uploadedAt'>) => {
    const newMaterial: LearningMaterial = {
      ...materialData,
      id: `mat-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    setMaterials(prev => [newMaterial, ...prev]);
    triggerCelebration();
  };

  // ==================== PARENT ACTIONS ====================
  const addNotification = (title: string, content: string, isImportant = false) => {
    const newNotif: ParentNotification = {
      id: `notif-${Date.now()}`,
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      sender: teacherProfile.name,
      isImportant,
      category: isImportant ? 'announcement' : 'academic',
      readBy: []
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addFeedback = (studentId: string, message: string) => {
    const student = students.find(s => s.id === studentId);
    const newFeedback: ParentFeedback = {
      id: `fb-${Date.now()}`,
      studentId,
      studentName: student ? student.fullName : 'Học sinh',
      parentName: student ? student.parentName : 'Phụ huynh',
      message,
      sentAt: new Date().toISOString(),
      status: 'new'
    };
    setFeedbacks(prev => [newFeedback, ...prev]);
  };

  const replyFeedback = (id: string, replyText: string) => {
    setFeedbacks(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        return {
          ...f,
          teacherReply: replyText,
          repliedAt: new Date().toISOString(),
          status: 'replied'
        };
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        activeView,
        setActiveView,
        teacherInfo: teacherProfile,
        students,
        assignments,
        badges,
        materials,
        notifications,
        feedbacks,
        aiLiveStatus,

        // Multi-Class
        classes,
        activeClassId,
        activeClass,
        setActiveClassId,
        addClass,
        updateClass,
        deleteClass,
        isClassModalOpen,
        setClassModalOpen,

        // Teacher Profile
        teacherProfile,
        updateTeacherProfile,
        isTeacherModalOpen,
        setTeacherModalOpen,

        // Dynamic Subjects & Lessons
        subjects,
        activeSubjectId,
        setActiveSubjectId,
        addSubject,
        updateSubject,
        deleteSubject,
        isSubjectModalOpen,
        setSubjectModalOpen,

        genericLessons,
        addGenericLesson,
        updateGenericLesson,
        deleteGenericLesson,
        isLessonEditorOpen,
        setLessonEditorOpen,
        editingLesson,
        setEditingLesson,

        selectedGrade,
        setSelectedGrade,

        // Student & Classroom actions
        addStudent,
        updateStudent,
        deleteStudent,
        changeStudentStt,
        bulkImportStudents,
        markAttendance,
        markAllPresent,
        awardBadge,
        updateSeat,
        swapSeats,
        createAssignment,
        submitAssignmentDemo,
        addMaterial,
        addNotification,
        addFeedback,
        replyFeedback,
        triggerCelebration,
        dbConfig,
        isDbModalOpen,
        setDbModalOpen,
        isApiKeyModalOpen,
        setApiKeyModalOpen,
        isSyncing,
        syncStatusMessage,
        updateDbConfig,
        syncToCloud,
        syncFromCloud,
        syncFromGoogleSheet,
        testDbConnection,
        resetToInitialData,
        importDatabase,
        exportDatabaseBackup,

        // Authentication & Credentials
        authSession,
        isAuthenticated: !!authSession,
        login,
        logout,
        changeTeacherPassword,
        isAuthModalOpen,
        setAuthModalOpen,
        isChangePasswordOpen,
        setChangePasswordOpen,
        getTeacherPassword
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
