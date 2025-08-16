// Livestock Treatment Log - Main JavaScript File
// Data Storage and Management System

class LivestockApp {
    constructor() {
        this.animals = JSON.parse(localStorage.getItem('livestock_animals') || '[]');
        this.treatments = JSON.parse(localStorage.getItem('livestock_treatments') || '[]');
        this.feeding = JSON.parse(localStorage.getItem('livestock_feeding') || '[]');
        this.breeding = JSON.parse(localStorage.getItem('livestock_breeding') || '[]');
        
        this.currentSection = 'dashboard';
        this.editingAnimal = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderAnimals();
        this.renderTreatments();
        this.renderFeeding();
        this.renderBreeding();
        this.setupOfflineDetection();
        this.handleURLActions();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Animal Management
        document.getElementById('addAnimalBtn').addEventListener('click', () => this.showAnimalModal());
        document.getElementById('cancelAnimalBtn').addEventListener('click', () => this.hideAnimalModal());
        document.getElementById('animalForm').addEventListener('submit', (e) => this.saveAnimal(e));

        // Treatment Management
        document.getElementById('addTreatmentBtn').addEventListener('click', () => this.showTreatmentModal());
        document.getElementById('cancelTreatmentBtn').addEventListener('click', () => this.hideTreatmentModal());
        document.getElementById('treatmentForm').addEventListener('submit', (e) => this.saveTreatment(e));

        // Feeding Management
        document.getElementById('addFeedingBtn').addEventListener('click', () => this.showFeedingModal());
        document.getElementById('cancelFeedingBtn').addEventListener('click', () => this.hideFeedingModal());
        document.getElementById('feedingForm').addEventListener('submit', (e) => this.saveFeeding(e));

        // Breeding Management
        document.getElementById('addBreedingBtn').addEventListener('click', () => this.showBreedingModal());
        document.getElementById('cancelBreedingBtn').addEventListener('click', () => this.hideBreedingModal());
        document.getElementById('breedingForm').addEventListener('submit', (e) => this.saveBreeding(e));

        // Filters
        document.getElementById('treatmentFilter').addEventListener('change', () => this.renderTreatments());
        document.getElementById('animalFilter').addEventListener('change', () => this.renderTreatments());
        document.getElementById('dateFilter').addEventListener('change', () => this.renderTreatments());

        // Modal close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;

        // Update data when switching sections
        if (section === 'dashboard') {
            this.updateDashboard();
        }
    }

    // Animal Management
    showAnimalModal(animal = null) {
        this.editingAnimal = animal;
        const modal = document.getElementById('animalModal');
        const title = document.getElementById('animalModalTitle');
        const form = document.getElementById('animalForm');

        if (animal) {
            title.textContent = 'Edit Animal';
            document.getElementById('animalName').value = animal.name || '';
            document.getElementById('animalType').value = animal.type || '';
            document.getElementById('animalBreed').value = animal.breed || '';
            document.getElementById('animalBirthDate').value = animal.birthDate || '';
            document.getElementById('animalGender').value = animal.gender || '';
            document.getElementById('animalWeight').value = animal.weight || '';
            document.getElementById('animalNotes').value = animal.notes || '';
        } else {
            title.textContent = 'Add New Animal';
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    hideAnimalModal() {
        document.getElementById('animalModal').classList.add('hidden');
        this.editingAnimal = null;
    }

    saveAnimal(e) {
        e.preventDefault();
        
        const animalData = {
            id: this.editingAnimal ? this.editingAnimal.id : Date.now().toString(),
            name: document.getElementById('animalName').value,
            type: document.getElementById('animalType').value,
            breed: document.getElementById('animalBreed').value,
            birthDate: document.getElementById('animalBirthDate').value,
            gender: document.getElementById('animalGender').value,
            weight: parseFloat(document.getElementById('animalWeight').value) || null,
            notes: document.getElementById('animalNotes').value,
            status: 'healthy',
            createdAt: this.editingAnimal ? this.editingAnimal.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingAnimal) {
            const index = this.animals.findIndex(a => a.id === this.editingAnimal.id);
            this.animals[index] = animalData;
            this.showAlert('Animal updated successfully!', 'success');
        } else {
            this.animals.push(animalData);
            this.showAlert('Animal added successfully!', 'success');
        }

        this.saveData();
        this.hideAnimalModal();
        this.renderAnimals();
        this.updateDashboard();
        this.updateAnimalSelects();
    }

    deleteAnimal(id) {
        if (confirm('Are you sure you want to delete this animal? This will also delete all related records.')) {
            this.animals = this.animals.filter(a => a.id !== id);
            this.treatments = this.treatments.filter(t => t.animalId !== id);
            this.feeding = this.feeding.filter(f => f.animalId !== id);
            this.breeding = this.breeding.filter(b => b.femaleId !== id && b.maleId !== id);
            
            this.saveData();
            this.renderAnimals();
            this.updateDashboard();
            this.updateAnimalSelects();
            this.showAlert('Animal and related records deleted successfully!', 'success');
        }
    }

    renderAnimals() {
        const grid = document.getElementById('animalsGrid');
        
        if (this.animals.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-400">
                    <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p class="text-lg mb-2">No animals added yet</p>
                    <p class="text-sm">Click "Add Animal" to get started</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.animals.map(animal => {
            const age = animal.birthDate ? this.calculateAge(animal.birthDate) : 'Unknown';
            const statusColor = this.getStatusColor(animal.status);
            
            return `
                <div class="card animal-card p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-semibold">${animal.name}</h3>
                            <p class="text-gray-400">${animal.type} ${animal.breed ? `• ${animal.breed}` : ''}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="app.showAnimalModal(${JSON.stringify(animal).replace(/"/g, '&quot;')})" 
                                    class="text-blue-400 hover:text-blue-300">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button onclick="app.deleteAnimal('${animal.id}')" 
                                    class="text-red-400 hover:text-red-300">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Age:</span>
                            <span>${age}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Gender:</span>
                            <span class="capitalize">${animal.gender || 'Unknown'}</span>
                        </div>
                        ${animal.weight ? `
                            <div class="flex justify-between">
                                <span class="text-gray-400">Weight:</span>
                                <span>${animal.weight} kg</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Status:</span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium text-white ${statusColor}">
                                ${animal.status || 'healthy'}
                            </span>
                        </div>
                    </div>
                    
                    ${animal.notes ? `
                        <div class="mt-4 p-3 bg-gray-800 rounded-lg">
                            <p class="text-sm text-gray-300">${animal.notes}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // Treatment Management
    showTreatmentModal() {
        const modal = document.getElementById('treatmentModal');
        const form = document.getElementById('treatmentForm');
        
        form.reset();
        document.getElementById('treatmentDate').value = new Date().toISOString().slice(0, 16);
        this.updateAnimalSelects();
        
        modal.classList.remove('hidden');
    }

    hideTreatmentModal() {
        document.getElementById('treatmentModal').classList.add('hidden');
    }

    saveTreatment(e) {
        e.preventDefault();
        
        const treatmentData = {
            id: Date.now().toString(),
            animalId: document.getElementById('treatmentAnimal').value,
            type: document.getElementById('treatmentType').value,
            name: document.getElementById('treatmentName').value,
            date: document.getElementById('treatmentDate').value,
            dosage: document.getElementById('treatmentDosage').value,
            veterinarian: document.getElementById('treatmentVet').value,
            cost: parseFloat(document.getElementById('treatmentCost').value) || null,
            notes: document.getElementById('treatmentNotes').value,
            createdAt: new Date().toISOString()
        };

        this.treatments.push(treatmentData);
        this.saveData();
        this.hideTreatmentModal();
        this.renderTreatments();
        this.updateDashboard();
        this.showAlert('Treatment record added successfully!', 'success');
    }

    deleteTreatment(id) {
        if (confirm('Are you sure you want to delete this treatment record?')) {
            this.treatments = this.treatments.filter(t => t.id !== id);
            this.saveData();
            this.renderTreatments();
            this.updateDashboard();
            this.showAlert('Treatment record deleted successfully!', 'success');
        }
    }

    renderTreatments() {
        const container = document.getElementById('treatmentsList');
        let filteredTreatments = [...this.treatments];

        // Apply filters
        const typeFilter = document.getElementById('treatmentFilter').value;
        const animalFilter = document.getElementById('animalFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        if (typeFilter) {
            filteredTreatments = filteredTreatments.filter(t => t.type === typeFilter);
        }
        if (animalFilter) {
            filteredTreatments = filteredTreatments.filter(t => t.animalId === animalFilter);
        }
        if (dateFilter) {
            filteredTreatments = filteredTreatments.filter(t => 
                t.date.startsWith(dateFilter)
            );
        }

        // Sort by date (newest first)
        filteredTreatments.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredTreatments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <p class="text-lg mb-2">No treatment records found</p>
                    <p class="text-sm">Add your first treatment record to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTreatments.map(treatment => {
            const animal = this.animals.find(a => a.id === treatment.animalId);
            const animalName = animal ? animal.name : 'Unknown Animal';
            const treatmentClass = `treatment-${treatment.type}`;
            
            return `
                <div class="card p-6 ${treatmentClass}">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-lg font-semibold">${treatment.name}</h3>
                            <p class="text-gray-400">${animalName} • ${this.formatDate(treatment.date)}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white capitalize">
                                ${treatment.type}
                            </span>
                            <button onclick="app.deleteTreatment('${treatment.id}')" 
                                    class="text-red-400 hover:text-red-300">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        ${treatment.dosage ? `
                            <div>
                                <span class="text-gray-400">Dosage:</span>
                                <span class="ml-2">${treatment.dosage}</span>
                            </div>
                        ` : ''}
                        ${treatment.veterinarian ? `
                            <div>
                                <span class="text-gray-400">Veterinarian:</span>
                                <span class="ml-2">${treatment.veterinarian}</span>
                            </div>
                        ` : ''}
                        ${treatment.cost ? `
                            <div>
                                <span class="text-gray-400">Cost:</span>
                                <span class="ml-2">$${treatment.cost.toFixed(2)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${treatment.notes ? `
                        <div class="mt-4 p-3 bg-gray-800 rounded-lg">
                            <p class="text-sm text-gray-300">${treatment.notes}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // Feeding Management
    showFeedingModal() {
        const modal = document.getElementById('feedingModal');
        const form = document.getElementById('feedingForm');
        
        form.reset();
        document.getElementById('feedingTime').value = new Date().toISOString().slice(0, 16);
        this.updateAnimalSelects();
        
        modal.classList.remove('hidden');
    }

    hideFeedingModal() {
        document.getElementById('feedingModal').classList.add('hidden');
    }

    saveFeeding(e) {
        e.preventDefault();
        
        const feedingData = {
            id: Date.now().toString(),
            animalId: document.getElementById('feedingAnimal').value,
            feedType: document.getElementById('feedType').value,
            amount: parseFloat(document.getElementById('feedAmount').value),
            time: document.getElementById('feedingTime').value,
            notes: document.getElementById('feedingNotes').value,
            createdAt: new Date().toISOString()
        };

        this.feeding.push(feedingData);
        this.saveData();
        this.hideFeedingModal();
        this.renderFeeding();
        this.showAlert('Feeding record added successfully!', 'success');
    }

    deleteFeeding(id) {
        if (confirm('Are you sure you want to delete this feeding record?')) {
            this.feeding = this.feeding.filter(f => f.id !== id);
            this.saveData();
            this.renderFeeding();
            this.showAlert('Feeding record deleted successfully!', 'success');
        }
    }

    renderFeeding() {
        const container = document.getElementById('feedingList');
const sortedFeeding = [...this.feeding].sort((a, b) => new Date(b.time) -