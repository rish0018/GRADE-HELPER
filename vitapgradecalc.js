// Constants for calculations and validation
const QUIZ_MAX = 10;
const CAT_MAX = 50;
const LAB_MAX = 100;
const FAT_WEIGHT = 0.45; // FAT is 60% of theory (75%) = 45% total
const GRADE_BOUNDARIES = {
    'S': 90,
    'A': 80,
    'B': 70,
    'C': 60,
    'D': 50,
    'E': 45
};

// Function to predict FAT average based on CAT1 and CAT2
function predictFATAverage(cat1, cat2) {
    const cat1Percent = (cat1 / CAT_MAX) * 100;
    const cat2Percent = (cat2 / CAT_MAX) * 100;
    const avgCAT = (cat1Percent + cat2Percent) / 2;
    const fatEstimate = (0.85 * avgCAT) + 10;
    return Math.min(100, Math.max(40, fatEstimate));
}

// Calculate current total marks excluding FAT
function calculateCurrentTotal(input) {
    // Theory Component (75% total)
    // Quizzes (10% of theory = 7.5% total)
    const quizTotal = ((input.quiz1 + input.quiz2 + input.quiz3) / (3 * QUIZ_MAX)) * 7.5;
    
    // CATs (15% each of theory = 11.25% total each)
    const cat1Contribution = (input.cat1 / CAT_MAX) * 11.25;
    const cat2Contribution = (input.cat2 / CAT_MAX) * 11.25;
    
    // Lab (25% total)
    const labContribution = (input.lab / LAB_MAX) * 25;
    
    return quizTotal + cat1Contribution + cat2Contribution + labContribution;
}

// Calculate dynamic grades based on current total and predicted FAT average
function calculateDynamicGrades(inputs) {
    const currentTotal = calculateCurrentTotal(inputs);
    const predictedFATAverage = predictFATAverage(inputs.cat1, inputs.cat2);

    const results = [];
    const grades = Object.keys(GRADE_BOUNDARIES);

    for (const grade of grades) {
        const totalNeeded = GRADE_BOUNDARIES[grade];
        let requiredFatMark = ((totalNeeded - currentTotal) / FAT_WEIGHT);
        
        let status = 'Possible';
        let rangeLow = Math.max(40, Math.floor(requiredFatMark - 5));
        let rangeHigh = Math.min(100, Math.ceil(required, requiredFatMark + 5));

        if (requiredFatMark < 40) {
            requiredFatMark = 40;
            status = 'Need min. 40 in FAT';
            rangeLow = 40;
            rangeHigh = 40;
        } else if (requiredFatMark > 100) {
            requiredFatMark = 100;
            status = 'Impossible';
        }

        results.push({
            grade,
            requiredFatMarkExact: Math.round(requiredFatMark),
            range: `${rangeLow} - ${rangeHigh}`,
            status
        });
    }

    results.push({
        grade: 'F',
        requiredFatMarkExact: null,
        range: null,
        status: 'If total is below 50% or FAT below 40 marks'
    });

    return { results, predictedFATAverage, currentTotal };
}

// Validate input values
function validateInputs(inputs, isTheoryOnly = false) {
    const maxLab = isTheoryOnly ? 0 : LAB_MAX;
    const validations = {
        quiz1: { max: QUIZ_MAX, min: 0 },
        quiz2: { max: QUIZ_MAX, min: 0 },
        quiz3: { max: QUIZ_MAX, min: 0 },
        cat1: { max: CAT_MAX, min: 0 },
        cat2: { max: CAT_MAX, min: 0 },
        lab: { max: maxLab, min: 0 }
    };

    for (const [key, value] of Object.entries(inputs)) {
        if (value < validations[key].min || value > validations[key].max) {
            displayError(`Please enter valid marks for ${key} (between ${validations[key].min} and ${validations[key].max})`);
            return false;
        }
    }
    return true;
}

// Display error message
function displayError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000); // Hide after 3 seconds
}

// Get input value from an element
function getInputValue(id, def = 0) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`Element with id ${id} not found.`);
        return def;
    }
    const val = parseFloat(el.value);
    return isNaN(val) ? def : val;
}

// Create table row for a grade result
function createTableRow(result) {
    let statusClass = 'status-warning';
    if (result.status === 'Possible') statusClass = 'status-possible';
    else if (result.status === 'Impossible') statusClass = 'status-impossible';

    if (result.grade === 'F') {
        return `
            <tr>
                <td><span class="grade-indicator">${result.grade}</span></td>
                <td colspan="3">${result.status}</td>
            </tr>
        `;
    }

    return `
        <tr>
            <td><span class="grade-indicator">${result.grade}</span></td>
            <td>${result.range}</td>
            <td>${result.requiredFatMarkExact} out of 100</td>
            <td class="${statusClass}">${result.status}</td>
        </tr>
    `;
}

// Display results
function displayResults(calcResults) {
    const { results, predictedFATAverage, currentTotal } = calcResults;
    document.getElementById('summary-container').innerHTML = `
        <div class="info-box">
            <p><strong>Your Current Total (excluding FAT):</strong> ${currentTotal.toFixed(2)}%</p>
            <p><strong>Predicted FAT Average:</strong> ${predictedFATAverage.toFixed(2)}%</p>
        </div>
    `;

    document.getElementById('predicted-fat-container').innerHTML = `
        <h3>Predicted FAT Class Average</h3>
        <p>Predicted FAT average is <strong>${predictedFATAverage.toFixed(2)}%</strong> based on CAT1 and CAT2 scores.</p>
        <p class="subtitle">Grade thresholds: S≥90, A≥80, B≥70, C≥60, D≥50, E≥45</p>
    `;

    let rowsHTML = '';
    for (const result of results) {
        rowsHTML += createTableRow(result);
    }
    document.getElementById('results-body').innerHTML = rowsHTML;
    document.getElementById('result-container').style.display = 'block';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add error message container if not present
    if (!document.getElementById('error-message')) {
        const errorMessage = document.createElement('div');
        errorMessage.id = 'error-message';
        errorMessage.style.display = 'none';
        errorMessage.style.color = 'red';
        document.body.appendChild(errorMessage);
    }

    document.getElementById('calculate-theory-lab').addEventListener('click', () => {
        const inputs = {
            quiz1: getInputValue('quiz1'),
            quiz2: getInputValue('quiz2'),
            quiz3: getInputValue('quiz3'),
            cat1: getInputValue('cat1'),
            cat2: getInputValue('cat2'),
            lab: getInputValue('lab')
        };

        if (!validateInputs(inputs)) return;
        const calcResults = calculateDynamicGrades(inputs);
        displayResults(calcResults);
    });

    document.getElementById('calculate-theory-only').addEventListener('click', () => {
        const inputs = {
            quiz1: getInputValue('t-quiz1'),
            quiz2: getInputValue('t-quiz2'),
            quiz3: getInputValue('t-quiz3'),
            cat1: getInputValue('t-cat1'),
            cat2: getInputValue('t-cat2'),
            lab: 0
        };

        if (!validateInputs(inputs, true)) return;
        const calcResults = calculateDynamicGrades(inputs);
        displayResults(calcResults);
    });

    // Toggle between theory & lab and theory only forms
    document.getElementById('theory-lab-toggle').addEventListener('click', () => toggleForms('theory-lab'));
    document.getElementById('theory-only-toggle').addEventListener('click', () => toggleForms('theory-only'));
});

function toggleForms(mode) {
    const theoryLabToggle = document.getElementById('theory-lab-toggle');
    const theoryOnlyToggle = document.getElementById('theory-only-toggle');
    const theoryLabForm = document.getElementById('theory-lab-form');
    const theoryOnlyForm = document.getElementById('theory-only-form');

    if (mode === 'theory-lab') {
        theoryLabToggle.classList.add('active');
        theoryOnlyToggle.classList.remove('active');
        theoryLabForm.classList.add('active');
        theoryOnlyForm.classList.remove('active');
    } else {
        theoryOnlyToggle.classList.add('active');
        theoryLabToggle.classList.remove('active');
        theoryOnlyForm.classList.add('active');
        theoryLabForm.classList.remove('active');
    }
    document.getElementById('result-container').style.display = 'none';
}