let exercisesDatabase = [];
        let workouts = JSON.parse(localStorage.getItem('gym_workouts')) || [];
        let userGoals = JSON.parse(localStorage.getItem('gym_goals')) || [];

        let muscleChartInstance = null;
        let trendChartInstance = null;

        document.getElementById('workout-date').valueAsDate = new Date();
        document.getElementById('goal-date').valueAsDate = new Date(Date.now() + 7*24*60*60*1000);

        async function fetchExercises() {
            try {
                exercisesDatabase = [
                    { id: 1, name: "Bench Press", target: "Chest", equipment: "Barbell", type: "Strength", difficulty: "Medium", instructions: "Skafda yotgan holda shtangani ko'krak qafasiga tushiring va yuqoriga bosing.", met: 6 },
                    { id: 2, name: "Squats", target: "Legs", equipment: "Barbell", type: "Strength", difficulty: "Medium", instructions: "Shtangani yelkaga qo'yib, tizzalarni 90 darajagacha bukib o'tiring va qayta turing.", met: 5.5 },
                    { id: 3, name: "Deadlift", target: "Back", equipment: "Barbell", type: "Strength", difficulty: "Hard", instructions: "Oyoqlarni yelka kengligida qo'yib, yerdagi shtangani belni to'g'ri tutgan holda ko'taring.", met: 6.5 },
                    { id: 4, name: "Overhead Press", target: "Shoulders", equipment: "Barbell", type: "Strength", difficulty: "Medium", instructions: "Shtangani tik turgan holda ko'krakdan yuqoriga, bosh uzra ko'taring.", met: 5 },
                    { id: 5, name: "Bicep Curls", target: "Arms", equipment: "Dumbbells", type: "Strength", difficulty: "Easy", instructions: "Gantellarni qo'lda tutib, tirsakni bukkan holda biceps mushagini qisqartiring.", met: 3 },
                    { id: 6, name: "Treadmill Run", target: "Cardio", equipment: "Treadmill", type: "Cardio", difficulty: "Medium", instructions: "Yugurish yo'lakchasida barqaror tempda kardio mashg'ulotini bajaring.", met: 8 },
                    { id: 7, name: "Lat Pulldown", target: "Back", equipment: "Cable Machine", type: "Strength", difficulty: "Easy", instructions: "Trenajyor dastasini yuqoridan ko'krakning yuqori qismiga qarata torting.", met: 4 },
                    { id: 8, name: "Leg Press", target: "Legs", equipment: "LegPress Machine", type: "Strength", difficulty: "Medium", instructions: "Oyoq platformasini tizzalarni bukib o'zingizga yaqinlashtiring va kuch bilan bosing.", met: 5 }
                ];
                
                populateExerciseDropdown();
                renderExerciseList(exercisesDatabase);
                showInitialDetailsPlaceholder();
            } catch (error) {
                console.error("API xatolik:", error);
            }
        }

        const btn = document.getElementById("btn")
        btn.addEventListener("click", () => {
            document.body.classList.toggle("dark")
            
        })

        function populateExerciseDropdown() {
            const select = document.getElementById('workout-exercise-select');
            select.textContent = '';
            
            const defaultOpt = document.createElement('option');
            defaultOpt.value = "";
            defaultOpt.textContent = "-- Mashqni tanlang --";
            select.appendChild(defaultOpt);

            exercisesDatabase.forEach(ex => {
                const opt = document.createElement('option');
                opt.value = ex.name;
                opt.textContent = `${ex.name} (${ex.target})`;
                select.appendChild(opt);
            });
        }

        function calculateCalories(exerciseName, duration, intensity) {
            const ex = exercisesDatabase.find(e => e.name === exerciseName) || { met: 4 };
            let multiplier = 1;
            if (intensity === 'Low') multiplier = 0.8;
            if (intensity === 'High') multiplier = 1.3;
            return Math.round(ex.met * multiplier * 70 * (duration / 60));
        }

        function calculateStreak() {
            if (workouts.length === 0) return 0;
            const dates = [...new Set(workouts.map(w => w.date))].sort((a,b) => new Date(b) - new Date(a));
            let streak = 0;
            let today = new Date(); today.setHours(0,0,0,0);
            let checkDate = new Date(dates[0]); checkDate.setHours(0,0,0,0);
            if (Math.ceil(Math.abs(today - checkDate) / (1000 * 60 * 60 * 24)) > 1) return 0;

            for (let i = 0; i < dates.length; i++) {
                let current = new Date(dates[i]); current.setHours(0,0,0,0);
                if (i === 0) { streak = 1; continue; }
                let prev = new Date(dates[i-1]); prev.setHours(0,0,0,0);
                let diff = (prev - current) / (1000 * 60 * 60 * 24);
                if (diff === 1) streak++;
                else if (diff > 1) break;
            }
            return streak;
        }
        
        function updateUI() {
            renderWorkoutLogs();
            renderDashboardStats();
            renderPRs();
            renderGoals();
            initCharts();
            document.getElementById('streak-display').textContent = `${calculateStreak()} Kunlik Streak`;
        }

        function renderDashboardStats() {
            document.getElementById('stat-total-workouts').textContent = workouts.length;
            let totalEx = workouts.length;
            let totalVolume = 0;
            let totalDuration = 0;

            workouts.forEach(w => {
                totalVolume += (w.sets * w.reps * (w.weight || 0));
                totalDuration += parseInt(w.duration || 0);
            });

            document.getElementById('stat-total-exercises').textContent = totalEx;
            document.getElementById('stat-total-volume').textContent = `${totalVolume} kg`;
            document.getElementById('stat-avg-duration').textContent = workouts.length ? Math.round(totalDuration / workouts.length) + " minut" : "0 minut";
        }

        function renderWorkoutLogs() {
            const container = document.getElementById('workout-logs-container');
            container.textContent = '';

            if (workouts.length === 0) {
                const p = document.createElement('p');
                p.classList.add('text-gray-500', 'italic', 'text-center', 'py-4');
                p.textContent = "Hozircha mashg'ulotlar jurnali bo'sh.";
                container.appendChild(p);
                return;
            }

            const sortOrder = document.getElementById('sort-logs').value;
            const sorted = [...workouts].sort((a, b) => sortOrder === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));

            sorted.forEach(w => {
                const volume = w.sets * w.reps * (w.weight || 0);
                
                const card = document.createElement('div');
                card.classList.add('bg-gymDark', 'p-4', 'rounded-xl', 'border', 'border-gray-800', 'flex', 'flex-col', 'md:flex-row', 'justify-between', 'items-start', 'md:items-center', 'gap-4', 'hover:border-gray-700', 'transition');

                const infoWrapper = document.createElement('div');

                const badges = document.createElement('div');
                badges.classList.add('flex', 'items-center', 'gap-2');
                
                const dateBadge = document.createElement('span');
                dateBadge.classList.add('text-xs', 'font-bold', 'bg-gymAccent/30', 'text-purple-300', 'px-2', 'py-0.5', 'rounded-full');
                dateBadge.textContent = w.date;

                const intensityBadge = document.createElement('span');
                intensityBadge.classList.add('text-xs', 'font-bold', 'bg-gray-800', 'text-gray-300', 'px-2', 'py-0.5', 'rounded-full');
                intensityBadge.textContent = `${w.intensity} Intensity`;

                badges.appendChild(dateBadge);
                badges.appendChild(intensityBadge);

                const title = document.createElement('h3');
                title.classList.add('text-lg', 'font-bold', 'text-white', 'mt-1');
                title.textContent = w.exercise;

                const sub = document.createElement('p');
                sub.classList.add('text-sm', 'text-gray-400');
                sub.textContent = `${w.sets} sets × ${w.reps} reps ${w.weight ? '× ' + w.weight + ' kg' : ''}`;

                const meta = document.createElement('div');
                meta.classList.add('flex', 'gap-4', 'mt-2', 'text-xs', 'text-gray-500');
                
                meta.innerHTML = `<span><i class="fa-solid fa-clock mr-1"></i>${w.duration} min</span>
                                  <span><i class="fa-solid fa-dumbbell mr-1"></i>Volume: <strong>${volume} kg</strong></span>
                                  <span class="text-orange-400"><i class="fa-solid fa-fire mr-1"></i>~${w.calories} kcal</span>`;

                infoWrapper.appendChild(badges);
                infoWrapper.appendChild(title);
                infoWrapper.appendChild(sub);
                infoWrapper.appendChild(meta);

                const delBtn = document.createElement('button');
                delBtn.classList.add('text-red-500', 'hover:text-red-400', 'p-2', 'text-sm', 'bg-red-500/10', 'hover:bg-red-500/20', 'rounded-lg', 'transition', 'self-end', 'md:self-center');
                delBtn.textContent = " O'chirish";
                
                const trashIcon = document.createElement('i');
                trashIcon.classList.add('fa-solid', 'fa-trash', 'mr-1');
                delBtn.insertBefore(trashIcon);
                
                delBtn.onclick = () => deleteWorkout(w.id);

                card.appendChild(infoWrapper);
                card.appendChild(delBtn);
                container.appendChild(card);
            });
        }

        function renderPRs() {
            const container = document.getElementById('pr-container');
            container.textContent = '';
            const prs = {};

            workouts.forEach(w => {
                if (w.weight) {
                    if (!prs[w.exercise] || prs[w.exercise].weight < w.weight) {
                        prs[w.exercise] = { weight: w.weight, date: w.date };
                    }
                }
            });

            const keys = Object.keys(prs);
            if (keys.length === 0) {
                const p = document.createElement('p');
                p.classList.add('text-gray-500', 'text-sm', 'italic');
                p.textContent = "Hozircha PR o'rnatilmagan.";
                container.appendChild(p);
                return;
            }

            keys.forEach(exName => {
                const item = prs[exName];
                const div = document.createElement('div');
                div.classList.add('flex', 'justify-between', 'items-center', 'bg-gymDark/60', 'p-2.5', 'rounded-xl', 'border', 'border-yellow-500/20');

                const left = document.createElement('div');
                const pName = document.createElement('p');
                pName.classList.add('text-sm', 'font-bold', 'text-white');
                pName.textContent = exName;
                const pDate = document.createElement('p');
                pDate.classList.add('text-xs', 'text-gray-400');
                pDate.textContent = item.date;
                left.appendChild(pName);
                left.appendChild(pDate);

                const badge = document.createElement('div');
                badge.classList.add('flex', 'items-center', 'gap-1.5', 'bg-yellow-500/10', 'text-yellow-400', 'px-2', 'py-1', 'rounded-lg', 'text-xs', 'font-black');
                badge.textContent = ` ${item.weight} kg`;
                const medal = document.createElement('i');
                medal.classList.add('fa-solid', 'fa-medal');
                badge.prepend(medal);

                div.appendChild(left);
                div.appendChild(badge);
                container.appendChild(div);
            });
        }

        function renderExerciseList(data) {
            const container = document.getElementById('api-exercises-list');
            container.textContent = '';

            if (data.length === 0) {
                const p = document.createElement('p');
                p.classList.add('text-gray-500', 'text-xs', 'italic', 'text-center', 'py-2');
                p.textContent = "Mashq topilmadi.";
                container.appendChild(p);
                return;
            }

            data.forEach(ex => {
                const btn = document.createElement('button');
                btn.classList.add('w-full', 'text-left', 'bg-gymDark/40', 'p-2', 'rounded-lg', 'text-sm', 'border', 'border-gray-800', 'hover:border-gymNeon/40', 'transition', 'flex', 'justify-between', 'items-center', 'text-gray-300');
                btn.onclick = () => showExerciseDetails(ex.id);

                const spanName = document.createElement('span');
                spanName.textContent = ex.name;

                const spanTarget = document.createElement('span');
                spanTarget.classList.add('text-xs', 'bg-gray-800', 'text-gray-400', 'px-2', 'py-0.5', 'rounded');
                spanTarget.textContent = ex.target;

                btn.appendChild(spanName);
                btn.appendChild(spanTarget);
                container.appendChild(btn);
            });
        }

        function showInitialDetailsPlaceholder() {
            const panel = document.getElementById('exercise-details-panel');
            panel.textContent = '';
            const p = document.createElement('p');
            p.classList.add('text-gray-400', 'italic', 'text-center', 'my-auto');
            p.textContent = "Tafsilotlarini ko'rish uchun biror mashqni tanlang.";
            panel.appendChild(p);
        }

        function showExerciseDetails(id) {
            const ex = exercisesDatabase.find(e => e.id === id);
            const panel = document.getElementById('exercise-details-panel');
            if (!ex) return;

            panel.textContent = '';

            const wrapper = document.createElement('div');
            wrapper.classList.add('space-y-2');

            const h3 = document.createElement('h3');
            h3.classList.add('text-md', 'font-black', 'text-gymNeon', 'uppercase', 'tracking-wide');
            h3.textContent = ex.name;
            wrapper.appendChild(h3);

            const grid = document.createElement('div');
            grid.classList.add('grid', 'grid-cols-2', 'gap-2', 'text-xs');

            const specs = [
                { l: "Target", v: ex.target },
                { l: "Equip", v: ex.equipment },
                { l: "Type", v: ex.type },
                { l: "Difficulty", v: ex.difficulty }
            ];

            specs.forEach(s => {
                const sp = document.createElement('span');
                sp.classList.add('bg-gray-800', 'p-1.5', 'rounded', 'text-gray-300');
                sp.textContent = `${s.l}: ${s.v}`;
                grid.appendChild(sp);
            });
            wrapper.appendChild(grid);

            const desc = document.createElement('p');
            desc.classList.add('text-xs', 'text-gray-400', 'mt-2', 'bg-gymDark/50', 'p-2', 'rounded', 'border', 'border-gray-800', 'leading-relaxed');
            desc.textContent = `Ko'rsatma: ${ex.instructions}`;
            wrapper.appendChild(desc);

            const formBtn = document.createElement('button');
            formBtn.classList.add('w-full', 'mt-4', 'bg-gray-800', 'hover:bg-gray-700', 'text-white', 'text-xs', 'py-1.5', 'rounded-lg', 'transition', 'font-bold');
            formBtn.textContent = "Formaga joylash";
            formBtn.onclick = () => { document.getElementById('workout-exercise-select').value = ex.name; };

            panel.appendChild(wrapper);
            panel.appendChild(formBtn);
        }

        function renderGoals() {
            const container = document.getElementById('goals-container');
            container.textContent = '';

            if (userGoals.length === 0) {
                const p = document.createElement('p');
                p.classList.add('text-gray-500', 'text-xs', 'italic');
                p.textContent = "Maqsadlar belgilanmagan.";
                container.appendChild(p);
                return;
            }

            userGoals.forEach((g, idx) => {
                const div = document.createElement('div');
                div.classList.add('bg-gymDark/50', 'p-3', 'rounded-xl', 'border', 'border-gray-800', 'text-xs', 'space-y-1');

                const top = document.createElement('div');
                top.classList.add('flex', 'justify-between', 'font-bold', 'text-white');
                const sTitle = document.createElement('span'); sTitle.textContent = g.title;
                const sTarget = document.createElement('span'); sTarget.classList.add('text-blue-400'); sTarget.textContent = `${g.target} kg`;
                top.appendChild(sTitle); top.appendChild(sTarget);

                const btm = document.createElement('div');
                btm.classList.add('flex', 'justify-between', 'text-[10px]', 'text-gray-500');
                const sDate = document.createElement('span'); sDate.textContent = `Muddati: ${g.date}`;
                const dBtn = document.createElement('button'); dBtn.classList.add('text-red-400', 'hover:underline'); dBtn.textContent = "O'chirish";
                dBtn.onclick = () => deleteGoal(idx);
                btm.appendChild(sDate); btm.appendChild(dBtn);

                div.appendChild(top);
                div.appendChild(btm);
                container.appendChild(div);
            });
        }
        function initCharts() {
            const ctxMuscle = document.getElementById('muscleChart').getContext('2d');
            const muscleCounts = {};
            workouts.forEach(w => {
                const ex = exercisesDatabase.find(e => e.name === w.exercise);
                const m = ex ? ex.target : 'Boshqa';
                muscleCounts[m] = (muscleCounts[m] || 0) + 1;
            });

            if (muscleChartInstance) muscleChartInstance.destroy();
            muscleChartInstance = new Chart(ctxMuscle, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(muscleCounts),
                    datasets: [{
                        data: Object.values(muscleCounts),
                        backgroundColor: ['#00F5D4', '#7B2CBF', '#FF007F', '#FFB703', '#3A86FF', '#8AC926'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#9CA3AF', font: { size: 11 } } } }
                }
            });

            const ctxTrend = document.getElementById('trendChart').getContext('2d');
            const sorted = [...workouts].filter(w => w.weight > 0).sort((a,b) => new Date(a.date) - new Date(b.date));
            const timelineLabels = [];
            const timelineData = [];

            sorted.forEach(w => {
                if(!timelineLabels.includes(w.date)) {
                    timelineLabels.push(w.date);
                    const dayWeights = sorted.filter(x => x.date === w.date).map(x => x.weight);
                    timelineData.push(Math.max(...dayWeights));
                }
            });

            if (trendChartInstance) trendChartInstance.destroy();
            trendChartInstance = new Chart(ctxTrend, {
                type: 'line',
                data: {
                    labels: timelineLabels.slice(-10),
                    datasets: [{
                        label: 'Max Weight',
                        data: timelineData.slice(-10),
                        borderColor: '#7B2CBF',
                        backgroundColor: 'rgba(123, 44, 191, 0.2)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 3,
                        pointBackgroundColor: '#00F5D4'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { color: '#1F2937' }, ticks: { color: '#9CA3AF' } },
                        y: { grid: { color: '#1F2937' }, ticks: { color: '#9CA3AF' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
        document.getElementById('workout-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const exercise = document.getElementById('workout-exercise-select').value;
            const date = document.getElementById('workout-date').value;
            const duration = document.getElementById('workout-duration').value;
            const intensity = document.getElementById('workout-intensity').value;
            const sets = parseInt(document.getElementById('workout-sets').value);
            const reps = parseInt(document.getElementById('workout-reps').value);
            const weight = parseInt(document.getElementById('workout-weight').value) || 0;

            if(!exercise) return alert("Mashqni tanlang.");

            workouts.push({
                id: Date.now().toString(),
                exercise, date, duration, intensity, sets, reps, weight,
                calories: calculateCalories(exercise, duration, intensity)
            });

            localStorage.setItem('gym_workouts', JSON.stringify(workouts));
            document.getElementById('workout-sets').value = '';
            document.getElementById('workout-reps').value = '';
            document.getElementById('workout-weight').value = '';
            updateUI();
        });

        function deleteWorkout(id) {
            workouts = workouts.filter(w => w.id !== id);
            localStorage.setItem('gym_workouts', JSON.stringify(workouts));
            updateUI();
        }

        document.getElementById('goal-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const title = document.getElementById('goal-title').value;
            const target = document.getElementById('goal-target').value;
            const date = document.getElementById('goal-date').value;
            userGoals.push({ title, target, date });
            localStorage.setItem('gym_goals', JSON.stringify(userGoals));
            document.getElementById('goal-title').value = '';
            document.getElementById('goal-target').value = '';
            renderGoals();
        });

        function deleteGoal(idx) {
            userGoals.splice(idx, 1);
            localStorage.setItem('gym_goals', JSON.stringify(userGoals));
            renderGoals();
        }

        function filterExercises() {
            const query = document.getElementById('search-input').value.toLowerCase();
            const selectedMuscle = document.getElementById('filter-muscle').value;
            const filtered = exercisesDatabase.filter(ex => {
                return ex.name.toLowerCase().includes(query) && (selectedMuscle === "" || ex.target === selectedMuscle);
            });
            renderExerciseList(filtered);
        }

        document.getElementById('search-input').addEventListener('input', filterExercises);
        document.getElementById('filter-muscle').addEventListener('change', filterExercises);
        document.getElementById('sort-logs').addEventListener('change', renderWorkoutLogs);

        window.addEventListener('DOMContentLoaded', () => {
            fetchExercises();
            updateUI();
        });