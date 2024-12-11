export class Framework {
  createElement(tag, props = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes and event listeners
    Object.keys(props).forEach(key => {
      if (key === 'style' && typeof props[key] === 'object') {
        // Apply each style individually when `style` is an object
        Object.entries(props[key]).forEach(([styleKey, styleValue]) => {
          element.style[styleKey] = styleValue;
        });
      } else if (key.startsWith('on')) {
        const eventType = key.substring(2).toLowerCase();
        element.addEventListener(eventType, props[key]);
      } else {
        element.setAttribute(key, props[key]);
      }
    });


    // Ensure `children` is an array
    if (!Array.isArray(children)) {
      children = [children];
    }
    // Append each child if it's valid
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    return element;
  }
  // New method to append an array of child elements to a container
  appendChildren(container, children) {
    // Ensure children is an array
    if (!Array.isArray(children)) {
      children = [children];
    }
    children.forEach(child => {
      if (child instanceof Node) {
        container.appendChild(child);
      }
    });
  }

  updateDOM(newStructure, root) {
    root.innerHTML = '';
    root.appendChild(newStructure);
  }
}



