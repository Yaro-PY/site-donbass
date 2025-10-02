document.documentElement.classList.add('js-enabled');
const startButton = document.getElementById('startButton');
const missionIntro = document.getElementById('missionIntro');
const missionCards = document.querySelectorAll('.mission-card');
const historyMission = document.getElementById('historyMission');
const cultureMission = document.getElementById('cultureMission');
const ecoMission = document.getElementById('ecoMission');
const finalBrief = document.getElementById('finalBrief');

const scoreSpan = document.getElementById('score');
const missionStatus = document.getElementById('missionStatus');
const progressBar = document.querySelector('.progress');
const progressFill = document.getElementById('progressFill');
const factButton = document.getElementById('factButton');
const factText = document.getElementById('factText');
const restartButton = document.getElementById('restartButton');

const historyEventsContainer = document.getElementById('historyEvents');
const historyFeedback = document.getElementById('historyFeedback');
const historyReset = document.getElementById('historyReset');
const historyComplete = document.getElementById('historyComplete');

const cultureForm = document.getElementById('cultureForm');
const cultureFeedback = document.getElementById('cultureFeedback');

const ecoForm = document.getElementById('ecoForm');
const ecoFeedback = document.getElementById('ecoFeedback');

const finalSummary = document.getElementById('finalSummary');
const missionBackButtons = document.querySelectorAll('.mission-back');

const galleryViewport = document.querySelector('.gallery__viewport');
const galleryTrack = document.querySelector('.gallery__track');
const galleryItems = document.querySelectorAll('.gallery__item');
const galleryPrev = document.querySelector(
    '.gallery__control[data-direction="prev"]'
);
const galleryNext = document.querySelector(
    '.gallery__control[data-direction="next"]'
);
const galleryModal = document.querySelector('.gallery-modal');
const galleryModalImage = document.querySelector('.gallery-modal__image');
const galleryModalCaption = document.querySelector('.gallery-modal__caption');
const galleryModalClose = document.querySelector('.gallery-modal__close');

const missionCardsMap = {
    history: historyMission,
    culture: cultureMission,
    eco: ecoMission,
};

const expeditionData = window.EXPEDITION_DATA || {};

const missionTitles = expeditionData.missionTitles || {
    intro: 'План подорожі',
    history: 'Історична експедиція',
    culture: 'Культурний маршрут',
    eco: 'Екологічний челендж',
    final: 'Фінальний брифінг',
};

const facts = Array.isArray(expeditionData.facts) ? expeditionData.facts : [];
const historyEvents = Array.isArray(expeditionData.historyEvents)
    ? expeditionData.historyEvents
    : [];

const cultureAnswers = expeditionData.cultureAnswers || {
    monastery: 'sviatohirsk',
    craft: 'salt',
    poet: 'sosura',
    theatre: 'donetsk',
    museum: 'donetsk',
    tradition: 'wedding',
};
const ecoAnswers = expeditionData.ecoAnswers || {
    river: 'siversky',
    forest: 'oak',
    chalk: 'flora',
    reserve: 'kamyani',
    animal: 'saiga',
    lake: 'slovyansk',
};

const missionState = {
    history: { completed: false, bestScore: 0 },
    culture: { completed: false, bestScore: 0 },
    eco: { completed: false, bestScore: 0 },
};

let totalScore = 0;
let activeMission = 'intro';

let galleryPage = 0;

function getGalleryItemsPerPage() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 960) return 2;
    return 3;
}

function getGalleryMaxPage() {
    if (!galleryItems.length) return 0;
    return Math.max(
        0,
        Math.ceil(galleryItems.length / getGalleryItemsPerPage()) - 1
    );
}

function updateGallery() {
    if (!galleryTrack || !galleryItems.length) return;
    const maxPage = getGalleryMaxPage();
    if (galleryPage > maxPage) galleryPage = maxPage;
    const targetIndex = Math.min(
        galleryItems.length - 1,
        galleryPage * getGalleryItemsPerPage()
    );
    const firstItem = galleryItems[0];
    const targetItem = galleryItems[targetIndex];
    const offset = targetItem.offsetLeft - firstItem.offsetLeft;
    galleryTrack.style.transform = `translateX(-${offset}px)`;
    if (galleryPrev) galleryPrev.disabled = galleryPage === 0;
    if (galleryNext) galleryNext.disabled = galleryPage === maxPage;
}

function openGalleryModal(source, alt, caption) {
    if (!galleryModal || !galleryModalImage || !galleryModalCaption) return;
    galleryModalImage.src = source;
    galleryModalImage.alt = alt;
    galleryModalCaption.textContent = caption;
    galleryModal.hidden = false;
    document.body.classList.add('modal-open');
}

function closeGalleryModal() {
    if (!galleryModal || galleryModal.hidden) return;
    galleryModal.hidden = true;
    if (galleryModalImage) {
        galleryModalImage.src = '';
        galleryModalImage.alt = '';
    }
    if (galleryModalCaption) {
        galleryModalCaption.textContent = '';
    }
    document.body.classList.remove('modal-open');
}

function pulseProgress() {
    if (!progressFill) return;
    progressFill.classList.remove('progress__fill--pulse');
    void progressFill.offsetWidth;
    progressFill.classList.add('progress__fill--pulse');
}

function updateScoreboard() {
    scoreSpan.textContent = totalScore;
    const completedCount = Object.values(missionState).filter(
        (m) => m.completed
    ).length;
    if (progressFill) {
        progressFill.style.width = `${(completedCount / 3) * 100}%`;
        pulseProgress();
    }
    if (progressBar) {
        progressBar.setAttribute('aria-valuenow', String(completedCount));
        progressBar.setAttribute(
            'aria-valuetext',
            `${completedCount} з 3 місій завершено`
        );
    }
}

function updateMissionStatus(key) {
    missionStatus.textContent = missionTitles[key] || missionTitles.intro;
}

function showMission(key) {
    activeMission = key;
    for (const [missionKey, section] of Object.entries(missionCardsMap)) {
        section.hidden = missionKey !== key;
    }
    finalBrief.hidden = key !== 'final';
    missionIntro.hidden = key !== 'intro';
    updateMissionStatus(key);
    if (key === 'intro' || key === 'final') {
        missionCards.forEach((card) =>
            card.classList.remove('mission-card--active')
        );
    } else {
        missionCards.forEach((card) => {
            card.classList.toggle(
                'mission-card--active',
                card.dataset.mission === key
            );
        });
    }
    if (key === 'history') {
        if (!historyEventsContainer.childElementCount) {
            resetHistoryMission();
        }
        historyEventsContainer.focus?.();
    }
}

function returnToMissionHub() {
    showMission('intro');
    requestAnimationFrame(() => {
        missionIntro?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        missionIntro?.focus?.();
    });
}

function randomFact() {
    if (!facts.length || !factText) return;
    const nextFact = facts[Math.floor(Math.random() * facts.length)];
    factText.textContent = nextFact;
}

const historyState = {
    currentIndex: 0,
    errors: 0,
};

function resetHistoryMission() {
    if (!historyEventsContainer || !historyEvents.length) return;
    historyFeedback.textContent = '';
    historyFeedback.className = 'feedback';
    historyComplete.disabled = true;
    historyState.currentIndex = 0;
    historyState.errors = 0;
    const shuffled = [...historyEvents].sort(() => Math.random() - 0.5);
    historyEventsContainer.innerHTML = '';
    shuffled.forEach((event) => {
        const card = document.createElement('div');
        card.className = 'event-card';

        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = `
            <strong class="event-year">${event.year}</strong>
            <strong>${event.title}</strong>
            <p>${event.description}</p>
        `;
        button.dataset.year = String(event.year);

        button.addEventListener('click', () => {
            card.classList.add('is-revealed');
            handleHistoryChoice(card, event);
        });

        const description = document.createElement('p');
        description.textContent = event.description;

        card.appendChild(button);
        card.appendChild(description);
        historyEventsContainer.appendChild(card);
    });
}

function handleHistoryChoice(card, event) {
    const orderedEvents = [...historyEvents].sort((a, b) => a.year - b.year);
    const expectedEvent = orderedEvents[historyState.currentIndex];
    if (!expectedEvent) {
        return;
    }

    if (event.id === expectedEvent.id) {
        card.classList.remove('is-incorrect');
        card.classList.add('is-correct');
        card.querySelector('button').disabled = true;
        historyState.currentIndex += 1;

        historyFeedback.textContent = 'Чудово! Ви розташували подію правильно.';
        historyFeedback.className = 'feedback success';

        if (historyState.currentIndex === historyEvents.length) {
            historyFeedback.textContent =
                'Хронологію відновлено! Ви можете завершити місію.';
            historyComplete.disabled = false;
        }
    } else {
        card.classList.add('is-incorrect');
        historyState.errors += 1;
        historyFeedback.textContent =
            'Спробуйте іншу подію. Зверніть увагу на підказки у описах.';
        historyFeedback.className = 'feedback error';
    }
}

function finalizeMission(key, earnedScore) {
    const state = missionState[key];
    const increment = Math.max(0, earnedScore - state.bestScore);
    state.bestScore = Math.max(state.bestScore, earnedScore);
    if (earnedScore >= 60) {
        state.completed = true;
    }
    totalScore += increment;
    updateScoreboard();
    updateMissionStatus(key);
    checkFinalBrief();
}

function checkFinalBrief() {
    const completedCount = Object.values(missionState).filter(
        (m) => m.completed
    ).length;
    if (completedCount === 3) {
        const badges =
            totalScore >= 240
                ? 'Чудово! Ви здобули відзнаку "Гід Донбасу".'
                : 'Вітаємо! Ви зібрали основні артефакти — завершіть місії, щоб здобути відзнаку "Гід Донбасу".';
        finalSummary.textContent = `${badges} Загальний результат: ${totalScore} / 300.`;
    }
}

function startExpedition() {
    missionIntro.hidden = false;
    showMission('intro');
    document
        .getElementById('missionArea')
        .scrollIntoView({ behavior: 'smooth' });
    randomFact();
}

function initReveals() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) {
        return;
    }
    if (!('IntersectionObserver' in window)) {
        elements.forEach((el) => el.classList.add('in-view'));
        return;
    }
    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    obs.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));
}

startButton?.addEventListener('click', startExpedition);
factButton?.addEventListener('click', randomFact);
missionCards.forEach((card) => {
    card.addEventListener('click', () => {
        const missionKey = card.dataset.mission;
        showMission(missionKey);
    });
});

galleryPrev?.addEventListener('click', () => {
    galleryPage = Math.max(0, galleryPage - 1);
    updateGallery();
});

galleryNext?.addEventListener('click', () => {
    const maxPage = getGalleryMaxPage();
    galleryPage = Math.min(maxPage, galleryPage + 1);
    updateGallery();
});

galleryItems.forEach((item) => {
    const img = item.querySelector('img');
    const caption = item.querySelector('figcaption');
    if (!img) return;
    item.addEventListener('click', () => {
        openGalleryModal(
            img.currentSrc || img.src,
            img.alt || '',
            caption ? caption.textContent : ''
        );
    });
});

galleryModalClose?.addEventListener('click', closeGalleryModal);

galleryModal?.addEventListener('click', (event) => {
    if (event.target === galleryModal) {
        closeGalleryModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && galleryModal && !galleryModal.hidden) {
        closeGalleryModal();
    }
});

window.addEventListener('resize', updateGallery);

updateGallery();

missionBackButtons.forEach((button) => {
    button.addEventListener('click', returnToMissionHub);
});

historyReset?.addEventListener('click', () => {
    resetHistoryMission();
    historyFeedback.textContent = 'Порядок подій скинуто. Почніть заново.';
    historyFeedback.className = 'feedback';
});

historyComplete?.addEventListener('click', () => {
    const penalty = Math.min(historyState.errors * 10, 60);
    const earned = Math.max(60, 100 - penalty);
    finalizeMission('history', earned);
    historyFeedback.textContent = `Місія завершена! Нараховано: ${earned} балів.`;
    historyFeedback.className = 'feedback success';
});

cultureForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(cultureForm);
    const entries = Object.entries(cultureAnswers);

    if (!entries.length) {
        cultureFeedback.textContent = 'Немає даних для перевірки завдання.';
        cultureFeedback.className = 'feedback';
        finalizeMission('culture', 0);
        return;
    }

    let correct = 0;
    entries.forEach(([field, answer]) => {
        if (data.get(field) === answer) {
            correct += 1;
        }
    });

    if (correct === entries.length) {
        cultureFeedback.textContent =
            'Бездоганно! Ви точно знаєте культурні перлини Донбасу.';
        cultureFeedback.className = 'feedback success';
    } else {
        cultureFeedback.textContent = `Кількість правильних відповідей: ${correct} з ${entries.length}. Перечитайте підказки та спробуйте ще раз.`;
        cultureFeedback.className = 'feedback error';
    }

    const earned = Math.round((correct / entries.length) * 100);
    finalizeMission('culture', earned);
});

cultureForm?.addEventListener('reset', () => {
    cultureFeedback.textContent = '';
    cultureFeedback.className = 'feedback';
});

ecoForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(ecoForm);
    const entries = Object.entries(ecoAnswers);

    if (!entries.length) {
        ecoFeedback.textContent = 'Немає даних для перевірки завдання.';
        ecoFeedback.className = 'feedback';
        finalizeMission('eco', 0);
        return;
    }

    let correct = 0;
    entries.forEach(([field, answer]) => {
        if (data.get(field) === answer) {
            correct += 1;
        }
    });

    if (correct === entries.length) {
        ecoFeedback.textContent =
            'Бездоганно! Ви впізнали природні перлини Донбасу.';
        ecoFeedback.className = 'feedback success';
    } else {
        ecoFeedback.textContent = `Правильних відповідей: ${correct} з ${entries.length}. Перечитайте підказки у галереї та спробуйте ще раз.`;
        ecoFeedback.className = 'feedback error';
    }

    const earned = Math.round((correct / entries.length) * 100);
    finalizeMission('eco', earned);
});

ecoForm?.addEventListener('reset', () => {
    ecoFeedback.textContent = '';
    ecoFeedback.className = 'feedback';
});

document.addEventListener('DOMContentLoaded', () => {
    const galleryTrack = document.querySelector('.gallery__track');
    const galleryItems = [...galleryTrack.querySelectorAll('.gallery__item')];
    const extraContainer = document.querySelector('.gallery__extra');
    const toggleBtn = document.getElementById('toggleGallery');

    if (galleryItems.length > 3) {
        galleryItems
            .slice(3)
            .forEach((item) => extraContainer.appendChild(item));

        toggleBtn.addEventListener('click', () => {
            const isHidden = extraContainer.hasAttribute('hidden');
            if (isHidden) {
                extraContainer.removeAttribute('hidden');
                toggleBtn.textContent = 'Згорнути';
            } else {
                extraContainer.setAttribute('hidden', '');
                toggleBtn.textContent = 'Показати більше';
                galleryTrack.scrollIntoView({ behavior: 'smooth' });
            }
        });
    } else {
        toggleBtn.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const titleLink = document.querySelector('.site-title__link');
    const tagline = document.querySelector('.hero__tagline');
    const startBtn = document.getElementById('startButton');

    if (!startBtn) return;

    const on = () => startBtn.classList.add('attention');
    const off = () => startBtn.classList.remove('attention');

    [titleLink, tagline].forEach((el) => {
        el?.addEventListener('mouseenter', on);
        el?.addEventListener('mouseleave', off);
        el?.addEventListener('focus', on);
        el?.addEventListener('blur', off);
    });
});

restartButton?.addEventListener('click', () => {
    totalScore = 0;
    Object.keys(missionState).forEach((key) => {
        missionState[key].completed = false;
        missionState[key].bestScore = 0;
    });
    historyState.currentIndex = 0;
    historyState.errors = 0;
    cultureForm?.reset();
    ecoForm?.reset();
    historyFeedback.textContent = '';
    cultureFeedback.textContent = '';
    ecoFeedback.textContent = '';
    finalSummary.textContent = '';
    resetHistoryMission();
    updateScoreboard();
    showMission('intro');
    randomFact();
});

document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.querySelector('.hero-slideshow');
    const overlay = document.querySelector('.hero__overlay');
    if (!wrap || !overlay) return;

    const frames = Array.from(wrap.querySelectorAll('img')).filter(
        (el) => el.src
    );
    if (!frames.length) return;

    const overlayLayers = Array.from(
        overlay.querySelectorAll('.overlay-layer')
    );

    const mapSlideToLayer = [0, 1];
    const buttonThemes = ['theme-autumn', 'theme-winter'];

    const DISPLAY_TIME = 7000;
    const FADE_TIME = 2800;

    const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    let index = 0;

    frames.forEach((img, i) => img.classList.toggle('is-active', i === 0));
    if (overlayLayers.length) {
        overlayLayers.forEach((layer, i) =>
            layer.classList.toggle('is-active', i === mapSlideToLayer[0])
        );
    }
    if (startButton) {
        startButton.classList.remove('theme-autumn', 'theme-winter');
        startButton.classList.add(buttonThemes[0]);
    }

    if (reduce || frames.length === 1) return;

    frames.forEach((img) => {
        const pre = new Image();
        pre.src = img.src;
    });

    const play = () => {
        const current = frames[index];
        const nextIndex = (index + 1) % frames.length;
        const next = frames[nextIndex];

        next.classList.add('is-active');

        if (overlayLayers.length) {
            const nextLayer = mapSlideToLayer[nextIndex];
            overlayLayers.forEach((layer, i) =>
                layer.classList.toggle('is-active', i === nextLayer)
            );
        }

        if (startButton) {
            startButton.classList.remove('theme-autumn', 'theme-winter');
            startButton.classList.add(buttonThemes[nextIndex]);
        }

        setTimeout(() => {
            current.classList.remove('is-active');
            index = nextIndex;
        }, FADE_TIME);
    };

    setInterval(play, DISPLAY_TIME);
});

resetHistoryMission();
updateScoreboard();
showMission('intro');
updateMissionStatus('intro');
initReveals();
