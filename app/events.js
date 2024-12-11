let activeListeners = {}; // Track active listeners by page

// Add or update event listener
export function handleEvent(pageID, selectorOrElement, eventType, callback) {
    // Remove previous listener if one exists
    if (activeListeners[pageID] && activeListeners[pageID][eventType]) {
        const { element, listener } = activeListeners[pageID][eventType];
        element.removeEventListener(eventType, listener);
        delete activeListeners[pageID][eventType];
    }

    // Define the event listener
    const listener = (event) => {
        const targetElement = selectorOrElement instanceof HTMLElement
            ? selectorOrElement
            : document.querySelector(selectorOrElement);

        // Ensure event is from the target element
        const isValidEvent = targetElement && targetElement.contains(event.target);
        if (isValidEvent) {
            callback(event);
        }
    };

    // Add event listener to the target element
    const element = selectorOrElement instanceof HTMLElement ? selectorOrElement : document;
    element.addEventListener(eventType, listener);

    // Store listener for removal
    if (!activeListeners[pageID]) {
        activeListeners[pageID] = {};
    }
    activeListeners[pageID][eventType] = { element, listener };
}

// Dispatch a custom event
export function dispatchCustomEvent(pageID, eventType, detail = {}) {
    // Dispatch event to all active listeners for the given pageID and eventType
    if (activeListeners[pageID] && activeListeners[pageID][eventType]) {
        const { element } = activeListeners[pageID][eventType];
        const customEvent = new CustomEvent(eventType, { detail });
        element.dispatchEvent(customEvent);
    }
}



