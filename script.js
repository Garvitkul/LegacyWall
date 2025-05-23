// DOM Elements
const addNoteBtn = document.getElementById('addNoteBtn');
const notesContainer = document.getElementById('notesContainer');
const searchInput = document.getElementById('searchInput');
const noteTemplate = document.getElementById('noteTemplate');

// Notes array to store all notes
let notes = [];
// Track unsaved notes
let unsavedNotes = new Set();

// Load notes from server
async function loadNotes() {
    try {
        const response = await fetch('/api/notes');
        notes = await response.json();
        renderNotes();
    } catch (error) {
        console.error('Failed to load notes:', error);
        notes = [];
    }
}

// Save notes to server
async function saveNotes() {
    try {
        await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notes)
        });
    } catch (error) {
        console.error('Failed to save notes:', error);
        alert('Failed to save notes. Please try again.');
    }
}

// Generate a random 6-digit alphanumeric code
function generateSecurityCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    
    // Ensure at least 3 letters and 3 numbers
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 3; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Shuffle the code
    return code.split('').sort(() => Math.random() - 0.5).join('');
}

// Show security code to user
function showSecurityCode(code) {
    alert(`Please save this security code: ${code}\nYou will need it to edit or delete this note later.`);
}

// Prompt for security code
function promptSecurityCode() {
    return prompt('Please enter the security code for this note:');
}

// Validate security code
function validateSecurityCode(note, enteredCode) {
    return note.securityCode === enteredCode;
}

// Initialize the app
async function init() {
    await loadNotes();
    setupEventListeners();
    // Add beforeunload event listener to handle page refresh
    window.addEventListener('beforeunload', handleBeforeUnload);
}

// Handle page refresh
async function handleBeforeUnload() {
    // Remove unsaved notes
    notes = notes.filter(note => !unsavedNotes.has(note.id));
    await saveNotes();
}

// Set up event listeners
function setupEventListeners() {
    addNoteBtn.addEventListener('click', createNewNote);
    searchInput.addEventListener('input', handleSearch);
}

// Create a new note
function createNewNote() {
    const note = {
        id: Date.now(),
        title: '',
        content: '',
        location: '',
        date: new Date().toLocaleString(),
        securityCode: null // Will be set when first saved
    };
    
    notes.unshift(note);
    unsavedNotes.add(note.id); // Mark as unsaved
    saveNotes();
    renderNotes();
    
    // Enable editing for the newly created note
    const newNote = notesContainer.firstChild;
    const titleInput = newNote.querySelector('.note-title');
    const contentTextarea = newNote.querySelector('.note-content');
    const locationInput = newNote.querySelector('.location-input');
    const saveBtn = newNote.querySelector('.save-btn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnIcon = saveBtn.querySelector('i');
    
    titleInput.readOnly = false;
    contentTextarea.readOnly = false;
    locationInput.readOnly = false;
    
    // Set button to show Save for new note
    btnText.textContent = 'Save';
    btnIcon.className = 'fas fa-save';
    saveBtn.classList.remove('saved');
    saveBtn.classList.add('editing');
}

// Render all notes
function renderNotes() {
    notesContainer.innerHTML = '';
    
    notes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesContainer.appendChild(noteElement);
    });
}

// Create a note element from template
function createNoteElement(note) {
    const noteElement = noteTemplate.content.cloneNode(true);
    const noteDiv = noteElement.querySelector('.note');
    
    // Set note data
    const titleInput = noteElement.querySelector('.note-title');
    const contentTextarea = noteElement.querySelector('.note-content');
    const dateSpan = noteElement.querySelector('.note-date');
    const locationInput = noteElement.querySelector('.location-input');
    const saveBtn = noteElement.querySelector('.save-btn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnIcon = saveBtn.querySelector('i');
    
    // Set initial values
    titleInput.value = note.title;
    contentTextarea.value = note.content;
    dateSpan.textContent = note.date;
    locationInput.value = note.location || '';
    
    // Make all fields read-only by default
    titleInput.readOnly = true;
    contentTextarea.readOnly = true;
    locationInput.readOnly = true;
    
    // Set initial button state
    btnText.textContent = 'Edit';
    btnIcon.className = 'fas fa-edit';
    saveBtn.classList.add('saved');
    
    // Save button functionality
    saveBtn.addEventListener('click', () => {
        if (titleInput.readOnly) {
            // If note has a security code, validate it
            if (note.securityCode) {
                const enteredCode = promptSecurityCode();
                if (!enteredCode || !validateSecurityCode(note, enteredCode)) {
                    alert('Invalid security code. Action cancelled.');
                    return;
                }
            }
            
            // Enable editing
            titleInput.readOnly = false;
            contentTextarea.readOnly = false;
            locationInput.readOnly = false;
            
            // Update button to show Save
            btnText.textContent = 'Save';
            btnIcon.className = 'fas fa-save';
            saveBtn.classList.remove('saved');
            saveBtn.classList.add('editing');
            
            // Mark as unsaved when editing starts
            unsavedNotes.add(note.id);
        } else {
            // Validate note content before saving
            const content = contentTextarea.value.trim();
            
            if (!content) {
                alert('Cannot save an empty note. Please add some content to your story.');
                return;
            }
            
            // Save and disable editing
            note.title = titleInput.value.trim();
            note.content = content;
            note.location = locationInput.value.trim();
            note.date = new Date().toLocaleString();
            
            // Generate and set security code if this is the first save
            if (!note.securityCode) {
                note.securityCode = generateSecurityCode();
                showSecurityCode(note.securityCode);
            }
            
            saveNotes();
            
            // Remove from unsaved notes
            unsavedNotes.delete(note.id);
            
            titleInput.readOnly = true;
            contentTextarea.readOnly = true;
            locationInput.readOnly = true;
            
            // Update button to show Edit
            btnText.textContent = 'Edit';
            btnIcon.className = 'fas fa-edit';
            saveBtn.classList.remove('editing');
            saveBtn.classList.add('saved');
        }
    });
    
    // Add delete functionality
    noteElement.querySelector('.delete-btn').addEventListener('click', () => {
        // Validate security code before deletion
        if (!note.securityCode) {
            deleteNote(note.id);
            return;
        }
        
        const enteredCode = promptSecurityCode();
        if (!enteredCode || !validateSecurityCode(note, enteredCode)) {
            alert('Invalid security code. Deletion cancelled.');
            return;
        }
        
        deleteNote(note.id);
    });
    
    return noteDiv;
}

// Delete a note
function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    unsavedNotes.delete(id); // Remove from unsaved notes if it was there
    saveNotes();
    renderNotes();
}

// Handle search functionality
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        (note.location && note.location.toLowerCase().includes(searchTerm))
    );
    
    notesContainer.innerHTML = '';
    filteredNotes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesContainer.appendChild(noteElement);
    });
}

// Initialize the app
init(); 