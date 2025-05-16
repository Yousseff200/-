// Initialize IndexedDB
let db;
const dbName = "MemoriesDB";
const dbVersion = 1;

const request = indexedDB.open(dbName, dbVersion);

request.onerror = (event) => {
    console.error("Database error:", event.target.error);
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains("memories")) {
        const store = db.createObjectStore("memories", { keyPath: "id", autoIncrement: true });
        store.createIndex("date", "date");
        store.createIndex("type", "type");
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    loadMemories();
};

// Memory Management Functions
function addMemory(memory) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["memories"], "readwrite");
        const store = transaction.objectStore("memories");
        const request = store.add(memory);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getMemories() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["memories"], "readonly");
        const store = transaction.objectStore("memories");
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteMemory(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["memories"], "readwrite");
        const store = transaction.objectStore("memories");
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Add updateMemory function
function updateMemory(id, updatedMemory) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["memories"], "readwrite");
        const store = transaction.objectStore("memories");
        const request = store.put({ ...updatedMemory, id });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Add getMemoryById function
function getMemoryById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["memories"], "readonly");
        const store = transaction.objectStore("memories");
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Download memory function
function downloadMemory(memory) {
    const link = document.createElement('a');
    link.href = memory.data;
    link.download = `${memory.title}-${new Date(memory.date).toLocaleDateString("ar-SA")}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Edit memory function
async function openEditMemoryModal(memory) {
    const modal = document.getElementById("add-memory-modal");
    const form = document.getElementById("add-memory-form");
    const title = document.getElementById("memory-title");
    const description = document.getElementById("memory-description");

    title.value = memory.title;
    description.value = memory.description || '';

    // Change form submit handler for edit
    form.onsubmit = async (e) => {
        e.preventDefault();

        const updatedMemory = {
            ...memory,
            title: title.value,
            description: description.value
        };

        try {
            await updateMemory(memory.id, updatedMemory);
            form.reset();
            closeModal("add-memory-modal");
            loadMemories();
        } catch (error) {
            console.error("Error updating memory:", error);
            alert("حدث خطأ أثناء تحديث الذكرى");
        }
    };

    modal.style.display = "block";
}

// UI Functions
function openAddMemoryModal() {
    document.getElementById("add-memory-modal").style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Close modals when clicking outside
window.onclick = (event) => {
    const modals = document.getElementsByClassName("modal");
    for (const modal of modals) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
};

// Close buttons
document.querySelectorAll(".close").forEach(closeBtn => {
    closeBtn.onclick = () => {
        const modal = closeBtn.closest(".modal");
        if (modal) {
            modal.style.display = "none";
        }
    };
});

// Add Memory Form Handler
document.getElementById("add-memory-form").onsubmit = async (e) => {
    e.preventDefault();

    const title = document.getElementById("memory-title").value;
    const description = document.getElementById("memory-description").value;
    const file = document.getElementById("memory-file").files[0];

    if (!file) {
        alert("الرجاء اختيار ملف");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const memory = {
            title,
            description,
            date: new Date().toISOString(),
            type: file.type.split("/")[0],
            data: e.target.result
        };

        try {
            await addMemory(memory);
            document.getElementById("add-memory-form").reset();
            closeModal("add-memory-modal");
            loadMemories();
        } catch (error) {
            console.error("Error adding memory:", error);
            alert("حدث خطأ أثناء حفظ الذكرى");
        }
    };

    reader.readAsDataURL(file);
};

// Load and Display Memories
async function loadMemories() {
    try {
        const memories = await getMemories();
        const container = document.getElementById("memories-container");
        container.innerHTML = "";

        memories.sort((a, b) => new Date(b.date) - new Date(a.date));

        memories.forEach(memory => {
            const card = createMemoryCard(memory);
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading memories:", error);
    }
}

function createMemoryCard(memory) {
    const card = document.createElement("div");
    card.className = "memory-card";

    const content = document.createElement("div");
    content.className = "memory-content";

    // Create media element based on type
    let mediaElement;
    switch (memory.type) {
        case "image":
            mediaElement = document.createElement("img");
            mediaElement.src = memory.data;
            break;
        case "video":
            mediaElement = document.createElement("video");
            mediaElement.src = memory.data;
            mediaElement.controls = true;
            break;
        case "audio":
            mediaElement = document.createElement("audio");
            mediaElement.src = memory.data;
            mediaElement.controls = true;
            break;
        case "application":
            mediaElement = document.createElement("embed");
            mediaElement.src = memory.data;
            mediaElement.type = "application/pdf";
            break;
    }

    const title = document.createElement("h3");
    title.className = "memory-title";
    title.textContent = memory.title;

    const date = document.createElement("div");
    date.className = "memory-date";
    date.textContent = new Date(memory.date).toLocaleDateString("ar-SA");

    // Create actions container
    const actions = document.createElement("div");
    actions.className = "memory-actions";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit-btn";
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = () => openEditMemoryModal(memory);

    // Download button
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "action-btn download-btn";
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.onclick = () => downloadMemory(memory);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn delete-btn";
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = async () => {
        if (confirm("هل أنت متأكد من حذف هذه الذكرى؟")) {
            try {
                await deleteMemory(memory.id);
                loadMemories();
            } catch (error) {
                console.error("Error deleting memory:", error);
                alert("حدث خطأ أثناء حذف الذكرى");
            }
        }
    };

    actions.appendChild(editBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);

    content.appendChild(mediaElement);
    content.appendChild(title);
    content.appendChild(date);
    card.appendChild(content);
    card.appendChild(actions);

    return card;
}

// Search and Filter Functions
document.getElementById("search").oninput = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.getElementsByClassName("memory-card");

    Array.from(cards).forEach(card => {
        const title = card.querySelector(".memory-title").textContent.toLowerCase();
        card.style.display = title.includes(searchTerm) ? "block" : "none";
    });
};

document.getElementById("type-filter").onchange = (e) => {
    const filterType = e.target.value;
    const cards = document.getElementsByClassName("memory-card");

    Array.from(cards).forEach(card => {
        const mediaElement = card.querySelector("img, video, audio, embed");
        const type = mediaElement.tagName.toLowerCase();
        
        if (filterType === "all") {
            card.style.display = "block";
        } else {
            card.style.display = type === filterType ? "block" : "none";
        }
    });
};

document.getElementById("date-filter").onchange = (e) => {
    const filterDate = new Date(e.target.value).toDateString();
    const cards = document.getElementsByClassName("memory-card");

    Array.from(cards).forEach(card => {
        const date = card.querySelector(".memory-date").textContent;
        const cardDate = new Date(date).toDateString();
        card.style.display = cardDate === filterDate ? "block" : "none";
    });
};

document.getElementById("sort-btn").onclick = () => {
    const container = document.getElementById("memories-container");
    const cards = Array.from(container.getElementsByClassName("memory-card"));
    
    cards.sort((a, b) => {
        const dateA = new Date(a.querySelector(".memory-date").textContent);
        const dateB = new Date(b.querySelector(".memory-date").textContent);
        return dateB - dateA;
    });

    container.innerHTML = "";
    cards.forEach(card => container.appendChild(card));
};

// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-links') && !e.target.closest('.mobile-menu-btn')) {
        navLinks.classList.remove('active');
    }
});

// View Switching (Grid/List)
const viewButtons = document.querySelectorAll('.view-btn');
const memoriesContainer = document.getElementById('memories-container');

viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        
        // Update active button
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update view
        memoriesContainer.className = `memories-container ${view}-view`;
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
}); 
