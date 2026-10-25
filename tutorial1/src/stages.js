import { CONFIG, MAZES, STAGE_NAMES } from './config.js';
import { solveStage } from './solver.js';

export const CUSTOM_STAGES_STORAGE_KEY = 'couple_custom_stages_v1';

const memoryFallback = [];

function getStorage() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
        }
    } catch {
        // Ignore storage access errors
    }
    return null;
}

export function getBuiltInStages() {
    return MAZES.map((map, idx) => ({
        id: `builtin-${idx + 1}`,
        stageNumber: idx + 1,
        name: STAGE_NAMES[idx] || `Stage ${idx + 1}`,
        timeLimit: CONFIG.STAGE_TIMES[idx] || 60,
        map: [...map],
        isCustom: false
    }));
}

export function getCustomStages() {
    const storage = getStorage();
    let rawList = memoryFallback;

    if (storage) {
        try {
            const raw = storage.getItem(CUSTOM_STAGES_STORAGE_KEY);
            rawList = raw ? JSON.parse(raw) : [];
        } catch {
            rawList = [];
        }
    }

    if (!Array.isArray(rawList)) return [];

    const builtInCount = MAZES.length;
    return rawList
        .filter((item) => item && Array.isArray(item.map) && item.map.length === CONFIG.ROWS)
        .map((item, idx) => ({
            id: item.id || `custom-${idx + 1}`,
            stageNumber: builtInCount + idx + 1,
            name: item.name || `Custom Stage ${idx + 1}`,
            timeLimit: Number(item.timeLimit) > 0 ? Number(item.timeLimit) : 60,
            map: item.map,
            minMoves: item.minMoves || null,
            createdAt: item.createdAt || null,
            isCustom: true
        }));
}

export function getAllStages() {
    return [...getBuiltInStages(), ...getCustomStages()];
}

export function getStageByNumber(stageNumber) {
    const all = getAllStages();
    const index = Math.max(0, Math.min(all.length - 1, Number(stageNumber) - 1));
    return all[index] || all[0];
}

export function addCustomStage({ name, map, timeLimit = 60 }) {
    const solveResult = solveStage(map);
    if (!solveResult.solvable) {
        throw new Error(solveResult.reason || 'Stage is not solvable.');
    }

    const customStages = getCustomStages();
    const trimmedName = (name || '').trim() || `Custom Stage ${customStages.length + 1}`;

    const newStage = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmedName,
        timeLimit: Number(timeLimit) > 0 ? Number(timeLimit) : 60,
        map: map.map((row) => String(row)),
        minMoves: solveResult.minMoves,
        createdAt: new Date().toISOString()
    };

    const updated = [...customStages.map(({ id, name: n, timeLimit: t, map: m, minMoves, createdAt }) => ({
        id,
        name: n,
        timeLimit: t,
        map: m,
        minMoves,
        createdAt
    })), newStage];

    const storage = getStorage();
    if (storage) {
        storage.setItem(CUSTOM_STAGES_STORAGE_KEY, JSON.stringify(updated));
    } else {
        memoryFallback.length = 0;
        memoryFallback.push(...updated);
    }

    const allStages = getAllStages();
    return allStages[allStages.length - 1];
}

export function deleteCustomStage(id) {
    const customStages = getCustomStages();
    const filtered = customStages
        .filter((s) => s.id !== id)
        .map(({ id: sId, name, timeLimit, map, minMoves, createdAt }) => ({
            id: sId,
            name,
            timeLimit,
            map,
            minMoves,
            createdAt
        }));

    const storage = getStorage();
    if (storage) {
        storage.setItem(CUSTOM_STAGES_STORAGE_KEY, JSON.stringify(filtered));
    } else {
        memoryFallback.length = 0;
        memoryFallback.push(...filtered);
    }
    return getAllStages();
}
