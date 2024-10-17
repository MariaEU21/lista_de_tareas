document.addEventListener("DOMContentLoaded", () => {
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');
    const completedTaskList = document.getElementById('completedTaskList');

    const googleAppsScriptUrl = 'https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbz3thEB6kGH4XAL688teshl31JddsJoODTLenmExu-o7cC1rT9qxeq7nI4-uiP8iTd8/exec';


    // Cargar las tareas desde Google Sheets cuando se cargue la página
    loadTasksFromGoogleSheets();

    // Enviar el formulario para agregar una nueva tarea
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskText = taskInput.value;
        const now = new Date();
        const createdAt = now.toLocaleString();

        const newTask = {
            text: taskText,
            createdAt: createdAt,
            completedAt: null,
            completedBy: null,
            observation: null
        };

        taskInput.value = '';

        // Enviar la nueva tarea a Google Sheets
        sendTaskToGoogleSheets(newTask);
    });

    // Función para renderizar las tareas en la página
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        completedTaskList.innerHTML = '';

        tasks.forEach((task, index) => {
            const taskItem = document.createElement('li');
            taskItem.classList.add(task.completedAt !== "Pendiente" ? 'completed' : '');

            taskItem.innerHTML = `
                <span>${task.text} (Creada: ${task.createdAt})</span>
                <div>
                    ${task.completedAt !== "Pendiente"
                        ? `<span>Completada por: ${task.completedBy} a las ${task.completedAt}. Observación: ${task.observation || "Ninguna"}</span>`
                        : `<button class="complete-btn" onclick="completeTask(${index})">Completar</button>`}
                </div>
            `;

            if (task.completedAt !== "Pendiente") {
                completedTaskList.appendChild(taskItem);
            } else {
                taskList.appendChild(taskItem);
            }
        });
    }

    // Función para completar una tarea
    window.completeTask = (index) => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const now = new Date();
        const name = prompt("¿Quién completó esta tarea?");
        const observation = prompt("¿Alguna observación sobre la tarea?");

        if (name) {
            tasks[index].completedAt = now.toLocaleString();
            tasks[index].completedBy = name;
            tasks[index].observation = observation;

            // Enviar actualización de tarea completada a Google Sheets
            sendTaskToGoogleSheets(tasks[index], index);

            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks(tasks);
        }
    };

    // Función para enviar la tarea a Google Sheets
    function sendTaskToGoogleSheets(task, index = null) {
        const formData = new FormData();
        formData.append('task', task.text);
        formData.append('createdAt', task.createdAt);
        formData.append('completedAt', task.completedAt || "");
        formData.append('completedBy', task.completedBy || "");
        formData.append('observation', task.observation || "");
        formData.append('index', index); // Si es actualización

        fetch(googleAppsScriptUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(result => {
            console.log(result);
            loadTasksFromGoogleSheets(); // Recargar tareas después de enviar
        })
        .catch(error => console.error('Error:', error));
    }

    // Cargar las tareas desde Google Sheets
    function loadTasksFromGoogleSheets() {
        fetch(googleAppsScriptUrl)
        .then(response => response.json())
        .then(data => {
            console.log("Datos recibidos desde Google Sheets:", data);
            const tasks = data.tasks || [];
            localStorage.setItem('tasks', JSON.stringify(tasks)); // Guardar en localStorage
            renderTasks(tasks);
        })
        .catch(error => console.error('Error al cargar las tareas:', error));
    }
});
