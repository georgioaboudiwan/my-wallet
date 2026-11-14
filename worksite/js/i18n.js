const STR = {
  en: {
    app: 'Worksite', tagline: 'Crew, days and pay — in one place',
    dashboard: 'Dashboard', planner: 'Planner', workers: 'Workers', payments: 'Payments', settings: 'Settings',
    day: 'Day', week: 'Week', month: 'Month', today: 'Today',
    earned: 'Earned', paid: 'Paid', left: 'Left to pay', owed: 'Total owed', owedHint: 'All time, all workers',
    periodHint: 'This period', onSite: 'On site today', planned: 'Planned', worked: 'Worked', absent: 'Absent',
    laborCost: 'Labor cost', bySite: 'Cost by site', byWorker: 'By worker', noSite: 'No site',
    days: 'Days', balance: 'Balance', rate: 'Daily rate', perDay: '/day',
    addWorker: 'Add worker', editWorker: 'Edit worker', name: 'Name', phone: 'Phone', trade: 'Trade',
    tradeHint: 'Mason, electrician, helper…', notes: 'Notes', active: 'Active', inactive: 'Inactive',
    edit: 'Edit', save: 'Save', cancel: 'Cancel', delete: 'Delete', confirmDelete: 'Delete this? This cannot be undone.',
    addPayment: 'Add payment', editPayment: 'Edit payment', amount: 'Amount', currency: 'Currency', date: 'Date',
    method: 'Method', cash: 'Cash', transfer: 'Bank transfer', whish: 'Whish', omt: 'OMT', other: 'Other',
    note: 'Note', worker: 'Worker', site: 'Site', status: 'Status', full: 'Full day', half: 'Half day',
    hours: 'Hours', hoursShort: 'h', custom: 'Custom', fraction: 'Day fraction',
    payBalance: 'Pay balance', pay: 'Pay', history: 'History', noData: 'Nothing here yet',
    noWorkers: 'Add your first worker to start planning.', copyLastWeek: 'Copy last week',
    markWorked: 'Mark planned as worked', clearDay: 'Clear',
    business: 'Business name', language: 'Language', defaultPeriod: 'Default period', weekStart: 'Week starts on',
    hoursPerDay: 'Hours in a full day', lbpRate: 'LBP rate (1 USD =)', sites: 'Sites', addSite: 'Add site',
    location: 'Location', signOut: 'Sign out', exportCsv: 'Export CSV', demo: 'Demo mode — data stays on this device',
    email: 'Email', password: 'Password', signIn: 'Sign in', signUp: 'Create account', forgot: 'Forgot password?',
    haveAccount: 'Have an account? Sign in', noAccount: 'New here? Create account', tryDemo: 'Try the demo',
    checkEmail: 'Check your email to confirm, then sign in.', resetSent: 'Reset link sent to your email.',
    pwRule: 'At least 10 characters', saved: 'Saved', deleted: 'Deleted', error: 'Something went wrong',
    all: 'All', search: 'Search', total: 'Total', entries: 'Work days', lastPaid: 'Last paid',
    advance: 'Paid ahead', credit: 'credit', weekdays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    sessionExpired: 'Session expired. Please sign in again.', offline: 'You are offline',
    copied: 'Copied {n} plans', marked: 'Marked {n} as worked', install: 'Install app'
  },
  ar: {
    app: 'ورشتي', tagline: 'العمّال، الأيام والدفعات — بمكان واحد',
    dashboard: 'الرئيسية', planner: 'التخطيط', workers: 'العمّال', payments: 'الدفعات', settings: 'الإعدادات',
    day: 'يوم', week: 'أسبوع', month: 'شهر', today: 'اليوم',
    earned: 'المستحق', paid: 'المدفوع', left: 'الباقي', owed: 'مجموع الديون', owedHint: 'كل الفترات، كل العمّال',
    periodHint: 'هذه الفترة', onSite: 'بالورشة اليوم', planned: 'مخطط', worked: 'اشتغل', absent: 'غائب',
    laborCost: 'كلفة العمّال', bySite: 'الكلفة حسب الورشة', byWorker: 'حسب العامل', noSite: 'بلا ورشة',
    days: 'أيام', balance: 'الرصيد', rate: 'اليومية', perDay: '/يوم',
    addWorker: 'إضافة عامل', editWorker: 'تعديل عامل', name: 'الاسم', phone: 'الهاتف', trade: 'المهنة',
    tradeHint: 'معلّم، كهربجي، مساعد…', notes: 'ملاحظات', active: 'فعّال', inactive: 'متوقف',
    edit: 'تعديل', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', confirmDelete: 'حذف؟ لا يمكن التراجع.',
    addPayment: 'إضافة دفعة', editPayment: 'تعديل دفعة', amount: 'المبلغ', currency: 'العملة', date: 'التاريخ',
    method: 'الطريقة', cash: 'كاش', transfer: 'تحويل مصرفي', whish: 'Whish', omt: 'OMT', other: 'غير ذلك',
    note: 'ملاحظة', worker: 'العامل', site: 'الورشة', status: 'الحالة', full: 'يوم كامل', half: 'نص يوم',
    hours: 'ساعات', hoursShort: 'س', custom: 'مخصص', fraction: 'جزء من اليوم',
    payBalance: 'ادفع الباقي', pay: 'ادفع', history: 'السجل', noData: 'لا شيء بعد',
    noWorkers: 'أضف أول عامل لتبدأ التخطيط.', copyLastWeek: 'انسخ الأسبوع الماضي',
    markWorked: 'سجّل المخطط كمشتغل', clearDay: 'مسح',
    business: 'اسم الشركة', language: 'اللغة', defaultPeriod: 'الفترة الافتراضية', weekStart: 'بداية الأسبوع',
    hoursPerDay: 'ساعات اليوم الكامل', lbpRate: 'سعر الليرة (1 دولار =)', sites: 'الورش', addSite: 'إضافة ورشة',
    location: 'الموقع', signOut: 'تسجيل الخروج', exportCsv: 'تصدير CSV', demo: 'وضع تجريبي — البيانات على هذا الجهاز فقط',
    email: 'البريد الإلكتروني', password: 'كلمة السر', signIn: 'دخول', signUp: 'إنشاء حساب', forgot: 'نسيت كلمة السر؟',
    haveAccount: 'عندك حساب؟ ادخل', noAccount: 'جديد؟ أنشئ حساب', tryDemo: 'جرّب النسخة التجريبية',
    checkEmail: 'تحقق من بريدك للتأكيد، ثم ادخل.', resetSent: 'أرسلنا رابط التغيير لبريدك.',
    pwRule: '10 أحرف على الأقل', saved: 'تم الحفظ', deleted: 'تم الحذف', error: 'صار خطأ',
    all: 'الكل', search: 'بحث', total: 'المجموع', entries: 'أيام العمل', lastPaid: 'آخر دفعة',
    advance: 'مدفوع سلفاً', credit: 'سلفة', weekdays: ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'],
    months: ['كانون٢','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين١','تشرين٢','كانون١'],
    sessionExpired: 'انتهت الجلسة. ادخل من جديد.', offline: 'لا يوجد اتصال',
    copied: 'تم نسخ {n}', marked: 'تم تسجيل {n}', install: 'ثبّت التطبيق'
  }
};

let lang = 'en';
export const setLang = l => {
  lang = STR[l] ? l : 'en';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
};
export const getLang = () => lang;
export const t = (k, vars) => {
  let s = STR[lang][k] ?? STR.en[k] ?? k;
  if (vars && typeof s === 'string') for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
  return s;
};
