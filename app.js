"use strict";

const els = {
  gtfsStatus: document.querySelector("#gtfsStatus"),
  refreshBtn: document.querySelector("#refreshBtn"),
  destinationSearch: document.querySelector("#destinationSearch"),
  destinationSearchBtn: document.querySelector("#destinationSearchBtn"),
  tripSelect: document.querySelector("#tripSelect"),
  tripHint: document.querySelector("#tripHint"),
  languageSelect: document.querySelector("#languageSelect"),
  autoAnnounce: document.querySelector("#autoAnnounce"),
  chooseGtfsBtn: document.querySelector("#chooseGtfsBtn"),
  gtfsFileInput: document.querySelector("#gtfsFileInput"),
  announcementVolume: document.querySelector("#announcementVolume"),
  announcementVolumeValue: document.querySelector("#announcementVolumeValue"),
  trainTypeSelect: document.querySelector("#trainTypeSelect"),
  soundVariantSelect: document.querySelector("#soundVariantSelect"),
  loadSoundsBtn: document.querySelector("#loadSoundsBtn"),
  downloadSoundsBtn: document.querySelector("#downloadSoundsBtn"),
  previewEngineBtn: document.querySelector("#previewEngineBtn"),
  previewAccelBtn: document.querySelector("#previewAccelBtn"),
  previewDecelBtn: document.querySelector("#previewDecelBtn"),
  previewRideBtn: document.querySelector("#previewRideBtn"),
  previewWheelBtn: document.querySelector("#previewWheelBtn"),
  previewStuckBtn: document.querySelector("#previewStuckBtn"),
  enableSoundBtn: document.querySelector("#enableSoundBtn"),
  welcomeBtn: document.querySelector("#welcomeBtn"),
  arrivingBtn: document.querySelector("#arrivingBtn"),
  approachingBtn: document.querySelector("#approachingBtn"),
  arrivedBtn: document.querySelector("#arrivedBtn"),
  engineVolume: document.querySelector("#engineVolume"),
  accelerationVolume: document.querySelector("#accelerationVolume"),
  decelerationVolume: document.querySelector("#decelerationVolume"),
  rideVolume: document.querySelector("#rideVolume"),
  wheelVolume: document.querySelector("#wheelVolume"),
  stuckVolume: document.querySelector("#stuckVolume"),
  engineVolumeValue: document.querySelector("#engineVolumeValue"),
  accelerationVolumeValue: document.querySelector("#accelerationVolumeValue"),
  decelerationVolumeValue: document.querySelector("#decelerationVolumeValue"),
  rideVolumeValue: document.querySelector("#rideVolumeValue"),
  wheelVolumeValue: document.querySelector("#wheelVolumeValue"),
  stuckVolumeValue: document.querySelector("#stuckVolumeValue"),
  soundStatus: document.querySelector("#soundStatus"),
  speedKph: document.querySelector("#speedKph"),
  speedKphValue: document.querySelector("#speedKphValue"),
  speedDisplay: document.querySelector("#speedDisplay"),
  downloadAllSoundsBtn: document.querySelector("#downloadAllSoundsBtn"),
  trainTypeLabel: document.querySelector("#trainTypeLabel"),
  audioStatus: document.querySelector("#audioStatus"),
  stationBadge: document.querySelector("#stationBadge"),
  stationFilterInput: document.querySelector("#stationFilterInput"),
  installBtn: document.querySelector("#installBtn"),
  pwaStatus: document.querySelector("#pwaStatus"),
  serviceCode: document.querySelector("#serviceCode"),
  clock: document.querySelector("#clock"),
  destinationName: document.querySelector("#destinationName"),
  liveChip: document.querySelector("#liveChip"),
  phaseLabel: document.querySelector("#phaseLabel"),
  nextStation: document.querySelector("#nextStation"),
  progressFill: document.querySelector("#progressFill"),
  scheduleDate: document.querySelector("#scheduleDate"),
  scheduleTime: document.querySelector("#scheduleTime"),
  startScheduleBtn: document.querySelector("#startScheduleBtn"),
  resetScheduleBtn: document.querySelector("#resetScheduleBtn"),
  scheduleHint: document.querySelector("#scheduleHint"),
  stopListWindow: document.querySelector(".stop-list-window"),
  stopList: document.querySelector("#stopList"),
  sectionText: document.querySelector("#sectionText"),
  statusText: document.querySelector("#statusText"),
  journeyProgress: document.querySelector("#journeyProgress"),
  tickerText: document.querySelector("#tickerText"),
  trainDisplay: document.querySelector(".train-display")
};

const GTFS_SRC = "gtfs.zip";
const GONG_SRC = "pkp-intercity-gong.ogg";
const DEFAULT_DWELL_SECONDS = 45;
const ARRIVING_ANNOUNCEMENT_THRESHOLD_SECONDS = 45;
const EARLY_STOPS_OFFSET = 3;

const state = {
  datasetName: "Sample POLREGIO",
  trips: [],
  selectableTrips: [],
  selectedTripId: "",
  selectedTrip: null,
  destinationQuery: "",
  currentSnapshot: null,
  audioEnabled: false,
  deferredInstallPrompt: null,
  announcementMarks: new Set(),
  lastRenderedStopKey: "",
  gong: new Audio(GONG_SRC),
  language: "en",
  autoAnnounce: true,
  announcementVolume: 1.0,
  approachStationFilters: [],
  scheduleActive: false,
  scheduleStartSimMs: null,
  scheduleStartRealMs: null,
  gtfsArrayBuffer: null,
};

state.gong.preload = "auto";
state.gong.volume = 0.6;

const TRAIN_SOUND_EVENTS = [
  "engine",
  "acceleration",
  "deceleration",
  "ride",
  "wheel",
  "stuckWheel"
];

const TRAIN_SOUND_PRESETS = {
  diesel: [
    {
      id: "diesel-tem2",
      label: "Soviet TEM2 diesel",
      sources: {
        engine: "https://freesound.org/data/previews/783/783841_12024110-hq.mp3",
        acceleration: "https://freesound.org/data/previews/783/783841_12024110-hq.mp3",
        deceleration: "https://freesound.org/data/previews/783/783840_12024110-hq.mp3",
        ride: "https://freesound.org/data/previews/783/783838_12024110-hq.mp3",
        wheel: "https://freesound.org/data/previews/783/783838_12024110-hq.mp3",
        stuckWheel: "https://freesound.org/data/previews/783/783838_12024110-hq.mp3"
      }
    },
    {
      id: "diesel-d1",
      label: "Soviet D1 diesel",
      sources: {
        engine: "d1-engine.mp3",
        acceleration: "d1-acceleration.mp3",
        deceleration: "d1-deceleration.mp3",
        ride: "d1-ride.mp3",
        wheel: "d1-wheel.mp3",
        stuckWheel: "d1-stuck-wheel.mp3"
      }
    }
  ],
  electric: [
    {
      id: "electric-vl80",
      label: "Soviet VL80 electric",
      sources: {
        engine: "https://upload.wikimedia.org/wikipedia/commons/6/65/Droning_train_motor_on_halt.ogg",
        acceleration: "https://upload.wikimedia.org/wikipedia/commons/6/65/Droning_train_motor_on_halt.ogg",
        deceleration: "https://upload.wikimedia.org/wikipedia/commons/7/76/Train_doors_closing.ogg",
        ride: "https://upload.wikimedia.org/wikipedia/commons/6/65/Droning_train_motor_on_halt.ogg",
        wheel: "https://upload.wikimedia.org/wikipedia/commons/7/76/Train_doors_closing.ogg",
        stuckWheel: "https://upload.wikimedia.org/wikipedia/commons/7/76/Train_doors_closing.ogg"
      }
    }
  ],
  battery: [
    {
      id: "battery-commuter",
      label: "Battery commuter",
      sources: {
        engine: "https://upload.wikimedia.org/wikipedia/commons/6/65/Droning_train_motor_on_halt.ogg",
        acceleration: "https://upload.wikimedia.org/wikipedia/commons/6/65/Droning_train_motor_on_halt.ogg",
        deceleration: "https://upload.wikimedia.org/wikipedia/commons/7/76/Train_doors_closing.ogg",
        ride: "https://upload.wikimedia.org/wikipedia/commons/6/65/Droning_train_motor_on_halt.ogg",
        wheel: "https://upload.wikimedia.org/wikipedia/commons/7/76/Train_doors_closing.ogg",
        stuckWheel: "https://upload.wikimedia.org/wikipedia/commons/7/76/Train_doors_closing.ogg"
      }
    }
  ]
};

const SOUND_VOLUME_LABELS = {
  engine: "Engine volume",
  acceleration: "Acceleration volume",
  deceleration: "Deceleration volume",
  ride: "Ride volume",
  wheel: "Wheel volume",
  stuckWheel: "Stuck wheel volume"
};

function isAudioElementReady(audio) {
  return audio.readyState >= 3;
}

function formatVolumeDisplay(value) {
  return `${Math.round(value * 100)}%`;
}

async function fetchSoundBlob(url) {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Unable to download ${url}`);
  return response.blob();
}

function buildSoundOptionList(type) {
  const presets = TRAIN_SOUND_PRESETS[type] || [];
  return presets.map((preset) => ({ value: preset.id, label: preset.label }));
}

function findSoundPreset(type, presetId) {
  return (TRAIN_SOUND_PRESETS[type] || []).find((preset) => preset.id === presetId) || null;
}

function updateSoundStatus(text) {
  els.soundStatus.textContent = text;
}

async function loadSoundPreset() {
  const type = els.trainTypeSelect.value;
  const presetId = els.soundVariantSelect.value;
  const preset = findSoundPreset(type, presetId);
  if (!preset) {
    updateSoundStatus("No sound preset selected.");
    return;
  }
  updateSoundStatus(`Loading ${preset.label} sounds from the internet...`);

  state.loadedSounds = {};
  state.soundAudioObjects = {};
  state.activeSoundPreset = preset;
  state.selectedTrainType = type;
  state.selectedSoundPresetLabel = preset.label;
  updateTrainTypeDisplay();

  await Promise.all(TRAIN_SOUND_EVENTS.map(async (eventName) => {
    const sourceUrl = preset.sources[eventName];
    if (!sourceUrl) return;
    const audio = new Audio(sourceUrl);
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.volume = state.soundVolumes[eventName] ?? 0.75;
    if (eventName === "ride" || eventName === "engine") {
      audio.loop = true;
    }
    state.soundAudioObjects[eventName] = audio;
    audio.load();
    try {
      await new Promise((resolve) => {
        if (isAudioElementReady(audio)) return resolve();
        audio.addEventListener("canplaythrough", resolve, { once: true, passive: true });
        audio.addEventListener("error", resolve, { once: true, passive: true });
      });
      state.loadedSounds[eventName] = !audio.error;
    } catch (error) {
      state.loadedSounds[eventName] = false;
    }
  }));

  updateSoundStatus(`Loaded sounds for ${preset.label}. Use preview buttons or auto sound now.`);
}

async function downloadSoundPack() {
  const type = els.trainTypeSelect.value || Object.keys(TRAIN_SOUND_PRESETS)[0];
  const presetId = els.soundVariantSelect.value;
  const preset = state.activeSoundPreset || findSoundPreset(type, presetId);
  if (!preset) {
    updateSoundStatus("Select a train type and sound pack first.");
    return;
  }
  const zip = new JSZip();
  updateSoundStatus(`Downloading ${preset.label} sound pack...`);

  await Promise.all(TRAIN_SOUND_EVENTS.map(async (eventName) => {
    const sourceUrl = preset.sources[eventName];
    if (!sourceUrl) return;
    try {
      const blob = await fetchSoundBlob(sourceUrl);
      const extension = sourceUrl.split(".").pop().split("?")[0] || "mp3";
      zip.file(`${eventName}.${extension}`, blob);
    } catch (error) {
      console.warn(`Could not download ${eventName}`, error);
    }
  }));

  const archiveName = `${preset.id}-sounds.zip`;
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = archiveName;
  anchor.click();
  URL.revokeObjectURL(url);
  updateSoundStatus(`Downloaded sound pack ${archiveName}.`);
}

function applySoundVolume(eventName, value) {
  state.soundVolumes[eventName] = value;
  if (state.soundAudioObjects[eventName]) {
    state.soundAudioObjects[eventName].volume = value;
  }
}

function setVolumeLabel(element, value) {
  if (element) element.textContent = formatVolumeDisplay(value);
}

function syncSoundVolumeLabels() {
  setVolumeLabel(els.engineVolumeValue, state.soundVolumes.engine);
  setVolumeLabel(els.accelerationVolumeValue, state.soundVolumes.acceleration);
  setVolumeLabel(els.decelerationVolumeValue, state.soundVolumes.deceleration);
  setVolumeLabel(els.rideVolumeValue, state.soundVolumes.ride);
  setVolumeLabel(els.wheelVolumeValue, state.soundVolumes.wheel);
  setVolumeLabel(els.stuckVolumeValue, state.soundVolumes.stuckWheel);
  setVolumeLabel(els.announcementVolumeValue, state.announcementVolume);
}

function loadSoundTypeOptions() {
  els.trainTypeSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select train type";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  els.trainTypeSelect.appendChild(defaultOption);

  Object.keys(TRAIN_SOUND_PRESETS).forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = `${type.charAt(0).toUpperCase()}${type.slice(1)} train sounds`;
    els.trainTypeSelect.appendChild(option);
  });

  if (els.trainTypeSelect.options.length > 1) {
    els.trainTypeSelect.selectedIndex = 1;
  }
}

function renderSoundVariantOptions() {
  const type = els.trainTypeSelect.value || Object.keys(TRAIN_SOUND_PRESETS)[0];
  const variantOptions = buildSoundOptionList(type);
  els.soundVariantSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select sound pack";
  defaultOption.disabled = true;
  els.soundVariantSelect.appendChild(defaultOption);

  variantOptions.forEach((variant, index) => {
    const option = document.createElement("option");
    option.value = variant.value;
    option.textContent = variant.label;
    els.soundVariantSelect.appendChild(option);
    if (index === 0) {
      option.selected = true;
    }
  });

  if (!els.soundVariantSelect.value && els.soundVariantSelect.options.length > 1) {
    els.soundVariantSelect.selectedIndex = 1;
  }

  const selectedPreset = findSoundPreset(type, els.soundVariantSelect.value);
  if (selectedPreset) {
    state.selectedTrainType = type;
    state.selectedSoundPresetLabel = selectedPreset.label;
    updateTrainTypeDisplay();
  }
}

function playSynthEvent(eventName) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.value = 0.2 * (state.soundVolumes[eventName] ?? 0.75);
  gain.connect(context.destination);
  const now = context.currentTime;

  function noise(duration, filterFreq) {
    const bufferSize = context.sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    source.connect(filter).connect(gain);
    source.start(now);
    source.stop(now + duration);
  }

  function tone(startFreq, endFreq, duration, type = "sine") {
    const oscillator = context.createOscillator();
    const oscGain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(oscGain).connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  switch (eventName) {
    case "engine":
      tone(80, 120, 2.4, "triangle");
      noise(2.4, 600);
      break;
    case "acceleration":
      tone(90, 220, 1.3, "sawtooth");
      noise(1.3, 1800);
      break;
    case "deceleration":
      tone(220, 80, 1.1, "triangle");
      noise(1.1, 900);
      break;
    case "ride":
      noise(0.8, 1800);
      break;
    case "wheel":
      noise(0.5, 1200);
      break;
    case "stuckWheel":
      tone(300, 120, 0.9, "square");
      noise(0.9, 1400);
      break;
    default:
      noise(1.1, 1300);
      break;
  }

  window.setTimeout(() => context.close(), 3000);
}

function playSoundEvent(eventName) {
  const audio = state.soundAudioObjects[eventName];
  if (audio && typeof audio.play === "function") {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = state.soundVolumes[eventName] ?? 0.75;
    audio.play().catch(() => playSynthEvent(eventName));
    return;
  }
  playSynthEvent(eventName);
}

function playStationEngineOnly() {
  playSoundEvent("engine");
}

const defaultSoundVolumes = {
  engine: 0.8,
  acceleration: 0.8,
  deceleration: 0.8,
  ride: 0.8,
  wheel: 0.8,
  stuckWheel: 0.8
};

state.soundVolumes = { ...defaultSoundVolumes };
state.soundAudioObjects = {};
state.loadedSounds = {};
state.activeSoundPreset = null;
state.selectedTrainType = null;
state.selectedSoundPresetLabel = null;
state.speedKph = 0;
state.autoSoundIntervalId = null;
state.accelerationIntervalId = null;
state.accelerationEndTimeoutId = null;
state.decelerationIntervalId = null;
state.decelerationEndTimeoutId = null;
state.speedRampIntervalId = null;
state.previousSpeedKph = 0;
state.d1AccelerationTimeoutId = null;

function updateTrainTypeDisplay() {
  if (!els.trainTypeLabel) return;
  const trainTypeText = state.selectedTrainType
    ? `${state.selectedTrainType.charAt(0).toUpperCase() + state.selectedTrainType.slice(1)} train`
    : "No train type";
  const soundPackText = state.selectedSoundPresetLabel || "No sound pack";
  els.trainTypeLabel.textContent = `${trainTypeText} · ${soundPackText}`;
}

function updateSpeedDisplay() {
  const speed = Math.max(0, Math.min(160, Number(state.speedKph) || 0));
  els.speedKphValue.textContent = `${speed} km/h`;
  if (els.speedDisplay) {
    els.speedDisplay.textContent = `${speed} km/h`;
  }
}

function stopAutoTrainSounds() {
  if (state.autoSoundIntervalId) {
    clearInterval(state.autoSoundIntervalId);
    state.autoSoundIntervalId = null;
  }
  // Pause all sound event audio objects
  for (const eventName of TRAIN_SOUND_EVENTS) {
    if (state.soundAudioObjects[eventName]) {
      state.soundAudioObjects[eventName].pause();
      state.soundAudioObjects[eventName].currentTime = 0;
    }
  }
}

function stopAccelerationPhase() {
  if (state.accelerationIntervalId) {
    clearInterval(state.accelerationIntervalId);
    state.accelerationIntervalId = null;
  }
  if (state.accelerationEndTimeoutId) {
    clearTimeout(state.accelerationEndTimeoutId);
    state.accelerationEndTimeoutId = null;
  }
}

function stopDecelerationPhase() {
  if (state.decelerationIntervalId) {
    clearInterval(state.decelerationIntervalId);
    state.decelerationIntervalId = null;
  }
  if (state.decelerationEndTimeoutId) {
    clearTimeout(state.decelerationEndTimeoutId);
    state.decelerationEndTimeoutId = null;
  }
}

function startAutoTrainSounds() {
  stopAutoTrainSounds();
  stopAccelerationPhase();
  stopDecelerationPhase();
  const effectiveSpeed = Math.max(10, state.speedKph || 60);
  state.autoSoundIntervalId = setInterval(() => {
    playSoundEvent("ride");
    playSoundEvent("wheel");
    if (Math.random() > 0.4) {
      playSoundEvent("engine");
    }
    if (Math.random() > 0.75) {
      playSoundEvent("stuckWheel");
    }
  }, Math.max(1600, 7000 - effectiveSpeed * 30));
}

function playStationEngineOnly() {
  stopAutoTrainSounds();
  stopAccelerationPhase();
  stopDecelerationPhase();
  playSoundEvent("engine");
}

function rampSpeed(durationMs, targetSpeed) {
  if (state.speedRampIntervalId) {
    clearInterval(state.speedRampIntervalId);
    state.speedRampIntervalId = null;
  }
  const startSpeed = Number(state.speedKph) || 0;
  const steps = Math.round(durationMs / 500);
  if (steps < 1) {
    state.speedKph = targetSpeed;
    updateSpeedDisplay();
    return;
  }
  const speedStep = (targetSpeed - startSpeed) / steps;
  let step = 0;
  state.speedRampIntervalId = setInterval(() => {
    step += 1;
    state.speedKph = Math.max(0, Math.min(160, startSpeed + speedStep * step));
    els.speedKph.value = state.speedKph;
    updateSpeedDisplay();
    if (step >= steps) {
      clearInterval(state.speedRampIntervalId);
      state.speedRampIntervalId = null;
    }
  }, 500);
}

function startAccelerationPhase(durationMs = 30000) {
  stopDecelerationPhase();
  stopAutoTrainSounds();
  playSoundEvent("acceleration");
  playSoundEvent("engine");
  state.accelerationIntervalId = setInterval(() => {
    playSoundEvent("acceleration");
    playSoundEvent("engine");
  }, 7000);
  state.accelerationEndTimeoutId = setTimeout(() => {
    stopAccelerationPhase();
    startAutoTrainSounds();
  }, durationMs);
}

function startDecelerationPhase(durationMs = 30000) {
  stopAccelerationPhase();
  stopAutoTrainSounds();
  playSoundEvent("deceleration");
  state.decelerationIntervalId = setInterval(() => {
    playSoundEvent("deceleration");
  }, 9000);
  state.decelerationEndTimeoutId = setTimeout(() => {
    stopDecelerationPhase();
    playStationEngineOnly();
  }, durationMs);
}

function updateAutoTrainSounds(snapshot, previousSnapshot) {
  if (!state.activeSoundPreset) return;

  // Special handling for D1 diesel
  if (state.activeSoundPreset.id === "diesel-d1") {
    const isAtStation = snapshot.phase === "waiting" || snapshot.phase === "arrived" || snapshot.phase === "terminus";
    const wasAtStation = previousSnapshot && (previousSnapshot.phase === "waiting" || previousSnapshot.phase === "arrived" || previousSnapshot.phase === "terminus");
    const isEnroute = snapshot.phase === "enroute";
    const wasEnroute = previousSnapshot && previousSnapshot.phase === "enroute";
    const isArriving = snapshot.phase === "arriving";
    const wasArriving = previousSnapshot && previousSnapshot.phase === "arriving";
    
    // At station: play engine sound only
    if (isAtStation) {
      if (!wasAtStation) {
        // Entering station: stop all movement sounds, play engine
        if (state.d1AccelerationTimeoutId) {
          clearTimeout(state.d1AccelerationTimeoutId);
          state.d1AccelerationTimeoutId = null;
        }
        stopAutoTrainSounds();
        stopAccelerationPhase();
        stopDecelerationPhase();
        
        // Stop all sounds except engine
        if (state.soundAudioObjects.acceleration) state.soundAudioObjects.acceleration.pause();
        if (state.soundAudioObjects.deceleration) state.soundAudioObjects.deceleration.pause();
        if (state.soundAudioObjects.wheel) state.soundAudioObjects.wheel.pause();
        
        playSoundEvent("engine");
      }
      // Stay at station: keep engine looping
      return;
    }
    
    // En route: play acceleration for 15 seconds, then switch to looping wheel sound
    if (isEnroute) {
      if (!wasEnroute) {
        // Just entered en-route phase
        if (state.d1AccelerationTimeoutId) {
          clearTimeout(state.d1AccelerationTimeoutId);
          state.d1AccelerationTimeoutId = null;
        }
        
        // Pause engine and other sounds
        if (state.soundAudioObjects.engine) state.soundAudioObjects.engine.pause();
        if (state.soundAudioObjects.deceleration) state.soundAudioObjects.deceleration.pause();
        if (state.soundAudioObjects.wheel) state.soundAudioObjects.wheel.pause();
        
        // Play acceleration sound
        playSoundEvent("acceleration");
        
        // After 15 seconds, switch to wheel sound
        state.d1AccelerationTimeoutId = setTimeout(() => {
          if (state.soundAudioObjects.acceleration) {
            state.soundAudioObjects.acceleration.pause();
            state.soundAudioObjects.acceleration.currentTime = 0;
          }
          playSoundEvent("wheel");
          state.d1AccelerationTimeoutId = null;
        }, 15000);
      }
      return;
    }
    
    // Arriving: stop wheel sound and play deceleration
    if (isArriving) {
      if (!wasArriving) {
        // Just entered arriving phase
        if (state.d1AccelerationTimeoutId) {
          clearTimeout(state.d1AccelerationTimeoutId);
          state.d1AccelerationTimeoutId = null;
        }
        
        // Stop all movement sounds
        if (state.soundAudioObjects.engine) state.soundAudioObjects.engine.pause();
        if (state.soundAudioObjects.acceleration) state.soundAudioObjects.acceleration.pause();
        if (state.soundAudioObjects.wheel) state.soundAudioObjects.wheel.pause();
        
        // Play deceleration sound
        playSoundEvent("deceleration");
      }
      return;
    }
    
    return;
  }

  if (snapshot.phase === "waiting") {
    stopAutoTrainSounds();
    stopAccelerationPhase();
    stopDecelerationPhase();
    state.speedKph = 0;
    els.speedKph.value = 0;
    updateSpeedDisplay();
    return;
  }

  if (snapshot.phase === "enroute") {
    if (!previousSnapshot || previousSnapshot.phase !== "enroute") {
      rampSpeed(30000, 90);
      startAccelerationPhase(30000);
    }
    // Keep sounds playing continuously during enroute
    return;
  }

  if (snapshot.phase === "arriving") {
    if (!previousSnapshot || previousSnapshot.phase !== "arriving") {
      rampSpeed(30000, 15);
      startDecelerationPhase(30000);
    }
    return;
  }

  if (snapshot.phase === "arrived" || snapshot.phase === "terminus") {
    if (!previousSnapshot || previousSnapshot.phase !== snapshot.phase) {
      state.speedKph = 0;
      els.speedKph.value = 0;
      updateSpeedDisplay();
      // Stop all sounds except for D1 diesel engine
      stopAutoTrainSounds();
      stopAccelerationPhase();
      stopDecelerationPhase();
      if (state.activeSoundPreset && state.activeSoundPreset.id === "diesel-d1") {
        playSoundEvent("engine");
      }
    }
    return;
  }
}

function setTrainSpeed(kph) {
  const speed = Number(kph || 0);
  state.previousSpeedKph = state.speedKph;
  state.speedKph = Math.max(0, Math.min(160, speed));
  updateSpeedDisplay();

  if (state.speedKph > state.previousSpeedKph) {
    playSoundEvent("acceleration");
  } else if (state.speedKph < state.previousSpeedKph) {
    playSoundEvent("deceleration");
  }

  if (state.speedKph > 0) {
    playSoundEvent("engine");
    startAutoTrainSounds();
  } else {
    stopAutoTrainSounds();
  }
}

async function downloadAllSoundPacks() {
  const zip = new JSZip();
  updateSoundStatus("Downloading all sound packs from the internet...");

  const fetchPromises = [];
  Object.entries(TRAIN_SOUND_PRESETS).forEach(([type, presets]) => {
    presets.forEach((preset) => {
      TRAIN_SOUND_EVENTS.forEach((eventName) => {
        const sourceUrl = preset.sources[eventName];
        if (!sourceUrl) return;
        const extension = sourceUrl.split(".").pop().split("?")[0] || "mp3";
        const filePath = `${type}/${preset.id}/${eventName}.${extension}`;
        fetchPromises.push(
          fetchSoundBlob(sourceUrl).then((blob) => zip.file(filePath, blob)).catch(() => {
            console.warn(`Failed to fetch ${filePath}`);
          })
        );
      });
    });
  });

  await Promise.all(fetchPromises);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `train-sound-packs.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
  updateSoundStatus("Downloaded all sound packs.");
}

const ANNOUNCEMENT_LANGUAGE_ORDER = {
  en: ["en"],
  pl: ["pl"],
  "pl-en": ["pl", "en"],
  "en-pl": ["en", "pl"],
  de: ["de"],
  cs: ["cs"],
  sk: ["sk"],
  uk: ["uk"],
  fr: ["fr"],
  es: ["es"],
  it: ["it"],
  nl: ["nl"],
  pt: ["pt"],
  sv: ["sv"],
  all: ["pl", "en", "de", "cs", "sk", "uk", "fr", "es", "it", "nl", "pt", "sv"]
};

const ANNOUNCEMENT_LOCALES = {
  en: {
    lang: "en-GB",
    and: "and",
    welcome: ({ destination, operatorName }) => `Welcome onboard this ${operatorName} service to: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `We will shortly be arriving at: ${next.name}. Change here for services to other destinations. Please mind the gap between the train and the platform. This train terminates here. All change please!`
      : `We will shortly be arriving at ${next.name}. Please mind the gap between the train and the platform.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'other destinations';
      const base = `We are now approaching: ${next.name}. Change here for services to ${destText}. Please mind the gap between the train and the platform.`;
      if (isTerminusForNext) {
        return base + ' This train terminates here. All change please!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `This station is: ${current.name}. This train terminates here. All change please! Thank you for travelling with us!`
      : `This station is: ${current.name}. This train is for: ${destination}. The next station will be: ${afterCurrent[0] || destination}.`
  },
  pl: {
    lang: "pl-PL",
    and: "oraz",
    welcome: ({ destination, operatorName }) => `Witamy w pociagu ${operatorName} do stacji: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `Wkrotce przyjedziemy do stacji ${next.name}. Przesiadka na inne pociagi. Prosimy zachowac ostroznosc przy wysiadaniu. Pociag konczy tutaj bieg. Prosze opuscic pociag!`
      : `Wkrotce przyjedziemy do stacji ${next.name}. Prosimy zachowac ostroznosc przy wysiadaniu.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'inne pociągi';
      const base = `Zbliżamy się do stacji: ${next.name}. Przesiadka na pociągi do ${destText}. Prosimy zachować ostrożność przy wysiadaniu.`;
      if (isTerminusForNext) {
        return base + ' Pociąg kończy tutaj bieg. Proszę opuścić pociąg!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Stacja: ${current.name}. Pociag konczy bieg. Prosze opuscic pociag. Dziekujemy za wspolna podroz!`
      : `Stacja: ${current.name}. Pociag jedzie do stacji: ${destination}. Nastepna stacja bedzie: ${afterCurrent[0] || destination}.`
  },
  de: {
    lang: "de-DE",
    and: "und",
    welcome: ({ destination, operatorName }) => `Willkommen an Bord dieses ${operatorName}-Zuges nach: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `Wir erreichen in Kuerze ${next.name}. Umstieg zu anderen Zugverbindungen. Bitte achten Sie auf den Abstand zwischen Zug und Bahnsteig. Dieser Zug endet hier. Bitte alle aussteigen.`
      : `Wir erreichen in Kuerze ${next.name}. Bitte achten Sie auf den Abstand zwischen Zug und Bahnsteig.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'anderen Zugverbindungen';
      const base = `Wir naehern uns dem Bahnhof ${next.name}. Umstieg zu Zuegen nach ${destText}. Bitte achten Sie auf den Abstand zwischen Zug und Bahnsteig.`;
      if (isTerminusForNext) {
        return base + ' Dieser Zug endet hier. Bitte alle aussteigen.';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Diese Station ist: ${current.name}. Dieser Zug endet hier. Bitte alle aussteigen. Vielen Dank fuer Ihre Reise!`
      : `Diese Station ist: ${current.name}. Dieser Zug faehrt nach: ${destination}. Der naechste Halt wird sein: ${afterCurrent[0] || destination}.`
  },
  cs: {
    lang: "cs-CZ",
    and: "a",
    welcome: ({ destination, operatorName }) => `Vitejte ve vlaku ${operatorName} do stanice: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `Za chvili prijedeme do stanice ${next.name}. Prestup na ostatni vlaky. Dbejte prosim opatrnosti pri vystupovani. Tento vlak zde konci. Prosim vystupte!`
      : `Za chvili prijedeme do stanice ${next.name}. Dbejte prosim opatrnosti pri vystupovani.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'ostatni vlaky';
      const base = `Priblizujeme se k stanici ${next.name}. Prestup na vlaky do ${destText}. Dbejte prosim opatrnosti pri vystupovani.`;
      if (isTerminusForNext) {
        return base + ' Tento vlak zde konci. Prosim vystupte!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Tato stanice je: ${current.name}. Vlak zde konci. Prosim vystupte. Dekujeme za cestu s nami!`
      : `Tato stanice je: ${current.name}. Vlak jede do stanice: ${destination}. Pristi stanice bude: ${afterCurrent[0] || destination}.`
  },
  sk: {
    lang: "sk-SK",
    and: "a",
    welcome: ({ destination, operatorName }) => `Vitajte vo vlaku ${operatorName} do stanice: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `O chvilu prideme do stanice ${next.name}. Prestup na ine vlaky. Pri vystupovani budte prosim opatrni. Tento vlak tu konci. Prosim vystupte!`
      : `O chvilu prideme do stanice ${next.name}. Pri vystupovani budte prosim opatrni.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'ine vlaky';
      const base = `Blizime sa k stanici ${next.name}. Prestup na vlaky do ${destText}. Pri vystupovani budte prosim opatrni.`;
      if (isTerminusForNext) {
        return base + ' Tento vlak tu konci. Prosim vystupte!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Tato stanica je: ${current.name}. Vlak tu konci. Prosim vystupte. Dakujeme za cestu s nami!`
      : `Tato stanica je: ${current.name}. Vlak ide do stanice: ${destination}. Nasledujuca stanica bude: ${afterCurrent[0] || destination}.`
  },
  uk: {
    lang: "uk-UA",
    and: "and",
    welcome: ({ destination, operatorName }) => `Welcome onboard this ${operatorName} service to: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `We will shortly arrive at ${next.name}. Change here for services to other destinations. Please take care when leaving the train. This train terminates here. All change please!`
      : `We will shortly arrive at ${next.name}. Please take care when leaving the train.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'other destinations';
      const base = `We are now approaching: ${next.name}. Change here for services to ${destText}. Please take care when leaving the train.`;
      if (isTerminusForNext) {
        return base + ' This train terminates here. All change please!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `This station is: ${current.name}. This train terminates here. All change please! Thank you for travelling with us!`
      : `This station is: ${current.name}. This train is for: ${destination}. The next station will be: ${afterCurrent[0] || destination}.`
  },
  fr: {
    lang: "fr-FR",
    and: "et",
    welcome: ({ destination, operatorName }) => `Bienvenue a bord de ce train ${operatorName} a destination de: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `Nous arriverons bientot a ${next.name}. Correspondances vers d'autres destinations. Veuillez faire attention en descendant du train. Ce train est termine ici. Tous les passagers doivent descendre!`
      : `Nous arriverons bientot a ${next.name}. Veuillez faire attention en descendant du train.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : "d'autres destinations";
      const base = `Nous approchons de la gare de ${next.name}. Correspondances vers ${destText}. Veuillez faire attention en descendant du train.`;
      if (isTerminusForNext) {
        return base + ' Ce train est termine ici. Veuillez descendre!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Cette gare est: ${current.name}. Ce train est termine ici. Veuillez descendre. Merci d'avoir voyage avec nous!`
      : `Cette gare est: ${current.name}. Ce train est a destination de: ${destination}. La prochaine gare sera: ${afterCurrent[0] || destination}.`
  },
  es: {
    lang: "es-ES",
    and: "y",
    welcome: ({ destination, operatorName }) => `Bienvenidos a bordo de este servicio ${operatorName} con destino a: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `En breve llegaremos a ${next.name}. Transbordos a otros destinos. Tengan cuidado al bajar del tren. Este tren termina aqui. Por favor, bajen del tren!`
      : `En breve llegaremos a ${next.name}. Tengan cuidado al bajar del tren.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'otros destinos';
      const base = `Estamos aproximandonos a la estacion de ${next.name}. Transbordos a ${destText}. Tengan cuidado al bajar del tren.`;
      if (isTerminusForNext) {
        return base + ' Este tren termina aqui. Por favor, bajen del tren!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Esta estacion es: ${current.name}. Este tren termina aqui. Por favor, bajen del tren. Gracias por viajar con nosotros!`
      : `Esta estacion es: ${current.name}. Este tren va a: ${destination}. La proxima estacion sera: ${afterCurrent[0] || destination}.`
  },
  it: {
    lang: "it-IT",
    and: "e",
    welcome: ({ destination, operatorName }) => `Benvenuti a bordo di questo treno ${operatorName} per: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `Stiamo per arrivare a ${next.name}. Coincidenze con altri treni. Prestare attenzione quando si scende dal treno. Questo treno termina qui. Si prega di scendere!`
      : `Stiamo per arrivare a ${next.name}. Prestare attenzione quando si scende dal treno.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'altri treni';
      const base = `Stiamo avvicinandoci alla stazione di ${next.name}. Coincidenze con treni per ${destText}. Prestare attenzione quando si scende dal treno.`;
      if (isTerminusForNext) {
        return base + ' Questo treno termina qui. Si prega di scendere!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Questa stazione e: ${current.name}. Questo treno termina qui. Si prega di scendere. Grazie per aver viaggiato con noi!`
      : `Questa stazione e: ${current.name}. Questo treno e diretto a: ${destination}. La prossima stazione sara: ${afterCurrent[0] || destination}.`
  },
  nl: {
    lang: "nl-NL",
    and: "en",
    welcome: ({ destination, operatorName }) => `Welkom aan boord van deze ${operatorName}-trein naar: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `Wij komen zo aan in ${next.name}. Overstappogelijkheden naar andere bestemmingen. Let op bij het uitstappen. Deze trein eindigt hier. Iedereen uitstappen alstublieft!`
      : `Wij komen zo aan in ${next.name}. Let op bij het uitstappen.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'andere bestemmingen';
      const base = `Wij naderen het station ${next.name}. Overstappogelijkheden naar ${destText}. Let op bij het uitstappen.`;
      if (isTerminusForNext) {
        return base + ' Deze trein eindigt hier. Iedereen uitstappen alstublieft!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Dit station is: ${current.name}. Deze trein eindigt hier. Iedereen uitstappen alstublieft. Bedankt voor het reizen met ons!`
      : `Dit station is: ${current.name}. Deze trein rijdt naar: ${destination}. Het volgende station wordt: ${afterCurrent[0] || destination}.`
  },
  pt: {
    lang: "pt-PT",
    and: "e",
    welcome: ({ destination, operatorName }) => `Bem-vindos a bordo deste servico ${operatorName} para: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `Dentro de momentos chegaremos a ${next.name}. Correspondencias para outros destinos. Tenha cuidado ao sair do comboio. Este comboio termina aqui. Todos devem sair, por favor!`
      : `Dentro de momentos chegaremos a ${next.name}. Tenha cuidado ao sair do comboio.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'outros destinos';
      const base = `Estamos a aproximar-nos a estacao de ${next.name}. Correspondencias para ${destText}. Tenha cuidado ao sair do comboio.`;
      if (isTerminusForNext) {
        return base + ' Este comboio termina aqui. Todos devem sair, por favor!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Esta estacao e: ${current.name}. Este comboio termina aqui. Todos devem sair, por favor. Obrigado por viajar connosco!`
      : `Esta estacao e: ${current.name}. Este comboio segue para: ${destination}. A proxima estacao sera: ${afterCurrent[0] || destination}.`
  },
  sv: {
    lang: "sv-SE",
    and: "och",
    welcome: ({ destination, operatorName }) => `Valkommen ombord pa detta ${operatorName}-tag till: ${destination}.`,
    arriving: ({ next, isTerminus }) => isTerminus
      ? `Vi ankommer snart till ${next.name}. Bytemoejligheter till andra destinationer. Var forsiktig nar du stiger av taget. Detta tag slutar har. Alla stiger av, tack!`
      : `Vi ankommer snart till ${next.name}. Var forsiktig nar du stiger av taget.`,
    approaching: ({ next, destinationsFromNext, isTerminusForNext }) => {
      const destText = destinationsFromNext.length > 0 ? destinationsFromNext.join(', ') : 'andra destinationer';
      const base = `Vi narmar oss stationen ${next.name}. Bytemoejligheter till ${destText}. Var forsiktig nar du stiger av taget.`;
      if (isTerminusForNext) {
        return base + ' Detta tag slutar har. Alla stiger av, tack!';
      } else {
        return base;
      }
    },
    arrived: ({ current, destination, afterCurrent, isTerminus }) => isTerminus
      ? `Denna station ar: ${current.name}. Taget slutar har. Alla stiger av, tack. Tack for att du reser med oss!`
      : `Denna station ar: ${current.name}. Taget gar till: ${destination}. Nasta station blir: ${afterCurrent[0] || destination}.`
  }
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatClock(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getSimulatedNow() {
  if (state.scheduleActive && state.scheduleStartSimMs !== null && state.scheduleStartRealMs !== null) {
    return new Date(state.scheduleStartSimMs + Math.max(0, Date.now() - state.scheduleStartRealMs));
  }
  return new Date();
}

function formatScheduleDisplay(date) {
  return date.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function secondsNowForGtfs(date = new Date()) {
  let seconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  if (seconds < 3 * 3600) seconds += 24 * 3600;
  return seconds;
}

function gtfsDate(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function weekdayKey(date = new Date()) {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
}

function parseGtfsTime(value) {
  if (!value) return null;
  const parts = value.trim().split(":").map(Number);
  if (parts.length < 2 || parts.some(Number.isNaN)) return null;
  return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
}

function formatGtfsTime(seconds) {
  if (!Number.isFinite(seconds)) return "--:--:--";
  const wrapped = ((Math.floor(seconds) % 86400) + 86400) % 86400;
  return `${pad(Math.floor(wrapped / 3600))}:${pad(Math.floor((wrapped % 3600) / 60))}:${pad(wrapped % 60)}`;
}

function minutesText(seconds) {
  if (!Number.isFinite(seconds)) return "time unavailable";
  if (seconds <= 0) return "now";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes === 1 ? "1 min" : `${minutes} min`;
}

function readableList(items) {
  return localizedList(items, "and");
}

function localizedList(items, conjunction) {
  const clean = items.filter(Boolean);
  if (clean.length <= 1) return clean[0] || "";
  if (clean.length === 2) return `${clean[0]} ${conjunction} ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} ${conjunction} ${clean[clean.length - 1]}`;
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function stationMatchesFilter(name) {
  const normalized = normalizeSearchText(name);
  return state.approachStationFilters.some((filter) => normalized.includes(filter));
}

function parseStationFilters(value) {
  return String(value || "")
    .split(",")
    .map((part) => normalizeSearchText(part))
    .filter(Boolean);
}

function trainSearchText(trip) {
  return normalizeSearchText([
    trip.destination?.name,
    trip.headsign,
    trip.route?.short_name,
    trip.route?.long_name,
    trip.route?.operator
  ].filter(Boolean).join(" "));
}

function currentTrainOptions() {
  const options = state.selectableTrips.length ? state.selectableTrips : state.trips;
  const query = normalizeSearchText(state.destinationQuery);
  if (!query) return options;
  return options.filter((trip) => trainSearchText(trip).includes(query));
}

function csvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quote = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quote) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quote = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quote = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      if (row.some((item) => item.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field);
  if (row.some((item) => item.trim() !== "")) rows.push(row);

  const headers = rows.shift()?.map((item) => item.trim()) || [];
  return rows.map((cells) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = (cells[index] || "").trim();
    });
    return entry;
  });
}

function findZipFile(zip, name) {
  const direct = zip.file(name);
  if (direct) return direct;
  const lower = name.toLowerCase();
  const match = Object.keys(zip.files).find((fileName) => fileName.toLowerCase().endsWith(`/${lower}`) || fileName.toLowerCase() === lower);
  return match ? zip.file(match) : null;
}

async function readGtfsCsv(zip, name, required = false) {
  const file = findZipFile(zip, name);
  if (!file) {
    if (required) throw new Error(`Missing required GTFS file: ${name}`);
    return [];
  }
  return csvRows(await file.async("string"));
}

function buildServiceSet(calendar, calendarDates, date = new Date()) {
  const today = gtfsDate(date);
  const weekday = weekdayKey(date);
  const serviceIds = new Set();

  for (const row of calendar) {
    const inDateRange = (!row.start_date || row.start_date <= today) && (!row.end_date || row.end_date >= today);
    if (inDateRange && row[weekday] === "1") serviceIds.add(row.service_id);
  }

  for (const row of calendarDates) {
    if (row.date !== today) continue;
    if (row.exception_type === "1") serviceIds.add(row.service_id);
    if (row.exception_type === "2") serviceIds.delete(row.service_id);
  }

  if (!calendar.length && !calendarDates.length) return null;
  return serviceIds;
}

function tripLabel(trip) {
  const routeName = trip.route.short_name || trip.route.long_name || "POLREGIO";
  const headsign = trip.headsign || trip.destination.name;
  return `Driving now | ${routeName} to ${headsign} | ${formatGtfsTime(trip.startSec)}-${formatGtfsTime(trip.endSec)}`;
}

function normalizeTrip(trip, route, stopTimes, stopsById, agenciesById, defaultAgency) {
  const orderedStops = stopTimes
    .filter((row) => row.trip_id === trip.trip_id)
    .sort((a, b) => Number(a.stop_sequence || 0) - Number(b.stop_sequence || 0))
    .map((row, index) => {
      const stop = stopsById.get(row.stop_id) || {};
      const arrival = parseGtfsTime(row.arrival_time || row.departure_time);
      const departure = parseGtfsTime(row.departure_time || row.arrival_time);
      return {
        id: row.stop_id || `${trip.trip_id}-${index}`,
        name: stop.stop_name || row.stop_id || `Stop ${index + 1}`,
        code: stop.stop_code || "",
        platform: row.stop_headsign || row.platform_code || stop.platform_code || "",
        arrivalSec: arrival,
        departureSec: Math.max(departure ?? arrival ?? 0, arrival ?? departure ?? 0),
        sequence: Number(row.stop_sequence || index)
      };
    })
    .filter((stop) => Number.isFinite(stop.arrivalSec) || Number.isFinite(stop.departureSec));

  if (orderedStops.length < 2) return null;

  for (let index = 0; index < orderedStops.length; index += 1) {
    const stop = orderedStops[index];
    if (!Number.isFinite(stop.arrivalSec)) stop.arrivalSec = stop.departureSec;
    if (!Number.isFinite(stop.departureSec)) stop.departureSec = stop.arrivalSec;
    if (stop.departureSec < stop.arrivalSec) stop.departureSec = stop.arrivalSec;
  }

  const startSec = orderedStops[0].departureSec;
  const endSec = orderedStops[orderedStops.length - 1].arrivalSec;
  const destination = orderedStops[orderedStops.length - 1];
  const agency = route?.agency_id ? agenciesById.get(route.agency_id) : defaultAgency;
  const operatorName = agency?.agency_name || route?.agency_name || "POLREGIO";

  return {
    id: trip.trip_id,
    route: {
      id: route?.route_id || trip.route_id,
      short_name: route?.route_short_name || route?.route_long_name || "R",
      long_name: route?.route_long_name || "",
      operator: operatorName,
      color: route?.route_color ? `#${route.route_color.replace("#", "")}` : ""
    },
    serviceId: trip.service_id,
    headsign: trip.trip_headsign || destination.name,
    stops: orderedStops,
    destination,
    startSec,
    endSec,
    isSample: false,
    isActive: false
  };
}

async function parseGtfsZip(file, date = new Date()) {
  if (!window.JSZip) throw new Error("JSZip did not load. Check jszip.min.js.");

  const zip = await JSZip.loadAsync(file);
  const [stops, routes, trips, stopTimes, calendar, calendarDates, agencies] = await Promise.all([
    readGtfsCsv(zip, "stops.txt", true),
    readGtfsCsv(zip, "routes.txt", true),
    readGtfsCsv(zip, "trips.txt", true),
    readGtfsCsv(zip, "stop_times.txt", true),
    readGtfsCsv(zip, "calendar.txt"),
    readGtfsCsv(zip, "calendar_dates.txt"),
    readGtfsCsv(zip, "agency.txt")
  ]);

  const serviceSet = buildServiceSet(calendar, calendarDates, date);
  const stopsById = new Map(stops.map((stop) => [stop.stop_id, stop]));
  const routesById = new Map(routes.map((route) => [route.route_id, route]));
  const agenciesById = new Map(agencies.map((agency) => [agency.agency_id || "__default", agency]));
  const defaultAgency = agencies[0] || null;
  const stopTimesByTrip = new Map();

  for (const row of stopTimes) {
    if (!stopTimesByTrip.has(row.trip_id)) stopTimesByTrip.set(row.trip_id, []);
    stopTimesByTrip.get(row.trip_id).push(row);
  }

  const normalizedTrips = [];
  for (const trip of trips) {
    if (serviceSet && !serviceSet.has(trip.service_id)) continue;
    const normalized = normalizeTrip(trip, routesById.get(trip.route_id), stopTimesByTrip.get(trip.trip_id) || [], stopsById, agenciesById, defaultAgency);
    if (normalized) normalizedTrips.push(normalized);
  }

  normalizedTrips.sort((a, b) => a.startSec - b.startSec);
  return normalizedTrips;
}

function scheduleInputsChanged() {
  const hasDate = Boolean(els.scheduleDate.value);
  els.startScheduleBtn.disabled = !hasDate;
  els.scheduleHint.textContent = hasDate
    ? "Press Start to run schedule simulation from the selected date/time."
    : "Pick a date to enable schedule simulation.";
}

async function reloadTripsForDate(date) {
  if (!state.gtfsArrayBuffer) return;
  try {
    els.gtfsStatus.textContent = `Reloading schedule for ${formatScheduleDisplay(date)}...`;
    const trips = await parseGtfsZip(state.gtfsArrayBuffer, date);
    if (!trips.length) throw new Error("No trips found for selected date.");
    loadTrips(trips, state.datasetName, `${state.datasetName} schedule loaded for ${formatScheduleDisplay(date)}.`);
    selectTrip(state.selectedTripId || state.trips[0]?.id);
  } catch (error) {
    els.gtfsStatus.textContent = `Schedule reload failed: ${error.message}`;
  }
}

async function toggleScheduleSimulation() {
  if (state.scheduleActive) {
    await stopScheduleSimulation();
    return;
  }

  const dateValue = els.scheduleDate.value;
  if (!dateValue) {
    els.scheduleHint.textContent = "Select a date before starting schedule simulation.";
    return;
  }

  const timeValue = els.scheduleTime.value || "00:00";
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const selectedDate = new Date(year, month - 1, day, hour, minute, 0);

  if (Number.isNaN(selectedDate.getTime())) {
    els.scheduleHint.textContent = "Selected date/time is invalid.";
    return;
  }

  state.scheduleActive = true;
  state.scheduleStartSimMs = selectedDate.getTime();
  state.scheduleStartRealMs = Date.now();
  els.startScheduleBtn.textContent = "⏹ Stop schedule";
  els.resetScheduleBtn.disabled = false;
  els.scheduleHint.textContent = `Running schedule from ${formatScheduleDisplay(selectedDate)}.`;

  await reloadTripsForDate(selectedDate);
}

async function stopScheduleSimulation() {
  state.scheduleActive = false;
  state.scheduleStartSimMs = null;
  state.scheduleStartRealMs = null;
  els.startScheduleBtn.textContent = "▶ Start schedule";
  els.resetScheduleBtn.disabled = true;
  els.scheduleHint.textContent = "Schedule simulation stopped. Showing live current time.";

  if (state.gtfsArrayBuffer) {
    await reloadTripsForDate(new Date());
  } else {
    refreshLiveTrips();
    selectTrip(state.selectedTripId);
  }
}

function createSampleTrip(id, routeName, startOffsetMinutes, stopNames, headsign) {
  const now = secondsNowForGtfs();
  const startSec = now + startOffsetMinutes * 60;
  const stops = stopNames.map((name, index) => {
    const base = startSec + index * 9 * 60 + Math.max(0, index - 1) * 90;
    return {
      id: `${id}-${index}`,
      name,
      code: "",
      platform: index % 2 === 0 ? "2" : "1",
      arrivalSec: index === 0 ? base : base - 35,
      departureSec: index === stopNames.length - 1 ? base - 35 : base + DEFAULT_DWELL_SECONDS,
      sequence: index + 1
    };
  });

  return {
    id,
    route: {
      id: routeName,
      short_name: routeName,
      long_name: "POLREGIO regional service",
      operator: "POLREGIO",
      color: "#00a651"
    },
    serviceId: "sample",
    headsign,
    stops,
    destination: stops[stops.length - 1],
    startSec: stops[0].departureSec,
    endSec: stops[stops.length - 1].arrivalSec,
    isSample: true,
    isActive: false
  };
}

function sampleTrips() {
  return [
    createSampleTrip("sample-r-64200", "R 64200", -12, [
      "Wrocław Główny",
      "Wrocław Brochów",
      "Oława",
      "Brzeg",
      "Lewin Brzeski",
      "Opole Zachodnie",
      "Opole Główne"
    ], "Opole Główne"),
    createSampleTrip("sample-r-30518", "R 30518", -28, [
      "Kraków Główny",
      "Kraków Płaszów",
      "Bochnia",
      "Brzesko Okocim",
      "Tarnów"
    ], "Tarnów"),
    createSampleTrip("sample-r-77631", "R 77631", 18, [
      "Poznań Główny",
      "Poznań Garbary",
      "Czerwonak",
      "Owińska",
      "Gniezno"
    ], "Gniezno")
  ];
}

function classifyTrips(trips) {
  const now = secondsNowForGtfs(getSimulatedNow());
  const active = [];
  const waiting = [];
  const completed = [];

  for (const trip of trips) {
    trip.isWaiting = now < trip.startSec;
    trip.isActive = now >= trip.startSec && now <= trip.endSec + 120;
    trip.isCompleted = now > trip.endSec + 120;

    if (trip.isActive) active.push(trip);
    else if (trip.isWaiting) waiting.push(trip);
    else completed.push(trip);
  }

  active.sort((a, b) => a.endSec - b.endSec);
  waiting.sort((a, b) => a.startSec - b.startSec);
  completed.sort((a, b) => b.endSec - a.endSec);
  return [...active, ...waiting, ...completed];
}

function loadTrips(trips, datasetName, status) {
  state.datasetName = datasetName;
  state.trips = trips;
  state.selectableTrips = classifyTrips(trips);
  state.selectedTripId = state.selectableTrips[0]?.id || trips[0]?.id || "";
  state.destinationQuery = "";
  els.destinationSearch.value = "";
  state.announcementMarks.clear();
  renderTripOptions();
  selectTrip(state.selectedTripId);
  els.gtfsStatus.textContent = status;
}

function renderTripOptions() {
  els.tripSelect.innerHTML = "";
  const options = currentTrainOptions();

  if (!options.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No destination match";
    option.disabled = true;
    els.tripSelect.append(option);
    els.tripHint.textContent = `No train found for destination "${state.destinationQuery}".`;
    return;
  }

  for (const trip of options) {
    const option = document.createElement("option");
    option.value = trip.id;
    option.textContent = tripLabel(trip);
    els.tripSelect.append(option);
  }

  if (state.selectedTripId && options.some((trip) => trip.id === state.selectedTripId)) {
    els.tripSelect.value = state.selectedTripId;
  }

  els.tripHint.textContent = state.destinationQuery
    ? `${options.length} train${options.length === 1 ? "" : "s"} found for "${state.destinationQuery}". Press Search or Enter to select the first match.`
    : `${state.datasetName}: every train is shown in Driving Now. Trips before departure wait until their first scheduled departure.`;
}

function searchDestination(selectFirst = false) {
  state.destinationQuery = els.destinationSearch.value.trim();
  renderTripOptions();
  const [match] = currentTrainOptions();

  if (!selectFirst) return;

  if (!match) {
    els.tripHint.textContent = `No train found for destination "${state.destinationQuery}".`;
    return;
  }

  selectTrip(match.id);
  els.tripHint.textContent = `Selected ${match.route.short_name || match.route.long_name || "train"} to ${match.destination.name}.`;
}

function selectTrip(tripId) {
  const trip = state.trips.find((item) => item.id === tripId) || state.trips[0];
  if (!trip) return;
  state.selectedTripId = trip.id;
  state.selectedTrip = trip;
  els.tripSelect.value = trip.id;
  state.announcementMarks.clear();
  state.lastRenderedStopKey = "";
  updateDisplay(true);
}

function snapshotForTrip(trip, now = secondsNowForGtfs()) {
  const stops = trip.stops;
  const first = stops[0];
  const last = stops[stops.length - 1];
  const tripDuration = Math.max(1, trip.endSec - trip.startSec);
  let phase = "waiting";
  let currentIndex = 0;
  let nextIndex = 1;
  let segmentProgress = 0;
  let nextArrivalSec = stops[1]?.arrivalSec ?? trip.endSec;
  let currentDepartureSec = null;
  let status = "Waiting departure";

  if (now < first.departureSec) {
    nextIndex = 0;
    nextArrivalSec = first.departureSec;
  } else if (now >= last.arrivalSec) {
    phase = "terminus";
    currentIndex = stops.length - 1;
    nextIndex = stops.length - 1;
    nextArrivalSec = last.arrivalSec;
    segmentProgress = 1;
    status = "Arrived";
  } else {
    for (let index = 0; index < stops.length - 1; index += 1) {
      const current = stops[index];
      const next = stops[index + 1];
      const departed = current.departureSec;
      const arrived = next.arrivalSec;
      const dwellEnd = next.departureSec || next.arrivalSec + DEFAULT_DWELL_SECONDS;

      if (now >= departed && now < arrived) {
        phase = arrived - now <= ARRIVING_ANNOUNCEMENT_THRESHOLD_SECONDS ? "arriving" : "enroute";
        currentIndex = index;
        nextIndex = index + 1;
        nextArrivalSec = arrived;
        segmentProgress = (now - departed) / Math.max(1, arrived - departed);
        status = phase === "arriving" ? "Arriving" : "En route";
        break;
      }

      if (now >= arrived && now < dwellEnd) {
        phase = "arrived";
        currentIndex = index + 1;
        nextIndex = Math.min(index + 2, stops.length - 1);
        nextArrivalSec = stops[nextIndex]?.arrivalSec || next.arrivalSec;
        currentDepartureSec = dwellEnd;
        segmentProgress = 1;
        status = nextIndex === currentIndex ? "Arrived" : "At station";
        break;
      }
    }
  }

  const nextStop = stops[nextIndex] || last;
  const currentStop = stops[currentIndex] || first;
  const journeyProgress = Math.max(0, Math.min(1, (now - trip.startSec) / tripDuration));
  const activeSegmentProgress = ["enroute", "arriving"].includes(phase)
    ? Math.max(0, Math.min(1, segmentProgress))
    : 0;
  const offsetIndex = Math.min(currentIndex + EARLY_STOPS_OFFSET, stops.length - 1);
  const stopProgress = Math.max(0, Math.min(1, (offsetIndex + activeSegmentProgress) / Math.max(1, stops.length - 1)));

  return {
    phase,
    status,
    currentIndex,
    nextIndex,
    currentStop,
    nextStop,
    nextArrivalSec,
    currentDepartureSec,
    secondsToNext: nextArrivalSec - now,
    secondsToDeparture: Number.isFinite(currentDepartureSec) ? currentDepartureSec - now : null,
    segmentProgress: Math.max(0, Math.min(1, segmentProgress)),
    journeyProgress,
    stopProgress
  };
}

function renderStops(trip, snapshot) {
  const key = `${trip.id}:${snapshot.currentIndex}:${snapshot.nextIndex}:${trip.stops.length}`;
  if (key === state.lastRenderedStopKey) return;
  state.lastRenderedStopKey = key;
  els.stopList.innerHTML = "";

  trip.stops.forEach((stop, index) => {
    const item = document.createElement("li");
    if (index < snapshot.currentIndex) item.classList.add("passed");
    if (index === snapshot.currentIndex && ["waiting", "arrived", "terminus"].includes(snapshot.phase)) item.classList.add("current");
    if (index === snapshot.nextIndex && !["waiting", "terminus"].includes(snapshot.phase)) item.classList.add("next");

    const dot = document.createElement("span");
    dot.className = "stop-dot";

    const name = document.createElement("span");
    name.className = "stop-name";
    name.textContent = stop.name;

    const time = document.createElement("span");
    time.className = "stop-time";
    time.textContent = formatGtfsTime(stop.departureSec || stop.arrivalSec);

    item.append(dot, name, time);
    els.stopList.append(item);
  });
}

function centerStopList(snapshot) {
  const preferredStop = els.stopList.querySelector("li.current") || els.stopList.querySelector("li.next");
  if (!preferredStop || !els.stopListWindow) return;
  const windowWidth = els.stopListWindow.clientWidth;
  const stopCenter = preferredStop.offsetLeft + preferredStop.offsetWidth / 2;
  const targetScroll = Math.max(0, stopCenter - windowWidth / 2);
  els.stopListWindow.scrollTo({ left: targetScroll, behavior: "smooth" });
}

function updateProgressThumb(snapshot, progress = snapshot.stopProgress) {
  const thumb = document.querySelector("#progressThumb");
  if (!thumb) return;
  thumb.style.left = `${Math.round(progress * 100)}%`;
}

function updateDisplay(forceStops = false) {
  const trip = state.selectedTrip;
  if (!trip) return;

  const nowDate = getSimulatedNow();
  const snapshot = snapshotForTrip(trip, secondsNowForGtfs(nowDate));
  const previousSnapshot = state.currentSnapshot;
  state.currentSnapshot = snapshot;

  els.trainDisplay.classList.remove("phase-waiting", "phase-enroute", "phase-arriving", "phase-arrived", "phase-terminus");
  els.trainDisplay.classList.add(`phase-${snapshot.phase}`);

  if (els.speedDisplay) {
    els.speedDisplay.textContent = `${Math.max(0, Math.min(160, Number(state.speedKph) || 0))} km/h`;
  }
  els.clock.textContent = formatClock(nowDate);
  els.serviceCode.textContent = trip.route.short_name || trip.route.long_name || "POLREGIO";
  els.destinationName.textContent = trip.destination.name;
  els.phaseLabel.textContent = snapshot.phase === "waiting" ? "Departure station" : snapshot.phase === "arrived" ? "This station" : snapshot.phase === "terminus" ? "Terminus" : "Next station";
  els.nextStation.textContent = snapshot.phase === "waiting" ? snapshot.currentStop.name : snapshot.phase === "arrived" || snapshot.phase === "terminus" ? snapshot.currentStop.name : snapshot.nextStop.name;
  els.progressFill.style.width = `${Math.round(snapshot.stopProgress * 100)}%`;
  els.journeyProgress.textContent = `${Math.round(snapshot.stopProgress * 100)}%`;
  updateProgressThumb(snapshot, snapshot.stopProgress);
  els.statusText.textContent = snapshot.status;
  els.sectionText.textContent = snapshot.phase === "waiting"
    ? `${snapshot.currentStop.name} → ${trip.destination.name}`
    : snapshot.phase === "terminus"
    ? `${trip.stops[0].name} → ${trip.destination.name}`
    : `${snapshot.currentStop.name} → ${snapshot.nextStop.name}`;

  const remainingStops = trip.stops.slice(snapshot.nextIndex).map((stop) => stop.name);
  const stationAfterCurrent = trip.stops[snapshot.currentIndex + 1]?.name || trip.destination.name;

  const operatorName = trip.route.operator || "POLREGIO";
  const ticker = snapshot.phase === "waiting"
    ? `Waiting for scheduled departure at ${formatGtfsTime(snapshot.currentStop.departureSec)} from ${snapshot.currentStop.name}. This train is for: ${trip.destination.name}.`
    : snapshot.phase === "terminus"
    ? `This station is: ${snapshot.currentStop.name}. This train terminates here. All change please! Thank you for travelling with us!`
    : snapshot.phase === "arrived"
      ? `This station is: ${snapshot.currentStop.name}. This train is for: ${trip.destination.name}. The next station will be: ${stationAfterCurrent}.`
      : `Welcome onboard this ${operatorName} service to: ${trip.destination.name}. Calling at ${readableList(remainingStops)}.`;
  els.tickerText.textContent = ticker;

  els.trainDisplay.classList.toggle("waiting", snapshot.phase === "waiting");
  els.trainDisplay.classList.toggle("arriving", snapshot.phase === "arriving");
  els.trainDisplay.classList.toggle("arrived", snapshot.phase === "arrived" || snapshot.phase === "terminus");
  els.liveChip.lastChild.textContent = snapshot.phase === "waiting" ? "Waiting departure" : trip.isSample ? "Sample live" : "Live GTFS";

  if (els.stationBadge) {
    els.stationBadge.style.display = (snapshot.phase === "arrived" || snapshot.phase === "terminus") ? "block" : "none";
  }

  if (forceStops) state.lastRenderedStopKey = "";
  renderStops(trip, snapshot);
  centerStopList(snapshot);
  maybeAutoAnnounce(snapshot);
  updateAutoTrainSounds(snapshot, previousSnapshot);
}

function getDestinationsFromStation(stationId) {
  const destinations = new Set();
  for (const trip of state.trips) {
    const stopIndex = trip.stops.findIndex(stop => stop.id === stationId);
    if (stopIndex >= 0 && stopIndex < trip.stops.length - 1) {
      // This trip departs from this station
      destinations.add(trip.destination.name);
    }
  }
  return Array.from(destinations).slice(0, 5); // Limit to 5 destinations
}

function isMainStation(stationName) {
  const normalized = (stationName || "").toUpperCase().trim();
  return normalized.endsWith("GŁÓWNY") || normalized.endsWith("HBF");
}

function announcementText(type) {
  const trip = state.selectedTrip;
  const snapshot = state.currentSnapshot || snapshotForTrip(trip);
  const language = els.languageSelect.value;
  const next = snapshot.nextStop;
  const current = snapshot.currentStop;
  const destination = trip.destination.name;
  const operatorName = trip.route.operator || "POLREGIO";
  const remaining = trip.stops.slice(Math.max(snapshot.nextIndex, 1)).map((stop) => stop.name);
  const afterCurrent = trip.stops.slice(snapshot.currentIndex + 1).map((stop) => stop.name);
  const isTerminus = snapshot.phase === "terminus" || current.id === trip.destination.id;
  const destinationsFromNext = type === "approaching" ? getDestinationsFromStation(next.id) : [];
  const isTerminusForNext = next.id === trip.destination.id;
  const context = { trip, snapshot, next, current, destination, operatorName, remaining, afterCurrent, isTerminus, destinationsFromNext, isTerminusForNext };
  const languageCodes = ANNOUNCEMENT_LANGUAGE_ORDER[language] || ANNOUNCEMENT_LANGUAGE_ORDER.en;

  return languageCodes.map((code) => {
    const locale = ANNOUNCEMENT_LOCALES[code] || ANNOUNCEMENT_LOCALES.en;
    return {
      text: locale[type](context),
      lang: locale.lang
    };
  });
}

function pickVoice(lang) {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return voices.find((voice) => voice.lang === lang)
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
    || null;
}

async function playSyntheticGong() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.26;
  master.connect(context.destination);
  const notes = [
    { delay: 0, freq: 784, length: 0.42 },
    { delay: 0.23, freq: 659, length: 0.55 },
    { delay: 0.46, freq: 523, length: 0.78 }
  ];

  notes.forEach((note) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = note.freq;
    gain.gain.setValueAtTime(0.0001, context.currentTime + note.delay);
    gain.gain.exponentialRampToValueAtTime(0.55, context.currentTime + note.delay + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + note.delay + note.length);
    osc.connect(gain).connect(master);
    osc.start(context.currentTime + note.delay);
    osc.stop(context.currentTime + note.delay + note.length + 0.05);
  });

  window.setTimeout(() => context.close(), 1600);
}

async function playGong() {
  try {
    state.gong.volume = state.announcementVolume;
    state.gong.pause();
    state.gong.currentTime = 0;
    await state.gong.play();
    window.setTimeout(() => {
      state.gong.pause();
      state.gong.currentTime = 0;
    }, 2600);
  } catch (error) {
    await playSyntheticGong();
  }
}

function speakSegments(segments) {
  if (!("speechSynthesis" in window)) {
    els.audioStatus.textContent = "Speech synthesis is not available in this browser.";
    return;
  }

  window.speechSynthesis.cancel();
  segments.forEach((segment) => {
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = segment.lang;
    utterance.voice = pickVoice(segment.lang);
    utterance.rate = 0.92;
    utterance.pitch = 0.95;
    utterance.volume = state.announcementVolume;
    window.speechSynthesis.speak(utterance);
  });
}

async function playAnnouncement(type) {
  if (!state.selectedTrip) return;
  state.audioEnabled = true;
  const segments = announcementText(type);
  els.audioStatus.textContent = segments.length === 1
    ? "Playing gong and announcement."
    : `Playing gong and ${segments.length} language announcements.`;
  await playGong();
  window.setTimeout(() => {
    speakSegments(segments);
  }, 1050);
}

function queueAutoAnnouncement(type, keyPart) {
  if (!els.autoAnnounce.checked || !state.audioEnabled) return;
  const key = `${type}:${state.selectedTripId}:${keyPart}`;
  if (state.announcementMarks.has(key)) return;
  state.announcementMarks.add(key);
  playAnnouncement(type);
}

function maybeAutoAnnounce(snapshot) {
  if (!state.selectedTrip) return;
  if (snapshot.phase === "enroute" || snapshot.phase === "arriving") {
    queueAutoAnnouncement("welcome", `depart:${snapshot.currentStop.id}:${snapshot.currentStop.departureSec}`);
  }
  if (snapshot.phase === "arriving"
      && snapshot.secondsToNext <= ARRIVING_ANNOUNCEMENT_THRESHOLD_SECONDS
      && snapshot.secondsToNext > 0) {
    const isTerminus = snapshot.nextStop.id === state.selectedTrip.destination.id;
    const nextIsMainStation = isMainStation(snapshot.nextStop.name);
    const matchedStation = stationMatchesFilter(snapshot.nextStop.name);
    const announcementType = nextIsMainStation || matchedStation ? "approaching" : "arriving";
    queueAutoAnnouncement(announcementType, `${snapshot.nextStop.id}:${matchedStation ? "filter" : "auto"}`);
  }
  if (snapshot.phase === "arrived") {
    queueAutoAnnouncement("arrived", `${snapshot.currentStop.id}:${snapshot.currentStop.arrivalSec}`);
  }
  if (snapshot.phase === "terminus") {
    queueAutoAnnouncement("arriving", `${snapshot.currentStop.id}:terminus`);
  }
}

async function loadAutomaticGtfsFeed() {
  try {
    els.gtfsStatus.textContent = `Loading ${GTFS_SRC}...`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    let response;
    try {
      response = await fetch(GTFS_SRC, { 
        cache: "no-store",
        signal: controller.signal 
      });
    } finally {
      clearTimeout(timeoutId);
    }
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    els.gtfsStatus.textContent = `Parsing ${GTFS_SRC}...`;
    const arrayBuffer = await response.arrayBuffer();
    state.gtfsArrayBuffer = arrayBuffer;
    
    const trips = await parseGtfsZip(arrayBuffer);
    if (!trips.length) throw new Error("No trips found");
    
    loadTrips(trips, GTFS_SRC, `${GTFS_SRC}: ${trips.length.toLocaleString()} trips loaded.`);
  } catch (error) {
    els.gtfsStatus.textContent = `GTFS auto-load failed: ${error.message}. Select gtfs.zip manually.`;
    loadTrips(sampleTrips(), "Sample POLREGIO", `Using sample trips. (${error.message})`);
  }
}

function loadGtfsFile(file) {
  if (!file) return;
  els.gtfsStatus.textContent = `Loading ${file.name}...`;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const arrayBuffer = reader.result;
      state.gtfsArrayBuffer = arrayBuffer;
      const trips = await parseGtfsZip(arrayBuffer);
      if (!trips.length) throw new Error("No trips found");
      loadTrips(trips, file.name, `${file.name}: ${trips.length.toLocaleString()} trips loaded.`);
      els.gtfsStatus.textContent = `${file.name} loaded successfully.`;
    } catch (innerError) {
      els.gtfsStatus.textContent = `GTFS parse failed: ${innerError.message}`;
    }
  };
  reader.onerror = () => {
    els.gtfsStatus.textContent = `Could not read ${file.name}.`;
  };
  reader.readAsArrayBuffer(file);
}

function refreshLiveTrips() {
  if (!state.trips.length) return;
  state.selectableTrips = classifyTrips(state.trips);
  renderTripOptions();
  const stillSelectable = state.selectableTrips.some((trip) => trip.id === state.selectedTripId);
  if (!stillSelectable && state.selectableTrips[0]) selectTrip(state.selectableTrips[0].id);
  els.gtfsStatus.textContent = `${state.datasetName}: live trip list refreshed at ${formatClock()}.`;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    els.pwaStatus.textContent = "Service workers are not available in this browser.";
    return;
  }

  if (!["http:", "https:"].includes(window.location.protocol)) {
    els.pwaStatus.textContent = "Open from GitHub Pages, HTTPS, or localhost to enable PWA mode.";
    return;
  }

  navigator.serviceWorker.register("service-worker.js")
    .then(() => {
      els.pwaStatus.textContent = "PWA cache is ready for this static site.";
    })
    .catch(() => {
      els.pwaStatus.textContent = "PWA registration failed. Refresh the static site and try again.";
    });
}

async function autoLoadD1DieselSounds() {
  // Automatically select and load D1 diesel sounds on startup
  if (els.trainTypeSelect) els.trainTypeSelect.value = "diesel";
  if (els.soundVariantSelect) els.soundVariantSelect.value = "diesel-d1";
  
  state.selectedTrainType = "diesel";
  state.activeSoundPreset = findSoundPreset("diesel", "diesel-d1");
  state.selectedSoundPresetLabel = "Soviet D1 diesel";
  
  if (state.activeSoundPreset) {
    // Load all D1 sounds: engine, acceleration, deceleration, wheel
    const soundsToLoad = [
      { name: "engine", loop: true },
      { name: "acceleration", loop: false },
      { name: "deceleration", loop: false },
      { name: "wheel", loop: true }
    ];
    
    for (const soundConfig of soundsToLoad) {
      const sourceUrl = state.activeSoundPreset.sources[soundConfig.name];
      if (!sourceUrl) continue;
      
      const audio = new Audio(sourceUrl);
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.volume = state.soundVolumes[soundConfig.name] ?? 0.8;
      audio.loop = soundConfig.loop;
      state.soundAudioObjects[soundConfig.name] = audio;
      audio.load();
      
      try {
        await new Promise((resolve) => {
          if (isAudioElementReady(audio)) return resolve();
          audio.addEventListener("canplaythrough", resolve, { once: true, passive: true });
          audio.addEventListener("error", resolve, { once: true, passive: true });
        });
        state.loadedSounds[soundConfig.name] = !audio.error;
      } catch (error) {
        state.loadedSounds[soundConfig.name] = false;
      }
    }
    
    els.audioStatus.textContent = "D1 sounds ready. Engine at station, Acceleration/Wheel en-route, Deceleration on arrival.";
  }
  
  updateTrainTypeDisplay();
}

function bindEvents() {
  els.refreshBtn.addEventListener("click", loadAutomaticGtfsFeed);
  els.chooseGtfsBtn.addEventListener("click", () => els.gtfsFileInput.click());
  els.gtfsFileInput.addEventListener("change", (event) => loadGtfsFile(event.target.files?.[0]));
  els.scheduleDate.addEventListener("input", scheduleInputsChanged);
  els.scheduleTime.addEventListener("input", scheduleInputsChanged);
  els.stationFilterInput.addEventListener("input", (event) => {
    state.approachStationFilters = parseStationFilters(event.target.value);
  });
  els.destinationSearch.addEventListener("input", () => searchDestination(false));
  els.destinationSearch.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    searchDestination(true);
  });
  els.destinationSearchBtn.addEventListener("click", () => searchDestination(true));
  els.startScheduleBtn.addEventListener("click", toggleScheduleSimulation);
  els.resetScheduleBtn.addEventListener("click", stopScheduleSimulation);
  els.tripSelect.addEventListener("change", (event) => selectTrip(event.target.value));
  els.enableSoundBtn.addEventListener("click", async () => {
    state.audioEnabled = true;
    els.audioStatus.textContent = "Sound enabled. Auto announcements can now play.";
    await playGong();
  });
  els.welcomeBtn.addEventListener("click", () => playAnnouncement("welcome"));
  els.arrivingBtn.addEventListener("click", () => playAnnouncement("arriving"));
  els.approachingBtn.addEventListener("click", () => playAnnouncement("approaching"));
  els.arrivedBtn.addEventListener("click", () => playAnnouncement("arrived"));
  els.trainTypeSelect.addEventListener("change", () => {
    renderSoundVariantOptions();
    updateSoundStatus("Train type changed. Loading default sound pack...");
    loadSoundPreset();
  });
  els.soundVariantSelect.addEventListener("change", () => {
    updateSoundStatus("Selected sound set. Loading sound pack...");
    loadSoundPreset();
  });
  els.loadSoundsBtn.addEventListener("click", loadSoundPreset);
  els.downloadSoundsBtn.addEventListener("click", downloadSoundPack);
  els.previewEngineBtn.addEventListener("click", () => playSoundEvent("engine"));
  els.previewAccelBtn.addEventListener("click", () => playSoundEvent("acceleration"));
  els.previewDecelBtn.addEventListener("click", () => playSoundEvent("deceleration"));
  els.previewRideBtn.addEventListener("click", () => playSoundEvent("ride"));
  els.previewWheelBtn.addEventListener("click", () => playSoundEvent("wheel"));
  els.previewStuckBtn.addEventListener("click", () => playSoundEvent("stuckWheel"));
  els.downloadAllSoundsBtn.addEventListener("click", downloadAllSoundPacks);
  els.speedKph.addEventListener("input", (event) => {
    setTrainSpeed(Number(event.target.value));
  });
  els.engineVolume.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    applySoundVolume("engine", value);
    setVolumeLabel(els.engineVolumeValue, value);
  });
  els.accelerationVolume.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    applySoundVolume("acceleration", value);
    setVolumeLabel(els.accelerationVolumeValue, value);
  });
  els.decelerationVolume.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    applySoundVolume("deceleration", value);
    setVolumeLabel(els.decelerationVolumeValue, value);
  });
  els.rideVolume.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    applySoundVolume("ride", value);
    setVolumeLabel(els.rideVolumeValue, value);
  });
  els.wheelVolume.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    applySoundVolume("wheel", value);
    setVolumeLabel(els.wheelVolumeValue, value);
  });
  els.stuckVolume.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    applySoundVolume("stuckWheel", value);
    setVolumeLabel(els.stuckVolumeValue, value);
  });
  els.announcementVolume.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.announcementVolume = value;
    setVolumeLabel(els.announcementVolumeValue, value);
  });
  els.installBtn.addEventListener("click", async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    els.installBtn.disabled = true;
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    els.installBtn.disabled = false;
    els.pwaStatus.textContent = "Install is available for this app.";
  });

  window.speechSynthesis?.addEventListener?.("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  });
}

function boot() {
  bindEvents();
  loadSoundTypeOptions();
  renderSoundVariantOptions();
  syncSoundVolumeLabels();
  updateTrainTypeDisplay();
  loadSoundPreset();
  autoLoadD1DieselSounds();
  registerServiceWorker();
  loadAutomaticGtfsFeed();
  window.setInterval(() => {
    updateDisplay();
    if (new Date().getSeconds() === 0) refreshLiveTrips();
  }, 1000);
}

boot();
