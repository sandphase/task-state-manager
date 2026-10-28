// LocalStorage-backed DB keys for resilient client-side operation
const KEY_PROFILES = 'sirius_db_profiles';
const KEY_TASKS = 'sirius_db_tasks';
const KEY_TEMPLATES = 'sirius_db_templates';

// Remote API check (only for local HTTP development, not HTTPS production)
const REMOTE_API = (typeof window !== 'undefined' && window.location.protocol === 'http:' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:8080'
    : null;

function getTodayString(offsetDays = 0) {
    const d = new Date(Date.now() + offsetDays * 86400000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function initLocalDatabase() {
    if (!localStorage.getItem(KEY_PROFILES)) {
        const defaultProfiles = [
            { id: 1, name: 'NullPhase', icon: 'zap' }
        ];
        localStorage.setItem(KEY_PROFILES, JSON.stringify(defaultProfiles));
    }

    if (!localStorage.getItem(KEY_TASKS)) {
        const todayStr = getTodayString(0);
        const tomStr = getTodayString(1);
        const nextWeekStr = getTodayString(7);

        const defaultTasks = [
            {
                id: 1,
                profileId: 1,
                parentId: null,
                title: "Inicializar núcleo de telemetría cuántica",
                subject: "Infraestructura",
                description: "Verificar sincronización determinista de estados y persistencia en tiempo real.",
                priority: "high",
                status: "done",
                dueDate: todayStr,
                reminder: null,
                notes: "Módulos de telemetría cargados a 60 FPS."
            },
            {
                id: 2,
                profileId: 1,
                parentId: null,
                title: "Auditoría de seguridad Zero-Knowledge",
                subject: "Ciberseguridad",
                description: "Garantizar criptografía client-side sin fugas de datos hacia redes externas.",
                priority: "high",
                status: "pending",
                dueDate: todayStr,
                reminder: "on_due_date",
                notes: "Algoritmos SHA-256 validados."
            },
            {
                id: 3,
                profileId: 1,
                parentId: null,
                title: "Optimizar transiciones de estado de la nave",
                subject: "Física FSM",
                description: "Garantizar ciclo Staged -> Active -> Completed sin latencia de renderizado.",
                priority: "medium",
                status: "pending",
                dueDate: tomStr,
                reminder: null,
                notes: "Respuesta táctica < 1ms."
            },
            {
                id: 4,
                profileId: 1,
                parentId: null,
                title: "Sincronización de telemetría interdimensional",
                subject: "Frontend",
                description: "Conectar endpoints reactivos con fallback de proxies en tiempo real.",
                priority: "low",
                status: "pending",
                dueDate: nextWeekStr,
                reminder: null,
                notes: "Latencia de canal verificada."
            }
        ];
        localStorage.setItem(KEY_TASKS, JSON.stringify(defaultTasks));
    }

    if (!localStorage.getItem(KEY_TEMPLATES)) {
        const defaultTemplates = [
            {
                id: 1,
                name: "Protocolo de Despliegue",
                items: [
                    { title: "Linting & Type Check", subject: "QA", priority: "high" },
                    { title: "Build de contenedor Docker", subject: "DevOps", priority: "high" },
                    { title: "Verificación de endpoints TLS/SSL", subject: "Seguridad", priority: "medium" }
                ]
            },
            {
                id: 2,
                name: "Rutina Matutina de Operaciones",
                items: [
                    { title: "Revisión de alertas de telemetría", subject: "Monitoreo", priority: "high" },
                    { title: "Sincronización de repositorios remotos", subject: "Git", priority: "medium" },
                    { title: "Actualización de dependencias críticas", subject: "Mantenimiento", priority: "low" }
                ]
            }
        ];
        localStorage.setItem(KEY_TEMPLATES, JSON.stringify(defaultTemplates));
    }
}

function getLocalCollection(key) {
    initLocalDatabase();
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveLocalCollection(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

export const api = {
    // ---- PROFILES ----
    async getProfiles() {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/profiles`, { signal: ctrl.signal });
                clearTimeout(tid);
                if (res.ok) return await res.json();
            } catch {
                // fallback to local
            }
        }
        return getLocalCollection(KEY_PROFILES);
    },

    async addProfile(profile) {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/profiles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profile),
                    signal: ctrl.signal
                });
                clearTimeout(tid);
                if (res.ok) return await res.json();
            } catch {
                // fallback to local
            }
        }
        const profiles = getLocalCollection(KEY_PROFILES);
        const newProfile = {
            id: Date.now(),
            name: profile.name,
            icon: profile.icon || 'user'
        };
        profiles.push(newProfile);
        saveLocalCollection(KEY_PROFILES, profiles);
        return { status: 'success', id: newProfile.id, ...newProfile };
    },

    async deleteProfile(id) {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/profiles/${id}`, { method: 'DELETE', signal: ctrl.signal });
                clearTimeout(tid);
                if (res.ok) return { status: 'success' };
            } catch {
                // fallback to local
            }
        }
        const profiles = getLocalCollection(KEY_PROFILES).filter(p => Number(p.id) !== Number(id));
        saveLocalCollection(KEY_PROFILES, profiles);
        const tasks = getLocalCollection(KEY_TASKS).filter(t => Number(t.profileId) !== Number(id));
        saveLocalCollection(KEY_TASKS, tasks);
        return { status: 'success' };
    },

    // ---- TASKS ----
    async getTasks(profileId) {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const url = profileId ? `${REMOTE_API}/tasks?profileId=${profileId}` : `${REMOTE_API}/tasks`;
                const res = await fetch(url, { signal: ctrl.signal });
                clearTimeout(tid);
                if (res.ok) return await res.json();
            } catch {
                // fallback to local
            }
        }
        const tasks = getLocalCollection(KEY_TASKS);
        if (profileId) {
            return tasks.filter(t => Number(t.profileId) === Number(profileId));
        }
        return tasks;
    },

    async addTask(task) {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task),
                    signal: ctrl.signal
                });
                clearTimeout(tid);
                if (res.ok) return await res.json();
            } catch {
                // fallback to local
            }
        }
        const tasks = getLocalCollection(KEY_TASKS);
        const newTask = {
            id: Date.now(),
            profileId: task.profileId ? Number(task.profileId) : 1,
            parentId: task.parentId ? Number(task.parentId) : null,
            title: String(task.title || '').trim(),
            subject: String(task.subject || 'General').trim(),
            description: String(task.description || '').trim(),
            priority: task.priority || 'medium',
            status: task.status || 'pending',
            dueDate: task.dueDate || getTodayString(0),
            reminder: task.reminder || null,
            notes: task.notes || ''
        };
        tasks.push(newTask);
        saveLocalCollection(KEY_TASKS, tasks);
        return { status: 'success', id: newTask.id, ...newTask };
    },

    async updateTask(task) {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/tasks/${task.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task),
                    signal: ctrl.signal
                });
                clearTimeout(tid);
                if (res.ok) return await res.json();
            } catch {
                // fallback to local
            }
        }
        const tasks = getLocalCollection(KEY_TASKS);
        const index = tasks.findIndex(t => Number(t.id) === Number(task.id));
        if (index !== -1) {
            tasks[index] = {
                ...tasks[index],
                ...task,
                id: Number(task.id),
                profileId: task.profileId ? Number(task.profileId) : tasks[index].profileId,
                parentId: task.parentId ? Number(task.parentId) : tasks[index].parentId
            };
            saveLocalCollection(KEY_TASKS, tasks);
        }
        return { status: 'success' };
    },

    async deleteTask(id) {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/tasks/${id}`, { method: 'DELETE', signal: ctrl.signal });
                clearTimeout(tid);
                if (res.ok) return { status: 'success' };
            } catch {
                // fallback to local
            }
        }
        let tasks = getLocalCollection(KEY_TASKS);
        tasks = tasks.filter(t => Number(t.id) !== Number(id) && Number(t.parentId) !== Number(id));
        saveLocalCollection(KEY_TASKS, tasks);
        return { status: 'success' };
    },

    // ---- TEMPLATES ----
    async getTemplates() {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/templates`, { signal: ctrl.signal });
                clearTimeout(tid);
                if (res.ok) return await res.json();
            } catch {
                // fallback to local
            }
        }
        return getLocalCollection(KEY_TEMPLATES);
    },

    async createTemplate(template) {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/templates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(template),
                    signal: ctrl.signal
                });
                clearTimeout(tid);
                if (res.ok) return await res.json();
            } catch {
                // fallback to local
            }
        }
        const templates = getLocalCollection(KEY_TEMPLATES);
        const newTemplate = {
            id: Date.now(),
            name: template.name,
            items: template.items || []
        };
        templates.push(newTemplate);
        saveLocalCollection(KEY_TEMPLATES, templates);
        return { status: 'success', id: newTemplate.id, ...newTemplate };
    },

    async applyTemplate(templateId, profileId) {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/templates/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ templateId, profileId }),
                    signal: ctrl.signal
                });
                clearTimeout(tid);
                if (res.ok) return await res.json();
            } catch {
                // fallback to local
            }
        }
        const templates = getLocalCollection(KEY_TEMPLATES);
        const template = templates.find(t => Number(t.id) === Number(templateId));
        if (!template) throw new Error('Plantilla no encontrada');

        const tasks = getLocalCollection(KEY_TASKS);
        const todayStr = getTodayString(0);
        const baseId = Date.now();

        (template.items || []).forEach((item, idx) => {
            tasks.push({
                id: baseId + idx + 1,
                profileId: profileId ? Number(profileId) : 1,
                parentId: null,
                title: item.title,
                subject: item.subject || 'Rutina',
                description: `Generado desde plantilla: ${template.name}`,
                priority: item.priority || 'medium',
                status: 'pending',
                dueDate: todayStr,
                reminder: null,
                notes: ''
            });
        });
        saveLocalCollection(KEY_TASKS, tasks);
        return { status: 'success' };
    },

    async deleteTemplate(id) {
        if (REMOTE_API) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1000);
                const res = await fetch(`${REMOTE_API}/templates/${id}`, { method: 'DELETE', signal: ctrl.signal });
                clearTimeout(tid);
                if (res.ok) return { status: 'success' };
            } catch {
                // fallback to local
            }
        }
        const templates = getLocalCollection(KEY_TEMPLATES).filter(t => Number(t.id) !== Number(id));
        saveLocalCollection(KEY_TEMPLATES, templates);
        return { status: 'success' };
    }
};
