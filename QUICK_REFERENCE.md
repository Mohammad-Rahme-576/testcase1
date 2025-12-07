#  Quick Reference Guide

##  Project Files

### الملفات الأساسية (Core Files)
```
index.html      → النموذج الرئيسي للمستخدمين
styles.css      → التنسيق والتصميم
script.js       → المنطق البرمجي
data.js         → بيانات القطاعات والقرى
```

### الأدوات المساعدة (Utility Files)
```
test_export.html  → اختبار التصدير + بيانات تجريبية
clear_data.html   → مسح وإدارة البيانات المخزنة
```

---

## 🎯 الوظائف الرئيسية | Main Functions

### في script.js

#### إدارة الخطوات
```javascript
nextStep(step)         // الانتقال للخطوة التالية
prevStep(step)         // الرجوع للخطوة السابقة
showStep(step)         // عرض خطوة محددة
validateStep(step)     // التحقق من صحة البيانات
```

#### البيانات الجغرافية
```javascript
loadSectors()              // تحميل القطاعات
handleSectorChange()       // عند اختيار قطاع
handleVillageChange()      // عند اختيار قرية
```

#### الإدخال الديناميكي
```javascript
addResident()              // إضافة ساكن جديد (مبنى كامل)
removeResident(index)      // حذف ساكن
addMyFloor()              // إضافة طابق جديد
removeMyFloor(index)      // حذف طابق
```

#### جمع البيانات
```javascript
collectFormData()          // جمع كل البيانات
handleSubmit(e)           // إرسال النموذج
saveSubmission(data)      // حفظ في localStorage
```

#### التصدير
```javascript
exportToExcel()           // تصدير كل البيانات لـ Excel
```

---

## 🗂️ هيكل البيانات | Data Structure

### القطاعات والقرى (في data.js)
```javascript
southLebanonData = {
  "قطاع صور": {
    villages: {
      "صور": [103, 105, 122, ...]
    }
  },
  // ... 8 قطاعات أخرى
}
```

### البيانات المُرسلة
```javascript
{
  // معلومات الموقع
  sector: "قطاع صور",
  village: "صور",
  neighborhood: "حي المدينة",
  buildingName: "برج السلام",
  streetName: "شارع الحمراء",
  
  // معلومات العقار
  propertyNumber: "103",
  sectionNumber: "5",
  isInBuilding: true,
  buildingType: "سكني",
  floors: "4",
  floorNumber: "2",
  sectionType: "منزل",
  direction: "شمال",
  
  // معلومات شخصية
  fullName: "أحمد محمد",
  motherName: "فاطمة",
  registry: "صور/1985",
  phone: "03123456",
  
  // نوع الإدخال
  entryType: "single" | "myFloors" | "full",
  
  // بيانات إضافية (حسب النوع)
  myFloors: [...],      // للطوابق المتعددة
  residents: [...]      // للمبنى الكامل
}
```

---

## 💾 التخزين المحلي | LocalStorage

### المفاتيح المستخدمة
```javascript
submission_TIMESTAMP     // كل تسجيل بمفتاح فريد
submissionCount         // عداد التسجيلات (قديم)
currentFormData         // حفظ تلقائي للنموذج
```

### الوصول للبيانات
```javascript
// قراءة كل التسجيلات
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('submission_')) {
        const data = JSON.parse(localStorage.getItem(key));
        // استخدم البيانات
    }
}

// مسح كل التسجيلات
for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key.startsWith('submission_')) {
        localStorage.removeItem(key);
    }
}
```

---

## 🎨 CSS Classes الرئيسية

### التنسيق العام
```css
.container              // الحاوية الرئيسية
.form-step             // كل خطوة في النموذج
.form-step.active      // الخطوة النشطة
.form-group            // مجموعة حقول
.form-navigation       // أزرار التنقل
```

### الأزرار
```css
.btn                   // زر عادي
.btn-next              // زر التالي
.btn-prev              // زر السابق
.btn-submit            // زر الإرسال
.export-btn            // زر التصدير
```

### الإدخال الديناميكي
```css
.floor-entry           // صندوق طابق
.resident-entry        // صندوق ساكن
.btn-remove            // زر الحذف
.btn-add-floor         // زر إضافة طابق
.btn-add-resident      // زر إضافة ساكن
```

### Toggle Switch
```css
.toggle-container      // حاوية المفتاح
.toggle-switch         // المفتاح نفسه
.toggle-slider         // الجزء المتحرك
```
