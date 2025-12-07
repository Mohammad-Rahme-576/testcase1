/**
 * ============================================
 * LEBANON WAR DAMAGE ASSESSMENT FORM
 * Multi-Step Form Handler
 * ============================================
 * 
 * This script manages the damage assessment form including:
 * - Multi-step navigation and validation
 * - Dynamic form field generation
 * - Data collection and storage
 * - Excel export functionality
 * 
 * @author Lebanon War Damage Assessment Team
 * @version 1.0
 */

// ============================================
// GLOBAL VARIABLES
// ============================================

// Form navigation
let currentStep = 1;                  // Current active step
const totalSteps = 4;                 // Total number of main steps

// Submission control
const MAX_SUBMISSIONS = 3;            // Maximum allowed submissions per user

// Dynamic entry counters
let residentCounter = 1;              // Counter for resident entries (full building mode)
let myFloorCounter = 1;               // Counter for floor entries (my floors mode)

// Entry type flags
let isFullBuildingEntry = false;      // Flag for full building entry mode
let isMyFloorsEntry = false;          // Flag for multiple floors entry mode

// ============================================
// APPLICATION INITIALIZATION
// ============================================

/**
 * Initialize the application when DOM is fully loaded
 * Sets up all event listeners and loads initial data
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    loadSectors();
    checkSubmissionLimit();
    loadSavedData();
    setupEntryTypeListeners();
    setupBuildingFieldsListener();
});

// ============================================
// FORM INITIALIZATION & EVENT LISTENERS
// ============================================

/**
 * Initialize form event listeners
 * Attaches handlers for form submission and dropdown changes
 */
function initializeForm() {
    const form = document.getElementById('damageForm');
    form.addEventListener('submit', handleSubmit);
    
    // Location selection handlers
    document.getElementById('sector').addEventListener('change', handleSectorChange);
    document.getElementById('village').addEventListener('change', handleVillageChange);
}

/**
 * Load available sectors into the sector dropdown
 * Populates options from southLebanonData object
 */
function loadSectors() {
    const sectorSelect = document.getElementById('sector');
    const sectors = Object.keys(southLebanonData);
    
    sectors.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.textContent = sector;
        sectorSelect.appendChild(option);
    });
}

// ============================================
// CASCADING DROPDOWN HANDLERS
// ============================================

/**
 * Handle sector selection change
 * Updates village dropdown based on selected sector
 * Resets property number dropdown
 * 
 * @param {Event} e - Change event from sector dropdown
 */
function handleSectorChange(e) {
    const sector = e.target.value;
    const villageSelect = document.getElementById('village');
    const propertySelect = document.getElementById('propertyNumber');
    
    // Reset dependent dropdowns to initial state
    villageSelect.innerHTML = '<option value="">اختر المنطقة العقارية...</option>';
    propertySelect.innerHTML = '<option value="">اختر رقم العقار...</option>';
    propertySelect.disabled = true;
    
    if (sector) {
        // Enable and populate village dropdown
        villageSelect.disabled = false;
        const villages = Object.keys(southLebanonData[sector].villages);
        
        villages.forEach(village => {
            const option = document.createElement('option');
            option.value = village;
            option.textContent = village;
            villageSelect.appendChild(option);
        });
    } else {
        villageSelect.disabled = true;
    }
    
    saveFormData();
}

// Handle village selection
function handleVillageChange(e) {
    const village = e.target.value;
    const sector = document.getElementById('sector').value;
    const propertySelect = document.getElementById('propertyNumber');
    
    // Reset property dropdown
    propertySelect.innerHTML = '<option value="">اختر رقم العقار...</option>';
    
    if (village && sector) {
        // Enable and populate property number dropdown
        propertySelect.disabled = false;
        const properties = southLebanonData[sector].villages[village];
        
        properties.forEach(property => {
            const option = document.createElement('option');
            option.value = property;
            option.textContent = property;
            propertySelect.appendChild(option);
        });
    } else {
        propertySelect.disabled = true;
    }
    
    saveFormData();
}

// Setup building fields listener (show/hide block fields with toggle)
function setupBuildingFieldsListener() {
    const toggle = document.getElementById('isInBuildingToggle');
    const buildingFields = document.getElementById('buildingFields');
    const block = document.getElementById('block');
    const buildingCount = document.getElementById('buildingCount');
    
    // Initially hide building fields (toggle is off by default)
    buildingFields.style.display = 'none';
    block.required = false;
    buildingCount.required = false;
    
    toggle.addEventListener('change', function() {
        if (this.checked) {
            buildingFields.style.display = 'block';
            block.required = true;
            buildingCount.required = true;
        } else {
            buildingFields.style.display = 'none';
            block.required = false;
            buildingCount.required = false;
            block.value = '';
            buildingCount.value = '';
        }
    });
}

// Setup entry type radio listeners
/**
 * Setup listeners for entry type radio buttons
 * Determines which path the user will take:
 * - Single entry (default)
 * - My floors entry (multiple floors owned by submitter)
 * - Full building entry (all residents in building)
 */
function setupEntryTypeListeners() {
    const radios = document.querySelectorAll('input[name="entryType"]');
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            isFullBuildingEntry = this.value === 'full';
            isMyFloorsEntry = this.value === 'myFloors';
        });
    });
}

// ============================================
// FORM NAVIGATION CONTROLS
// ============================================

/**
 * Navigate to the next step in the form
 * Handles conditional navigation based on entry type
 * 
 * Flow:
 * - Single entry: 1 → 2 → 3 → 4
 * - My floors: 1 → 2 → 2a → 3 → 4
 * - Full building: 1 → 2 → 2b → 4
 * 
 * @param {number|string} step - Current step number or identifier
 */
function nextStep(step) {
    if (validateStep(step)) {
        // Step 2 branches into different paths based on entry type
        if (step === 2) {
            const entryType = document.querySelector('input[name="entryType"]:checked').value;
            
            // Path A: Multiple floors owned by same person
            if (entryType === 'myFloors') {
                currentStep = '2a';
                showStep('2a');
                updateProgress();
                saveFormData();
                window.scrollTo(0, 0);
                return;
            } 
            // Path B: Full building with multiple residents
            else if (entryType === 'full') {
                currentStep = '2b';
                showStep('2b');
                updateProgress();
                saveFormData();
                window.scrollTo(0, 0);
                return;
            }
        }
        
        if (step === '2a') {
            // From my floors entry, go to step 3
            currentStep = 3;
            showStep(3);
            updateProgress();
            saveFormData();
            window.scrollTo(0, 0);
            return;
        }
        
        if (step === '2b') {
            // From full building entry, go to step 4 (skip step 3)
            currentStep = 4;
            populateReviewData();
            showStep(4);
            updateProgress();
            saveFormData();
            window.scrollTo(0, 0);
            return;
        }
        
        if (step === 3) {
            // Before going to review step, populate review data
            populateReviewData();
        }
        
        currentStep++;
        showStep(currentStep);
        updateProgress();
        saveFormData();
        window.scrollTo(0, 0);
    }
}

// Navigate to previous step
function prevStep(step) {
    if (step === '2a') {
        // From my floors entry, go back to step 2
        currentStep = 2;
        showStep(2);
        updateProgress();
        window.scrollTo(0, 0);
        return;
    }
    
    if (step === '2b') {
        // From full building entry, go back to step 2
        currentStep = 2;
        showStep(2);
        updateProgress();
        window.scrollTo(0, 0);
        return;
    }
    
    if (step === 3) {
        // Check if we came from my floors entry
        if (isMyFloorsEntry) {
            currentStep = '2a';
            showStep('2a');
            updateProgress();
            window.scrollTo(0, 0);
            return;
        }
    }
    
    if (step === 4) {
        // Check if we came from full building entry
        if (isFullBuildingEntry) {
            currentStep = '2b';
            showStep('2b');
            updateProgress();
            window.scrollTo(0, 0);
            return;
        }
    }
    
    currentStep--;
    showStep(currentStep);
    updateProgress();
    window.scrollTo(0, 0);
}

// Show specific step
function showStep(step) {
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(`step${step}`).classList.add('active');
}

// Update progress bar
function updateProgress() {
    let progress;
    let stepText;
    
    if (currentStep === '2a' || currentStep === '2b') {
        progress = 50; // Middle of the process
        stepText = 'الخطوة 2 من 4';
    } else {
        progress = (currentStep / totalSteps) * 100;
        stepText = `الخطوة ${currentStep} من ${totalSteps}`;
    }
    
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = stepText;
}

// Validate current step
function validateStep(step) {
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    if (step === 1) {
        // Validate location information
        const sector = document.getElementById('sector').value;
        const village = document.getElementById('village').value;
        const neighborhood = document.getElementById('neighborhood').value;
        const buildingName = document.getElementById('buildingName').value;
        const street = document.getElementById('street').value;
        
        if (!sector) {
            showError('sectorError', 'الرجاء اختيار القطاع');
            isValid = false;
        }
        if (!village) {
            showError('villageError', 'الرجاء اختيار المنطقة العقارية');
            isValid = false;
        }
        if (!neighborhood || neighborhood.trim().length < 2) {
            showError('neighborhoodError', 'الرجاء إدخال الحي');
            isValid = false;
        }
        if (!buildingName || buildingName.trim().length < 2) {
            showError('buildingNameError', 'الرجاء إدخال اسم المبنى');
            isValid = false;
        }
        if (!street || street.trim().length < 2) {
            showError('streetError', 'الرجاء إدخال اسم الشارع');
            isValid = false;
        }
    }
    
    if (step === 2) {
        // Validate building information
        const propertyNumber = document.getElementById('propertyNumber').value;
        const sectionNumber = document.getElementById('sectionNumber').value;
        const isInBuilding = document.getElementById('isInBuildingToggle').checked;
        const buildingType = document.getElementById('buildingType').value;
        const totalFloors = document.getElementById('totalFloors').value;
        const floorNumber = document.getElementById('floorNumber').value;
        const sectionType = document.getElementById('sectionType').value;
        const direction = document.getElementById('direction').value;
        
        if (!propertyNumber) {
            showError('propertyNumberError', 'الرجاء اختيار رقم العقار');
            isValid = false;
        }
        if (!sectionNumber) {
            showError('sectionNumberError', 'الرجاء إدخال رقم القسم');
            isValid = false;
        }
        
        // Validate block fields if in building (toggle is checked)
        if (isInBuilding) {
            const block = document.getElementById('block').value;
            const buildingCount = document.getElementById('buildingCount').value;
            
            if (!block || block.trim().length < 1) {
                showError('blockError', 'الرجاء إدخال البلوك');
                isValid = false;
            }
            if (!buildingCount) {
                showError('buildingCountError', 'الرجاء إدخال عدد المباني/البلوكات');
                isValid = false;
            }
        }
        
        if (!buildingType) {
            showError('buildingTypeError', 'الرجاء اختيار نوع المبنى');
            isValid = false;
        }
        if (!totalFloors) {
            showError('totalFloorsError', 'الرجاء إدخال عدد الطوابق');
            isValid = false;
        }
        if (!floorNumber) {
            showError('floorNumberError', 'الرجاء إدخال رقم الطابق');
            isValid = false;
        }
        if (!sectionType) {
            showError('sectionTypeError', 'الرجاء اختيار نوع القسم');
            isValid = false;
        }
        if (!direction) {
            showError('directionError', 'الرجاء اختيار الجهة');
            isValid = false;
        }
    }
    
    if (step === '2a') {
        // Validate my floors entry
        const floors = document.querySelectorAll('.floor-entry');
        let hasError = false;
        
        floors.forEach((floor, index) => {
            const inputs = floor.querySelectorAll('input[required], select[required]');
            inputs.forEach(input => {
                if (!input.value || input.value.trim() === '') {
                    input.style.borderColor = '#e74c3c';
                    hasError = true;
                    isValid = false;
                } else {
                    input.style.borderColor = '#e0e0e0';
                }
            });
        });
        
        if (hasError) {
            alert('الرجاء ملء جميع الحقول المطلوبة لجميع الطوابق');
        }
    }
    
    if (step === '2b') {
        // Validate full building entry
        const residents = document.querySelectorAll('.resident-entry');
        let hasError = false;
        
        residents.forEach((resident, index) => {
            const inputs = resident.querySelectorAll('input[required], select[required]');
            inputs.forEach(input => {
                if (!input.value || input.value.trim() === '') {
                    input.style.borderColor = '#e74c3c';
                    hasError = true;
                    isValid = false;
                } else {
                    input.style.borderColor = '#e0e0e0';
                }
            });
        });
        
        if (hasError) {
            alert('الرجاء ملء جميع الحقول المطلوبة لجميع القاطنين');
        }
    }
    
    if (step === 3) {
        // Validate contact information
        const fullName = document.getElementById('fullName').value;
        const motherName = document.getElementById('motherName').value;
        const registry = document.getElementById('registry').value;
        const phone = document.getElementById('phone').value;
        
        if (!fullName || fullName.trim().length < 5) {
            showError('fullNameError', 'الرجاء إدخال الاسم الثلاثي كاملاً');
            isValid = false;
        }
        
        if (!motherName || motherName.trim().length < 3) {
            showError('motherNameError', 'الرجاء إدخال اسم الأم');
            isValid = false;
        }
        
        if (!registry || registry.trim().length < 3) {
            showError('registryError', 'الرجاء إدخال رقم السجل');
            isValid = false;
        }
        
        if (!phone) {
            showError('phoneError', 'الرجاء إدخال رقم الهاتف');
            isValid = false;
        } else if (!validatePhoneNumber(phone)) {
            showError('phoneError', 'رقم الهاتف غير صحيح');
            isValid = false;
        }
    }
    
    return isValid;
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// Validate phone number (Lebanese format)
function validatePhoneNumber(phone) {
    // Basic validation for Lebanese phone numbers
    const phoneRegex = /^(03|70|71|76|78|79|81)\d{6}$/;
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return phoneRegex.test(cleanPhone);
}

// Add new floor entry (for my floors)
function addMyFloor() {
    const container = document.getElementById('myFloorsContainer');
    const newIndex = myFloorCounter;
    
    const floorHTML = `
        <div class="floor-entry" data-index="${newIndex}">
            <div class="floor-header">
                <h3>طابق رقم ${newIndex + 1}</h3>
                <button type="button" class="btn-remove-floor" onclick="removeFloor(${newIndex})">
                    <span>×</span>
                </button>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>رقم الطابق <span class="required">*</span></label>
                    <input type="number" name="myfloor_number_${newIndex}" min="0" max="50" placeholder="مثال: 3" required>
                </div>
                <div class="form-group">
                    <label>نوع القسم <span class="required">*</span></label>
                    <select name="myfloor_sectionType_${newIndex}" required>
                        <option value="">اختر النوع...</option>
                        <option value="house">منزل</option>
                        <option value="shop">محل</option>
                        <option value="warehouse">مستودع</option>
                        <option value="office">مكتب</option>
                        <option value="clinic">عيادة</option>
                        <option value="factory">معمل</option>
                        <option value="other">أخرى</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>الجهة <span class="required">*</span></label>
                    <select name="myfloor_direction_${newIndex}" required>
                        <option value="">اختر الجهة...</option>
                        <option value="north">شمالي</option>
                        <option value="south">جنوبي</option>
                        <option value="east">شرقي</option>
                        <option value="west">غربي</option>
                        <option value="northeast">شمال شرقي</option>
                        <option value="northwest">شمال غربي</option>
                        <option value="southeast">جنوب شرقي</option>
                        <option value="southwest">جنوب غربي</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>اسم الشخص المسجل باسمه <span class="required">*</span></label>
                    <input type="text" name="myfloor_registrant_${newIndex}" placeholder="الاسم الكامل" required>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', floorHTML);
    myFloorCounter++;
    
    updateRemoveFloorButtons();
}

// Remove floor entry
function removeFloor(index) {
    const floor = document.querySelector(`.floor-entry[data-index="${index}"]`);
    if (floor) {
        floor.remove();
        updateRemoveFloorButtons();
        renumberFloors();
    }
}

// Update visibility of remove buttons for floors
function updateRemoveFloorButtons() {
    const floors = document.querySelectorAll('.floor-entry');
    floors.forEach((floor, index) => {
        const removeBtn = floor.querySelector('.btn-remove-floor');
        if (floors.length > 1) {
            removeBtn.style.display = 'flex';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

// Renumber floors after removal
function renumberFloors() {
    const floors = document.querySelectorAll('.floor-entry');
    floors.forEach((floor, index) => {
        const header = floor.querySelector('.floor-header h3');
        header.textContent = `طابق رقم ${index + 1}`;
    });
}

// Add new resident entry
function addResident() {
    const container = document.getElementById('residentsContainer');
    const newIndex = residentCounter;
    
    const residentHTML = `
        <div class="resident-entry" data-index="${newIndex}">
            <div class="resident-header">
                <h3>قاطن رقم ${newIndex + 1}</h3>
                <button type="button" class="btn-remove-resident" onclick="removeResident(${newIndex})">
                    <span>×</span>
                </button>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>الاسم الثلاثي <span class="required">*</span></label>
                    <input type="text" name="resident_fullName_${newIndex}" placeholder="الاسم الكامل" required>
                </div>
                <div class="form-group">
                    <label>اسم الأم <span class="required">*</span></label>
                    <input type="text" name="resident_motherName_${newIndex}" placeholder="اسم الأم" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>رقم السجل <span class="required">*</span></label>
                    <input type="text" name="resident_registry_${newIndex}" placeholder="رقم السجل" required>
                </div>
                <div class="form-group">
                    <label>رقم الهاتف <span class="required">*</span></label>
                    <input type="tel" name="resident_phone_${newIndex}" placeholder="03123456" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>الطابق <span class="required">*</span></label>
                    <input type="number" name="resident_floor_${newIndex}" min="0" max="50" placeholder="مثال: 2" required>
                </div>
                <div class="form-group">
                    <label>نوع القسم <span class="required">*</span></label>
                    <select name="resident_sectionType_${newIndex}" required>
                        <option value="">اختر النوع...</option>
                        <option value="house">منزل</option>
                        <option value="shop">محل</option>
                        <option value="warehouse">مستودع</option>
                        <option value="office">مكتب</option>
                        <option value="clinic">عيادة</option>
                        <option value="factory">معمل</option>
                        <option value="other">أخرى</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>الجهة <span class="required">*</span></label>
                    <select name="resident_direction_${newIndex}" required>
                        <option value="">اختر الجهة...</option>
                        <option value="north">شمالي</option>
                        <option value="south">جنوبي</option>
                        <option value="east">شرقي</option>
                        <option value="west">غربي</option>
                        <option value="northeast">شمال شرقي</option>
                        <option value="northwest">شمال غربي</option>
                        <option value="southeast">جنوب شرقي</option>
                        <option value="southwest">جنوب غربي</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', residentHTML);
    residentCounter++;
    
    // Show remove button on all entries if more than one
    updateRemoveButtons();
}

// Remove resident entry
function removeResident(index) {
    const resident = document.querySelector(`.resident-entry[data-index="${index}"]`);
    if (resident) {
        resident.remove();
        updateRemoveButtons();
        renumberResidents();
    }
}

// Update visibility of remove buttons
function updateRemoveButtons() {
    const residents = document.querySelectorAll('.resident-entry');
    residents.forEach((resident, index) => {
        const removeBtn = resident.querySelector('.btn-remove-resident');
        if (residents.length > 1) {
            removeBtn.style.display = 'flex';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

// Renumber residents after removal
function renumberResidents() {
    const residents = document.querySelectorAll('.resident-entry');
    residents.forEach((resident, index) => {
        const header = resident.querySelector('.resident-header h3');
        header.textContent = `قاطن رقم ${index + 1}`;
    });
}

// Populate review data
function populateReviewData() {
    // Location info
    document.getElementById('reviewSector').textContent = document.getElementById('sector').value;
    document.getElementById('reviewVillage').textContent = document.getElementById('village').value;
    document.getElementById('reviewNeighborhood').textContent = document.getElementById('neighborhood').value;
    document.getElementById('reviewBuildingName').textContent = document.getElementById('buildingName').value;
    document.getElementById('reviewStreet').textContent = document.getElementById('street').value;
    
    // Building info
    document.getElementById('reviewPropertyNumber').textContent = document.getElementById('propertyNumber').value;
    document.getElementById('reviewSectionNumber').textContent = document.getElementById('sectionNumber').value;
    
    // Is in building (toggle)
    const isInBuilding = document.getElementById('isInBuildingToggle').checked;
    document.getElementById('reviewIsInBuilding').textContent = isInBuilding ? 'نعم' : 'لا';
    
    // Show/hide block and building count based on isInBuilding
    if (isInBuilding) {
        document.getElementById('reviewBlockItem').style.display = 'flex';
        document.getElementById('reviewBuildingCountItem').style.display = 'flex';
        document.getElementById('reviewBlock').textContent = document.getElementById('block').value;
        document.getElementById('reviewBuildingCount').textContent = document.getElementById('buildingCount').value;
    } else {
        document.getElementById('reviewBlockItem').style.display = 'none';
        document.getElementById('reviewBuildingCountItem').style.display = 'none';
    }
    
    const buildingType = document.getElementById('buildingType');
    document.getElementById('reviewBuildingType').textContent = buildingType.options[buildingType.selectedIndex].text;
    document.getElementById('reviewTotalFloors').textContent = document.getElementById('totalFloors').value;
    document.getElementById('reviewFloorNumber').textContent = document.getElementById('floorNumber').value;
    
    const sectionType = document.getElementById('sectionType');
    document.getElementById('reviewSectionType').textContent = sectionType.options[sectionType.selectedIndex].text;
    
    const direction = document.getElementById('direction');
    document.getElementById('reviewDirection').textContent = direction.options[direction.selectedIndex].text;
    
    // Check entry type
    const entryType = document.querySelector('input[name="entryType"]:checked').value;
    
    if (entryType === 'myFloors') {
        // Show my floors review
        document.getElementById('singleResidentReview').style.display = 'block';
        document.getElementById('fullBuildingReview').style.display = 'none';
        document.getElementById('myFloorsReview').style.display = 'block';
        
        document.getElementById('reviewFullName').textContent = document.getElementById('fullName').value;
        document.getElementById('reviewMotherName').textContent = document.getElementById('motherName').value;
        document.getElementById('reviewRegistry').textContent = document.getElementById('registry').value;
        document.getElementById('reviewPhone').textContent = document.getElementById('phone').value;
        
        // Populate my floors list
        const myFloorsList = document.getElementById('reviewMyFloorsList');
        myFloorsList.innerHTML = '';
        
        const floors = document.querySelectorAll('.floor-entry');
        floors.forEach((floor, index) => {
            const floorNumber = floor.querySelector(`input[name^="myfloor_number"]`).value;
            const sectionTypeSelect = floor.querySelector(`select[name^="myfloor_sectionType"]`);
            const sectionTypeText = sectionTypeSelect.options[sectionTypeSelect.selectedIndex].text;
            const directionSelect = floor.querySelector(`select[name^="myfloor_direction"]`);
            const directionText = directionSelect.options[directionSelect.selectedIndex].text;
            const registrant = floor.querySelector(`input[name^="myfloor_registrant"]`).value;
            
            const floorHTML = `
                <div class="floor-review-item">
                    <span><strong>طابق ${floorNumber}</strong> - ${sectionTypeText} - ${directionText} - ${registrant}</span>
                </div>
            `;
            
            myFloorsList.insertAdjacentHTML('beforeend', floorHTML);
        });
    } else if (entryType === 'full') {
        // Show full building residents list
        document.getElementById('singleResidentReview').style.display = 'none';
        document.getElementById('myFloorsReview').style.display = 'none';
        document.getElementById('fullBuildingReview').style.display = 'block';
        
        const residentsList = document.getElementById('reviewResidentsList');
        residentsList.innerHTML = '';
        
        const residents = document.querySelectorAll('.resident-entry');
        residents.forEach((resident, index) => {
            const fullName = resident.querySelector(`input[name^="resident_fullName"]`).value;
            const motherName = resident.querySelector(`input[name^="resident_motherName"]`).value;
            const registry = resident.querySelector(`input[name^="resident_registry"]`).value;
            const phone = resident.querySelector(`input[name^="resident_phone"]`).value;
            const floor = resident.querySelector(`input[name^="resident_floor"]`).value;
            const sectionTypeSelect = resident.querySelector(`select[name^="resident_sectionType"]`);
            const sectionTypeText = sectionTypeSelect.options[sectionTypeSelect.selectedIndex].text;
            const directionSelect = resident.querySelector(`select[name^="resident_direction"]`);
            const directionText = directionSelect.options[directionSelect.selectedIndex].text;
            
            const residentHTML = `
                <div class="resident-review-item">
                    <h4>قاطن رقم ${index + 1}</h4>
                    <div class="review-item">
                        <span class="review-label">الاسم:</span>
                        <span class="review-value">${fullName}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-label">اسم الأم:</span>
                        <span class="review-value">${motherName}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-label">رقم السجل:</span>
                        <span class="review-value">${registry}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-label">رقم الهاتف:</span>
                        <span class="review-value">${phone}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-label">الطابق:</span>
                        <span class="review-value">${floor}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-label">نوع القسم:</span>
                        <span class="review-value">${sectionTypeText}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-label">الجهة:</span>
                        <span class="review-value">${directionText}</span>
                    </div>
                </div>
            `;
            
            residentsList.insertAdjacentHTML('beforeend', residentHTML);
        });
    }
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    
    // Check submission limit
    const submissionCount = getSubmissionCount();
    if (submissionCount >= MAX_SUBMISSIONS) {
        alert('لقد وصلت إلى الحد الأقصى من التسجيلات (3). للمزيد من التسجيلات، يرجى الاتصال بنا.');
        return;
    }
    
    // Collect form data
    const formData = collectFormData();
    
    // Save to localStorage (in production, this would be sent to backend/Google Sheets)
    saveSubmission(formData);
    
    // Increment submission count
    incrementSubmissionCount();
    
    // Show success message
    showSuccessMessage();
}

// Collect all form data
function collectFormData() {
    const entryTypeElement = document.querySelector('input[name="entryType"]:checked');
    const entryType = entryTypeElement ? entryTypeElement.value : 'single';
    const isInBuilding = document.getElementById('isInBuildingToggle').checked;
    
    const baseData = {
        sector: document.getElementById('sector').value,
        village: document.getElementById('village').value,
        neighborhood: document.getElementById('neighborhood').value,
        buildingName: document.getElementById('buildingName').value,
        streetName: document.getElementById('street').value,
        propertyNumber: document.getElementById('propertyNumber').value,
        sectionNumber: document.getElementById('sectionNumber').value,
        isInBuilding: isInBuilding,
        buildingType: document.getElementById('buildingType').value,
        floors: document.getElementById('totalFloors').value,
        floorNumber: document.getElementById('floorNumber').value,
        sectionType: document.getElementById('sectionType').value,
        direction: document.getElementById('direction').value,
        entryType: entryType,
        timestamp: new Date().toLocaleString('ar-LB')
    };
    
    // Add block and building count if in building (toggle checked)
    if (isInBuilding) {
        baseData.block = document.getElementById('block').value;
        baseData.buildingCount = document.getElementById('buildingCount').value;
    }
    
    if (entryType === 'myFloors') {
        // Collect main resident data
        baseData.fullName = document.getElementById('fullName').value;
        baseData.motherName = document.getElementById('motherName').value;
        baseData.registry = document.getElementById('registry').value;
        baseData.phone = document.getElementById('phone').value;
        
        // Collect additional floors data
        const myFloors = [];
        const floorEntries = document.querySelectorAll('.floor-entry');
        
        floorEntries.forEach((entry, index) => {
            const floor = {
                floorNumber: entry.querySelector(`input[name^="myfloor_number"]`).value,
                sectionType: entry.querySelector(`select[name^="myfloor_sectionType"]`).value,
                direction: entry.querySelector(`select[name^="myfloor_direction"]`).value,
                registrant: entry.querySelector(`input[name^="myfloor_registrant"]`).value
            };
            myFloors.push(floor);
        });
        
        baseData.myFloors = myFloors;
    } else if (entryType === 'full') {
        // Collect main contact info for full building entry
        baseData.fullName = document.getElementById('fullName').value;
        baseData.motherName = document.getElementById('motherName').value;
        baseData.registry = document.getElementById('registry').value;
        baseData.phone = document.getElementById('phone').value;
        
        // Collect all residents data
        const residents = [];
        const residentEntries = document.querySelectorAll('.resident-entry');
        
        residentEntries.forEach((entry, index) => {
            const resident = {
                fullName: entry.querySelector(`input[name^="resident_fullName"]`).value,
                motherName: entry.querySelector(`input[name^="resident_motherName"]`).value,
                registry: entry.querySelector(`input[name^="resident_registry"]`).value,
                phone: entry.querySelector(`input[name^="resident_phone"]`).value,
                floor: entry.querySelector(`input[name^="resident_floor"]`).value,
                sectionType: entry.querySelector(`select[name^="resident_sectionType"]`).value,
                direction: entry.querySelector(`select[name^="resident_direction"]`).value
            };
            residents.push(resident);
        });
        
        baseData.residents = residents;
    } else {
        // Single entry - collect personal info from step 3
        baseData.fullName = document.getElementById('fullName').value;
        baseData.motherName = document.getElementById('motherName').value;
        baseData.registry = document.getElementById('registry').value;
        baseData.phone = document.getElementById('phone').value;
    }
    
    return baseData;
}

// Save submission to localStorage (using submission_ prefix for Excel export)
function saveSubmission(data) {
    const timestamp = Date.now();
    const key = `submission_${timestamp}`;
    localStorage.setItem(key, JSON.stringify(data));
}

// Get submission count
function getSubmissionCount() {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('submission_')) {
            count++;
        }
    }
    return count;
}

// Increment submission count (no longer needed as we count directly from localStorage)
function incrementSubmissionCount() {
    // This function is kept for compatibility but doesn't do anything
    // as we count submissions directly from localStorage keys
}

// Check submission limit
function checkSubmissionLimit() {
    const count = getSubmissionCount();
    const remainingSubmissions = MAX_SUBMISSIONS - count;
    
    if (remainingSubmissions > 0) {
        document.getElementById('submissionCount').textContent = 
            `يمكنك تسجيل ${remainingSubmissions} منازل إضافية`;
    } else {
        document.getElementById('submissionCount').textContent = 
            'لقد وصلت إلى الحد الأقصى من التسجيلات';
        document.getElementById('submitBtn').disabled = true;
    }
}

// Show success message
function showSuccessMessage() {
    document.getElementById('damageForm').style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';
    document.getElementById('successMessage').classList.add('show');
}

// Reset form for new submission
function resetForm() {
    document.getElementById('damageForm').reset();
    document.getElementById('village').disabled = true;
    document.getElementById('propertyNumber').disabled = true;
    
    // Reset my floors counter and container
    myFloorCounter = 1;
    const myFloorsContainer = document.getElementById('myFloorsContainer');
    const allMyFloors = myFloorsContainer.querySelectorAll('.floor-entry');
    allMyFloors.forEach((floor, index) => {
        if (index > 0) floor.remove();
    });
    
    // Reset first floor
    const firstFloor = myFloorsContainer.querySelector('.floor-entry');
    if (firstFloor) {
        firstFloor.querySelectorAll('input, select').forEach(input => input.value = '');
    }
    
    updateRemoveFloorButtons();
    
    // Reset resident counter and container
    residentCounter = 1;
    const residentsContainer = document.getElementById('residentsContainer');
    const allResidents = residentsContainer.querySelectorAll('.resident-entry');
    allResidents.forEach((resident, index) => {
        if (index > 0) resident.remove();
    });
    
    // Reset first resident
    const firstResident = residentsContainer.querySelector('.resident-entry');
    if (firstResident) {
        firstResident.querySelectorAll('input, select').forEach(input => input.value = '');
    }
    
    updateRemoveButtons();
    
    // Reset building fields visibility and toggle
    document.getElementById('buildingFields').style.display = 'none';
    document.getElementById('isInBuildingToggle').checked = false;
    
    currentStep = 1;
    isFullBuildingEntry = false;
    isMyFloorsEntry = false;
    showStep(1);
    updateProgress();
    
    document.getElementById('damageForm').style.display = 'block';
    document.querySelector('.progress-container').style.display = 'block';
    document.getElementById('successMessage').classList.remove('show');
    
    checkSubmissionLimit();
    clearSavedData();
    
    window.scrollTo(0, 0);
}

// Save form data to localStorage (auto-save feature)
function saveFormData() {
    // Basic auto-save implementation
    const formData = {
        village: document.getElementById('village').value,
        neighborhood: document.getElementById('neighborhood').value,
        buildingName: document.getElementById('buildingName')?.value || '',
        street: document.getElementById('street')?.value || ''
    };
    
    localStorage.setItem('currentFormData', JSON.stringify(formData));
}

// Load saved form data
function loadSavedData() {
    const savedData = localStorage.getItem('currentFormData');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        // Restore basic form values
        if (data.village) {
            document.getElementById('village').value = data.village;
            document.getElementById('village').dispatchEvent(new Event('change'));
            
            setTimeout(() => {
                if (data.neighborhood) {
                    document.getElementById('neighborhood').value = data.neighborhood;
                }
            }, 100);
        }
    }
}

// Clear saved data
function clearSavedData() {
    localStorage.removeItem('currentFormData');
}

// Add event listeners to save data on input
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', saveFormData);
    });
});

// ============================================
// EXCEL EXPORT FUNCTIONALITY
// ============================================

/**
 * Export all submitted data to Excel file
 * 
 * Features:
 * - Retrieves all submissions from localStorage
 * - Handles three entry types (single, myFloors, full building)
 * - Creates properly formatted Excel with Arabic support
 * - Generates unique rows for each floor/resident
 * - Auto-downloads file with timestamp
 * 
 * File format:
 * - Sheet name: "حصر الأضرار"
 * - Columns: 20+ fields including location, property, and personal data
 * - Rows: One per submission, expanded for multi-entry types
 */
function exportToExcel() {
    const exportInfo = document.getElementById('exportInfo');
    
    try {
        // Retrieve all submission entries from browser storage
        const submissions = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('submission_')) {
                const data = JSON.parse(localStorage.getItem(key));
                submissions.push(data);
            }
        }

        // Validate that data exists
        if (submissions.length === 0) {
            exportInfo.className = 'export-info error';
            exportInfo.textContent = 'لا توجد بيانات للتصدير. الرجاء إدخال بيانات أولاً.';
            return;
        }

        // Array to hold formatted Excel rows
        const excelData = [];
        
        submissions.forEach((submission, index) => {
            const baseInfo = {
                'رقم السجل': index + 1,
                'تاريخ التسجيل': submission.timestamp || new Date().toLocaleString('ar-LB'),
                'القطاع': submission.sector || '',
                'القرية': submission.village || '',
                'الحي': submission.neighborhood || '',
                'اسم المبنى': submission.buildingName || '',
                'اسم الشارع': submission.streetName || '',
                'رقم العقار': submission.propertyNumber || '',
                'رقم القسم': submission.sectionNumber || '',
                'ضمن مبنى': submission.isInBuilding ? 'نعم' : 'لا',
                'رقم الكتلة/المبنى': submission.blockNumber || '',
                'عدد المباني': submission.buildingCount || '',
                'نوع المبنى': submission.buildingType || '',
                'عدد الطوابق': submission.floors || '',
                'رقم الطابق': submission.floorNumber || '',
                'نوع القسم': submission.sectionType || '',
                'الاتجاه': submission.direction || '',
                'الاسم الكامل': submission.fullName || '',
                'اسم الأم': submission.motherName || '',
                'القيد': submission.registry || '',
                'رقم الهاتف': submission.phone || ''
            };

            // Handle different entry types
            if (submission.myFloors && submission.myFloors.length > 0) {
                // Type: My Floors Entry
                baseInfo['نوع الإدخال'] = 'طوابق مسجلة باسمي';
                baseInfo['عدد الطوابق المسجلة'] = submission.myFloors.length;
                
                submission.myFloors.forEach((floor, floorIndex) => {
                    const floorData = { ...baseInfo };
                    floorData['رقم السجل'] = `${index + 1}.${floorIndex + 1}`;
                    floorData['رقم الطابق الإضافي'] = floor.floorNumber || '';
                    floorData['نوع القسم الإضافي'] = floor.sectionType || '';
                    floorData['الاتجاه الإضافي'] = floor.direction || '';
                    floorData['اسم المسجل'] = floor.registrantName || '';
                    excelData.push(floorData);
                });
            } else if (submission.residents && submission.residents.length > 0) {
                // Type: Full Building Entry
                baseInfo['نوع الإدخال'] = 'مبنى كامل';
                baseInfo['عدد السكان'] = submission.residents.length;
                
                submission.residents.forEach((resident, residentIndex) => {
                    const residentData = { ...baseInfo };
                    residentData['رقم السجل'] = `${index + 1}.${residentIndex + 1}`;
                    residentData['اسم الساكن'] = resident.fullName || '';
                    residentData['اسم أم الساكن'] = resident.motherName || '';
                    residentData['قيد الساكن'] = resident.registry || '';
                    residentData['هاتف الساكن'] = resident.phone || '';
                    residentData['طابق الساكن'] = resident.floor || '';
                    residentData['نوع قسم الساكن'] = resident.sectionType || '';
                    residentData['اتجاه الساكن'] = resident.direction || '';
                    excelData.push(residentData);
                });
            } else {
                // Type: Single Entry
                baseInfo['نوع الإدخال'] = 'إدخال واحد';
                excelData.push(baseInfo);
            }
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 10 },  // رقم السجل
            { wch: 20 },  // تاريخ التسجيل
            { wch: 15 },  // القطاع
            { wch: 15 },  // القرية
            { wch: 15 },  // الحي
            { wch: 20 },  // اسم المبنى
            { wch: 20 },  // اسم الشارع
            { wch: 12 },  // رقم العقار
            { wch: 12 },  // رقم القسم
            { wch: 10 },  // ضمن مبنى
            { wch: 15 },  // رقم الكتلة/المبنى
            { wch: 12 },  // عدد المباني
            { wch: 15 },  // نوع المبنى
            { wch: 12 },  // عدد الطوابق
            { wch: 12 },  // رقم الطابق
            { wch: 15 },  // نوع القسم
            { wch: 12 },  // الاتجاه
            { wch: 20 },  // الاسم الكامل
            { wch: 15 },  // اسم الأم
            { wch: 15 },  // القيد
            { wch: 15 }   // رقم الهاتف
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'حصر الأضرار');

        // Generate filename with current date
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
        const filename = `حصر_الأضرار_${dateStr}.xlsx`;

        // Export file
        XLSX.writeFile(wb, filename);

        // Show success message
        exportInfo.className = 'export-info success';
        exportInfo.textContent = `✅ تم تصدير ${submissions.length} سجل بنجاح إلى ملف ${filename}`;
        
        // Hide message after 5 seconds
        setTimeout(() => {
            exportInfo.style.display = 'none';
        }, 5000);

    } catch (error) {
        console.error('Error exporting to Excel:', error);
        exportInfo.className = 'export-info error';
        exportInfo.textContent = '❌ حدث خطأ أثناء التصدير. الرجاء المحاولة مرة أخرى.';
    }
}
