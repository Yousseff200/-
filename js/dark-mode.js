// تهيئة الوضع المظلم
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من وجود تفضيل محفوظ
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // زر تبديل الوضع المظلم
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
});

// تطبيق السمة
function applyTheme(theme) {
    // تطبيق السمة على عنصر HTML
    document.documentElement.setAttribute('data-theme', theme);
    
    // حفظ التفضيل
    localStorage.setItem('theme', theme);
    
    // تحديث أيقونة الزر
    updateThemeIcon(theme);
    
    // إضافة/إزالة كلاس dark للجسم
    if (theme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}

// تحديث أيقونة الوضع المظلم
function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            // تحديث الأيقونة بناءً على الوضع
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                themeToggle.setAttribute('aria-label', 'تفعيل الوضع النهاري');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                themeToggle.setAttribute('aria-label', 'تفعيل الوضع الليلي');
            }
        }
    }
}

// التحقق من تفضيل النظام
function getSystemThemePreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

// الاستماع لتغييرات تفضيل النظام
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
    }
}); 