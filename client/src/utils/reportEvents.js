const REPORTS_CHANGED_EVENT = 'reports:changed';

export const notifyReportsChanged = (payload = {}) => {
  window.dispatchEvent(new CustomEvent(REPORTS_CHANGED_EVENT, { detail: payload }));
};

export const subscribeReportsChanged = (handler) => {
  const listener = (event) => handler(event.detail || {});
  window.addEventListener(REPORTS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(REPORTS_CHANGED_EVENT, listener);
};

export default {
  notifyReportsChanged,
  subscribeReportsChanged,
};
