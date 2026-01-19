function initializeEmailJS() {
    if (window.emailjs) {
        emailjs.init({
            publicKey: "AhJw9brOVuNneu--g",
        });
        console.log("EmailJS успешно активирован");
    }
}
document.addEventListener('DOMContentLoaded', initializeEmailJS);
document.addEventListener('DOMContentLoaded', () => {
    // --- ПЕРЕМЕННЫЕ ---
    const FALLBACK_IMG = "assets/duskball.png";
    const loader = document.getElementById('loader');
    const pokeForm = document.getElementById('poke-tournament-form');
    const submitBtn = document.getElementById('send-btn');

    // --- 1. ПРЕЛОАДЕР ---
    if (loader) {
        // Используем 'load' на window, чтобы дождаться всех ресурсов
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 800);
            }, 1000);
        });
    }

    // --- 2. АНИМАЦИЯ ПРИ СКРОЛЛЕ ---
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // После активации можно перестать наблюдать за элементом
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // --- 3. ЛОГИКА АВТОПОДБОРА ИЗОБРАЖЕНИЙ ---
    const pokemonCards = document.querySelectorAll('.pokemon-slot-card');

    pokemonCards.forEach(card => {
        const id = card.dataset.id;
        const speciesInput = card.querySelector('.species-trigger');
        // Поиск через селектор атрибута надежнее, если ID динамические
        const imgElement = document.querySelector(`#poke-img-${id}`);

        if (!speciesInput || !imgElement) return;

        let timeout = null;

        const updatePokemonImage = () => {
            let name = speciesInput.value.toLowerCase().trim();
            // Очистка спецсимволов и замена пробелов на дефисы
            name = name.replace(/\s+/g, '-').replace(/[.\']/g, '');

            if (name) {
                imgElement.src = `https://img.pokemondb.net/artwork/large/${name}.jpg`;
            } else {
                imgElement.src = FALLBACK_IMG;
            }
        };

        // Обработка ошибки (Pokemon не найден)
        imgElement.onerror = () => {
            // Предотвращаем бесконечный цикл, если FALLBACK_IMG тоже отсутствует
            if (!imgElement.src.endsWith(FALLBACK_IMG)) {
                imgElement.src = FALLBACK_IMG;
            }
        };

        // Используем debounce, чтобы не спамить запросами при каждом нажатии клавиши
        speciesInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(updatePokemonImage, 500); 
        });
    });

    // --- 4. ОТПРАВКА ФОРМЫ ЧЕРЕЗ EMAILJS ---
	if (pokeForm) {
		pokeForm.addEventListener('submit', function(event) {
			event.preventDefault();

			// 1. ПРОВЕРКА ЗАГРУЗКИ БИБЛИОТЕКИ
			if (!window.emailjs) {
				alert("Ошибка: библиотека отправки не загружена. Отключите AdBlock или проверьте интернет.");
				return;
			}

			// 2. ВАЛИДАЦИЯ EMAIL
			const emailField = this.querySelector('input[name="trainer_email"]');
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailPattern.test(emailField.value.trim())) {
				alert("Пожалуйста, введите корректный адрес почты.");
				emailField.focus();
				return;
			}

			// 3. ПРОВЕРКА НА АНГЛИЙСКИЙ ЯЗЫК (кроме trainer_name)
			// Регулярное выражение разрешает: латиницу, цифры, пробелы и знаки препинания
			const englishPattern = /^[a-zA-Z0-9\s.,'!\-]*$/;
			
			// Получаем все input внутри формы
			const inputs = this.querySelectorAll('input');
			let isLanguageValid = true;

			for (let input of inputs) {
				// Пропускаем поле имени тренера
				if (input.name === 'trainer_name') continue;
				if (input.name === 'trainer_email') continue;

				const value = input.value.trim();
				if (value !== "" && !englishPattern.test(value)) {
					alert(`Поле "${input.placeholder}" заполнено некорректно. Используйте только английский язык.`);
					input.focus();
					isLanguageValid = false;
					break; 
				}
			}

			if (!isLanguageValid) return; // Прекращаем отправку, если найден русский текст

			// 4. ИНИЦИАЛИЗАЦИЯ И ОТПРАВКА
			emailjs.init('AhJw9brOVuNneu--g');

			const btn = document.getElementById('send-btn');
			const originalText = btn.innerText;
			btn.innerText = "Отправка...";
			btn.disabled = true;

			emailjs.sendForm('service_6cqznal', 'template_fsw4afi', this)
				.then(() => {
					alert('Заявка успешно отправлена! Ожидайте подтверждения по электронной почте.');
					this.reset();
					// Если у вас есть превью картинок, сбросьте их здесь
				})
				.catch((error) => {
					alert('Ошибка отправки: ' + JSON.stringify(error));
				})
				.finally(() => {
					btn.innerText = originalText;
					btn.disabled = false;
				});
		});
	}
});